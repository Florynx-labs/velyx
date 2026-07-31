# Your First Page

This guide walks you through creating your first VELYX page using the v0.5 conventions.

## 1. Create the route file

Create `src/app/routes/page.vx`:

```vx
<config>
definePage({
  title: "Home",
  layout: "default"
})
</config>

<setup>
  state name = "World";

  function greet() {
    name = "VELYX";
  }
</setup>

<template>
  <div class="home">
    <h1>Hello, {{ name }}!</h1>
    <button vx-click="greet">Say hello</button>
  </div>
</template>

<style>
  .home {
    text-align: center;
    padding: 4rem;
  }

  h1 {
    font-size: 2.5rem;
    color: #6366f1;
  }

  button {
    background: #6366f1;
    color: #fff;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
```

## 2. Understanding the blocks

### `<config>` — Page metadata
Declares page-level metadata consumed by the router and compiler.

```vx
<config>
definePage({ title: "Home", layout: "default" })
</config>
```

### `<setup>` — Client logic
The primary block for reactive state and functions. Replaces `<script>` (v0.5+).

```vx
<setup>
  state count = 0;          // reactive signal
  prop label: string = ""; // component prop

  function increment() {
    count++;                 // compiled to signal setter
  }
</setup>
```

### `<template>` — HTML
Standard HTML with VELYX directives and `{{ expressions }}`.

```vx
<template>
  <button vx-click="increment">{{ count }}</button>
</template>
```

### `<style>` — Scoped CSS
Scoped to the component by default.

### `<script server>` — Server-only code
Never shipped to the browser.

```vx
<script server>
  export async function loadData() {
    // Access DB, auth, etc.
    return { data: [] };
  }
</script>
```

## 3. Start the dev server

```bash
npm run dev
```

Your page is available at `http://localhost:5173`.

## Next steps

- [Routing](../core-concepts/routing.md)
- [Reactivity](../core-concepts/reactivity.md)
- [CLI Generators](../cli/generators.md)
