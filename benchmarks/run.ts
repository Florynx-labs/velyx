/**
 * VELYX Benchmark Suite (v0.3.0)
 * Developed by Florynx Labs
 *
 * Automated performance micro-benchmarks for VELYX primitives:
 *   1. Signal creation speed
 *   2. Signal update & effect propagation latency
 *   3. Batch update throughput
 *   4. Compiler SFC parsing and IR generation rate
 */

import { signal, effect, batch } from '../packages/runtime-core/dist/index.js';
import { compile } from '../packages/compiler/dist/index.js';

interface BenchmarkResult {
  readonly name: string;
  readonly iterations: number;
  readonly totalTimeMs: number;
  readonly opsPerSec: number;
}

function runBenchmark(
  name: string,
  iterations: number,
  fn: () => void
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < Math.min(100, iterations); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const totalTimeMs = performance.now() - start;
  const opsPerSec = Math.round((iterations / totalTimeMs) * 1000);

  return { name, iterations, totalTimeMs: Math.round(totalTimeMs * 100) / 100, opsPerSec };
}

function printReport(results: readonly BenchmarkResult[]): void {
  console.log('\n=================================================================');
  console.log('                 VELYX v0.3.0 PERFORMANCE BENCHMARK               ');
  console.log('=================================================================\n');

  console.table(
    results.map(r => ({
      'Benchmark Test': r.name,
      'Iterations': r.iterations.toLocaleString(),
      'Total Time (ms)': r.totalTimeMs,
      'Ops / sec': r.opsPerSec.toLocaleString()
    }))
  );

  console.log('\n=================================================================\n');
}

export function main(): void {
  const results: BenchmarkResult[] = [];

  // Benchmark 1: Signal Creation
  results.push(
    runBenchmark('Signal Creation (10k signals)', 10_000, () => {
      signal(0);
    })
  );

  // Benchmark 2: Signal Update & Dependent Effect Execution
  const s = signal(0);
  let count = 0;
  effect(() => {
    count += s();
  });
  results.push(
    runBenchmark('Signal Update + Effect Propagation (100k updates)', 100_000, () => {
      s(s() + 1);
    })
  );
  if (count === -1) console.log(count);

  // Benchmark 3: Batched Signal Updates
  const s1 = signal(0);
  const s2 = signal(0);
  let batchExecs = 0;
  effect(() => {
    batchExecs += s1() + s2();
  });

  results.push(
    runBenchmark('Batched State Updates (10k batches)', 10_000, () => {
      batch(() => {
        s1(s1() + 1);
        s2(s2() + 1);
      });
    })
  );
  if (batchExecs === -1) console.log(batchExecs);

  // Benchmark 4: SFC Compilation Speed
  const sampleSfc = `
<template>
  <div class="card">
    <h1>{{ title }}</h1>
    <button vx-click="inc">Count: {{ count }}</button>
  </div>
</template>
<script>
  state count = 0;
  state title = "Hello VELYX";
  function inc() { count++; }
</script>
<style>
  .card { padding: 1rem; background: #111; color: #fff; }
</style>
  `.trim();

  results.push(
    runBenchmark('Compiler SFC → IR → CodeGen (1k compilations)', 1_000, () => {
      compile(sampleSfc, { filename: 'Bench.vx' });
    })
  );

  printReport(results);
}

main();
