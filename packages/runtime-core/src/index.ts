/**
 * VELYX Runtime Core (v0.2.0)
 * Developed by Florynx Labs
 * Platform-agnostic Signals, Priority Scheduler, Scope Trees, and Lifecycle.
 */

export type CleanupFunction = () => void;
export type EffectFunction = () => void | CleanupFunction;

export const PriorityLevel = {
  Immediate: 0,
  UserBlocking: 1,
  Normal: 2,
  Low: 3,
  Idle: 4
} as const;

export type PriorityLevel = typeof PriorityLevel[keyof typeof PriorityLevel];

export interface Task {
  id: number;
  priority: PriorityLevel;
  fn: () => void;
  cancelled?: boolean;
}

// --- Scheduler & Priority Queue Architecture ---
let taskIdCounter = 0;
const priorityQueue: Task[] = [];
let isSchedulerScheduled = false;

export function scheduleTask(fn: () => void, priority: PriorityLevel = PriorityLevel.Immediate): Task {
  const task: Task = {
    id: ++taskIdCounter,
    priority,
    fn
  };

  // Immediate priority runs synchronously unless batching
  if (priority === PriorityLevel.Immediate && !isBatching) {
    try {
      task.fn();
    } catch (err) {
      console.error('[VELYX Scheduler Error]:', err);
    }
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

export function cancelTask(task: Task): void {
  task.cancelled = true;
}

export function flushSchedulerQueue(): void {
  isSchedulerScheduled = false;
  while (priorityQueue.length > 0) {
    const task = priorityQueue.shift();
    if (task && !task.cancelled) {
      try {
        task.fn();
      } catch (err) {
        console.error('[VELYX Scheduler Error]:', err);
      }
    }
  }
}

// --- Reactive Graph Architecture ---
let activeEffect: EffectSubscriber | null = null;
let isBatching = false;
const pendingBatchSet = new Set<EffectSubscriber>();

interface EffectSubscriber {
  execute: () => void;
  cleanup?: CleanupFunction;
  dependencies: Set<Set<EffectSubscriber>>;
  priority: PriorityLevel;
}

export interface Signal<T> {
  (): T;
  (newValue: T | ((prev: T) => T)): T;
  get value(): T;
  set value(newValue: T);
  peek(): T;
  subscribe(fn: (val: T) => void): CleanupFunction;
}

/**
 * Creates a fine-grained reactive signal graph node.
 */
export function signal<T>(initialValue: T): Signal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<EffectSubscriber>();

  function accessor(newValue?: T | ((prev: T) => T)): T {
    if (arguments.length > 0) {
      const nextValue = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(currentValue)
        : (newValue as T);

      if (!Object.is(currentValue, nextValue)) {
        currentValue = nextValue;
        notifySubscribers(subscribers);
      }
      return currentValue;
    }

    if (activeEffect) {
      subscribers.add(activeEffect);
      activeEffect.dependencies.add(subscribers);
    }
    return currentValue;
  }

  Object.defineProperty(accessor, 'value', {
    get() {
      return accessor();
    },
    set(val: T) {
      accessor(val);
    }
  });

  accessor.peek = () => currentValue;
  accessor.subscribe = (fn: (val: T) => void): CleanupFunction => {
    return effect(() => fn(accessor()));
  };

  return accessor as Signal<T>;
}

/**
 * Creates a reactive effect hooked into the scheduler.
 */
export function effect(fn: EffectFunction, priority: PriorityLevel = PriorityLevel.Immediate): CleanupFunction {
  const sub: EffectSubscriber = {
    priority,
    execute() {
      cleanupDependencies(sub);
      const prevEffect = activeEffect;
      activeEffect = sub;
      try {
        if (sub.cleanup) {
          sub.cleanup();
          sub.cleanup = undefined;
        }
        const result = fn();
        if (typeof result === 'function') {
          sub.cleanup = result;
        }
      } finally {
        activeEffect = prevEffect;
      }
    },
    dependencies: new Set()
  };

  sub.execute();

  return () => {
    if (sub.cleanup) sub.cleanup();
    cleanupDependencies(sub);
  };
}

/**
 * Creates a derived reactive computed signal.
 */
export function computed<T>(fn: () => T): Signal<T> {
  const derived = signal<T>(undefined as unknown as T);
  effect(() => {
    derived.value = fn();
  });
  return derived;
}

/**
 * Batches multiple state updates into a single scheduler flush.
 */
export function batch(fn: () => void): void {
  const prevBatching = isBatching;
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = prevBatching;
    if (!isBatching) {
      const effectsToRun = Array.from(pendingBatchSet);
      pendingBatchSet.clear();
      for (const sub of effectsToRun) {
        scheduleTask(() => sub.execute(), sub.priority);
      }
    }
  }
}

function notifySubscribers(subscribers: Set<EffectSubscriber>): void {
  for (const sub of Array.from(subscribers)) {
    if (isBatching) {
      pendingBatchSet.add(sub);
    } else {
      scheduleTask(() => sub.execute(), sub.priority);
    }
  }
}

function cleanupDependencies(sub: EffectSubscriber): void {
  for (const depSet of sub.dependencies) {
    depSet.delete(sub);
  }
  sub.dependencies.clear();
}

// --- Lifecycle Context Management ---
let currentComponentLifecycle: ComponentLifecycle | null = null;

export interface ComponentLifecycle {
  mountHooks: Array<() => void>;
  destroyHooks: Array<() => void>;
}

export function createComponentContext(): ComponentLifecycle {
  return {
    mountHooks: [],
    destroyHooks: []
  };
}

export function runInComponentContext<T>(ctx: ComponentLifecycle, fn: () => T): T {
  const prevCtx = currentComponentLifecycle;
  currentComponentLifecycle = ctx;
  try {
    return fn();
  } finally {
    currentComponentLifecycle = prevCtx;
  }
}

export function onMount(fn: () => void): void {
  if (currentComponentLifecycle) {
    currentComponentLifecycle.mountHooks.push(fn);
  }
}

export function onDestroy(fn: () => void): void {
  if (currentComponentLifecycle) {
    currentComponentLifecycle.destroyHooks.push(fn);
  }
}

export function component<T extends Record<string, any>>(
  factory: (props: T) => any
): (props?: T) => any {
  return (props: T = {} as T) => {
    const ctx = createComponentContext();
    const element = runInComponentContext(ctx, () => factory(props));
    
    if (element && typeof element === 'object') {
      (element as any).__velyx_lifecycle__ = ctx;
    }

    if (ctx.mountHooks.length > 0) {
      queueMicrotask(() => {
        for (const hook of ctx.mountHooks) hook();
      });
    }

    return element;
  };
}
