#!/usr/bin/env node
/**
 * Syncs pure domain modules from `packages/shared/src/domain` into `functions/src/shared`
 * before `tsc` or `vitest` runs in `functions/`.
 *
 * Why: Firebase Cloud Functions packages only the `functions/` directory on deploy, so
 * `functions/package.json` cannot depend on a workspace symlink outside `functions/`.
 * Syncing `packages/shared/src/domain` at build/test time gives `apps/customer`, `apps/fsm`,
 * and `functions/` a single source of truth while keeping `functions/lib/index.js` self-contained.
 */
const fs = require('node:fs')
const path = require('node:path')

const srcDir = path.resolve(__dirname, '../../packages/shared/src/domain')
const destDir = path.resolve(__dirname, '../src/shared')

fs.mkdirSync(destDir, { recursive: true })

for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
  const content = fs.readFileSync(path.join(srcDir, entry.name), 'utf8')
  const banner = '// AUTO-SYNCED FROM packages/shared/src/domain — DO NOT EDIT DIRECTLY.\n'
  fs.writeFileSync(path.join(destDir, entry.name), banner + content, 'utf8')
}
