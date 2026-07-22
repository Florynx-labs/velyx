/**
 * @velyx/router (v0.3.0)
 * Developed by Florynx Labs
 *
 * SPA dynamic router with signal-based path reactivity and layout support.
 *
 * @packageDocumentation
 */

import { signal, effect } from '@velyx/core';
import { createElement } from '@velyx/runtime';

export interface RouteDefinition {
  readonly path: string;
  readonly component: () => HTMLElement;
  readonly layout?: (props: { readonly children: HTMLElement }) => HTMLElement;
}

export interface RouterOptions {
  readonly routes: readonly RouteDefinition[];
}

/** Reactive signal tracking the current browser pathname. */
export const currentPath = signal<string>(
  typeof window !== 'undefined' ? window.location.pathname : '/'
);

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentPath.value = window.location.pathname;
  });
}

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

/**
 * Creates a reactive router view element that automatically re-renders
 * matching routes when `currentPath` changes.
 */
export function createRouter(options: RouterOptions): () => HTMLElement {
  const container = createElement('div', { class: 'velyx-router-view' });

  effect(() => {
    const path = currentPath.value;
    const matchedRoute = matchRoute(path, options.routes);

    container.innerHTML = '';
    if (matchedRoute !== undefined) {
      const pageEl = matchedRoute.component();
      if (matchedRoute.layout !== undefined) {
        const layoutEl = matchedRoute.layout({ children: pageEl });
        container.appendChild(layoutEl);
      } else {
        container.appendChild(pageEl);
      }
    } else {
      const notFound = createElement('div', { class: 'velyx-404' }, '404 - Page Not Found');
      container.appendChild(notFound);
    }
  });

  return () => container;
}

function matchRoute(path: string, routes: readonly RouteDefinition[]): RouteDefinition | undefined {
  return routes.find((r) => {
    if (r.path === path) return true;
    if (r.path.includes(':')) {
      const routeParts = r.path.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) return false;
      return routeParts.every((part, idx) => part.startsWith(':') || part === pathParts[idx]);
    }
    return false;
  });
}
