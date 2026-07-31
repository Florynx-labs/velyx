# CLI Generators

Generators scaffold VELYX files with the correct structure and conventions, saving you from writing boilerplate.

## `velyx generate page <name>`

Creates a new route page at `src/routes/<name>/page.vx`.

```bash
velyx generate page login
velyx generate page blog/about-us
```

**Generated file: `src/routes/login/page.vx`**

```vx
<config>
definePage({
  title: "Login",
  layout: "default"
})
</config>

<setup>
  state message = "Welcome to Login";
</setup>

<template>
  <div class="page">
    <h1>{{ message }}</h1>
  </div>
</template>
```

---

## `velyx generate component <Name>`

Creates a reusable component at `src/components/<Name>.vx`.

```bash
velyx generate component Card
velyx generate component UserAvatar
```

**Generated file: `src/components/Card.vx`**

```vx
<setup>
  // Component logic
</setup>

<template>
  <div class="card">
    <slot />
  </div>
</template>

<style>
  .card { padding: 1rem; }
</style>
```

---

## `velyx generate ui <Name>`

Creates a UI primitive in `src/components/ui/<Name>.vx`. Includes prop declarations for label and variant.

```bash
velyx generate ui Button
velyx generate ui Badge
velyx generate ui Avatar
```

---

## `velyx generate island <Name>`

Creates an interactive island in `src/islands/<Name>.vx`. Includes a reactive counter example as a starting point.

```bash
velyx generate island Counter
velyx generate island LikeButton
```

---

## `velyx generate layout <name>`

Creates a layout wrapper at `src/routes/<name>/layout.vx`.

```bash
velyx generate layout dashboard
velyx generate layout auth
```

**Generated file: `src/routes/dashboard/layout.vx`**

```vx
<setup>
  // Layout logic for "dashboard"
</setup>

<template>
  <div class="dashboard-layout">
    <header class="dashboard-layout__header">
      <nav><!-- navigation --></nav>
    </header>
    <main class="dashboard-layout__main">
      <slot />
    </main>
    <footer class="dashboard-layout__footer">
      <!-- footer -->
    </footer>
  </div>
</template>

<style>
  .dashboard-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .dashboard-layout__main { flex: 1; padding: 2rem; }
</style>
```

---

## Alias

All generators support the shorthand `g`:

```bash
velyx g page contact
velyx g component Modal
velyx g island VideoPlayer
```
