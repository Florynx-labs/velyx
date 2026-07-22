/**
 * VELYX Core Reactivity & Lifecycle Engine
 * Developed by Florynx Labs
 * Zero Virtual DOM - Fine-Grained Reactive Signals
 */

export type CleanupFunction = () => void;
export type EffectFunction = () => void | CleanupFunction;

let activeEffect: EffectSubscriber | null = null;
let isBatching = false;
const pendingEffects = new Set<EffectSubscriber>();

interface EffectSubscriber {
  execute: () => void;
  cleanup?: CleanupFunction;
  dependencies: Set<Set<EffectSubscriber>>;
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
 * Creates a fine-grained reactive signal.
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

    // Read value: register active effect as subscriber
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
 * Creates a reactive effect that automatically tracks signals accessed inside `fn`
 * and re-executes whenever any tracked signal updates.
 */
export function effect(fn: EffectFunction): CleanupFunction {
  const sub: EffectSubscriber = {
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
 * Batches multiple signal updates to prevent intermediate effect runs.
 */
export function batch(fn: () => void): void {
  const prevBatching = isBatching;
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = prevBatching;
    if (!isBatching) {
      const effectsToRun = Array.from(pendingEffects);
      pendingEffects.clear();
      for (const sub of effectsToRun) {
        sub.execute();
      }
    }
  }
}

function notifySubscribers(subscribers: Set<EffectSubscriber>) {
  for (const sub of Array.from(subscribers)) {
    if (isBatching) {
      pendingEffects.add(sub);
    } else {
      sub.execute();
    }
  }
}

function cleanupDependencies(sub: EffectSubscriber) {
  for (const depSet of sub.dependencies) {
    depSet.delete(sub);
  }
  sub.dependencies.clear();
}

// Lifecycle Context Management
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

/**
 * Registers a hook to run when the component mounts in the DOM.
 */
export function onMount(fn: () => void): void {
  if (currentComponentLifecycle) {
    currentComponentLifecycle.mountHooks.push(fn);
  }
}

/**
 * Registers a hook to run when the component unmounts.
 */
export function onDestroy(fn: () => void): void {
  if (currentComponentLifecycle) {
    currentComponentLifecycle.destroyHooks.push(fn);
  }
}

/**
 * Shorthand alias for component definition
 */
export function component<T extends Record<string, any>>(
  factory: (props: T) => HTMLElement
): (props?: T) => HTMLElement {
  return (props: T = {} as T) => {
    const ctx = createComponentContext();
    const element = runInComponentContext(ctx, () => factory(props));
    
    // Attach lifecycle triggers to DOM node
    (element as any).__velyx_lifecycle__ = ctx;

    // Trigger onMount after frame
    if (ctx.mountHooks.length > 0) {
      queueMicrotask(() => {
        for (const hook of ctx.mountHooks) hook();
      });
    }

    return element;
  };
}
