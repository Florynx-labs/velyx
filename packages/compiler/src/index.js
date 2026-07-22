/**
 * VELYX SFC Compiler & Code Generator
 * Developed by Florynx Labs
 * Parses .vx files and compiles them into fine-grained reactive ES Modules.
 */
/**
 * Extracts <template>, <script>, and <style> blocks from .vx file source code
 */
export function parseSFC(source) {
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
export function compile(source, options = {}) {
    const { template, script, style } = parseSFC(source);
    const stateVars = new Set();
    // 1. Transform Script Block Syntax
    // Converts `state name = value;` to `const name = signal(value);`
    let transformedScript = script.replace(/state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\r\n]+);?/g, (match, varName, initVal) => {
        stateVars.add(varName);
        return `const ${varName} = signal(${initVal.trim()});`;
    });
    // Replaces state variable increment/decrement: `count++` -> `count(count() + 1)`
    for (const varName of stateVars) {
        const incRegex = new RegExp(`\\b${varName}\\+\\+`, 'g');
        const decRegex = new RegExp(`\\b${varName}\\-\\-`, 'g');
        // Matches assignment `count = ...` but NOT `const count = ...`
        const assignRegex = new RegExp(`(?<!const\\s+|let\\s+|var\\s+)\\b${varName}\\s*=\\s*([^;\\r\\n\\)]+)`, 'g');
        transformedScript = transformedScript
            .replace(incRegex, `${varName}(${varName}() + 1)`)
            .replace(decRegex, `${varName}(${varName}() - 1)`)
            .replace(assignRegex, `${varName}($1)`);
    }
    // 2. Parse Template into Reactive AST / DOM JavaScript Calls
    const compiledTemplateJs = compileTemplateToJs(template, stateVars);
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
 * Transform template HTML into Javascript DOM instantiation calls with fine-grained signal bindings.
 */
function compileTemplateToJs(template, stateVars) {
    if (!template)
        return 'createElement("div")';
    const trimmed = template.trim();
    return convertHtmlToCreateElement(trimmed, stateVars);
}
function convertHtmlToCreateElement(html, stateVars) {
    const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>/g;
    const match = tagRegex.exec(html.trim());
    if (match) {
        const [, tagName, attrStr, innerContent] = match;
        const attrsObj = {};
        const attrRegex = /([a-zA-Z0-9-:]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
            const attrName = attrMatch[1];
            const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
            if (attrName === 'vx-click') {
                attrsObj['vx-on:click'] = attrVal;
            }
            else {
                attrsObj[attrName] = attrVal;
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
        let childrenCode = '';
        const hasInterpolation = /\{\{\s*([^}]+)\s*\}\}/.test(innerContent);
        if (hasInterpolation) {
            const parsedText = innerContent.replace(/\{\{\s*([^}]+)\s*\}\}/g, (m, expr) => {
                const clean = expr.trim();
                return `\${${clean}${stateVars.has(clean) ? '()' : ''}}`;
            });
            childrenCode = `() => \`${parsedText}\``;
        }
        else if (innerContent.trim()) {
            if (innerContent.trim().startsWith('<')) {
                childrenCode = convertHtmlToCreateElement(innerContent, stateVars);
            }
            else {
                childrenCode = `"${innerContent.trim()}"`;
            }
        }
        return `createElement("${tagName}", { ${attrsCode} }${childrenCode ? `, ${childrenCode}` : ''})`;
    }
    return `createElement("div", null, "${html}")`;
}
//# sourceMappingURL=index.js.map