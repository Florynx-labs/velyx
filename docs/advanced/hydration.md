# Hydration

Hydration in VELYX is the process of attaching reactive signals and event listeners to server-rendered (or static) HTML. Unlike full re-renders, VELYX uses **selective hydration** — only interactive islands download and run JavaScript.

## Hydration strategies

### Full hydration (default)

The entire component tree is hydrated on page load. Use for highly interactive pages:

```vx
<setup>
  state count = 0;
</setup>
```

### Island hydration (selective)

Each island is an independently hydrated unit. Static parts of the page never download JavaScript:

```
src/islands/Counter.vx   → ~2 KB JS (signals for this island only)
src/islands/LikeButton.vx → ~1.5 KB JS
Static page content       → 0 KB JS
```

### Deferred hydration (v0.6 roadmap)

```vx
<Counter vx-idle />      <!-- hydrate when browser is idle -->
<VideoPlayer vx-hover /> <!-- hydrate on user hover -->
<Comments vx-visible />  <!-- hydrate when scrolled into view -->
```

## SSR + Hydration flow

1. **Server** renders the full HTML from `page.vx` templates.
2. **Browser** receives complete HTML (fast FCP, no layout shift).
3. **VELYX runtime** scans for hydration markers.
4. **Islands** are individually hydrated by downloading their signal bundles.
5. Static content **never hydrates**.

## Hydration markers

The compiler injects `data-vx-island` attributes into island roots:

```html
<!-- Server-rendered output -->
<div data-vx-island="Counter" data-vx-state='{"count":0}'>
  <button>−</button>
  <span>0</span>
  <button>+</button>
</div>
```

The client runtime uses these markers to re-attach signals without re-rendering HTML.
