/**
 * @velyx/runtime-core (v0.3.0)
 * Developed by Florynx Labs
 *
 * Platform-agnostic reactive primitives: fine-grained signals, priority
 * scheduler, scope-aware lifecycle, and dependency graph.
 *
 * @packageDocumentation
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A function that cleans up an effect's side effects. */
export type CleanupFunction = () => void;

/** The body of a reactive effect; may return a cleanup function. */
export type EffectFunction = () => void | CleanupFunction;

/**
 * Scheduler priority levels — lower number = higher priority.
 * `Immediate` runs synchronously; all others are queued via microtask.
 */
export const PriorityLevel = {
  Immediate: 0,
  UserBlocking: 1,
  Normal: 2,
  Low: 3,
  Idle: 4
} as const;

export type PriorityLevel = typeof PriorityLevel[keyof typeof PriorityLevel];

/** An opaque scheduler task handle. */
export interface Task {
  readonly id: number;
  readonly priority: PriorityLevel;
  readonly fn: () => void;
  cancelled: boolean;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let taskIdCounter = 0;
const priorityQueue: Task[] = [];
let isSchedulerScheduled = false;
// Forward-declared so notifySubscribers can reference it before definition.
let isBatching = false;

/**
 * Schedules `fn` to run at the given `priority`.
 *
 * `Immediate` tasks run synchronously (unless inside a `batch`).
 * All other priorities are queued and flushed via `queueMicrotask`.
 */
export function scheduleTask(
  fn: () => void,
  priority: PriorityLevel = PriorityLevel.Immediate
): Task {
  const task: Task = { id: ++taskIdCounter, priority, fn, cancelled: false };

  if (priority === PriorityLevel.Immediate && !isBatching) {
    try { task.fn(); } catch (err) { console.error('[VELYX Scheduler]', err); }
    return task;
  }

  priorityQueue.push(task);
  priorityQueue.sort((a, b) => a.priority - b.priority);

  if (!isSchedulerScheduled) {
    isSchedulerScheduled = true;
    queueMicrotask(flushSchedulerQueue);
  }

  return task;
}

/** Marks a task as cancelled so it is skipped when dequeued. */
export function cancelTask(task: Task): void {
  task.cancelled = true;
}

/** Drains the priority queue, executing every non-cancelled task in order. */
export function flushSchedulerQueue(): void {
  isSchedulerScheduled = false;
  let task: Task | undefined;
  while ((task = priorityQueue.shift()) !== undefined) {
    if (!task.cancelled) {
      try { task.fn(); } catch (err) { console.error('[VELYX Scheduler]', err); }
    }
  }
}

// ─── Reactive Graph ───────────────────────────────────────────────────────────

let activeEffect: EffectSubscriber | null = null;
const pendingBatchSet = new Set<EffectSubscriber>();

interface EffectSubscriber {
  execute: () => void;
  cleanup: CleanupFunction | undefined;
  dependencies: Set<Set<EffectSubscriber>>;
  priority: PriorityLevel;
}

/**
 * A reactive signal — a getter/setter function with additional helpers.
 *
 * @example
 * const count = signal(0);
 * count();        // read → 0
 * count(1);       // write → 1
 * count.value;    // read via property
 * count.peek();   // read without tracking
 */
export interface Signal<T> {
  (): T;
  (newValue: T | ((prev: T) => T)): T;
  get value(): T;
  set value(newValue: T);
  /**
   * Reads the current value **without** registering a reactive dependency.
   * Useful in write-only contexts to avoid accidental tracking.
   */
  peek(): T;
  /**
   * Subscribes `fn` to value changes.
   * @returns A cleanup function that stops the subscription.
   */
  subscribe(fn: (val: T) => void): CleanupFunction;
}

/**
 * Creates a fine-grained reactive signal.
 *
 * Reads inside an active `effect` are automatically tracked.
 * Writes notify all dependent effects.
 *
 * @example
 * const name = signal("velyx");
 * effect(() => console.log(name())); // logs "velyx"
 * name("world");                     // logs "world"
 */
export function signal<T>(initialValue: T): Signal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<EffectSubscriber>();

  function accessor(newValue?: T | ((prev: T) => T)): T {
    if (arguments.length > 0) {
      const next =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(currentValue)
          : (newValue as T);
      if (!Object.is(currentValue, next)) {
        currentValue = next;
        notifySubscribers(subscribers);
      }
      return currentValue;
    }
    // Track this read inside any active effect.
    if (activeEffect !== null) {
      subscribers.add(activeEffect);
      activeEffect.dependencies.add(subscribers);
    }
    return currentValue;
  }

  Object.defineProperty(accessor, 'value', {
    get() { return accessor(); },
    set(val: T) { accessor(val); }
  });

