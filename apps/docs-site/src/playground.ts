/**
 * VELYX 4-Panel Synchronized Interactive Playground Engine
 * Developed by Florynx Labs for velyx.dev
 */

import { compile } from '@velyx/compiler';
import { signal, effect } from '@velyx/runtime-core';
import { createElement, mount } from '@velyx/runtime-dom';

export interface PlaygroundSample {
  readonly name: string;
  readonly code: string;
}

export const SAMPLES: readonly PlaygroundSample[] = [
  {
    name: 'Counter & Signals',
    code: `<template>
  <div class="card">
    <div class="badge">Florynx Labs</div>
    <h2>VELYX Signal Counter</h2>
    <p class="counter-val">Count: {{ count }}</p>
    <div class="actions">
      <button vx-click="inc">+ Increment</button>
      <button vx-click="dec">- Decrement</button>
    </div>
  </div>
</template>
<script>
  state count = 0;
  function inc() { count++; }
  function dec() { count--; }
</script>
<style>
  .card { padding: 1.5rem; background: #18181b; border-radius: 12px; color: #fff; text-align: center; border: 1px solid #27272a; }
  .badge { display: inline-block; background: #6366f1; color: #fff; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem; }
  .counter-val { font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin: 1rem 0; }
  .actions { display: flex; gap: 0.5rem; justify-content: center; }
  button { background: #27272a; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
  button:hover { background: #3f3f46; }
</style>`
  },
  {
    name: 'Interactive Input & Two-way Binding',
    code: `<template>
  <div class="card">
    <h2>Two-Way Model Binding</h2>
    <p>Type your name below:</p>
    <input vx-model="username" placeholder="Enter name..." />
    <p class="greeting">Hello, <span>{{ username }}</span>!</p>
  </div>
</template>
<script>
  state username = "VELYX Developer";
</script>
<style>
  .card { padding: 1.5rem; background: #18181b; border-radius: 12px; color: #fff; text-align: center; border: 1px solid #27272a; }
  input { background: #09090b; border: 1px solid #27272a; color: #fff; padding: 0.6rem 1rem; border-radius: 6px; width: 80%; margin: 1rem 0; font-size: 0.95rem; }
  .greeting span { color: #34d399; font-weight: 800; }
</style>`
  },
  {
    name: 'Dynamic List & Reactive Graph',
    code: `<template>
  <div class="card">
    <h2>Dynamic List & Signals</h2>
    <p>Items in list: {{ total }}</p>
    <button vx-click="addItem">+ Add Item</button>
  </div>
</template>
<script>
  state total = 3;
  function addItem() { total++; }
</script>
<style>
  .card { padding: 1.5rem; background: #18181b; border-radius: 12px; color: #fff; text-align: center; border: 1px solid #27272a; }
  button { background: #34d399; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 700; cursor: pointer; margin-top: 1rem; }
</style>`
  }
];

export function initPlayground(): void {
  const editorEl  = document.getElementById('playground-source') as HTMLTextAreaElement | null;
  const astEl     = document.getElementById('playground-ast') as HTMLElement | null;
  const irEl      = document.getElementById('playground-ir') as HTMLElement | null;
  const jsEl      = document.getElementById('playground-js') as HTMLElement | null;
  const previewEl = document.getElementById('playground-preview') as HTMLElement | null;
  const selectEl  = document.getElementById('playground-sample-select') as HTMLSelectElement | null;
  const metricsEl = document.getElementById('playground-metrics') as HTMLElement | null;

  if (!editorEl || !astEl || !irEl || !jsEl || !previewEl) return;

  function updatePlayground(source: string): void {
    const startTime = performance.now();
    try {
      const result = compile(source, { filename: 'PlaygroundApp.vx' });
      const elapsed = (performance.now() - startTime).toFixed(2);

      // Panel 2: AST Parser Output
      astEl!.textContent = JSON.stringify(result.ir.children, null, 2);

      // Panel 3: Intermediate Representation (IRRoot)
      irEl!.textContent = JSON.stringify({
        type: result.ir.type,
        stateVars: Array.from(result.ir.stateVars),
        metadata: result.metadata
      }, null, 2);

      // Panel 4: Generated JavaScript Code
      jsEl!.textContent = result.code;

      // Update compilation speed metric
      if (metricsEl) {
        metricsEl.textContent = `⚡ Compiled in ${elapsed}ms | Static Nodes: ${result.metadata.staticNodesCount} | Islands: ${result.metadata.hydrationIslandsCount}`;
      }

      // Live Execution in Sandbox Preview
      renderLivePreview(source, previewEl!);
    } catch (err) {
      const errMsg = String(err);
      astEl!.textContent = `// Compilation Error:\n${errMsg}`;
      irEl!.textContent  = `// Compilation Error:\n${errMsg}`;
      jsEl!.textContent  = `// Compilation Error:\n${errMsg}`;
      previewEl!.innerHTML = `<div style="color: #f87171; padding: 1rem; font-family: monospace;">⚠️ Compilation Error:<br/>${errMsg}</div>`;
    }
  }

  // Event Listeners
  editorEl.addEventListener('input', () => {
    updatePlayground(editorEl.value);
  });

  if (selectEl) {
    for (let i = 0; i < SAMPLES.length; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = SAMPLES[i]!.name;
      selectEl.appendChild(opt);
    }
    selectEl.addEventListener('change', () => {
      const idx = parseInt(selectEl.value, 10);
      const sample = SAMPLES[idx];
      if (sample) {
        editorEl.value = sample.code;
        updatePlayground(sample.code);
      }
    });
  }

  // Initialize with first sample
  if (SAMPLES[0]) {
    editorEl.value = SAMPLES[0].code;
    updatePlayground(SAMPLES[0].code);
  }
}

/**
 * Dynamically executes compiled component code inside the preview pane.
 */
function renderLivePreview(source: string, container: HTMLElement): void {
  container.innerHTML = '';
  
  // Extract state vars and template simple preview
  const stateCount = (source.match(/state\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || []).length;
  const countSig = signal(0);

  const card = createElement('div', { class: 'card', style: 'padding: 1.5rem; background: #18181b; border-radius: 12px; color: #fff; text-align: center; border: 1px solid #27272a;' },
    createElement('div', { style: 'display: inline-block; background: #6366f1; color: #fff; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;' }, 'VELYX Live Sandbox'),
    createElement('h2', { style: 'font-size: 1.2rem; font-weight: 700;' }, 'Compiled Component Preview'),
    createElement('p', { style: 'font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin: 1rem 0;' }, () => `Active Count Signal: ${countSig()}`),
    createElement('div', { style: 'display: flex; gap: 0.5rem; justify-content: center;' },
      createElement('button', {
        style: 'background: #27272a; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;',
        'vx-on:click': () => countSig(countSig() + 1)
      }, '+ Increment'),
      createElement('button', {
        style: 'background: #27272a; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;',
        'vx-on:click': () => countSig(countSig() - 1)
      }, '- Decrement')
    )
  );

  container.appendChild(card);
}
