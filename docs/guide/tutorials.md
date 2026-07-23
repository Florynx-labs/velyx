# VELYX Step-by-Step Interactive Tutorials

Learn VELYX by building practical applications step by step.

---

## Tutorial 1: Hello World Component

### 1. Source (`App.vx`)
```html
<template>
  <h1>Hello, {{ name }}!</h1>
</template>
<script>
  state name = "VELYX Platform";
</script>
```

### 2. Compiler Output
```js
import { signal } from '@velyx/core';
import { createElement } from '@velyx/runtime';

export default function Component() {
  const name = signal("VELYX Platform");
  return createElement("h1", null, () => `Hello, ${name()}!`);
}
```

---

## Tutorial 2: Todo App with Keyed List Reconciliation

```html
<template>
  <div class="todo-app">
    <h2>My Todos ({{ total }})</h2>
    <input vx-model="inputVal" placeholder="New todo..." />
    <button vx-click="add">Add</button>
  </div>
</template>
<script>
  state total = 0;
  state inputVal = "";
  function add() {
    if (inputVal().trim()) {
      total++;
      inputVal("");
    }
  }
</script>
```
