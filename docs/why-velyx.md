# Why VELYX?

> "HTML-first, compiler-first, zero unnecessary JavaScript."

VELYX is a reactive web framework built around one idea: **your browser should receive only the JavaScript it actually needs**, and the compiler should do the heavy lifting at build time.

---

## The problem with today's frameworks

Most popular frameworks share a common trade-off: they ship a JavaScript runtime to the browser that manages the DOM for you. This works, but it comes with a cost:

| Framework | Runtime JS (gzip) | Virtual DOM | Reactivity Model |
|---|---|---|---|
| React 19 | ~45 KB | Yes | useState / hooks |
| Vue 3 | ~22 KB | Yes (patched) | Proxy-based |
| Svelte 5 | ~7 KB | No | Runes compiler |
| **VELYX** | **~2.4 KB** | **No** | **Compiler + Signals** |

---

## Why `page.vx`?

Filesystem routing eliminates the need for route configuration files. Your directory structure *is* your router.

```
routes/
  page.vx          →  /
  about/page.vx    →  /about
  blog/[slug]/page.vx  →  /blog/:slug
```

This mirrors what **Next.js** pioneered for React and what **SvelteKit** does for Svelte — but VELYX implements it with zero runtime overhead for static routes.

---

## Why `<setup>` instead of `<script>`?

`<setup>` is a **compiler hint**. It tells the VELYX compiler:

> "This code runs on the client. Transform `state` to signals, `prop` to props, and tree-shake everything unused."

`<script>` was ambiguous — it could be confused with standard `<script>` tags. `<setup>` is intentional, unambiguous, and signals the compiler's role.

---

## Why compiler-first?

The VELYX compiler analyzes your `.vx` files at build time and:

1. **Identifies reactive state** — transforms `state count = 0` → `const count = signal(0)`
2. **Eliminates dead code** — unused transitions, unreferenced props, and static nodes are removed
3. **Generates minimal JS** — only the reactive primitives that are actually used ship to the browser
4. **Extracts server code** — `<script server>` blocks never reach the browser bundle

---

## Why less JavaScript?

JavaScript is the most expensive resource on the web — not in bytes, but in **parse + compile + execute time**. Every KB of JS blocked rendering on low-end devices.

VELYX's compiler emits only what the page actually needs:

- A static page with no reactivity ships **zero reactive JS**
- An island ships **only its own signals**
- A form with one button ships **one event handler**

---

## How does VELYX compare?

| Feature | React + Next.js | Vue + Nuxt | Svelte 5 | **VELYX** |
|---|---|---|---|---|
| Filesystem routing | ✅ | ✅ | ✅ | ✅ |
| Virtual DOM | ✅ | ✅ | ❌ | ❌ |
| Fine-grained signals | ❌ | ❌ | ✅ | ✅ |
| Server functions | ✅ | ✅ | ✅ | ✅ |
| Compiler-first | ❌ | ❌ | ✅ | ✅ |
| Runtime size (gzip) | 45 KB | 22 KB | 7 KB | **2.4 KB** |
| TypeScript native | ✅ | ✅ | ✅ | ✅ |
| Islands architecture | 🔶 partial | 🔶 partial | ✅ | ✅ |

---

## The VELYX philosophy

1. **HTML is the foundation** — templates are real HTML, not JSX
2. **The compiler is the framework** — intelligence lives at build time, not runtime
3. **Signals are the reactivity model** — fine-grained, no VDOM diffing
4. **Server and client are first-class** — `<setup>` for the browser, `<script server>` for the backend
5. **Zero config, zero ceremony** — create a file, get a route
