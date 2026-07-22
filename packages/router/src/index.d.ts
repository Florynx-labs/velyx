/**
 * VELYX Router Engine
 * Developed by Florynx Labs
 * Fine-grained SPA & SSR Router with Dynamic Routes and Layouts
 */
export interface RouteDefinition {
    path: string;
    component: () => HTMLElement;
    layout?: (props: {
        children: HTMLElement;
    }) => HTMLElement;
}
export interface RouterOptions {
    routes: RouteDefinition[];
}
export declare const currentPath: import("@velyx/core").Signal<string>;
/**
 * Programmatic Navigation
 */
export declare function navigate(to: string): void;
/**
 * Creates a Router View component
 */
export declare function createRouter(options: RouterOptions): () => HTMLElement;
//# sourceMappingURL=index.d.ts.map