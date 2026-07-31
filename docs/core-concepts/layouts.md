# Layouts

Layouts allow you to define a shared UI wrapper that automatically surrounds a group of pages.

## Convention

Place a `layout.vx` file in any route directory to wrap all pages in that directory and its subdirectories:

```
src/app/routes/
  dashboard/
    layout.vx         ← wraps /dashboard and /dashboard/*
    page.vx           ← /dashboard
    analytics/
      page.vx         ← /dashboard/analytics (wrapped by layout.vx)
    users/
      page.vx         ← /dashboard/users (wrapped by layout.vx)
```

## Writing a layout

A layout receives a `<slot />` where the child page is rendered:

```vx
<setup>
  // Layout-level state and logic
</setup>

<template>
  <div class="app-layout">
    <header class="header">
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main class="content">
      <slot />
    </main>

    <footer class="footer">
      <p>© 2026 My App</p>
    </footer>
  </div>
</template>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .content { flex: 1; }
</style>
```

## Declaring layout in a page

Reference the layout name in the page `<config>` block:

```vx
<config>
definePage({
  title: "Dashboard",
  layout: "dashboard"
})
</config>
```

## Generate a layout with the CLI

```bash
velyx generate layout dashboard
# Creates: src/routes/dashboard/layout.vx
```

## Root layout

To apply a layout to every page in the app, create a `layout.vx` at the root of your routes:

```
src/app/routes/
  layout.vx         ← wraps ALL pages
  page.vx
  about/
    page.vx
```
