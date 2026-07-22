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

export interface TemplateNode {
  type: 'element' | 'text' | 'interpolation';
  tag?: string;
  attrs?: Record<string, string>;
  children?: TemplateNode[];
  content?: string;
}

/**
 * Extracts <template>, <script>, and <style> blocks from .vx file source code
 */
export function parseSFC(source: string): ParsedVelyxSFC {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/i);
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/i);
  const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/i);

  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : '',
    style: styleMatch ? styleMatch[1].trim() : ''
  };
}

/**
 * Compiles a .vx single file component into executable JavaScript module.
 */
export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const { template, script, style } = parseSFC(source);
  const stateVars = new Set<string>();

  // 1. Transform Script Block Syntax
  // Converts `state name = value;` to `const name = signal(value);`
  let transformedScript = script.replace(/state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\r\n]+);?/g, (match, varName, initVal) => {
    stateVars.add(varName);
    return `const ${varName} = signal(${initVal.trim()});`;
  });

  // Replaces state variable increment/decrement: `count++` -> `count(count() + 1)`
  for (const varName of stateVars) {
    const incRegex = new RegExp(`\\b${varName}\\+\\+`, 'g');
    const decRegex = new RegExp(`\\b${varName}\\-\\-\n`, 'g');
    const assignRegex = new RegExp(`(?<!const\\s+|let\\s+|var\\s+)\\b${varName}\\s*=\\s*([^;\\r\\n\\)]+)`, 'g');

    transformedScript = transformedScript
      .replace(incRegex, `${varName}(${varName}() + 1)`)
      .replace(decRegex, `${varName}(${varName}() - 1)`)
      .replace(assignRegex, `${varName}($1)`);
  }

  // 2. Parse Template HTML into AST Nodes
  const templateAst = parseHtmlNodes(template);
  const compiledTemplateJs = generateJsFromAst(templateAst, stateVars);

  // 3. Generate Full ES Module Output
  const code = `
import { signal, effect, computed, onMount, onDestroy } from '@velyx/core';
import { createElement, bindEvent, bindModel, setAttr, appendChildren } from '@velyx/runtime';

${style ? `injectStyles(\`${style.replace(/`/g, '\\`')}\`);` : ''}

export default function Component(props = {}) {
  // --- Script State & Logic ---
  ${transformedScript}

  // --- Render Function ---
  return ${compiledTemplateJs};
}

function injectStyles(css) {
  if (typeof document !== 'undefined' && !document.getElementById('velyx-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'velyx-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }
}
`.trim();

  return {
    code,
    css: style
  };
}

/**
 * Parses HTML template string into an AST of TemplateNode[]
 */
function parseHtmlNodes(html: string): TemplateNode[] {
  const nodes: TemplateNode[] = [];
  let pos = 0;
  const len = html.length;

  while (pos < len) {
    if (html[pos] === '<') {
      // Check if closing tag
      if (html[pos + 1] === '/') {
        break; // Reached closing tag of parent node
      }

      // Parse opening tag
      const openTagMatch = html.slice(pos).match(/^<([a-zA-Z0-9-]+)([^>]*)>/);
      if (openTagMatch) {
        const fullMatch = openTagMatch[0];
        const tagName = openTagMatch[1];
        const attrStr = openTagMatch[2];

        pos += fullMatch.length;

        // Parse attributes
        const attrs: Record<string, string> = {};
        const attrRegex = /([a-zA-Z0-9-:]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
        }

        // Self closing tags e.g. <img /> or <input />
        const isSelfClosing = attrStr.trim().endsWith('/') || ['img', 'input', 'hr', 'br'].includes(tagName);

        let children: TemplateNode[] = [];
        if (!isSelfClosing) {
          children = parseHtmlNodes(html.slice(pos));
          // Skip closing tag </tagName>
          const closeTagRegex = new RegExp(`^<\\/${tagName}>`, 'i');
          const remaining = html.slice(pos);
          const closeMatch = remaining.match(closeTagRegex);
          if (closeMatch) {
            pos += closeMatch[0].length;
          } else {
            // Find position of closing tag in remaining
            const closeIndex = remaining.indexOf(`</${tagName}>`);
            if (closeIndex !== -1) {
              pos += closeIndex + `</${tagName}>`.length;
            }
          }
        }

        nodes.push({
          type: 'element',
          tag: tagName,
          attrs,
          children
        });
        continue;
      }
    }

    // Text content or interpolations {{ expr }}
    const nextOpen = html.indexOf('<', pos);
    const textChunk = nextOpen === -1 ? html.slice(pos) : html.slice(pos, nextOpen);
    pos += textChunk.length;

    if (textChunk.trim()) {
      nodes.push({
        type: 'text',
        content: textChunk.trim()
      });
    }
  }

  return nodes;
}

/**
 * Generates JavaScript DOM instantiation code from AST TemplateNode[]
 */
function generateJsFromAst(nodes: TemplateNode[], stateVars: Set<string>): string {
  if (nodes.length === 0) {
    return 'createElement("div")';
  }

  const rootNode = nodes.find(n => n.type === 'element') || nodes[0];
  return nodeToJs(rootNode, stateVars);
}

function nodeToJs(node: TemplateNode, stateVars: Set<string>): string {
  if (node.type === 'text') {
    const text = node.content || '';
    if (/\{\{\s*([^}]+)\s*\}\}/.test(text)) {
      const parsedText = text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (m, expr) => {
        const clean = expr.trim();
        return `\${${clean}${stateVars.has(clean) ? '()' : ''}}`;
      });
      return `() => \`${parsedText}\``;
    }
    return JSON.stringify(text);
  }

  if (node.type === 'element') {
    const tagName = node.tag || 'div';
    const attrsObj: Record<string, string> = {};

    if (node.attrs) {
      for (const [k, v] of Object.entries(node.attrs)) {
        if (k === 'vx-click') {
          attrsObj['vx-on:click'] = v;
        } else {
          attrsObj[k] = v;
        }
      }
    }

    const attrsCode = Object.entries(attrsObj)
      .map(([k, v]) => {
        if (k.startsWith('vx-on:')) {
          return `"${k}": typeof ${v} === "function" ? ${v} : () => ${v}()`;
        }
        return `"${k}": "${v}"`;
      })
      .join(', ');

    const childrenCode = (node.children || [])
      .map(child => nodeToJs(child, stateVars))
      .filter(Boolean)
      .join(', ');

    const attrsArg = attrsCode ? `{ ${attrsCode} }` : 'null';
    return `createElement("${tagName}", ${attrsArg}${childrenCode ? `, ${childrenCode}` : ''})`;
  }

  return 'null';
}
