import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSFC, compile, getDiagnostics } from './index.js';

describe('VELYX SFC Compiler v0.2.0 (IR & Passes)', () => {
  it('should parse <template>, <script>, and <style> sections', () => {
    const sfc = `
<template>
  <h1>Hello Velyx</h1>
</template>
<script>
state count = 0
</script>
<style>
h1 { color: red; }
</style>
    `;

    const parsed = parseSFC(sfc);
    assert.strictEqual(parsed.template, '<h1>Hello Velyx</h1>');
    assert.strictEqual(parsed.script, 'state count = 0');
    assert.strictEqual(parsed.style, 'h1 { color: red; }');
  });

  it('should generate IR tree and compilation metadata', () => {
    const sfc = `
<template>
  <button vx-click="increment">{{ count }}</button>
</template>
<script>
state count = 0
function increment() { count++ }
</script>
    `;

    const result = compile(sfc);

    assert.strictEqual(result.ir.type, 'IRRoot');
    assert.ok(result.ir.stateVars.has('count'));
    assert.ok(result.metadata.reactiveDependencies.includes('count'));
    assert.strictEqual(result.metadata.hydrationIslandsCount, 1);
    assert.ok(result.code.includes('const count = signal(0);'));
    assert.ok(result.code.includes('count(count() + 1)'));
    assert.ok(result.code.includes('createElement'));
  });

  it('should provide language server diagnostics', () => {
    const sourceNoTemplate = '<script>state x = 1</script>';
    const diagnostics = getDiagnostics(sourceNoTemplate);
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, 'Missing <template> block in SFC');
  });
});
