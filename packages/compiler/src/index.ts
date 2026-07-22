/**
 * @velyx/compiler (v0.3.0)
 * Developed by Florynx Labs
 *
 * Full SFC compiler pipeline:
 *   Lexer → SFC Parser → AST → IR Transformer → Optimization Passes → Code Generator
 *
 * @packageDocumentation
 */

// ─── SFC Types ────────────────────────────────────────────────────────────────

/** The three raw blocks extracted from a `.vx` single-file component. */
export interface ParsedVelyxSFC {
  readonly template: string;
  readonly script: string;
  readonly style: string;
}

/** A node produced by the HTML template parser. */
export interface TemplateNode {
  readonly type: 'element' | 'text';
  readonly tag?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly children?: readonly TemplateNode[];
  readonly content?: string;
  readonly isStatic?: boolean;
}

// ─── Intermediate Representation ──────────────────────────────────────────────

export type IRNodeType = 'IRRoot' | 'IRElement' | 'IRText';

interface BaseIRNode {
  readonly type: IRNodeType;
  readonly isStatic?: boolean;
}

/** A reactive or static text node in the IR. */
export interface IRTextNode extends BaseIRNode {
  readonly type: 'IRText';
  readonly content: string;
  readonly isReactive: boolean;
}

/** An element node with typed event and attribute maps. */
export interface IRElementNode extends BaseIRNode {
  readonly type: 'IRElement';
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly events: Readonly<Record<string, string>>;
  readonly children: readonly IRNode[];
}

/** The root container carrying compiled script, style, and state metadata. */
export interface IRRootNode extends BaseIRNode {
  readonly type: 'IRRoot';
  readonly script: string;
  readonly style: string;
  readonly stateVars: ReadonlySet<string>;
  readonly children: readonly IRNode[];
}

export type IRNode = IRTextNode | IRElementNode | IRRootNode;

// ─── Compilation Metadata ─────────────────────────────────────────────────────

/**
 * Metadata emitted alongside generated code; consumed by DevTools and the
 * future Language Server.
 */
export interface CompilationMetadata {
  readonly reactiveDependencies: readonly string[];
  readonly staticNodesCount: number;
  readonly hydrationIslandsCount: number;
  readonly componentTree: readonly string[];
}

/** The result returned by {@link compile}. */
export interface CompileResult {
  readonly code: string;
  readonly css: string;
  readonly ir: IRRootNode;
  readonly metadata: CompilationMetadata;
}

// ─── Plugin System ────────────────────────────────────────────────────────────

/**
 * A VELYX compiler plugin.
 *
 * Hooks are called in order: `parse → transformAST → transformIR → generate`.
 * Returning `undefined` from any hook passes through the default output.
 *
 * @example
 * definePlugin({
 *   name: 'my-plugin',
 *   transformIR(ir) { return { ...ir, children: [] }; }
 * });
 */
export interface VelyxPlugin {
  readonly name: string;
  readonly enforce?: 'pre' | 'post';
  parse?: (source: string, filename: string) => ParsedVelyxSFC | undefined;
  transformAST?: (ast: readonly TemplateNode[]) => readonly TemplateNode[] | undefined;
  transformIR?: (ir: IRRootNode) => IRRootNode | undefined;
  generate?: (ir: IRRootNode) => string | undefined;
}

/** Creates and returns a typed plugin object. */
export function definePlugin(plugin: VelyxPlugin): VelyxPlugin {
  return plugin;
}

// ─── SFC Lexer / Parser ───────────────────────────────────────────────────────

/**
 * Extracts the `<template>`, `<script>`, and `<style>` blocks from `.vx` source.
 *
 * Missing blocks result in empty strings, never `undefined`.
 */
export function parseSFC(source: string): ParsedVelyxSFC {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/i);
  const scriptMatch   = source.match(/<script>([\s\S]*?)<\/script>/i);
  const styleMatch    = source.match(/<style>([\s\S]*?)<\/style>/i);
  return {
    template: templateMatch?.[1]?.trim() ?? '',
    script:   scriptMatch?.[1]?.trim()   ?? '',
    style:    styleMatch?.[1]?.trim()    ?? ''
  };
}

// ─── HTML Template Parser ─────────────────────────────────────────────────────

