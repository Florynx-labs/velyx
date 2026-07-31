# Islands Architecture

Islands are **isolated interactive components** that hydrate independently from the rest of the page. Static HTML loads instantly; only the interactive parts download and execute JavaScript.

## Concept

A typical VELYX page is composed of:

```
┌─────────────────────────────────────────┐
│ Static Header         (0 JS)            │
├─────────────────────────────────────────┤
│ Static Article Text   (0 JS)            │
├──────────────┬──────────────────────────┤
│ 🏝 Counter   │ 🏝 Like Button           │
│ (signals JS) │ (signals JS)             │
├──────────────┴──────────────────────────┤
│ Static Footer         (0 JS)            │
└─────────────────────────────────────────┘
```

Only the **islands** `Counter` and `Like Button` download reactive JavaScript. Everything else is pure HTML.

## Creating an island

Generate with the CLI:

```bash
velyx generate island Counter
# Creates: src/islands/Counter.vx
```

An island is a regular `.vx` component using `<setup>`:

```vx
<setup>
  state count = 0;

  function increment() { count++; }
  function decrement() { count--; }
</setup>

<template>
  <div class="counter">
    <button vx-click="decrement">−</button>
    <span>{{ count }}</span>
    <button vx-click="increment">+</button>
  </div>
</template>

<style>
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: var(--vx-surface);
    border-radius: var(--vx-radius);
    border: 1px solid var(--vx-primary);
  }
  button {
    width: 2rem; height: 2rem;
    border-radius: 50%;
    border: 2px solid var(--vx-primary);
    background: transparent;
    color: var(--vx-primary);
    font-size: 1.1rem;
    cursor: pointer;
  }
  span { font-size: 1.5rem; font-weight: 700; min-width: 3rem; text-align: center; }
</style>
```

## Using an island in a page

```vx
<config>
definePage({ title: "Islands Demo" })
</config>

<setup>
  // Page setup — no reactivity needed for static content
</setup>

<template>
  <main class="page">
    <h1>Welcome</h1>

    <section class="static-text">
      <p>This paragraph is pure static HTML. Zero JavaScript.</p>
    </section>

    <!-- Island: only this component is reactive -->
    <Counter />

    <footer>
      <p>Static footer — no JavaScript.</p>
    </footer>
  </main>
</template>
```

## Islands vs. Components

| | Component | Island |
|---|---|---|
| Location | `src/components/` | `src/islands/` |
| Hydration | Always | Selective / lazy |
| Use case | Layout, UI primitives | Interactive widgets |
| JavaScript shipped | With parent | Independently |

## Deferred hydration (coming in v0.6)

Future versions of VELYX will support `vx-idle`, `vx-hover`, and `vx-visible` strategies for deferring island hydration until user interaction:

```vx
<!-- Hydrate only when user scrolls to this island -->
<Counter vx-visible />

<!-- Hydrate when browser is idle -->
<LiveChat vx-idle />

<!-- Hydrate on hover -->
<VideoPlayer vx-hover />
```
