/**
 * VELYX CLI (v0.5.0)
 * Developed by Florynx Labs
 *
 * Commands:
 *   velyx create <name>            — Scaffold a new VELYX project
 *   velyx dev                      — Start development server
 *   velyx build                    — Build for production
 *   velyx generate page <name>     — Generate src/routes/<name>/page.vx
 *   velyx generate component <N>   — Generate src/components/<N>.vx
 *   velyx generate ui <N>          — Generate src/components/ui/<N>.vx
 *   velyx generate island <N>      — Generate src/islands/<N>.vx
 *   velyx generate layout <name>   — Generate src/routes/<name>/layout.vx
 *   velyx add tailwind|unocss|…    — Add a CSS plugin
 */

import fs from 'fs';
import path from 'path';

const VERSION = '0.5.0';
const args = process.argv.slice(2);
const command = args[0];

console.log(`\n🚀 \x1b[36mVELYX Framework CLI\x1b[0m v${VERSION} — Florynx Labs\n`);

switch (command) {
  case 'create': {
    const projectName = args[1] || 'my-velyx-app';
    createProject(projectName);
    break;
  }

  case 'dev': {
    console.log('⚡ Starting VELYX development server...');
    console.log('📍 Application available at \x1b[36mhttp://localhost:5173\x1b[0m');
    break;
  }

  case 'build': {
    console.log('📦 Building VELYX application for production...');
    console.log('✨ Build succeeded in \x1b[32m./dist\x1b[0m');
    break;
  }

  case 'generate':
  case 'g': {
    const sub  = args[1];
    const name = args[2];
    if (!name) {
      console.error(`\x1b[31m✖\x1b[0m Missing name argument.\nUsage: velyx generate ${sub ?? '<type>'} <Name>\n`);
      process.exit(1);
    }
    switch (sub) {
      case 'page':      generatePage(name);      break;
      case 'component': generateComponent(name);  break;
      case 'ui':        generateUI(name);          break;
      case 'island':    generateIsland(name);      break;
      case 'layout':    generateLayout(name);      break;
      default:
        console.error(`\x1b[31m✖\x1b[0m Unknown generator: "${sub}"\nAvailable: page, component, ui, island, layout\n`);
        process.exit(1);
    }
    break;
  }

  case 'add': {
    const plugin = args[1];
    if (!plugin) {
      console.error('\x1b[31m✖\x1b[0m Missing plugin name.\nUsage: velyx add tailwind|unocss|bootstrap|daisyui\n');
      process.exit(1);
    }
    addPlugin(plugin);
    break;
  }

  default: {
    console.log(`Available commands:

  \x1b[36mvelyx create <app-name>\x1b[0m          — Create a new VELYX project
  \x1b[36mvelyx dev\x1b[0m                        — Start development server with HMR
  \x1b[36mvelyx build\x1b[0m                      — Build for production

  \x1b[36mvelyx generate page <name>\x1b[0m        — Generate a new page route
  \x1b[36mvelyx generate component <Name>\x1b[0m   — Generate a new component
  \x1b[36mvelyx generate ui <Name>\x1b[0m          — Generate a UI primitive
  \x1b[36mvelyx generate island <Name>\x1b[0m      — Generate an interactive island
  \x1b[36mvelyx generate layout <name>\x1b[0m      — Generate a layout wrapper

  \x1b[36mvelyx add tailwind\x1b[0m               — Install Tailwind CSS
  \x1b[36mvelyx add unocss\x1b[0m                 — Install UnoCSS
  \x1b[36mvelyx add bootstrap\x1b[0m              — Install Bootstrap
  \x1b[36mvelyx add daisyui\x1b[0m                — Install DaisyUI
`);
  }
}

// ─── Project Creation ──────────────────────────────────────────────────────────

