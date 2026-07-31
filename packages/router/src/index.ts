/**
 * @velyx/router (v0.5.0)
 * Developed by Florynx Labs
 *
 * SPA dynamic router with:
 * - Signal-based path reactivity
 * - Filesystem-based route discovery (build-time / Node.js)
 * - Dynamic route parameters ([param] → :param)
 * - Layout support
 *
 * @packageDocumentation
 */

import { signal, effect } from '@velyx/core';
import { createElement } from '@velyx/runtime';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteDefinition {
  readonly path: string;
  readonly component: () => HTMLElement;
  readonly layout?: (props: { readonly children: HTMLElement }) => HTMLElement;
}

export interface RouterOptions {
  readonly routes: readonly RouteDefinition[];
}

/** Parameters extracted from a dynamic route. e.g. `/blog/:slug` → `{ slug: "hello" }` */
export type RouteParams = Readonly<Record<string, string>>;

/**
 * A filesystem route entry produced by `discoverRoutes()` (build-time only).
 * Used by `@velyx/adapter-vite` to auto-build the route manifest.
 */
export interface FilesystemRoute {
  /** Route path as it would appear in the URL. e.g. `/blog/:slug` */
  readonly urlPath: string;
  /** Absolute filesystem path to the `page.vx` file. */
  readonly filePath: string;
  /** Absolute filesystem path to the nearest `layout.vx`, if any. */
  readonly layoutPath?: string;
  /** Whether this is a dynamic route (contains `:param` segments). */
  readonly isDynamic: boolean;
}

// ─── Reactive State ───────────────────────────────────────────────────────────

/** Reactive signal tracking the current browser pathname. */
export const currentPath = signal<string>(
  typeof window !== 'undefined' ? window.location.pathname : '/'
);

/** Reactive signal containing the current route params. */
export const currentParams = signal<RouteParams>({});

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentPath.value = window.location.pathname;
  });
}

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * Navigates programmatically to `to` using HTML5 `pushState`.
 *
 * @param to - Target URL pathname (e.g., `/dashboard`).
 */
export function navigate(to: string): void {
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', to);
    currentPath.value = to;
  }
}

// ─── Router View ──────────────────────────────────────────────────────────────

/**
 * Creates a reactive router view element that automatically re-renders
 * matching routes when `currentPath` changes.
 */
export function createRouter(options: RouterOptions): () => HTMLElement {
  const container = createElement('div', { class: 'velyx-router-view' });

  effect(() => {
    const path = currentPath.value;
    const matchResult = matchRoute(path, options.routes);

    container.innerHTML = '';
    if (matchResult !== undefined) {
      const { route, params } = matchResult;
      currentParams.value = params;

      const pageEl = route.component();
      if (route.layout !== undefined) {
        const layoutEl = route.layout({ children: pageEl });
        container.appendChild(layoutEl);
      } else {
        container.appendChild(pageEl);
      }
    } else {
      const notFound = createElement(
        'div',
        { class: 'velyx-404' },
        '404 — Page Not Found'
      );
      container.appendChild(notFound);
    }
  });

  return () => container;
}

// ─── Route Matching ───────────────────────────────────────────────────────────

interface MatchResult {
  readonly route: RouteDefinition;
  readonly params: RouteParams;
}

function matchRoute(
  path: string,
  routes: readonly RouteDefinition[]
): MatchResult | undefined {
  for (const route of routes) {
    const params = extractParams(route.path, path);
    if (params !== null) {
      return { route, params };
    }
  }
  return undefined;
}

/**
 * @internal Tries to match `routePattern` against `actualPath`.
 * Returns extracted params on success, or `null` on mismatch.
 *
 * Supports `:param` segments (dynamic routes).
 */
function extractParams(routePattern: string, actualPath: string): RouteParams | null {
  if (routePattern === actualPath) return {};

  const routeParts = routePattern.split('/');
  const pathParts  = actualPath.split('/');

  if (routeParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i]!;
    const pp = pathParts[i]!;
    if (rp.startsWith(':')) {
      params[rp.slice(1)] = decodeURIComponent(pp);
    } else if (rp !== pp) {
      return null;
    }
  }
  return params;
}

// ─── Filesystem Router (Build-time / Node.js) ─────────────────────────────────

/**
 * Discovers routes from a `routes/` directory using the VELYX filesystem
 * routing convention:
 * - `page.vx`   → route leaf
 * - `layout.vx` → ancestor layout
 * - `[param]/`  → dynamic segment (compiled to `:param`)
 *
 * **This function is designed to run at build-time in a Node.js/Bun context.**
 * It should be called by `@velyx/adapter-vite`, not shipped to the browser.
 *
 * @param routesDir - Absolute path to the `routes/` directory.
 * @returns Array of discovered `FilesystemRoute` entries, sorted so static
 *          routes come before dynamic ones (avoids greedy matching).
 *
 * @example
 * // In vite.config.ts:
 * import { discoverRoutes } from '@velyx/router';
 * const routes = await discoverRoutes('./src/app/routes');
 */
export async function discoverRoutes(routesDir: string): Promise<FilesystemRoute[]> {
  // Dynamic import so this code is tree-shaken in browser builds
  const { default: fs } = await import('fs');
  const { default: path } = await import('path');

  const routes: FilesystemRoute[] = [];

  function segmentToUrlParam(seg: string): string {
    // [slug] → :slug
    const dynMatch = seg.match(/^\[(.+)\]$/);
    return dynMatch ? `:${dynMatch[1]}` : seg;
  }

  function findLayoutAbove(dir: string, stop: string): string | undefined {
    // Walk up from dir until we find a layout.vx or hit the routesDir
    let current = dir;
    while (current !== stop && current.length >= stop.length) {
      const candidate = path.join(current, 'layout.vx');
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return undefined;
  }

  function walk(dir: string, segments: string[]): void {
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }

    if (entries.includes('page.vx')) {
      const urlSegments = segments.map(segmentToUrlParam);
      const urlPath = urlSegments.length === 0 ? '/' : `/${urlSegments.join('/')}`;
      const filePath = path.join(dir, 'page.vx');
      const layoutPath = findLayoutAbove(dir, routesDir);
      const isDynamic = urlPath.includes(':');

      const routeEntry: FilesystemRoute = { urlPath, filePath, isDynamic };
      if (layoutPath !== undefined) {
        (routeEntry as unknown as Record<string, unknown>).layoutPath = layoutPath;
      }

      routes.push(routeEntry);
    }

    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, [...segments, entry]);
      }
    }
  }

  walk(routesDir, []);

  // Sort: static routes before dynamic ones
  return routes.sort((a, b) => {
    if (a.isDynamic === b.isDynamic) return a.urlPath.localeCompare(b.urlPath);
    return a.isDynamic ? 1 : -1;
  });
}
