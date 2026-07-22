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
export declare function initDevtools(): DevtoolsHook;
//# sourceMappingURL=index.d.ts.map