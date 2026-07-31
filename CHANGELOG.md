# CHANGELOG — VELYX

All notable changes to the VELYX framework monorepo will be documented in this file.

---

## [0.5.0] - 2026-07-31

### "Filesystem Architecture Update"

#### Added
- **Filesystem-based Routing (`@velyx/router`)**:
  - Automatically maps `src/app/routes/**/page.vx` to URL paths (e.g. `routes/about/page.vx` → `/about`).
  - Supports dynamic route parameters via `[param]` folder convention (e.g. `routes/blog/[slug]/page.vx` → `/blog/:slug`).
  - Added `discoverRoutes()` utility for build-time route tree generation in `@velyx/adapter-vite`.
  - Added reactive `currentParams` signal for extracting URL route parameters in components.
- **Nested Layouts (`layout.vx`)**:
  - `layout.vx` automatically wraps all `page.vx` files in the same directory and subdirectories.
- **New `.vx` SFC Conventions (`@velyx/compiler`)**:
  - Introduced `<setup>` block as the primary client-side logic container, replacing `<script>`.
  - Introduced `<config>` block for page and component metadata declarations (`definePage`, `defineProps`).
  - Native support for `<script server>` blocks for server-only actions that never ship to the browser.
  - Backward compatibility: legacy `<script>` blocks remain fully supported with deprecation warnings.
- **CLI Generators (`@velyx/cli`)**:
  - `velyx generate page <name>` → scaffolds `src/routes/<name>/page.vx`.
  - `velyx generate component <Name>` → scaffolds `src/components/<Name>.vx`.
  - `velyx generate ui <Name>` → scaffolds `src/components/ui/<Name>.vx`.
  - `velyx generate island <Name>` → scaffolds `src/islands/<Name>.vx`.
  - `velyx generate layout <name>` → scaffolds `src/routes/<name>/layout.vx`.
  - `velyx add <plugin>` → interactive helper for Tailwind CSS, UnoCSS, Bootstrap, and DaisyUI.
- **VS Code Extension (`@velyx/vscode`)**:
  - Updated snippets: `vel`, `velpage`, `velcomponent`, `velserver`, `vx-config`.
  - Enhanced syntax highlighting for HTML tags (`div`, `span`, `button`), attributes, directives, and Mustache expressions.
- **Documentation & Examples**:
  - Complete docs rewrite under `docs/` covering getting started, core concepts, CLI reference, and architecture.
  - Added "Why VELYX?" philosophy document.
  - Added 6 official example projects (`examples/01-basic-page` through `06-dashboard`).

#### Changed
- `starter-minimal` template updated to the new `src/app/routes/` filesystem structure with global `style.css` styling.

---

*Powered by Florynx Labs*