  accessor.peek = (): T => currentValue;
  accessor.subscribe = (fn: (val: T) => void): CleanupFunction =>
    effect(() => fn(accessor()));

  return accessor as Signal<T>;
}

/**
 * Creates a reactive side-effect that re-runs whenever any signal it reads changes.
 *
 * The returned cleanup function disposes the effect and its subscriptions.
 *
 * @param fn      - Effect body. May return a cleanup function.
 * @param priority - Scheduler priority for re-runs (default: `Immediate`).
 *
 * @example
 * const stop = effect(() => {
 *   document.title = `Count: ${count()}`;
 * });
 * stop(); // disposes the effect
 */
export function effect(
  fn: EffectFunction,
  priority: PriorityLevel = PriorityLevel.Immediate
): CleanupFunction {
  const sub: EffectSubscriber = {
    priority,
    cleanup: undefined,
    dependencies: new Set(),
    execute() {
      cleanupDependencies(sub);
      const prev = activeEffect;
      activeEffect = sub;
      try {
        sub.cleanup?.();
        sub.cleanup = undefined;
        const result = fn();
        if (typeof result === 'function') { sub.cleanup = result; }
      } finally {
        activeEffect = prev;
      }
    }
  };

  sub.execute();

  return () => {
    sub.cleanup?.();
    cleanupDependencies(sub);
  };
}

/**
 * Creates a read-only derived signal whose value is recomputed whenever
 * any of its reactive dependencies change.
 *
 * @example
 * const double = computed(() => count() * 2);
 */
export function computed<T>(fn: () => T): Signal<T> {
  const derived = signal<T>(undefined as unknown as T);
  effect(() => { derived.value = fn(); });
  return derived;
}

/**
 * Defers all signal notifications inside `fn` until the batch completes,
 * then runs each affected effect exactly once.
 *
 * @example
 * batch(() => { a(1); b(2); }); // only one effect flush
 */
export function batch(fn: () => void): void {
  const prev = isBatching;
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = prev;
    if (!isBatching) {
      const pending = Array.from(pendingBatchSet);
      pendingBatchSet.clear();
      for (const sub of pending) {
        scheduleTask(() => sub.execute(), sub.priority);
      }
    }
  }
}

function notifySubscribers(subs: Set<EffectSubscriber>): void {
  for (const sub of subs) {
    if (isBatching) {
      pendingBatchSet.add(sub);
    } else {
      scheduleTask(() => sub.execute(), sub.priority);
    }
  }
}

function cleanupDependencies(sub: EffectSubscriber): void {
  for (const depSet of sub.dependencies) { depSet.delete(sub); }
  sub.dependencies.clear();
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/** Hooks registered by a component instance. */
export interface ComponentLifecycle {
  readonly mountHooks: Array<() => void>;
  readonly destroyHooks: Array<() => void>;
}

let currentComponentLifecycle: ComponentLifecycle | null = null;

/** @internal Creates a fresh component lifecycle context. */
export function createComponentContext(): ComponentLifecycle {
  return { mountHooks: [], destroyHooks: [] };
}

/** @internal Runs `fn` in the scope of `ctx`, restoring the previous context. */
export function runInComponentContext<T>(ctx: ComponentLifecycle, fn: () => T): T {
  const prev = currentComponentLifecycle;
  currentComponentLifecycle = ctx;
  try { return fn(); }
  finally { currentComponentLifecycle = prev; }
}

/**
 * Registers a callback to run after the component's root element mounts.
 * Must be called during component setup.
 */
export function onMount(fn: () => void): void {
  currentComponentLifecycle?.mountHooks.push(fn);
}

/**
 * Registers a callback to run when the component is destroyed.
 * Must be called during component setup.
 */
export function onDestroy(fn: () => void): void {
  currentComponentLifecycle?.destroyHooks.push(fn);
}

/**
 * Wraps a factory function in lifecycle context management, producing
 * a component constructor.
 *
 * @example
 * const MyComp = component((props) => {
 *   onMount(() => console.log('mounted'));
 *   return createElement('div', null, props.text);
 * });
 */
export function component<T extends Record<string, unknown>>(
  factory: (props: T) => unknown
): (props?: T) => unknown {
  return (props: T = {} as T) => {
    const ctx = createComponentContext();
    const element = runInComponentContext(ctx, () => factory(props));

    if (element !== null && typeof element === 'object') {
      (element as Record<string, unknown>)['__velyx_lifecycle__'] = ctx;
    }

    if (ctx.mountHooks.length > 0) {
      queueMicrotask(() => { for (const h of ctx.mountHooks) h(); });
    }

    return element;
  };
}
