/**
 * VELYX Vite Adapter Plugin
 * Developed by Florynx Labs
 * Enables compiling .vx components seamlessly within Vite applications.
 */
export declare function velyxPlugin(): {
    name: string;
    transform(code: string, id: string): {
        code: string;
        map: null;
    } | null;
};
export default velyxPlugin;
//# sourceMappingURL=index.d.ts.map