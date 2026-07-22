/**
 * VELYX Ultra-lightweight DOM Runtime (<10KB)
 * Developed by Florynx Labs
 * Directly targets and updates DOM nodes with zero VDOM overhead.
 */
import { effect } from '@velyx/core';
/**
 * Creates an HTML element with fine-grained reactivity bindings
 */
export function createElement(tag, attrs = null, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            if (key.startsWith('vx-on:') || key.startsWith('on')) {
                const eventName = key.startsWith('vx-on:')
                    ? key.slice(6)
                    : key.slice(2).toLowerCase();
                bindEvent(el, eventName, value);
            }
            else if (key === 'vx-model') {
                bindModel(el, value);
            }
            else if (typeof value === 'function') {
                // Reactive attribute
                effect(() => {
                    setAttr(el, key, value());
                });
            }
            else {
                setAttr(el, key, value);
            }
        }
    }
    appendChildren(el, children);
    return el;
}
/**
 * Appends children dynamically, handling text, nodes, and reactive accessor functions.
 */
export function appendChildren(parent, children) {
    for (const child of children) {
        if (child == null)
            continue;
        if (Array.isArray(child)) {
            appendChildren(parent, child);
        }
        else if (typeof child === 'function') {
            // Reactive text node or dynamic element
            const textNode = document.createTextNode('');
            parent.appendChild(textNode);
            effect(() => {
                const val = child();
                textNode.textContent = val == null ? '' : String(val);
            });
        }
        else if (child instanceof Node) {
            parent.appendChild(child);
        }
        else {
            const textNode = document.createTextNode(String(child));
            parent.appendChild(textNode);
        }
    }
}
/**
 * Sets an attribute or property on a target element
 */
export function setAttr(el, name, value) {
    if (value == null || value === false) {
        el.removeAttribute(name);
    }
    else if (name in el && name !== 'list' && name !== 'type') {
        el[name] = value;
    }
    else {
        el.setAttribute(name, value === true ? '' : String(value));
    }
}
/**
 * Binds an event listener to an element
 */
export function bindEvent(el, eventName, handler) {
    el.addEventListener(eventName, handler);
}
/**
 * Binds input field to a signal bidirectionally (vx-model)
 */
export function bindModel(inputEl, signalFn) {
    effect(() => {
        inputEl.value = signalFn() ?? '';
    });
    inputEl.addEventListener('input', (e) => {
        signalFn(e.target.value);
    });
}
/**
 * Conditional rendering without VDOM (vx-if)
 */
export function bindCondition(container, conditionFn, renderFn) {
    const commentAnchor = document.createComment('vx-if');
    container.appendChild(commentAnchor);
    let currentElement = null;
    effect(() => {
        const isTrue = Boolean(conditionFn());
        if (isTrue && !currentElement) {
            currentElement = renderFn();
            commentAnchor.parentNode?.insertBefore(currentElement, commentAnchor.nextSibling);
        }
        else if (!isTrue && currentElement) {
            currentElement.remove();
            currentElement = null;
        }
    });
}
/**
 * List rendering with fine-grained DOM updating (vx-for)
 */
export function bindLoop(container, listSignal, renderItem) {
    const commentAnchor = document.createComment('vx-for');
    container.appendChild(commentAnchor);
    const nodeMap = new Map();
    effect(() => {
        const list = listSignal() || [];
        const newMap = new Map();
        const parent = commentAnchor.parentNode;
        if (!parent)
            return;
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            let existingNode = nodeMap.get(item);
            if (!existingNode) {
                existingNode = renderItem(item, i);
            }
            newMap.set(item, existingNode);
            parent.insertBefore(existingNode, commentAnchor);
        }
        // Remove nodes no longer present
        for (const [item, node] of nodeMap.entries()) {
            if (!newMap.has(item)) {
                node.remove();
            }
        }
        nodeMap.clear();
        for (const [k, v] of newMap.entries()) {
            nodeMap.set(k, v);
        }
    });
}
/**
 * Mounts a component to a root element in DOM
 */
export function mount(componentFn, target) {
    const container = typeof target === 'string'
        ? document.querySelector(target)
        : target;
    if (!container) {
        throw new Error(`[VELYX Runtime] Target container "${target}" not found in DOM.`);
    }
    container.innerHTML = '';
    const rootNode = componentFn();
    container.appendChild(rootNode);
}
//# sourceMappingURL=index.js.map