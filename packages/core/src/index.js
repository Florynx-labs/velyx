/**
 * VELYX Core Reactivity & Lifecycle Engine
 * Developed by Florynx Labs
 * Zero Virtual DOM - Fine-Grained Reactive Signals
 */
let activeEffect = null;
let isBatching = false;
const pendingEffects = new Set();
/**
 * Creates a fine-grained reactive signal.
 */
export function signal(initialValue) {
    let currentValue = initialValue;
    const subscribers = new Set();
    function accessor(newValue) {
        if (arguments.length > 0) {
            const nextValue = typeof newValue === 'function'
                ? newValue(currentValue)
                : newValue;
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
        set(val) {
            accessor(val);
        }
    });
    accessor.peek = () => currentValue;
    accessor.subscribe = (fn) => {
        return effect(() => fn(accessor()));
    };
    return accessor;
}
/**
 * Creates a reactive effect that automatically tracks signals accessed inside `fn`
 * and re-executes whenever any tracked signal updates.
 */
export function effect(fn) {
    const sub = {
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
            }
            finally {
                activeEffect = prevEffect;
            }
        },
        dependencies: new Set()
    };
    sub.execute();
    return () => {
        if (sub.cleanup)
            sub.cleanup();
        cleanupDependencies(sub);
    };
}
/**
 * Creates a derived reactive computed signal.
 */
export function computed(fn) {
    const derived = signal(undefined);
    effect(() => {
        derived.value = fn();
    });
    return derived;
}
/**
 * Batches multiple signal updates to prevent intermediate effect runs.
 */
export function batch(fn) {
    const prevBatching = isBatching;
    isBatching = true;
    try {
        fn();
    }
    finally {
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
function notifySubscribers(subscribers) {
    for (const sub of Array.from(subscribers)) {
        if (isBatching) {
            pendingEffects.add(sub);
        }
        else {
            sub.execute();
        }
    }
}
function cleanupDependencies(sub) {
    for (const depSet of sub.dependencies) {
        depSet.delete(sub);
    }
    sub.dependencies.clear();
}
// Lifecycle Context Management
let currentComponentLifecycle = null;
export function createComponentContext() {
    return {
        mountHooks: [],
        destroyHooks: []
    };
}
export function runInComponentContext(ctx, fn) {
    const prevCtx = currentComponentLifecycle;
    currentComponentLifecycle = ctx;
    try {
        return fn();
    }
    finally {
        currentComponentLifecycle = prevCtx;
    }
}
/**
 * Registers a hook to run when the component mounts in the DOM.
 */
export function onMount(fn) {
    if (currentComponentLifecycle) {
        currentComponentLifecycle.mountHooks.push(fn);
    }
}
/**
 * Registers a hook to run when the component unmounts.
 */
export function onDestroy(fn) {
    if (currentComponentLifecycle) {
        currentComponentLifecycle.destroyHooks.push(fn);
    }
}
/**
 * Shorthand alias for component definition
 */
export function component(factory) {
    return (props = {}) => {
        const ctx = createComponentContext();
        const element = runInComponentContext(ctx, () => factory(props));
        // Attach lifecycle triggers to DOM node
        element.__velyx_lifecycle__ = ctx;
        // Trigger onMount after frame
        if (ctx.mountHooks.length > 0) {
            queueMicrotask(() => {
                for (const hook of ctx.mountHooks)
                    hook();
            });
        }
        return element;
    };
}
//# sourceMappingURL=index.js.map