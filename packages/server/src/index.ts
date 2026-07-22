/**
 * @velyx/server (v0.3.0)
 * Developed by Florynx Labs
 *
 * Server-side rendering (SSR), hydration marker injection, and Server Actions.
 *
 * @packageDocumentation
 */

export interface SSRRenderOptions {
  readonly manifest?: Readonly<Record<string, unknown>>;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * Renders a Velyx component to HTML string for SSR with hydration attributes.
 *
 * @param component - Component factory function.
 * @param props     - Props object passed to component.
 * @param _options  - SSR render options (manifest, initial state).
 */
export async function renderToString(
  component: (props?: Record<string, unknown>) => unknown,
  props: Record<string, unknown> = {},
  _options: SSRRenderOptions = {}
): Promise<string> {
  const result = component(props);

  if (typeof result === 'string') {
    return injectHydrationMarkers(result);
  }

  if (typeof result === 'object' && result !== null && 'outerHTML' in result) {
    return injectHydrationMarkers((result as HTMLElement).outerHTML);
  }

  return `<div data-vx-ssr="true">${String(result)}</div>`;
}

/**
 * Injects hydration markers for selective hydration on the client.
 */
function injectHydrationMarkers(html: string): string {
  let ssrId = 0;
  return html.replace(/<([a-zA-Z0-9-]+)(\s|>)/g, (_match, tagName: string, rest: string) => {
    ssrId++;
    return `<${tagName} data-vx-id="${ssrId}"${rest}`;
  });
}

/**
 * Wraps an async function into a typed VELYX Server Action.
 */
export function createServerAction<T, R>(actionFn: (data: T) => Promise<R>): (data: T) => Promise<R> {
  return async (data: T): Promise<R> => {
    return actionFn(data);
  };
}