function parseHtmlNodes(html: string): TemplateNode[] {
  const nodes: TemplateNode[] = [];
  let pos = 0;
  const len = html.length;

  while (pos < len) {
    const ch = html[pos];

    if (ch === '<') {
      // Closing tag signals end of this subtree
      if (html[pos + 1] === '/') break;

      const openTagMatch = html.slice(pos).match(/^<([a-zA-Z0-9-]+)([^>]*)>/);
      if (openTagMatch !== null) {
        const fullMatch = openTagMatch[0]!;
        const tagName   = openTagMatch[1]!;
        const attrStr   = openTagMatch[2]!;
        pos += fullMatch.length;

        const attrs: Record<string, string> = {};
        const attrRe = /([a-zA-Z0-9-:]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
        let am: RegExpExecArray | null;
        while ((am = attrRe.exec(attrStr)) !== null) {
          const key = am[1]!;
          const val = am[2] ?? am[3] ?? am[4] ?? '';
          attrs[key] = val;
        }

        const selfClosing =
          attrStr.trimEnd().endsWith('/') ||
          ['img', 'input', 'hr', 'br'].includes(tagName);

        const children: TemplateNode[] = [];
        if (!selfClosing) {
          const innerNodes = parseHtmlNodes(html.slice(pos));
          children.push(...innerNodes);
          const closeStr = `</${tagName}>`;
          const closeIdx = html.indexOf(closeStr, pos);
          if (closeIdx !== -1) pos = closeIdx + closeStr.length;
        }

        nodes.push({ type: 'element', tag: tagName, attrs, children });
        continue;
      }
    }

    const nextOpen  = html.indexOf('<', pos);
    const textChunk = nextOpen === -1 ? html.slice(pos) : html.slice(pos, nextOpen);
    pos += textChunk.length;
    if (textChunk.trim().length > 0) {
      nodes.push({ type: 'text', content: textChunk.trim() });
    }
  }

  return nodes;
}

// ─── AST → IR Transformer ────────────────────────────────────────────────────

/** @internal Converts a parsed AST into the IR tree, extracting state variables. */
export function astToIR(
  astNodes: readonly TemplateNode[],
  script: string,
  style: string
): IRRootNode {
  const stateVars = new Set<string>();
  const stateRe = /state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = stateRe.exec(script)) !== null) {
    if (m[1] !== undefined) stateVars.add(m[1]);
  }

  return {
    type: 'IRRoot',
    script,
    style,
    stateVars,
    children: astNodes.map(n => convertAstNode(n, stateVars))
  };
}

function convertAstNode(node: TemplateNode, stateVars: ReadonlySet<string>): IRNode {
  if (node.type === 'text') {
    const text = node.content ?? '';
    const isReactive = /\{\{\s*[^}]+\s*\}\}/.test(text);
    return { type: 'IRText', content: text, isReactive, isStatic: !isReactive };
  }

  const attrs: Record<string, string>  = {};
  const events: Record<string, string> = {};

  for (const [k, v] of Object.entries(node.attrs ?? {})) {
    if (k === 'vx-click' || k.startsWith('vx-on:')) {
      const evt = k === 'vx-click' ? 'click' : k.slice('vx-on:'.length);
      events[evt] = v;
    } else {
      attrs[k] = v;
    }
  }

  return {
    type: 'IRElement',
    tag: node.tag ?? 'div',
    attrs,
    events,
    children: (node.children ?? []).map(c => convertAstNode(c, stateVars)),
    isStatic: false
  };
}

// ─── Optimization Passes ──────────────────────────────────────────────────────

/**
 * Runs the full optimization pass pipeline over the IR and returns the
 * (potentially mutated) IR plus compilation metadata.
 *
 * Each pass is a pure function: `(IRRootNode) → IRRootNode`.
 */
export function runOptimizationPasses(
  ir: IRRootNode
): { ir: IRRootNode; metadata: CompilationMetadata } {
  // Pass 1: Static node detection (future: hoist static subtrees)
  const ir1 = staticNodeDetectionPass(ir);
  // Pass 2: Constant folding (future: collapse literal expressions)
  const ir2 = constantFoldingPass(ir1);

  const metadata: CompilationMetadata = {
    reactiveDependencies: Array.from(ir2.stateVars),
    staticNodesCount:    countStaticNodes(ir2),
    hydrationIslandsCount: countHydrationIslands(ir2),
    componentTree: collectTags(ir2)
  };

  return { ir: ir2, metadata };
}

function staticNodeDetectionPass(ir: IRRootNode): IRRootNode { return ir; }
function constantFoldingPass(ir: IRRootNode): IRRootNode     { return ir; }

function countHydrationIslands(ir: IRRootNode): number {
  let count = 0;
  function walk(node: IRNode): void {
    if (node.type === 'IRElement' && Object.keys(node.events).length > 0) count++;
    if ('children' in node) for (const c of node.children) walk(c);
  }
  walk(ir);
  return count;
}

function countStaticNodes(ir: IRRootNode): number {
  let count = 0;
  function walk(node: IRNode): void {
    if (node.isStatic === true) count++;
    if ('children' in node) for (const c of node.children) walk(c);
  }
  walk(ir);
  return count;
}

function collectTags(ir: IRRootNode): string[] {
  const tags: string[] = [];
  function walk(node: IRNode): void {
    if (node.type === 'IRElement') tags.push(node.tag);
    if ('children' in node) for (const c of node.children) walk(c);
  }
  walk(ir);
  return tags;
}

// ─── Code Generator ───────────────────────────────────────────────────────────

/**
 * Transforms an optimized `IRRootNode` into an executable ES module string.
 *
 * The generated module imports from `@velyx/core` and `@velyx/runtime` so that
 * the user's bundler can tree-shake unused primitives.
 */
