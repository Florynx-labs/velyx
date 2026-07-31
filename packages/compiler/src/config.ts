/**
 * @velyx/compiler — Configuration System
 * Developed by Florynx Labs
 *
 * Provides `defineConfig` for type-safe user configuration and
 * `resolveConfig` to merge defaults with user overrides.
 *
 * @packageDocumentation
 */

// ─── Insights Config ──────────────────────────────────────────────────────────

/** Configuration for compiler insights output. */
export interface VelyxInsightsConfig {
  /** Whether to generate the insights file. Defaults to `true`. */
  readonly enabled?: boolean;
  /**
   * Output path for the insights JSON file.
   * Defaults to `"dist/.velyx/insights.json"`.
   */
  readonly output?: string;
}

// ─── Compiler Config ──────────────────────────────────────────────────────────

/** Compiler-specific configuration options. */
export interface VelyxCompilerConfig {
  /** Controls the generation and location of compiler insights. */
  readonly insights?: VelyxInsightsConfig;
}

// ─── Top-Level Config ─────────────────────────────────────────────────────────

/**
 * Top-level VELYX configuration object, typically exported from
 * `velyx.config.ts` at the project root.
 *
 * @example
 * ```ts
 * // velyx.config.ts
 * import { defineConfig } from '@velyx/compiler';
 *
 * export default defineConfig({
 *   compiler: {
 *     insights: {
 *       output: './reports/velyx-insights.json'
 *     }
 *   }
 * });
 * ```
 */
export interface VelyxConfig {
  readonly compiler?: VelyxCompilerConfig;
}

// ─── Resolved Config ──────────────────────────────────────────────────────────

/** Fully resolved config with all defaults applied. */
export interface ResolvedVelyxConfig {
  readonly insights: Required<VelyxInsightsConfig>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Type-safe helper to define a VELYX user configuration.
 *
 * Returns the config object as-is — this function exists solely
 * for TypeScript autocompletion and validation.
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   compiler: {
 *     insights: { enabled: true, output: 'dist/.velyx/insights.json' }
 *   }
 * });
 * ```
 */
export function defineConfig(config: VelyxConfig): VelyxConfig {
  return config;
}

/**
 * Merges user configuration with framework defaults.
 *
 * Default values:
 * - `insights.enabled` → `true`
 * - `insights.output`  → `"dist/.velyx/insights.json"`
 *
 * @param userConfig - Optional partial config from the user.
 * @returns A fully resolved config with no optional fields.
 */
export function resolveConfig(userConfig?: VelyxConfig): ResolvedVelyxConfig {
  return {
    insights: {
      enabled: userConfig?.compiler?.insights?.enabled ?? true,
      output: userConfig?.compiler?.insights?.output ?? 'dist/.velyx/insights.json'
    }
  };
}
