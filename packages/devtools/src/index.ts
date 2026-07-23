/**
 * @velyx/devtools (v0.4.0)
 * Developed by Florynx Labs
 *
 * Browser-side hook for real-time inspection of signals, components, and
 * lifecycle events in VELYX applications.
 *
 * The hook exposes itself on `window.__VELYX_DEVTOOLS__` so that a browser
 * extension or custom DevTools panel can consume it.
 *
 * @packageDocumentation
 */

import { mountDevtoolsUI } from './ui.js';
export { mountDevtoolsUI };

// ─── Public API ───────────────────────────────────────────────────────────────

/** The shape of a tracked signal entry returned by `getSignals`. */
export interface SignalSnapshot {
  readonly name: string;
  readonly value: unknown;
}

/**
 * The global devtools hook API.
 *
 * @example
 * window.__VELYX_DEVTOOLS__?.registerSignal('count', countSignal);
 */
export interface DevtoolsHook {
  /**
   * Registers a signal so its current value appears in DevTools.
   * @param name   - Display name for the signal.
   * @param getter - Callable that returns the signal's current value.
   */
  registerSignal(name: string, getter: () => unknown): void;
  /**
   * Registers a mounted component root element.
   * @param componentName - Display name for the component.
   * @param element       - The root DOM element of the component.
   */
  registerComponent(componentName: string, element: HTMLElement): void;
  /**
   * Returns a snapshot of all currently registered signals and their values.
   */
  getSignals(): readonly SignalSnapshot[];
}

declare global {
  interface Window {
    __VELYX_DEVTOOLS__?: DevtoolsHook;
  }
}

// ─── Internal State ───────────────────────────────────────────────────────────

const trackedSignals    = new Map<string, () => unknown>();
const trackedComponents = new Set<HTMLElement>();

// ─── initDevtools ─────────────────────────────────────────────────────────────

/**
 * Initialises the VELYX DevTools hook and attaches it to `window`.
 *
 * Call this once, as early as possible in your application entry-point (or
 * let the framework do it automatically in development mode).
 *
 * @returns The live `DevtoolsHook` instance.
 *
 * @example
 * import { initDevtools } from '@velyx/devtools';
 * if (import.meta.env.DEV) initDevtools();
 */
export function initDevtools(): DevtoolsHook {
  const hook: DevtoolsHook = {
    registerSignal(name: string, getter: () => unknown): void {
      trackedSignals.set(name, getter);
      notifyDevtoolsChange();
    },

    registerComponent(componentName: string, element: HTMLElement): void {
      // componentName is reserved for the future component-tree inspector
      void componentName;
      trackedComponents.add(element);
      notifyDevtoolsChange();
    },

    getSignals(): readonly SignalSnapshot[] {
      return Array.from(trackedSignals.entries()).map(([name, getter]) => ({
        name,
        value: getter()
      }));
    }
  };

  if (typeof window !== 'undefined') {
    window.__VELYX_DEVTOOLS__ = hook;
    mountDevtoolsUI(hook);
  }

  return hook;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function notifyDevtoolsChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('velyx:devtools:update', {
      detail: {
        signalsCount:    trackedSignals.size,
        componentsCount: trackedComponents.size
      }
    })
  );
}
