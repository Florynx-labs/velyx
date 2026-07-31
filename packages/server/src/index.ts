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

// ─── Middleware System ────────────────────────────────────────────────────────

/**
 * Context object passed through the middleware chain.
 *
 * Each middleware can read/write `metadata` and set `user` (via `auth()`).
 * The `request` and `params` are read-only.
 */
export interface MiddlewareContext {
  readonly request: Request;
  readonly params: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
  /** Populated by `auth()` middleware after successful verification. */
  user?: unknown;
  /** Shareable key-value store for cross-middleware communication. */
  metadata: Record<string, unknown>;
}

/** Advances to the next middleware in the chain. */
export type MiddlewareNext = () => Promise<Response>;

/** A single middleware function in the pipeline. */
export type MiddlewareFunction = (ctx: MiddlewareContext, next: MiddlewareNext) => Promise<Response>;

/**
 * A mapping of server function IDs to their implementations.
 *
 * Each function receives the parsed request body and the middleware context.
 */
export interface ServerFunctionManifest {
  readonly functions: Readonly<Record<string, (data: unknown, ctx: MiddlewareContext) => Promise<unknown>>>;
}

// ─── Compose ──────────────────────────────────────────────────────────────────

/**
 * Composes an array of middleware functions into a single middleware.
 *
 * Execution flows left-to-right; the final `next` is called when the chain
 * is exhausted.
 *
 * @internal
 */
