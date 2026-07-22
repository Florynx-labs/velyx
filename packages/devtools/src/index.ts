/**
 * VELYX Devtools Hook & Inspector
 * Developed by Florynx Labs
 * Enables real-time state, signal graph, and component lifecycle inspection.
 */

export interface DevtoolsHook {
  registerSignal: (name: string, signalInstance: any) => void;
  registerComponent: (name: string, element: HTMLElement) => void;
  getSignals: () => Record<string, any>;
}

declare global {
  interface Window {
    __VELYX_DEVTOOLS__?: DevtoolsHook;
  }
}

const trackedSignals = new Map<string, any>();
const trackedComponents = new Set<HTMLElement>();

export function initDevtools(): DevtoolsHook {
  const hook: DevtoolsHook = {
    registerSignal(name: string, signalInstance: any) {
      trackedSignals.set(name, signalInstance);
      notifyDevtoolsChange();
    },
    registerComponent(name: string, element: HTMLElement) {
      trackedComponents.add(element);
      notifyDevtoolsChange();
    },
    getSignals() {
      const stateSnapshot: Record<string, any> = {};
      for (const [key, sig] of trackedSignals.entries()) {
        stateSnapshot[key] = sig();
      }
      return stateSnapshot;
    }
  };

  if (typeof window !== 'undefined') {
    window.__VELYX_DEVTOOLS__ = hook;
  }

  return hook;
}

function notifyDevtoolsChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('velyx:devtools:update', {
      detail: {
        signalsCount: trackedSignals.size,
        componentsCount: trackedComponents.size
      }
    }));
  }
}
