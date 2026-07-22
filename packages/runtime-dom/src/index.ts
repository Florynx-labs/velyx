/**
 * @velyx/runtime-dom (v0.3.0)
 * Developed by Florynx Labs
 *
 * DOM-specific renderer for the VELYX framework.
 * Provides fine-grained element creation, keyed list reconciliation,
 * conditional rendering, two-way data binding, and mounting.
 *
 * @packageDocumentation
 */

import { effect } from '@velyx/runtime-core';

/** Everything that can be passed as a child to `createElement`. */
export type Child =
  | HTMLElement
  | Text
  | string
  | number
  | boolean
  | null
  | undefined;

// ─── createElement ────────────────────────────────────────────────────────────

/**
 * Creates a DOM element with reactive attr binding and appends children.
 *
 * Attribute rules (in priority order):
 * - `vx-on:<event>` / `on*` → registers an event listener via {@link bindEvent}
 * - `vx-model`              → two-way binding via {@link bindModel}
 * - function value           → reactive binding (re-runs on signal change)
 * - static value             → sets once via {@link setAttr}
 *
 * @example
 * createElement('button', { 'vx-on:click': increment }, () => count())
 */
export function createElement(
  tag: string,
  attrs: Record<string, unknown> | null = null,
  ...children: unknown[]
): HTMLElement {
  const el = document.createElement(tag);

  if (attrs !== null) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('vx-on:') || key.startsWith('on')) {
        const eventName = key.startsWith('vx-on:')
          ? key.slice(6)
          : key.slice(2).toLowerCase();
        bindEvent(el, eventName, value as (e: Event) => void);
      } else if (key === 'vx-model') {
        bindModel(el as HTMLInputElement, value);
      } else if (typeof value === 'function') {
        effect(() => { setAttr(el, key, (value as () => unknown)()); });
      } else {
        setAttr(el, key, value);
      }
    }
  }

  appendChildren(el, children);
  return el;
}

// ─── appendChildren ───────────────────────────────────────────────────────────

/** @internal Recursively appends children to a parent element. */
export function appendChildren(parent: HTMLElement, children: unknown[]): void {
  for (const child of children) {
    if (child == null || child === false) continue;

    if (Array.isArray(child)) {
      appendChildren(parent, child as unknown[]);
    } else if (typeof child === 'function') {
      // Reactive text node: the function is a signal-returning accessor.
      const textNode = document.createTextNode('');
      parent.appendChild(textNode);
      effect(() => {
        const val = (child as () => unknown)();
        textNode.textContent = val == null ? '' : String(val);
      });
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

// ─── setAttr ──────────────────────────────────────────────────────────────────

/**
 * Sets or removes an attribute/property on a DOM element.
 *
 * - `null | false` → removes the attribute
 * - `true`         → sets the attribute to `""` (boolean attribute)
 * - Otherwise      → sets `el[name]` if it's a writable DOM property,
 *                    falls back to `setAttribute`
 */
export function setAttr(el: HTMLElement, name: string, value: unknown): void {
  if (value == null || value === false) {
    el.removeAttribute(name);
  } else if (name in el && name !== 'list' && name !== 'type') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as unknown as Record<string, unknown>)[name] = value;
  } else {
    el.setAttribute(name, value === true ? '' : String(value));
  }
}

// ─── bindEvent ────────────────────────────────────────────────────────────────

/**
 * Registers a DOM event listener on `el`.
 *
 * @example
 * bindEvent(button, 'click', () => count(count() + 1));
 */
export function bindEvent(
  el: HTMLElement,
  eventName: string,
  handler: (e: Event) => void
): void {
  el.addEventListener(eventName, handler);
}

// ─── bindModel ────────────────────────────────────────────────────────────────

/**
 * Establishes two-way binding between a signal and an `<input>` element.
 *
 * - Signal → DOM:  effect updates `inputEl.value` when the signal changes.
 * - DOM → signal:  `input` event calls `signalFn(newValue)` on every keystroke.
 *
 * @example
 * bindModel(inputEl, nameSignal);
 */
export function bindModel(
  inputEl: HTMLInputElement,
  signalFn: unknown
): void {
  const getter = signalFn as (() => string) & ((v: string) => void);
  effect(() => { inputEl.value = getter() ?? ''; });
  inputEl.addEventListener('input', (e) => {
    getter((e.target as HTMLInputElement).value);
  });
}

// ─── bindCondition ────────────────────────────────────────────────────────────

/**
 * Conditionally renders an element into `container` based on `conditionFn`.
 *
 * Tracks `conditionFn` as a reactive dependency and mounts/unmounts the
 * element produced by `renderFn` without destroying sibling nodes.
 *
 * @example
 * bindCondition(wrapper, () => isOpen(), () => createElement('dialog', null, '...'));
 */
export function bindCondition(
  container: HTMLElement,
  conditionFn: () => boolean,
  renderFn: () => HTMLElement
): void {
  const anchor = document.createComment('vx-if');
  container.appendChild(anchor);
  let current: HTMLElement | null = null;

  effect(() => {
    const show = Boolean(conditionFn());
    if (show && current === null) {
      current = renderFn();
      anchor.parentNode?.insertBefore(current, anchor.nextSibling);
    } else if (!show && current !== null) {
      current.remove();
      current = null;
    }
  });
}

// ─── bindLoop ─────────────────────────────────────────────────────────────────

/**
 * Performs keyed list reconciliation: renders a list of elements from
 * `listSignal`, adding/removing/reusing DOM nodes as the list changes.
 *
 * Each item is used as its own map key (identity-based diffing).
 * For large lists with non-primitive items, prefer adding a `key` property.
 *
 * @example
 * bindLoop(ul, () => items(), (item, i) => createElement('li', null, item.name));
 */
export function bindLoop<T>(
  container: HTMLElement,
  listSignal: () => T[],
  renderItem: (item: T, index: number) => HTMLElement
): void {
  const anchor = document.createComment('vx-for');
  container.appendChild(anchor);
  const nodeMap = new Map<T, HTMLElement>();

  effect(() => {
    const list = listSignal();
    const newMap = new Map<T, HTMLElement>();
    const parent = anchor.parentNode;
    if (parent === null) return;

    for (let i = 0; i < list.length; i++) {
      const item = list[i] as T;
      const existing = nodeMap.get(item);
      const node = existing ?? renderItem(item, i);
      newMap.set(item, node);
      parent.insertBefore(node, anchor);
    }

    for (const [item, node] of nodeMap.entries()) {
      if (!newMap.has(item)) node.remove();
    }

    nodeMap.clear();
    for (const [k, v] of newMap.entries()) { nodeMap.set(k, v); }
  });
}

// ─── mount ────────────────────────────────────────────────────────────────────

/**
 * Mounts a component into a DOM target, clearing existing content.
 *
 * @param componentFn - A function that returns the root element.
 * @param target      - A CSS selector string or a direct `HTMLElement`.
 *
 * @throws If the target element is not found in the document.
 *
 * @example
 * mount(() => App(), '#app');
 */
export function mount(
  componentFn: () => HTMLElement,
  target: HTMLElement | string
): void {
  const container =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;

  if (container === null) {
    throw new Error(
      `[VELYX Runtime DOM] Target container "${String(target)}" not found in the document.`
    );
  }

  container.innerHTML = '';
  container.appendChild(componentFn());
}
