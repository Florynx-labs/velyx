/**
 * @velyx/runtime-dom — Transition Engine
 * Developed by Florynx Labs
 *
 * Provides the Web Animations API (WAAPI) integration for `<transition>`
 * blocks compiled by the VELYX compiler.
 *
 * @packageDocumentation
 */

export interface TransitionConfig {
  readonly name: string;
  readonly keyframes: Keyframe[];
  readonly options?: KeyframeAnimationOptions;
}

const transitionRegistry = new Map<string, TransitionConfig>();

/**
 * Registers a named transition globally.
 * This is called by code generated from the compiler for each used transition.
 *
 * @param name   - The transition name (e.g. "fadeScale")
 * @param config - The WAAPI keyframes and options.
 */
export function registerTransition(name: string, config: TransitionConfig): void {
  transitionRegistry.set(name, config);
}

/**
 * Retrieves a registered transition by name.
 */
export function getTransition(name: string): TransitionConfig | undefined {
  return transitionRegistry.get(name);
}

/**
 * Applies a registered transition to a DOM element using WAAPI.
 *
 * @param el   - The target HTML element.
 * @param name - The name of the registered transition.
 * @returns The WAAPI `Animation` object if successful, or `null`.
 */
export function applyTransition(el: HTMLElement, name: string): Animation | null {
  const config = transitionRegistry.get(name);
  if (config === undefined) {
    console.warn(`[VELYX Runtime] Transition "${name}" applied to <${el.tagName.toLowerCase()}> but it was not registered.`);
    return null;
  }

  // WAAPI
  if (typeof el.animate === 'function') {
    return el.animate(config.keyframes, {
      duration: 300, // Default duration if not specified
      easing: 'ease-in-out',
      fill: 'both',
      ...config.options
    });
  }
  
  // Fallback could be added here for environments without WAAPI
  return null;
}
