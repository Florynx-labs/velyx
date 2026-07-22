/**
 * VELYX Ultra-lightweight DOM Runtime (<10KB)
 * Developed by Florynx Labs
 * Directly targets and updates DOM nodes with zero VDOM overhead.
 */
export type Child = HTMLElement | Text | string | number | null | undefined;
/**
 * Creates an HTML element with fine-grained reactivity bindings
 */
export declare function createElement(tag: string, attrs?: Record<string, any> | null, ...children: any[]): HTMLElement;
/**
 * Appends children dynamically, handling text, nodes, and reactive accessor functions.
 */
export declare function appendChildren(parent: HTMLElement, children: any[]): void;
/**
 * Sets an attribute or property on a target element
 */
export declare function setAttr(el: HTMLElement, name: string, value: any): void;
/**
 * Binds an event listener to an element
 */
export declare function bindEvent(el: HTMLElement, eventName: string, handler: (e: Event) => void): void;
/**
 * Binds input field to a signal bidirectionally (vx-model)
 */
export declare function bindModel(inputEl: HTMLInputElement, signalFn: any): void;
/**
 * Conditional rendering without VDOM (vx-if)
 */
export declare function bindCondition(container: HTMLElement, conditionFn: () => boolean, renderFn: () => HTMLElement): void;
/**
 * List rendering with fine-grained DOM updating (vx-for)
 */
export declare function bindLoop<T>(container: HTMLElement, listSignal: () => T[], renderItem: (item: T, index: number) => HTMLElement): void;
/**
 * Mounts a component to a root element in DOM
 */
export declare function mount(componentFn: () => HTMLElement, target: HTMLElement | string): void;
//# sourceMappingURL=index.d.ts.map