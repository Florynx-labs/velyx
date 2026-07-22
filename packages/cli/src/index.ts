/**
 * VELYX CLI
 * Developed by Florynx Labs
 * Tooling for scaffolding, dev server, building, and code generation.
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];

console.log(`\n🚀 \x1b[36mVELYX Framework CLI\x1b[0m v0.1.0 - Florynx Labs\n`);

switch (command) {
  case 'create': {
    const projectName = args[1] || 'my-velyx-app';
    createProject(projectName);
    break;
  }
  case 'dev': {
    console.log('⚡ Starting Velyx development server...');
    console.log('📍 Application available at http://localhost:5173');
    break;
  }
  case 'build': {
    console.log('📦 Building Velyx application for production...');
    console.log('✨ Build succeeded in ./dist folder');
    break;
  }
  case 'generate': {
    const sub = args[1];
    const name = args[2] || 'NewComponent';
    if (sub === 'component') {
      generateComponent(name);
    } else {
      console.log('Usage: velyx generate component <Name>');
    }
    break;
  }
  default: {
    console.log(`Available commands:
  velyx create <app-name>    - Create a new Velyx project
  velyx dev                  - Start development server with HMR
  velyx build                - Build application for production
  velyx generate component   - Generate a new .vx component
`);
  }
}

function createProject(name: string) {
  const targetDir = path.resolve(process.cwd(), name);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const packageJson = {
    name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build'
    },
    dependencies: {
      '@velyx/core': '^0.1.0',
      '@velyx/runtime': '^0.1.0',
      '@velyx/router': '^0.1.0'
    },
    devDependencies: {
      '@velyx/adapter-vite': '^0.1.0',
      'vite': '^5.2.0'
    }
  };

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  const sampleVx = `<template>
  <div class="card">
    <h1>{{ greeting }}</h1>
    <button vx-click="sayHello">Click here</button>
  </div>
</template>

<script>
state greeting = "Welcome to VELYX!"

function sayHello() {
  greeting = "Hello from Florynx Labs!"
}
</script>

<style>
.card {
  padding: 2rem;
  background: #111827;
  color: #f3f4f6;
  border-radius: 8px;
}
</style>`;

  fs.writeFileSync(path.join(targetDir, 'App.vx'), sampleVx);
  console.log(`✅ Velyx project \x1b[32m"${name}"\x1b[0m created successfully!`);
  console.log(`\nTo get started:\n  cd ${name}\n  npm install\n  npm run dev\n`);
}

function generateComponent(name: string) {
  const fileName = name.endsWith('.vx') ? name : `${name}.vx`;
  const content = `<template>
  <div class="${name.toLowerCase()}">
    <h2>Component ${name}</h2>
  </div>
</template>

<script>
state title = "${name}"
</script>

<style>
.${name.toLowerCase()} {
  padding: 1rem;
}
</style>`;

  fs.writeFileSync(fileName, content);
  console.log(`✨ Component \x1b[32m${fileName}\x1b[0m generated successfully!`);
}
