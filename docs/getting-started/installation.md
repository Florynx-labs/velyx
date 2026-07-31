# Installation

## Requirements

- **Node.js** 18+ or **Bun** 1+
- **pnpm** 8+ (recommended) or npm / yarn

## Create a new project

The fastest way to start is with the VELYX CLI:

```bash
npx velyx create my-app
cd my-app
npm install
npm run dev
```

This generates a fully structured project with the filesystem routing convention ready to use.

## Manual installation

If you prefer to set up manually:

```bash
npm install @velyx/core @velyx/runtime @velyx/router
npm install -D @velyx/adapter-vite vite
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import velyx from '@velyx/adapter-vite';

export default defineConfig({
  plugins: [velyx()]
});
```

## VS Code Extension

Install the official **VELYX** extension for full syntax highlighting, autocomplete and snippets:

- [Open VSX](https://open-vsx.org/extension/florynx-labs/vscode-velyx)

## Next steps

- [Project Structure](./project-structure.md)
- [Your First Page](./first-page.md)
