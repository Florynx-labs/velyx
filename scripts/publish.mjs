#!/usr/bin/env node
/**
 * VELYX — npm publish script
 * Publishes all @velyxteam/* packages in dependency order.
 * Run: node scripts/publish.mjs
 *
 * Requirements:
 *   - npm login  (or NODE_AUTH_TOKEN env var)
 *   - pnpm build (already done)
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const packages = [
  // Tier 0 — no internal deps
  'packages/runtime-core',
  'packages/compiler',
  // Tier 1 — depends on runtime-core
  'packages/runtime-dom',
  // Tier 2 — depends on runtime-core + runtime-dom
  'packages/runtime',
  // Tier 3 — depends on runtime + compiler
  'packages/core',
  'adapters/adapter-vite',
  // Tier 4 — depends on core + runtime
  'packages/router',
  'packages/server',
  'packages/devtools',
  // Tier 5 — depends on compiler
  'packages/cli',
];

for (const pkg of packages) {
  const pkgPath = path.join(root, pkg);
  const pkgJson = JSON.parse(
    (await import(path.join(pkgPath, 'package.json'), { assert: { type: 'json' } })).default
      ? JSON.stringify((await import(path.join(pkgPath, 'package.json'), { assert: { type: 'json' } })).default)
      : '{}'
  );

  console.log(`\n📦 Publishing ${pkg}...`);
  try {
    execSync('pnpm publish --access public --no-git-checks', {
      cwd: pkgPath,
      stdio: 'inherit',
    });
    console.log(`✅ Published ${pkg}`);
  } catch (e) {
    console.error(`❌ Failed to publish ${pkg}:`, e.message);
    process.exit(1);
  }
}

console.log('\n🎉 All packages published to @velyxteam!\n');
