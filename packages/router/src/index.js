/**
 * VELYX Router Engine
 * Developed by Florynx Labs
 * Fine-grained SPA & SSR Router with Dynamic Routes and Layouts
 */
import { signal, effect } from '@velyx/core';
import { createElement } from '@velyx/runtime';
export const currentPath = signal(typeof window !== 'undefined' ? window.location.pathname : '/');
if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        currentPath.value = window.location.pathname;
    });
}
/**
 * Programmatic Navigation
 */
export function navigate(to) {
    if (typeof window !== 'undefined') {
        window.history.pushState({}, '', to);
        currentPath.value = to;
    }
}
/**
 * Creates a Router View component
 */
export function createRouter(options) {
    const container = createElement('div', { class: 'velyx-router-view' });
    effect(() => {
        const path = currentPath.value;
        const matchedRoute = matchRoute(path, options.routes);
        container.innerHTML = '';
        if (matchedRoute) {
            const pageEl = matchedRoute.component();
            if (matchedRoute.layout) {
                const layoutEl = matchedRoute.layout({ children: pageEl });
                container.appendChild(layoutEl);
            }
            else {
                container.appendChild(pageEl);
            }
        }
        else {
            const notFound = createElement('div', { class: 'velyx-404' }, '404 - Page Not Found');
            container.appendChild(notFound);
        }
    });
    return () => container;
}
function matchRoute(path, routes) {
    return routes.find((r) => {
        if (r.path === path)
            return true;
        if (r.path.includes(':')) {
            const routeParts = r.path.split('/');
            const pathParts = path.split('/');
            if (routeParts.length !== pathParts.length)
                return false;
            return routeParts.every((part, idx) => part.startsWith(':') || part === pathParts[idx]);
        }
        return false;
    });
}
//# sourceMappingURL=index.js.map