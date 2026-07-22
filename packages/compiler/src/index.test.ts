import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSFC, compile } from './index.js';

describe('VELYX SFC Compiler', () => {
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

  it('should compile state syntax into signals', () => {
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
    assert.ok(result.code.includes('const count = signal(0);'));
    assert.ok(result.code.includes('count(count() + 1)'));
    assert.ok(result.code.includes('createElement'));
  });
});
