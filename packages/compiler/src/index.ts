/**
 * @velyx/compiler (v0.3.0)
 * Developed by Florynx Labs
 *
 * Full SFC compiler pipeline:
 *   Lexer → SFC Parser → AST → IR Transformer → Optimization Passes → Code Generator
 *
 * @packageDocumentation
 */

// ─── Exports ──────────────────────────────────────────────────────────────────

export * from './config.js';
export * from './insights.js';
import type { VelyxConfig } from './config.js';
import type { TransitionInsight } from './insights.js';

// ─── SFC Types ────────────────────────────────────────────────────────────────

/**
 * The raw blocks extracted from a `.vx` single-file component.
 *
 * Block precedence for client logic:
 *   1. `setup`  — new preferred block (VELYX v0.5+)
 *   2. `script` — legacy block (still accepted for backward compatibility)
 */
export interface ParsedVelyxSFC {
  /** Inlined HTML template. */
  readonly template: string;
  /** Legacy `<script>` block (backward compat). Prefer `setup`. */
  readonly script: string;
  /** New `<setup>` block — primary client logic block (v0.5+). */
  readonly setup: string;
  /** `<config>` block metadata (definePage, defineProps…). */
  readonly config: string;
  /** `<script server>` block — server-only logic. */
  readonly scriptServer: string;
  readonly style: string;
  readonly transition: string;
}

/** Parsed metadata from a `<config>` block. */
export interface PageConfig {
  readonly title?: string;
  readonly layout?: string;
  readonly description?: string;
  readonly [key: string]: string | undefined;
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
  readonly transition?: string;
}

// ─── Transition IR ────────────────────────────────────────────────────────────

export interface TransitionKeyframe {
  readonly offset: string;
  readonly properties: Readonly<Record<string, string>>;
}

export interface TransitionDefinition {
  readonly name: string;
  readonly keyframes: readonly TransitionKeyframe[];
  readonly used: boolean;
}

/** The root container carrying compiled script, style, and state metadata. */
export interface IRRootNode extends BaseIRNode {
  readonly type: 'IRRoot';
  readonly script: string;
  readonly style: string;
  readonly stateVars: ReadonlySet<string>;
  readonly children: readonly IRNode[];
  readonly transitions: readonly TransitionDefinition[];
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
  readonly transitions: readonly TransitionInsight[];
  readonly unusedTransitions: readonly string[];
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
 * Extracts all blocks from a `.vx` source file.
 *
 * Block support (v0.5+):
 * - `<config>`        → page/component metadata
 * - `<setup>`         → primary client logic (new convention)
 * - `<script>`        → legacy client logic (backward compat)
 * - `<script server>` → server-only functions
 * - `<template>`      → HTML template
 * - `<style>`         → scoped styles
 * - `<transition>`    → WAAPI animation definitions
 *
 * Missing blocks result in empty strings, never `undefined`.
 */
export function parseSFC(source: string): ParsedVelyxSFC {
  const templateMatch     = source.match(/<template>([\s\S]*?)<\/template>/i);
  // <script server> must be matched BEFORE generic <script> to avoid overlap
  const scriptServerMatch = source.match(/<script\s+server>([\s\S]*?)<\/script>/i);
  const scriptMatch       = source.match(/<script(?!\s+server)>([\s\S]*?)<\/script>/i);
  const setupMatch        = source.match(/<setup>([\s\S]*?)<\/setup>/i);
  const configMatch       = source.match(/<config>([\s\S]*?)<\/config>/i);
  const styleMatch        = source.match(/<style>([\s\S]*?)<\/style>/i);
  const transitionMatch   = source.match(/<transition>([\s\S]*?)<\/transition>/i);

  return {
    template:     templateMatch?.[1]?.trim()     ?? '',
    setup:        setupMatch?.[1]?.trim()        ?? '',
    script:       scriptMatch?.[1]?.trim()       ?? '',
    scriptServer: scriptServerMatch?.[1]?.trim() ?? '',
    config:       configMatch?.[1]?.trim()       ?? '',
    style:        styleMatch?.[1]?.trim()        ?? '',
    transition:   transitionMatch?.[1]?.trim()   ?? ''
  };
}

/**
 * Parses a `<config>` block and extracts its key/value pairs from a
 * `definePage({...})` or `defineProps({...})` call.
 *
 * @example
 * // Source: definePage({ title: "Home", layout: "default" })
 * // Result: { title: "Home", layout: "default" }
 */
export function parseConfigBlock(raw: string): PageConfig {
  const config: Record<string, string> = {};
  const objMatch = raw.match(/define(?:Page|Props|Component)\s*\(\s*\{([\s\S]*?)\}\s*\)/i);
  if (!objMatch) return config;

  const propRe = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:"([^"]*)"|'([^']*)'|([^,\n}]*))/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(objMatch[1] ?? '')) !== null) {
    config[m[1]!] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
  }
  return config;
}

export function parseTransitionBlock(raw: string): TransitionDefinition[] {
  const definitions: TransitionDefinition[] = [];
  const blockRe = /([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
  const keyframeRe = /([0-9]+%)\s*\{([^}]+)\}/g;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(raw)) !== null) {
    const name = blockMatch[1]!;
    const body = blockMatch[2]!;
    
    const keyframes: TransitionKeyframe[] = [];
    let kfMatch: RegExpExecArray | null;
    while ((kfMatch = keyframeRe.exec(body)) !== null) {
      const offset = kfMatch[1]!;
      const propsStr = kfMatch[2]!;
      const properties: Record<string, string> = {};
      
      const propRe = /([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = propRe.exec(propsStr)) !== null) {
        properties[pMatch[1]!] = pMatch[2]!.trim();
      }
      
      keyframes.push({ offset, properties });
    }
    
    definitions.push({ name, keyframes, used: false });
  }
  
  return definitions;
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

