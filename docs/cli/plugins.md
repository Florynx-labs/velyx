# CSS Plugins availble soon 

VELYX is **CSS-framework agnostic** by design. The core produces clean HTML with no forced styling. You can use any CSS approach you prefer.

## `velyx add <plugin>`

The CLI provides an interactive setup guide for the most popular CSS frameworks:

```bash
velyx add tailwind
velyx add unocss
velyx add bootstrap
velyx add daisyui
```

---

## Tailwind CSS

```bash
velyx add tailwind
```

**Manual steps:**

1. Install dependencies:
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```

2. Update `vite.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   import velyx from '@velyx/adapter-vite';

   export default defineConfig({
     plugins: [tailwindcss(), velyx()]
   });
   ```

3. Update `src/styles/style.css`:
   ```css
   @import "tailwindcss";
   ```

---

## UnoCSS

```bash
velyx add unocss
```

**Manual steps:**

1. Install:
   ```bash
   npm install -D unocss
   ```

2. Update `vite.config.ts`:
   ```ts
   import UnoCSS from 'unocss/vite';
   import velyx from '@velyx/adapter-vite';

   export default defineConfig({
     plugins: [UnoCSS(), velyx()]
   });
   ```

3. Add to `src/main.ts`:
   ```ts
   import 'virtual:uno.css';
   ```

---

## Bootstrap

```bash
velyx add bootstrap
```

**Manual steps:**

1. Install:
   ```bash
   npm install bootstrap
   ```

2. Add to `src/main.ts`:
   ```ts
   import 'bootstrap/dist/css/bootstrap.min.css';
   ```

---

## DaisyUI

DaisyUI is a component library built on top of Tailwind CSS. Set up Tailwind first, then:

```bash
velyx add daisyui
```

**Manual steps:**

1. Install:
   ```bash
   npm install -D daisyui
   ```

2. Update `tailwind.config.js`:
   ```js
   export default {
     plugins: [require('daisyui')]
   };
   ```

---

## Writing your own styles

The default `src/styles/style.css` is your global stylesheet. It is imported automatically in `src/main.ts` and provides CSS custom properties (`--vx-*`) for a consistent design token system.

Component-level styles can be added in the `<style>` block of any `.vx` file.
