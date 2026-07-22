import { describe, it } from 'node:test';
import assert from 'node:assert';
import { signal, effect, computed, batch } from './index.js';

describe('VELYX Core Signals & Reactivity', () => {
  it('should create reactive signals and update values', () => {
    const count = signal(0);
    assert.strictEqual(count(), 0);
    count(5);
    assert.strictEqual(count(), 5);
    assert.strictEqual(count.value, 5);
  });

  it('should trigger effects when signals update', () => {
    const count = signal(10);
    let tracker = 0;

    effect(() => {
      tracker = count() * 2;
    });

    assert.strictEqual(tracker, 20);
    count(15);
    assert.strictEqual(tracker, 30);
  });

  it('should support computed signals', () => {
    const count = signal(2);
    const double = computed(() => count() * 2);

    assert.strictEqual(double(), 4);
    count(5);
    assert.strictEqual(double(), 10);
  });

  it('should batch signal updates', () => {
    const a = signal(1);
    const b = signal(2);
    let runs = 0;

    effect(() => {
      const sum = a() + b();
      runs++;
    });

    assert.strictEqual(runs, 1);

    batch(() => {
      a(10);
      b(20);
    });

    assert.strictEqual(runs, 2);
  });
});
