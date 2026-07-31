# CLI Reference

## Commands

### `velyx create <name>`

Scaffolds a new VELYX project with the v0.5 filesystem routing convention.

```bash
velyx create my-app
cd my-app
npm install
npm run dev
```

**Generated structure:**
```
my-app/
├─ index.html
├─ vite.config.ts
├─ package.json
└─ src/
   ├─ main.ts
   ├─ styles/style.css
   ├─ app/routes/
   │  ├─ page.vx          (route /)
   │  └─ about/page.vx    (route /about)
   ├─ components/
   ├─ islands/
   └─ server/
```

---

### `velyx dev`

Starts the development server with HMR.

```bash
velyx dev
```

---

### `velyx build`

Builds the application for production.

```bash
velyx build
```

---

## Generators

### `velyx generate page <name>`

Alias: `velyx g page <name>`

Creates `src/routes/<name>/page.vx` with the full page template.

```bash
velyx generate page login
# → src/routes/login/page.vx
```

---

### `velyx generate component <Name>`

Creates `src/components/<Name>.vx`.

```bash
velyx generate component Card
# → src/components/Card.vx
```

---

### `velyx generate ui <Name>`

Creates a UI primitive in `src/components/ui/<Name>.vx`.

```bash
velyx generate ui Button
# → src/components/ui/Button.vx
```

---

### `velyx generate island <Name>`

Creates a reactive island in `src/islands/<Name>.vx` with a counter example.

```bash
velyx generate island Counter
# → src/islands/Counter.vx
```

---

### `velyx generate layout <name>`

Creates `src/routes/<name>/layout.vx` with a full layout template.

```bash
velyx generate layout dashboard
# → src/routes/dashboard/layout.vx
```

---

## CSS Plugins

### `velyx add tailwind`

Provides installation instructions for Tailwind CSS.

```bash
velyx add tailwind
velyx add unocss
velyx add bootstrap
velyx add daisyui
```

See [Plugins Guide](./plugins.md) for full setup steps.