export function composeMiddleware(middlewares: readonly MiddlewareFunction[]): MiddlewareFunction {
  return (ctx: MiddlewareContext, finalNext: MiddlewareNext): Promise<Response> => {
    let index = -1;

    function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        return Promise.reject(new Error('[VELYX Server] next() called multiple times in the same middleware.'));
      }
      index = i;

      const fn = i < middlewares.length ? middlewares[i] : undefined;
      if (fn === undefined) return finalNext();

      return fn(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

// ─── createServerFunctionHandler ──────────────────────────────────────────────

/**
 * Creates a universal request handler that pipes every incoming request
 * through the middleware chain, then dispatches to the matching server
 * function from the manifest.
 *
 * @param manifest    - Map of function IDs → implementations.
 * @param middlewares - Ordered array of middleware functions to apply.
 * @returns A `(Request) => Promise<Response>` handler.
 *
 * @example
 * ```ts
 * const handler = createServerFunctionHandler(manifest, [
 *   cors(),
 *   auth({ verify: verifyJWT }),
 *   rateLimit({ max: 100, windowMs: 60_000 }),
 *   logger()
 * ]);
 *
 * // In a Node / Bun / Deno server:
 * Bun.serve({ fetch: handler });
 * ```
 */
export function createServerFunctionHandler(
  manifest: ServerFunctionManifest,
  middlewares: MiddlewareFunction[] = []
): (request: Request) => Promise<Response> {
  const composed = composeMiddleware(middlewares);

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const functionId = url.pathname.split('/').pop() ?? '';

    const headerEntries: Record<string, string> = {};
    request.headers.forEach((value, key) => { headerEntries[key] = value; });

    const ctx: MiddlewareContext = {
      request,
      params: Object.fromEntries(url.searchParams.entries()),
      headers: headerEntries,
      user: undefined,
      metadata: {}
    };

    return composed(ctx, async () => {
      const fn = manifest.functions[functionId];
      if (fn === undefined) {
        return new Response(
          JSON.stringify({ error: `Server function "${functionId}" not found.` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const body = request.method === 'GET' ? null : await request.json().catch(() => null);
        const result = await fn(body, ctx);
        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });
  };
}

// ─── Built-in Middlewares ─────────────────────────────────────────────────────

/** Options for the {@link cors} middleware. */
export interface CorsOptions {
  /** Allowed origins. Defaults to `"*"`. */
  readonly origin?: string | readonly string[];
  /** Allowed HTTP methods. Defaults to common methods. */
  readonly methods?: readonly string[];
  /** Allowed request headers. */
  readonly allowedHeaders?: readonly string[];
  /** Max age for preflight cache (seconds). Defaults to `86400`. */
  readonly maxAge?: number;
}

/**
 * CORS middleware — sets `Access-Control-*` headers.
 *
 * Automatically handles `OPTIONS` preflight requests.
 *
 * @example
 * cors({ origin: 'https://myapp.com' })
 */
export function cors(options: CorsOptions = {}): MiddlewareFunction {
  const origin = options.origin ?? '*';
  const methods = options.methods ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  const allowedHeaders = options.allowedHeaders ?? ['Content-Type', 'Authorization'];
  const maxAge = options.maxAge ?? 86400;

  const originStr = Array.isArray(origin) ? (origin as string[]).join(', ') : (origin as string);

  return async (_ctx: MiddlewareContext, next: MiddlewareNext): Promise<Response> => {
    // Preflight
    if (_ctx.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': originStr,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': String(maxAge)
        }
      });
    }

    const response = await next();

    // Clone headers and append CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', originStr);
    newHeaders.set('Access-Control-Allow-Methods', methods.join(', '));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}

/** Options for the {@link auth} middleware. */
export interface AuthOptions {
  /**
   * Custom verification function.
   *
   * Receives the raw token string (extracted from `Authorization: Bearer <token>`)
   * and must return the verified user payload, or throw to reject.
   */
  readonly verify: (token: string) => Promise<unknown> | unknown;
  /** Header name to read the token from. Defaults to `"authorization"`. */
  readonly headerName?: string;
}

/**
 * Authentication middleware — extracts a bearer token and calls the
 * user-supplied `verify` function.
 *
 * On success, sets `ctx.user` to the value returned by `verify`.
 * On failure, responds with `401 Unauthorized`.
 *
 * @example
 * auth({ verify: (token) => jwt.verify(token, SECRET) })
 */
export function auth(options: AuthOptions): MiddlewareFunction {
  const headerName = (options.headerName ?? 'authorization').toLowerCase();

  return async (ctx: MiddlewareContext, next: MiddlewareNext): Promise<Response> => {
    const raw = ctx.headers[headerName] ?? '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

    if (token.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing authentication token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      ctx.user = await options.verify(token);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return next();
  };
}

/** Options for the {@link rateLimit} middleware. */
export interface RateLimitOptions {
  /** Maximum number of requests per window. Defaults to `100`. */
  readonly max?: number;
  /** Window duration in milliseconds. Defaults to `60 000` (1 minute). */
  readonly windowMs?: number;
  /**
   * Key extractor — determines the identity for rate-limiting.
   * Defaults to the `x-forwarded-for` header or `"unknown"`.
   */
  readonly keyFn?: (ctx: MiddlewareContext) => string;
}

/**
 * In-memory rate-limiting middleware.
 *
 * Tracks request counts per key within a sliding window and responds
 * with `429 Too Many Requests` when the limit is exceeded.
 *
 * @example
 * rateLimit({ max: 100, windowMs: 60_000 })
 */
export function rateLimit(options: RateLimitOptions = {}): MiddlewareFunction {
  const max = options.max ?? 100;
  const windowMs = options.windowMs ?? 60_000;
  const keyFn = options.keyFn ?? ((ctx: MiddlewareContext) => ctx.headers['x-forwarded-for'] ?? 'unknown');

  const store = new Map<string, { count: number; resetAt: number }>();

  return async (ctx: MiddlewareContext, next: MiddlewareNext): Promise<Response> => {
    const key = keyFn(ctx);
    const now = Date.now();

    let entry = store.get(key);
    if (entry === undefined || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetAt)
          }
        }
      );
    }

    const response = await next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(max));
    newHeaders.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    newHeaders.set('X-RateLimit-Reset', String(entry.resetAt));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}

/**
 * Logging middleware — logs method, URL, status, and duration to the console.
 *
 * @example
 * logger()
 */
export function logger(): MiddlewareFunction {
  return async (ctx: MiddlewareContext, next: MiddlewareNext): Promise<Response> => {
    const start = Date.now();
    const method = ctx.request.method;
    const url = ctx.request.url;

    let response: Response;
    try {
      response = await next();
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[VELYX] ${method} ${url} — ERROR (${duration}ms)`, err);
      throw err;
    }

    const duration = Date.now() - start;
    const status = response.status;
    const statusColor = status < 400 ? '\x1b[32m' : status < 500 ? '\x1b[33m' : '\x1b[31m';
    console.log(`[VELYX] ${method} ${url} — ${statusColor}${status}\x1b[0m (${duration}ms)`);

    return response;
  };
}
