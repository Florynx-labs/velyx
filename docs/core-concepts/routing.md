# Filesystem Routing

VELYX uses **filesystem-based routing** — your directory structure *is* your router.

## Convention

| File | Route |
|---|---|
| `src/app/routes/page.vx` | `/` |
| `src/app/routes/about/page.vx` | `/about` |
| `src/app/routes/blog/page.vx` | `/blog` |
| `src/app/routes/blog/[slug]/page.vx` | `/blog/:slug` |
| `src/app/routes/dashboard/page.vx` | `/dashboard` |
| `src/app/routes/dashboard/users/page.vx` | `/dashboard/users` |

## Dynamic segments

Wrap a directory name in square brackets to create a dynamic route parameter:

```
routes/
  blog/
    [slug]/
      page.vx   →  /blog/:slug
```

Inside `page.vx`, access the param via `@velyx/router`:

```vx
<setup>
  import { currentParams } from '@velyx/router';
  const slug = computed(() => currentParams.value.slug);
</setup>

<template>
  <h1>Post: {{ slug }}</h1>
</template>
```

## Layouts

A `layout.vx` file automatically wraps all pages in its directory and subdirectories:

```
routes/
  dashboard/
    layout.vx   ← wraps /dashboard and /dashboard/*
    page.vx     ← /dashboard
    analytics/
      page.vx   ← /dashboard/analytics (wrapped)
```

## Manual routes (programmatic)

If you prefer to define routes manually:

```ts
import { createRouter } from '@velyx/router';

const router = createRouter({
  routes: [
    { path: '/',       component: HomePage  },
    { path: '/about',  component: AboutPage },
    { path: '/blog/:slug', component: PostPage }
  ]
});
```

## Build-time route discovery

At build time, `@velyx/adapter-vite` calls `discoverRoutes()` to auto-generate the route manifest:

```ts
import { discoverRoutes } from '@velyx/router';

const routes = await discoverRoutes('./src/app/routes');
// [
//   { urlPath: '/',      filePath: '...page.vx',       isDynamic: false },
//   { urlPath: '/about', filePath: '...about/page.vx', isDynamic: false },
//   { urlPath: '/blog/:slug', filePath: '...[slug]/page.vx', isDynamic: true }
// ]
```

## Navigation

```ts
import { navigate } from '@velyx/router';

navigate('/about');        // programmatic navigation
navigate('/blog/my-post'); // with dynamic segment
```
