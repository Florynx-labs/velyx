/**
 * VELYX Server Engine
 * Developed by Florynx Labs
 * Handles SSR, streaming, and server actions.
 */
export interface SSRRenderOptions {
    manifest?: Record<string, any>;
    data?: Record<string, any>;
}
/**
 * Renders a Velyx component to HTML string for SSR with hydration attributes.
 */
export declare function renderToString(component: (props?: any) => any, props?: Record<string, any>, options?: SSRRenderOptions): Promise<string>;
/**
 * Server Action helper
 */
export declare function createServerAction<T, R>(actionFn: (data: T) => Promise<R>): (data: T) => Promise<R>;
//# sourceMappingURL=index.d.ts.map