/**
 * @internal Converts a parsed AST into the IR tree, extracting state variables.
 *
 * `setup` takes priority over `script` for client logic.
 * Both are accepted to maintain backward compatibility.
 */
export function astToIR(
  astNodes: readonly TemplateNode[],
  script: string,
  style: string,
  transitionBlock: string = '',
  setup: string = ''
): IRRootNode {
  // Use `setup` if present, fallback to legacy `script`
  const clientScript = setup.length > 0 ? setup : script;
  const stateVars = new Set<string>();
  const stateRe = /state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = stateRe.exec(clientScript)) !== null) {
    if (m[1] !== undefined) stateVars.add(m[1]);
  }

  const transitions = parseTransitionBlock(transitionBlock);

  return {
    type: 'IRRoot',
    script: clientScript,
    style,
    stateVars,
    children: astNodes.map(n => convertAstNode(n, stateVars)),
    transitions
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
  let transition: string | undefined;

  for (const [k, v] of Object.entries(node.attrs ?? {})) {
    if (k === 'vx-click' || k.startsWith('vx-on:')) {
      const evt = k === 'vx-click' ? 'click' : k.slice('vx-on:'.length);
      events[evt] = v;
    } else if (k === 'vx-transition') {
      transition = v;
    } else {
      attrs[k] = v;
    }
  }

  const nodeData: IRElementNode = {
    type: 'IRElement',
    tag: node.tag ?? 'div',
    attrs,
    events,
    children: (node.children ?? []).map(c => convertAstNode(c, stateVars)),
    isStatic: false
  };

  if (transition !== undefined) {
    // We cast any because transition is readonly in the type
    (nodeData as any).transition = transition;
  }

  return nodeData;
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
  // Pass 3: Dead Transition Elimination
  const ir3 = deadTransitionEliminationPass(ir2);

  const transitionInsights: TransitionInsight[] = ir3.transitions.map(t => ({
    name: t.name,
    used: t.used,
    keyframeCount: t.keyframes.length,
    strategy: 'waapi'
  }));

  const metadata: CompilationMetadata = {
    reactiveDependencies: Array.from(ir3.stateVars),
    staticNodesCount:    countStaticNodes(ir3),
    hydrationIslandsCount: countHydrationIslands(ir3),
    componentTree: collectTags(ir3),
    transitions: transitionInsights,
    unusedTransitions: ir2.transitions.filter(t => !t.used).map(t => t.name)
  };

  return { ir: ir3, metadata };
}

function deadTransitionEliminationPass(ir: IRRootNode): IRRootNode {
  const usedTransitions = new Set<string>();
  
  function walk(node: IRNode): void {
    if (node.type === 'IRElement' && node.transition !== undefined) {
      usedTransitions.add(node.transition);
    }
    if ('children' in node) {
      for (const c of node.children) walk(c);
    }
  }
  
  walk(ir);
  
  return {
    ...ir,
    transitions: ir.transitions.map(t => ({
      ...t,
      used: usedTransitions.has(t.name)
    }))
  };
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
  const usedTransitions = ir.transitions.filter(t => t.used);
  
  let transitionRegistrations = '';
  if (usedTransitions.length > 0) {
    transitionRegistrations = usedTransitions.map(t => {
      const waapiFrames = t.keyframes.map(kf => {
        // Convert '0%' to 0.0, '100%' to 1.0
        const offsetVal = parseFloat(kf.offset) / 100;
        const camelProps = Object.entries(kf.properties).map(([k, v]) => {
          const camelKey = k.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          return `"${camelKey}": "${v}"`;
        }).join(', ');
        return `{ offset: ${offsetVal}, ${camelProps} }`;
      }).join(', ');
      
      return `registerTransition("${t.name}", { name: "${t.name}", keyframes: [${waapiFrames}] });`;
    }).join('\n');
  }

  return `\
import { signal, effect, computed, onMount, onDestroy } from '@velyxteam/core';
import { createElement, bindEvent, bindModel, setAttr, registerTransition } from '@velyxteam/runtime';

${ir.style ? `injectStyles(\`${escapedCss}\`);` : ''}
${transitionRegistrations}

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
    if (node.transition) {
      attrEntries.push(`"vx-transition": "${node.transition}"`);
    }
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
  readonly config?: VelyxConfig;
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
  // Pass `setup` to astToIR — it will use setup if present, fallback to script
  const ir   = astToIR(ast, sfc.script, sfc.style, sfc.transition, sfc.setup);
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
  const sfc = parseSFC(source);

  if (!source.includes('<template>')) {
    diags.push({ message: 'Missing <template> block in SFC', line: 1, severity: 'warning' });
  }
  if (sfc.script.length > 0 && sfc.setup.length > 0) {
    diags.push({ message: 'Both <script> and <setup> are present. <setup> will be used; <script> is ignored.', line: 1, severity: 'warning' });
  }
  if (sfc.script.length > 0 && sfc.setup.length === 0) {
    diags.push({ message: '<script> is deprecated in favour of <setup>. Please migrate to <setup>.', line: 1, severity: 'warning' });
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
