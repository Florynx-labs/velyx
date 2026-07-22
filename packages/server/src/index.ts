/**
 * VELYX Server Engine
 * Developed by Florynx Labs
 * Handles SSR, streaming, and server actions.
 */

export interface SSRRenderOptions {
  manifest?: Record<string, any>;
  data?: Record<string, any>;
}

/**
 * Renders a Velyx component to HTML string for SSR with hydration attributes.
 */
export async function renderToString(
  component: (props?: any) => any,
  props: Record<string, any> = {},
  options: SSRRenderOptions = {}
): Promise<string> {
  // Execute component to get DOM or string output
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
 * Injects hydration markers for selective hydration on the client
 */
function injectHydrationMarkers(html: string): string {
  let ssrId = 0;
  return html.replace(/<([a-zA-Z0-9-]+)(\s|>)/g, (match, tagName, rest) => {
    ssrId++;
    return `<${tagName} data-vx-id="${ssrId}"${rest}`;
  });
}

/**
 * Server Action helper
 */
export function createServerAction<T, R>(actionFn: (data: T) => Promise<R>) {
  return async (data: T): Promise<R> => {
    return actionFn(data);
  };
}