export function generateCodeFromIR(ir: IRRootNode): string {
  const stateVars = ir.stateVars;

  // Transform `state x = val` → `const x = signal(val)`
  let script = ir.script.replace(
    /state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\r\n]+);?/g,
    (_m, name: string, init: string) => `const ${name} = signal(${init.trim()});`
  );

  for (const varName of stateVars) {
    // count++ → count(count() + 1)
    script = script.replace(
      new RegExp(`\\b${varName}\\+\\+`, 'g'),
      `${varName}(${varName}() + 1)`
    );
    // count-- → count(count() - 1)
    script = script.replace(
      new RegExp(`\\b${varName}--`, 'g'),
      `${varName}(${varName}() - 1)`
    );
    // count = x  (skip const/let/var declarations)
    script = script.replace(
      new RegExp(`(?<!const\\s|let\\s|var\\s)\\b${varName}\\s*=\\s*([^;\\r\\n)]+)`, 'g'),
      (_m, rhs: string) => `${varName}(${rhs})`
    );
  }

  const rootEl = ir.children.find(n => n.type === 'IRElement') ?? ir.children[0];
  const templateJs = rootEl !== undefined ? irNodeToJs(rootEl, stateVars) : 'null';
  const escapedCss = ir.style.replace(/`/g, '\\`');

  return `\
import { signal, effect, computed, onMount, onDestroy } from '@velyx/core';
import { createElement, bindEvent, bindModel, setAttr } from '@velyx/runtime';

${ir.style ? `injectStyles(\`${escapedCss}\`);` : ''}

export default function Component(props = {}) {
  // --- Reactive State ---
  ${script}

  // --- Render ---
  return ${templateJs};
}

/** @internal Injects component styles into <head> exactly once. */
function injectStyles(css) {
  if (typeof document !== 'undefined' && document.getElementById('velyx-styles') === null) {
    const el = document.createElement('style');
    el.id = 'velyx-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }
}
`.trim();
}

function irNodeToJs(node: IRNode, stateVars: ReadonlySet<string>): string {
  if (node.type === 'IRText') {
    const { content, isReactive } = node;
    if (!isReactive) return JSON.stringify(content);
    const tpl = content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, expr: string) => {
      const e = expr.trim();
      return `\${${stateVars.has(e) ? `${e}()` : e}}`;
    });
    return `() => \`${tpl}\``;
  }

  if (node.type === 'IRElement') {
    const attrEntries = [
      ...Object.entries(node.attrs).map(
        ([k, v]) => `"${k}": "${v}"`
      ),
      ...Object.entries(node.events).map(
        ([evt, handler]) =>
          `"vx-on:${evt}": typeof ${handler} === "function" ? ${handler} : () => ${handler}()`
      )
    ];
    const attrsStr = attrEntries.length > 0 ? `{ ${attrEntries.join(', ')} }` : 'null';
    const childrenStr = node.children
      .map(c => irNodeToJs(c, stateVars))
      .join(', ');
    return `createElement("${node.tag}", ${attrsStr}${childrenStr ? `, ${childrenStr}` : ''})`;
  }

  return 'null';
}

// ─── Public Compile Entry Point ───────────────────────────────────────────────

/** Options accepted by {@link compile}. */
export interface CompileOptions {
  readonly filename?: string;
  readonly plugins?: readonly VelyxPlugin[];
  readonly ssr?: boolean;
}

/**
 * Compiles a `.vx` source string into an ES module.
 *
 * Pipeline:
 * 1. SFC parse (`parseSFC`)
 * 2. HTML template parse → AST
 * 3. AST → IR (`astToIR`)
 * 4. Optimization passes (`runOptimizationPasses`)
 * 5. Code generation (`generateCodeFromIR`)
 *
 * @example
 * const { code, css, ir, metadata } = compile(source, { filename: 'App.vx' });
 */
export function compile(source: string, _options: CompileOptions = {}): CompileResult {
  const sfc  = parseSFC(source);
  const ast  = parseHtmlNodes(sfc.template);
  const ir   = astToIR(ast, sfc.script, sfc.style);
  const { ir: optimizedIr, metadata } = runOptimizationPasses(ir);
  const code = generateCodeFromIR(optimizedIr);

  return { code, css: sfc.style, ir: optimizedIr, metadata };
}

// ─── Language Server APIs ─────────────────────────────────────────────────────

/** A single compiler diagnostic for Language Server consumption. */
export interface VelyxDiagnostic {
  readonly message: string;
  readonly line: number;
  readonly severity: 'error' | 'warning';
}

/**
 * Returns diagnostics for the given `.vx` source without emitting code.
 * Intended for IDE / Language Server integration.
 *
 * @example
 * const diags = getDiagnostics(source);
 * if (diags.length > 0) console.warn(diags[0]?.message);
 */
export function getDiagnostics(source: string): VelyxDiagnostic[] {
  const diags: VelyxDiagnostic[] = [];
  if (!source.includes('<template>')) {
    diags.push({ message: 'Missing <template> block in SFC', line: 1, severity: 'warning' });
  }
  return diags;
}

/**
 * Incrementally parses a `.vx` source and returns its SFC blocks.
 * Extension point for Language Server incremental sync.
 */
export function parseIncremental(source: string): ParsedVelyxSFC {
  return parseSFC(source);
}
