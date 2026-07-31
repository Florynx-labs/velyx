# Project Structure

A VELYX v0.5 project follows a clear, opinionated directory convention:

```
my-app/
├─ index.html
├─ vite.config.ts
├─ package.json
└─ src/
   ├─ main.ts                    # Application entry point
   ├─ styles/
   │  └─ style.css               # Global styles
   ├─ app/
   │  └─ routes/                 # Filesystem routing root
   │     ├─ page.vx              # Route: /
   │     ├─ about/
   │     │  └─ page.vx           # Route: /about
   │     ├─ blog/
   │     │  ├─ page.vx           # Route: /blog
   │     │  └─ [slug]/
   │     │     └─ page.vx        # Route: /blog/:slug
   │     └─ dashboard/
   │        ├─ layout.vx         # Layout: wraps /dashboard/*
   │        ├─ page.vx           # Route: /dashboard
   │        ├─ analytics/
   │        │  └─ page.vx        # Route: /dashboard/analytics
   │        └─ users/
   │           └─ page.vx        # Route: /dashboard/users
   ├─ components/
   │  ├─ ui/                     # Design system primitives
   │  └─ *.vx                    # Shared components
   ├─ islands/                   # Interactive hydration islands
   ├─ stores/                    # Global state stores
   ├─ hooks/                     # Reusable composables
   ├─ server/                    # Server-only utilities
   ├─ lib/                       # Third-party integrations / helpers
   └─ assets/                    # Static assets (images, fonts…)
```

## Routing conventions

| File | URL |
|---|---|
| `routes/page.vx` | `/` |
| `routes/about/page.vx` | `/about` |
| `routes/blog/[slug]/page.vx` | `/blog/:slug` |
| `routes/dashboard/page.vx` | `/dashboard` |

## Layout convention

A `layout.vx` file **automatically wraps** all `page.vx` files in the same directory and below.

```
routes/
  dashboard/
    layout.vx    ← wraps /dashboard and /dashboard/*
    page.vx      ← /dashboard
    analytics/
      page.vx    ← /dashboard/analytics (also wrapped by layout.vx)
```

## SFC Block Convention (v0.5+)

```vx
<config>
definePage({ title: "My Page", layout: "default" })
</config>

<setup>
  state count = 0;
</setup>

<template>
  <h1>{{ count }}</h1>
</template>

<style>
  h1 { color: #6366f1; }
</style>

<script server>
  export async function handler() { /* server only */ }
</script>
```
