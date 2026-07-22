/**
 * VELYX Core Reactivity & Lifecycle Engine
 * Developed by Florynx Labs
 * Zero Virtual DOM - Fine-Grained Reactive Signals
 */
export type CleanupFunction = () => void;
export type EffectFunction = () => void | CleanupFunction;
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
export declare function signal<T>(initialValue: T): Signal<T>;
/**
 * Creates a reactive effect that automatically tracks signals accessed inside `fn`
 * and re-executes whenever any tracked signal updates.
 */
export declare function effect(fn: EffectFunction): CleanupFunction;
/**
 * Creates a derived reactive computed signal.
 */
export declare function computed<T>(fn: () => T): Signal<T>;
/**
 * Batches multiple signal updates to prevent intermediate effect runs.
 */
export declare function batch(fn: () => void): void;
export interface ComponentLifecycle {
    mountHooks: Array<() => void>;
    destroyHooks: Array<() => void>;
}
export declare function createComponentContext(): ComponentLifecycle;
export declare function runInComponentContext<T>(ctx: ComponentLifecycle, fn: () => T): T;
/**
 * Registers a hook to run when the component mounts in the DOM.
 */
export declare function onMount(fn: () => void): void;
/**
 * Registers a hook to run when the component unmounts.
 */
export declare function onDestroy(fn: () => void): void;
/**
 * Shorthand alias for component definition
 */
export declare function component<T extends Record<string, any>>(factory: (props: T) => HTMLElement): (props?: T) => HTMLElement;
//# sourceMappingURL=index.d.ts.map