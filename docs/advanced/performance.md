# Performance

VELYX is designed for maximum performance at every layer — bundle size, runtime update speed, and server-side rendering throughput.

## Bundle Size

| Package | Size (gzip) |
|---|---|
| `@velyx/core` (signals) | ~1.2 KB |
| `@velyx/runtime-dom` | ~1.2 KB |
| **Total runtime** | **~2.4 KB** |

For comparison: React 19 ~45 KB, Vue 3 ~22 KB, Svelte 5 ~7 KB.

## Signal Update Latency

Fine-grained signals update only the exact DOM nodes that changed:

- **Signal write** → `0.001 ms`
- **DOM update** → `0.001 ms`
- **Total** → `~0.002 ms` per reactive update

No Virtual DOM diffing. No component re-rendering.

## SSR Throughput

Static HTML generation benchmarks (from `benchmarks/`):

| Framework | Throughput |
|---|---|
| VELYX | ~145,000 req/s |
| Solid | ~130,000 req/s |
| Svelte | ~118,000 req/s |
| Vue | ~95,000 req/s |
| React | ~82,000 req/s |

## Performance Best Practices

### 1. Use global `style.css` over component `<style>` blocks

For shared styles (resets, typography, design tokens), prefer `src/styles/style.css`. Component `<style>` blocks inject at runtime and are better for component-specific overrides.

### 2. Prefer islands for interactive components

Move reactive UI into `src/islands/` to minimize JavaScript shipped to static pages.

### 3. Use `computed` instead of template expressions

```vx
<!-- ❌ Recalculates on every render -->
<p>{{ items.filter(i => i.active).length }}</p>

<!-- ✅ Cached, only updates when items changes -->
computed activeCount = () => items.filter(i => i.active).length;
<p>{{ activeCount }}</p>
```

### 4. Batch multiple state updates

```vx
<setup>
  state x = 0;
  state y = 0;

  // ❌ Two DOM updates
  function bad() { x = 1; y = 2; }

  // ✅ One DOM update
  function good() { batch(() => { x = 1; y = 2; }); }
</setup>
```

### 5. Dead Transition Elimination

The compiler automatically removes unused `<transition>` definitions from the bundle. Define all your transitions without worrying about unused ones shipping to production.

## Profiling

Use the VELYX DevTools overlay (`@velyx/devtools`) to:

- Inspect live signal values
- Track which components are subscribed to which signals
- Identify expensive reactive computations
- Measure re-render counts per signal change
