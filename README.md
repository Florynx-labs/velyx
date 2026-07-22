<p align="center">
  <img src="./logo.png" alt="VELYX Logo" width="280" />
</p>

# ⚡ VELYX Framework

> **"HTML should stay the foundation. JavaScript should be generated only when needed."**

**VELYX** is a next-generation frontend framework created by **Florynx Labs**. It combines the HTML-first simplicity of HTMX, the component architecture of React, the optimized compilation of Svelte, and the fine-grained signal reactivity of SolidJS.

---

## 🌟 Vision & Philosophy

- **Zero Virtual DOM**: Targeted DOM updates executed directly on modified DOM nodes without global Virtual DOM diffing overhead.
- **Micro-Runtime (<10KB gzip)**: Ultra-lightweight runtime responsible for applying direct reactive mutations.
- **Reactive Signals**: Fine-grained state management with automatic dependency tracking (`signal`, `effect`, `computed`).
- **Optimized SFC Compilation (`.vx`)**: SFC compiler that transforms `.vx` single-file component syntax into optimized ES modules.
- **Native SSR & Selective Hydration**: Fast server-side rendering with progressive client hydration.
- **CSS Agnostic**: Native support for TailwindCSS, SCSS, CSS Modules, or vanilla CSS.

---

## 📂 Monorepo Architecture

```text
velyx/
├── packages/
│   ├── core/         # Reactive signals (signal, effect, computed, batch) & lifecycle
│   ├── runtime/      # Micro DOM runtime (<10KB) & event/attribute bindings
│   ├── compiler/     # Parser & JS code generator for .vx components
│   ├── server/       # SSR engine, hydration markers, and Server Actions
│   ├── router/       # Reactive SPA/SSR router with dynamic route matching
│   ├── cli/          # CLI tool (velyx create, dev, build, generate)
│   └── devtools/     # Inspector hook & reactive state graph devtools
├── adapters/
│   └── adapter-vite/ # Vite plugin adapter to support .vx components
└── examples/
    └── counter-app/  # Full Hello World / Counter example app
```

---

## 📝 Component Syntax (`Counter.vx`)

Velyx single-file components are written in `.vx` files:

```html
<template>
  <div class="card">
    <h1>Count: {{ count }}</h1>
    <button vx-click="increment">+</button>
    <button vx-click="decrement">-</button>
  </div>
</template>

<script>
state count = 0

function increment() {
  count++
}

function decrement() {
  count--
}
</script>

<style>
.card {
  padding: 2rem;
  background: #0f172a;
  color: #38bdf8;
  border-radius: 12px;
}
</style>
```

---

## 🚀 Quickstart & Testing

### 1. Run Framework Unit Tests
```bash
node --experimental-strip-types packages/core/src/index.test.ts
node --experimental-strip-types packages/compiler/src/index.test.ts
```

### 2. Run the Example Counter App with Vite
```bash
cd examples/counter-app
npm install
npm run dev
```

---

## 🛠️ VELYX CLI

The `@velyx/cli` package provides the following commands:

```bash
velyx create my-app       # Create a new Velyx project
velyx dev                 # Start development server with HMR
velyx build               # Build application for production
velyx generate component  # Generate a new .vx component
```

---

## 📄 License

Developed by **Florynx Labs** under the MIT License.
