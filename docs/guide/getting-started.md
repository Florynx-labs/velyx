# VELYX Getting Started Guide

Welcome to **VELYX**, the compiler-first frontend platform created by **Florynx Labs**.

---

## 🚀 Quick Start (10 Seconds)

To create a new VELYX project, run:

```bash
npx create-velyx-app@latest my-app
cd my-app
pnpm install
pnpm dev
```

---

## 📁 Project Anatomy

A standard VELYX Single-File Component (`.vx`) has three clean sections:

```html
<template>
  <div class="card">
    <h2>Count: {{ count }}</h2>
    <button vx-click="increment">+ Increment</button>
  </div>
</template>

<script>
  state count = 0;

  function increment() {
    count++;
  }
</script>

<style>
  .card {
    padding: 1.5rem;
    background: #18181b;
    color: #fff;
    border-radius: 8px;
  }
</style>
```

---

## 🔑 Key Features
* **Zero Virtual DOM:** No tree-diffing, no reconciler allocations.
* **Granular Reactivity:** Updates target exact DOM text nodes and attributes.
* **Priority Scheduler:** Smooth 60fps UI frame rates even under heavy load.
