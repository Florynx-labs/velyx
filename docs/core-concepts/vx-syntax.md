# .vx Syntax Reference

Complete reference for the VELYX Single-File Component (SFC) syntax.

## Block overview

```vx
<config>       ← page/component metadata        (optional)
<setup>        ← client-side reactive logic      (primary, v0.5+)
<template>     ← HTML template                  (required)
<style>        ← scoped CSS                     (optional)
<transition>   ← WAAPI animation definitions    (optional)
<script server>← server-only functions          (optional)
```

> **Migration note**: `<script>` (v0.4 and earlier) is still supported for backward compatibility,
> but `<setup>` is now the recommended block.

---

## `<config>` block

Declares page-level or component-level metadata.

```vx
<config>
definePage({
  title: "My Page",
  layout: "default",
  description: "SEO description"
})
</config>
```

For components:
```vx
<config>
defineComponent({ name: "MyCard" })
</config>
```

---

## `<setup>` block

The primary client logic block.

### Reactive state

```vx
<setup>
  state count  = 0;           // number
  state name   = "Alice";     // string
  state active = true;        // boolean
  state items  = [];          // array
</setup>
```

### Props

```vx
<setup>
  prop label: string = "Submit";
  prop disabled: boolean = false;
</setup>
```

### Computed values

```vx
<setup>
  state count = 0;
  computed double = () => count * 2;
</setup>
```

### Watchers

```vx
<setup>
  state query = "";
  watch(query, (val) => {
    console.log("Query changed:", val);
  });
</setup>
```

### Lifecycle

```vx
<setup>
  onMount(() => {
    console.log("Component mounted");
  });

  onDestroy(() => {
    console.log("Component destroyed");
  });
</setup>
```

---

## `<template>` block

Standard HTML with VELYX directives and Mustache expressions.

### Mustache expressions

```vx
<h1>{{ count }}</h1>
<p>{{ name.toUpperCase() }}</p>
<span>{{ isActive ? "Yes" : "No" }}</span>
```

### Directives

| Directive | Description |
|---|---|
| `vx-click` | Click event |
| `vx-input` | Input event |
| `vx-change` | Change event |
| `vx-submit` | Form submit |
| `vx-model` | Two-way binding |
| `vx-if` | Conditional render |
| `vx-for` | List render |
| `vx-show` | Toggle visibility |
| `vx-transition` | Apply named transition |

### Directive modifiers

```vx
<button vx-click.once="handleClick">Click once</button>
<form vx-submit.prevent="handleSubmit">…</form>
<div vx-click.stop="stopProp">…</div>
```

---

## `<style>` block

Scoped CSS, injected once at mount.

```vx
<style>
  .card {
    background: var(--vx-surface);
    border-radius: var(--vx-radius);
    padding: 1.5rem;
  }
</style>
```

---

## `<transition>` block

Defines WAAPI animation keyframes by name, referenced via `vx-transition`.

```vx
<transition>
  fadeIn {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  slideLeft {
    0%   { transform: translateX(-20px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
</transition>

<template>
  <div vx-transition="fadeIn">Hello</div>
</template>
```

---

## `<script server>` block

Server-only code — never shipped to the browser.

```vx
<script server>
  export async function saveUser(data: { name: string }) {
    // Access DB, run auth checks, etc.
    return { id: crypto.randomUUID(), ...data };
  }
</script>
```
