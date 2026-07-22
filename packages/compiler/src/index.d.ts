/**
 * VELYX SFC Compiler & Code Generator
 * Developed by Florynx Labs
 * Parses .vx files and compiles them into fine-grained reactive ES Modules.
 */
export interface ParsedVelyxSFC {
    template: string;
    script: string;
    style: string;
}
export interface CompileOptions {
    filename?: string;
    ssr?: boolean;
}
export interface CompileResult {
    code: string;
    css: string;
    ast?: any;
}
/**
 * Extracts <template>, <script>, and <style> blocks from .vx file source code
 */
export declare function parseSFC(source: string): ParsedVelyxSFC;
/**
 * Compiles a .vx single file component into executable JavaScript module.
 */
export declare function compile(source: string, options?: CompileOptions): CompileResult;
//# sourceMappingURL=index.d.ts.map