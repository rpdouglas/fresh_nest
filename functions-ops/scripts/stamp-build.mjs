#!/usr/bin/env node
// Writes the commit being deployed beside the function's built code, so that /api/health can name it
// and a deploy can be checked against it. Run by firebase.json before the function is uploaded.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const repoRoot = new URL('../..', import.meta.url)
const fnRoot = new URL('..', import.meta.url)
const opts = { cwd: repoRoot }
const commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8', ...opts }).trim()
// a deploy is made from a clean main; if it ever is not, the name says so
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8', ...opts }).trim() ? '-dirty' : ''
mkdirSync(new URL('lib/', fnRoot), { recursive: true })
writeFileSync(new URL('lib/build.json', fnRoot), JSON.stringify({ commit: commit + dirty }) + '\n')
console.log(`Build stamped: ${commit}${dirty}`)