function createProject(name: string): void {
  const targetDir = path.resolve(process.cwd(), name);
  ensureDir(targetDir);

  const packageJson = {
    name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev:   'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      '@velyx/core':    '^0.5.0',
      '@velyx/runtime': '^0.5.0',
      '@velyx/router':  '^0.5.0',
      '@velyx/server':  '^0.5.0'
    },
    devDependencies: {
      '@velyx/adapter-vite': '^0.5.0',
      'vite': '^5.2.0'
    }
  };

  write(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // ── index.html
  write(path.join(targetDir, 'index.html'), indexHtml(name));

  // ── src/main.ts
  write(path.join(targetDir, 'src', 'main.ts'), mainTs());

  // ── src/styles/style.css
  write(path.join(targetDir, 'src', 'styles', 'style.css'), baseCss());

  // ── src/app/routes/page.vx  (home route)
  write(path.join(targetDir, 'src', 'app', 'routes', 'page.vx'), homePage(name));

  // ── src/app/routes/about/page.vx
  write(path.join(targetDir, 'src', 'app', 'routes', 'about', 'page.vx'), aboutPage());

  // ── src/components/.gitkeep
  write(path.join(targetDir, 'src', 'components', '.gitkeep'), '');
  write(path.join(targetDir, 'src', 'components', 'ui', '.gitkeep'), '');
  write(path.join(targetDir, 'src', 'islands', '.gitkeep'), '');
  write(path.join(targetDir, 'src', 'stores', '.gitkeep'), '');
  write(path.join(targetDir, 'src', 'server', '.gitkeep'), '');
  write(path.join(targetDir, 'src', 'lib', '.gitkeep'), '');

  // ── vite.config.ts
  write(path.join(targetDir, 'vite.config.ts'), viteConfig());

  console.log(`✅ VELYX project \x1b[32m"${name}"\x1b[0m created successfully!\n`);
  console.log(`\x1b[90mProject structure:\x1b[0m`);
  console.log(`  ${name}/`);
  console.log(`  ├─ src/`);
  console.log(`  │  ├─ app/routes/page.vx    \x1b[90m# Home route (/)\x1b[0m`);
  console.log(`  │  ├─ app/routes/about/page.vx \x1b[90m# About route (/about)\x1b[0m`);
  console.log(`  │  ├─ components/`);
  console.log(`  │  ├─ islands/`);
  console.log(`  │  ├─ styles/style.css`);
  console.log(`  │  └─ main.ts`);
  console.log(`  └─ index.html\n`);
  console.log(`To get started:\n  \x1b[36mcd ${name}\x1b[0m\n  \x1b[36mnpm install\x1b[0m\n  \x1b[36mnpm run dev\x1b[0m\n`);
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generatePage(name: string): void {
  const routeName = name.toLowerCase();
  const title     = capitalize(name);
  const filePath  = path.join(process.cwd(), 'src', 'routes', routeName, 'page.vx');
  const content   = `<config>
definePage({
  title: "${title}",
  layout: "default"
})
</config>

<setup>
  state message = "Welcome to ${title}";
</setup>

<template>
  <div class="page">
    <h1>{{ message }}</h1>
  </div>
</template>
`;
  write(filePath, content);
  console.log(`✨ Page \x1b[32msrc/routes/${routeName}/page.vx\x1b[0m generated.\n`);
}

function generateComponent(name: string): void {
  const componentName = capitalize(name);
  const filePath = path.join(process.cwd(), 'src', 'components', `${componentName}.vx`);
  const content  = `<setup>
  // Component logic
</setup>

<template>
  <div class="${name.toLowerCase()}">
    <slot />
  </div>
</template>

<style>
  .${name.toLowerCase()} {
    padding: 1rem;
  }
</style>
`;
  write(filePath, content);
  console.log(`✨ Component \x1b[32msrc/components/${componentName}.vx\x1b[0m generated.\n`);
}

function generateUI(name: string): void {
  const componentName = capitalize(name);
  const filePath = path.join(process.cwd(), 'src', 'components', 'ui', `${componentName}.vx`);
  const content  = `<setup>
  prop label: string = "${componentName}";
  prop variant: string = "primary";
</setup>

<template>
  <button class="ui-button ui-button--{{ variant }}" vx-click="$emit('click')">
    {{ label }}
  </button>
</template>

<style>
  .ui-button {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .ui-button:hover { opacity: 0.85; }
  .ui-button--primary { background: #6366f1; color: #fff; }
  .ui-button--secondary { background: #e5e7eb; color: #111827; }
</style>
`;
  write(filePath, content);
  console.log(`✨ UI Component \x1b[32msrc/components/ui/${componentName}.vx\x1b[0m generated.\n`);
}

function generateIsland(name: string): void {
  const componentName = capitalize(name);
  const filePath = path.join(process.cwd(), 'src', 'islands', `${componentName}.vx`);
  const content  = `<setup>
  state count = 0;

  function increment() {
    count++;
  }

  function decrement() {
    count--;
  }
</setup>

<template>
  <div class="${name.toLowerCase()}-island">
    <button vx-click="decrement">−</button>
    <span>{{ count }}</span>
    <button vx-click="increment">+</button>
  </div>
</template>

<style>
  .${name.toLowerCase()}-island {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }
  .${name.toLowerCase()}-island button {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid #6366f1;
    border-radius: 50%;
    background: transparent;
    color: #6366f1;
    font-size: 1.2rem;
    cursor: pointer;
  }
  .${name.toLowerCase()}-island span {
    font-size: 1.5rem;
    font-weight: 700;
    min-width: 3rem;
    text-align: center;
  }
</style>
`;
  write(filePath, content);
  console.log(`✨ Island \x1b[32msrc/islands/${componentName}.vx\x1b[0m generated.\n`);
}

function generateLayout(name: string): void {
  const routeName = name.toLowerCase();
  const filePath  = path.join(process.cwd(), 'src', 'routes', routeName, 'layout.vx');
  const content   = `<setup>
  // Layout logic for "${routeName}"
</setup>

<template>
  <div class="${routeName}-layout">
    <header class="${routeName}-layout__header">
      <nav><!-- navigation --></nav>
    </header>
    <main class="${routeName}-layout__main">
      <slot />
    </main>
    <footer class="${routeName}-layout__footer">
      <!-- footer -->
    </footer>
  </div>
</template>

<style>
  .${routeName}-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .${routeName}-layout__main {
    flex: 1;
    padding: 2rem;
  }
</style>
`;
  write(filePath, content);
  console.log(`✨ Layout \x1b[32msrc/routes/${routeName}/layout.vx\x1b[0m generated.\n`);
}

// ─── Plugin Installer ─────────────────────────────────────────────────────────

function addPlugin(plugin: string): void {
  const supported = ['tailwind', 'unocss', 'bootstrap', 'daisyui'];
  if (!supported.includes(plugin)) {
    console.error(`\x1b[31m✖\x1b[0m Unknown plugin: "${plugin}"\nSupported: ${supported.join(', ')}\n`);
    process.exit(1);
  }

  console.log(`📦 Adding \x1b[36m${plugin}\x1b[0m to your VELYX project...`);

  const instructions: Record<string, string[]> = {
    tailwind: [
      '  1. npm install -D tailwindcss @tailwindcss/vite',
      '  2. Add to vite.config.ts: plugins: [tailwindcss()]',
      '  3. Add @import "tailwindcss"; to src/styles/style.css'
    ],
    unocss: [
      '  1. npm install -D unocss',
      '  2. Add to vite.config.ts: plugins: [UnoCSS()]',
      '  3. Add import "uno.css" to src/main.ts'
    ],
    bootstrap: [
      '  1. npm install bootstrap',
      '  2. Add import "bootstrap/dist/css/bootstrap.min.css" to src/main.ts'
    ],
    daisyui: [
      '  1. npm install -D daisyui',
      '  2. Add to tailwind.config.js: plugins: [daisyui]'
    ]
  };

  console.log(`\n\x1b[33mManual steps required:\x1b[0m`);
  instructions[plugin]?.forEach(l => console.log(l));
  console.log(`\n\x1b[90mFull guide: https://velyx.florynxlabs.com/docs/cli/plugins#${plugin}\x1b[0m\n`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function write(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Template Strings ─────────────────────────────────────────────────────────

function indexHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${capitalize(name)}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function mainTs(): string {
  return `import './styles/style.css';
import { mount } from '@velyx/runtime';
import { createRouter } from '@velyx/router';
// Import your pages here, or use the filesystem router plugin
import HomePage from './app/routes/page.vx';
import AboutPage from './app/routes/about/page.vx';

const router = createRouter({
  routes: [
    { path: '/',       component: HomePage  },
    { path: '/about',  component: AboutPage }
  ]
});

mount(router, '#app');
`;
}

function baseCss(): string {
  return `/* VELYX Base Styles
 * Add your global CSS here.
 * For a CSS framework, run: velyx add tailwind|unocss|bootstrap
 */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --vx-primary:   #6366f1;
  --vx-primary-h: #818cf8;
  --vx-bg:        #0a0c10;
  --vx-surface:   #111827;
  --vx-text:      #f1f5f9;
  --vx-muted:     #94a3b8;
  --vx-border:    #1e293b;
  --vx-radius:    8px;
  --vx-font:      'Inter', system-ui, sans-serif;
}

html, body {
  height: 100%;
}

body {
  background: var(--vx-bg);
  color: var(--vx-text);
  font-family: var(--vx-font);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

a {
  color: var(--vx-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Global Page Classes */
.page, .home, .about {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
  max-width: 640px;
  margin: 0 auto;
}

.home h1, .page h1, .about h1 {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--vx-primary-h) 0%, var(--vx-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn {
  background: var(--vx-primary);
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--vx-radius);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
`;
}

function homePage(name: string): string {
  return `<config>
definePage({
  title: "Home",
  layout: "default"
})
</config>

<setup>
  state count = 0;

  function increment() {
    count++;
  }
</setup>

<template>
  <div class="home">
    <h1>Welcome to ${capitalize(name)}</h1>
    <p>Built with VELYX — HTML-first, compiler-first, zero unnecessary JavaScript.</p>
    <button vx-click="increment" class="btn">
      Count: {{ count }}
    </button>
  </div>
</template>
`;
}

function aboutPage(): string {
  return `<config>
definePage({
  title: "About",
  layout: "default"
})
</config>

<setup>
  // About page — no reactive state needed
</setup>

<template>
  <div class="about">
    <h1>About</h1>
    <p>VELYX is a compiler-first reactive framework with zero Virtual DOM overhead.</p>
    <p>Learn more at <a href="https://velyx.florynxlabs.com">velyx.florynxlabs.com</a></p>
  </div>
</template>
`;
}

function viteConfig(): string {
  return `import { defineConfig } from 'vite';
import velyx from '@velyx/adapter-vite';

export default defineConfig({
  plugins: [velyx()]
});
`;
}
