/**
 * @velyx/compiler — Compiler Insights
 * Developed by Florynx Labs
 *
 * Generates a structured JSON report of compilation statistics, reactive
 * dependencies, transition usage, and dead code metrics.
 *
 * @packageDocumentation
 */

import type { CompilationMetadata } from './index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Transition-level insight for a single named transition. */
export interface TransitionInsight {
  /** The name of the transition (e.g. `"fadeScale"`). */
  readonly name: string;
  /** Whether the transition is actually referenced by a `vx-transition` attribute. */
  readonly used: boolean;
  /** Number of keyframe offsets defined. */
  readonly keyframeCount: number;
  /** Whether the compiler emitted CSS `@keyframes` or JS WAAPI code. */
  readonly strategy: 'css' | 'waapi';
}

/** Per-file compilation insight record. */
export interface FileInsight {
  /** The source `.vx` filename. */
  readonly filename: string;
  /** Standard compilation metadata (reactive deps, static nodes, etc.). */
  readonly metadata: CompilationMetadata;
  /** Transition definitions found in this file's `<transition>` block. */
  readonly transitions: readonly TransitionInsight[];
  /** Names of transitions defined but never referenced. */
  readonly unusedTransitions: readonly string[];
}

/** Aggregated totals across all compiled files. */
export interface InsightsTotals {
  readonly totalFiles: number;
  readonly totalReactiveDependencies: number;
  readonly totalStaticNodes: number;
  readonly totalHydrationIslands: number;
  readonly totalTransitions: number;
  readonly deadTransitions: number;
}

/**
 * The complete compiler insights report, serialised to the
 * configured output path.
 */
export interface CompilerInsights {
  /** VELYX compiler version that produced this report. */
  readonly version: string;
  /** ISO-8601 timestamp of when the report was generated. */
  readonly timestamp: string;
  /** Per-file insight records. */
  readonly files: readonly FileInsight[];
  /** Aggregated totals. */
  readonly totals: InsightsTotals;
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Builds a complete `CompilerInsights` report from an array of per-file
 * insight records.
 *
 * @param files   - Insight data for every compiled `.vx` file.
 * @param version - The compiler version string (e.g. `"0.4.0"`).
 * @returns The fully assembled insights object.
 */
export function generateInsights(
  files: readonly FileInsight[],
  version: string = '0.4.0'
): CompilerInsights {
  const totals: InsightsTotals = {
    totalFiles: files.length,
    totalReactiveDependencies: files.reduce(
      (sum, f) => sum + f.metadata.reactiveDependencies.length, 0
    ),
    totalStaticNodes: files.reduce(
      (sum, f) => sum + f.metadata.staticNodesCount, 0
    ),
    totalHydrationIslands: files.reduce(
      (sum, f) => sum + f.metadata.hydrationIslandsCount, 0
    ),
    totalTransitions: files.reduce(
      (sum, f) => sum + f.transitions.length, 0
    ),
    deadTransitions: files.reduce(
      (sum, f) => sum + f.unusedTransitions.length, 0
    )
  };

  return {
    version,
    timestamp: new Date().toISOString(),
    files,
    totals
  };
}

/**
 * Serialises a `CompilerInsights` object and writes it to disk.
 *
 * Creates parent directories if they don't exist (Node.js / Bun / Deno).
 *
 * @param insights  - The insights report to write.
 * @param outputPath - Absolute or relative file path.
 */
export async function writeInsightsFile(
  insights: CompilerInsights,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(insights, null, 2);

  // Dynamic import to stay runtime-agnostic (works in Node, Bun, Deno)
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, json, 'utf-8');
  } catch {
    // Fallback: log a warning if file system is unavailable (e.g. browser)
    console.warn(
      `[VELYX Compiler] Could not write insights file to "${outputPath}". ` +
      `File system may not be available in this environment.`
    );
  }
}
