/**
 * VELYX Devtools Hook & Inspector
 * Developed by Florynx Labs
 * Enables real-time state, signal graph, and component lifecycle inspection.
 */
const trackedSignals = new Map();
const trackedComponents = new Set();
export function initDevtools() {
    const hook = {
        registerSignal(name, signalInstance) {
            trackedSignals.set(name, signalInstance);
            notifyDevtoolsChange();
        },
        registerComponent(name, element) {
            trackedComponents.add(element);
            notifyDevtoolsChange();
        },
        getSignals() {
            const stateSnapshot = {};
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
//# sourceMappingURL=index.js.map