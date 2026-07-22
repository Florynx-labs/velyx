import { describe, it } from 'node:test';
import assert from 'node:assert';
import { signal, effect, computed, batch, scheduleTask, PriorityLevel } from './index.js';

describe('VELYX Runtime Core & Priority Scheduler', () => {
  it('should create reactive signals and update values', () => {
    const count = signal(0);
    assert.strictEqual(count(), 0);
    count(5);
    assert.strictEqual(count(), 5);
    assert.strictEqual(count.value, 5);
  });

  it('should schedule tasks based on priority order', async () => {
    const order: string[] = [];

    scheduleTask(() => order.push('low'), PriorityLevel.Low);
    scheduleTask(() => order.push('immediate'), PriorityLevel.Immediate);
    scheduleTask(() => order.push('user-blocking'), PriorityLevel.UserBlocking);

    await new Promise(resolve => setTimeout(resolve, 50));

    assert.deepStrictEqual(order, ['immediate', 'user-blocking', 'low']);
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
