#!/usr/bin/env node
/**
 * P3-E41 (ADR-022): Copy the 11 FNC Landing `schedule*` Firestore collections from
 * `lilypad-strategy-design/(default)` into `freshnest-aa51e` (`freshnest-dev` or `(default)`).
 *
 * Safety defaults:
 *  - `--dry-run` is ON by default; pass `--apply` to write documents.
 *  - `--target-db` defaults to `freshnest-dev`; pass `--target-db=(default)` explicitly for prod.
 *  - Idempotent: preserves exact document IDs and Firestore Timestamp / GeoPoint / Bytes types.
 *  - Prints a before/after count table and exits non-zero if any collection count mismatches after `--apply`.
 *
 * Usage:
 *   node scripts/ops-migration/copy-schedule-collections.cjs --dry-run
 *   node scripts/ops-migration/copy-schedule-collections.cjs --apply --target-db=freshnest-dev
 *   node scripts/ops-migration/copy-schedule-collections.cjs --apply --target-db='(default)'
 */
'use strict'

const path = require('node:path')
const { createRequire } = require('node:module')

const OPS_COLLECTIONS = Object.freeze([
  'scheduleChangeLog',
  'scheduleCleanerTokens',
  'scheduleClientRates',
  'scheduleFeedback',
  'scheduleInvoiced',
  'scheduleLiveHandled',
  'schedulePlaces',
  'scheduleSettings',
  'scheduleSnapshots',
  'scheduleSoloOk',
  'scheduleVisitPhotos',
])

const BATCH_SIZE = 400

/** Split an array into fixed-size chunks (Firestore batch limit is 500; we use 400). */
function chunkArray(items, size = BATCH_SIZE) {
  if (!Number.isInteger(size) || size <= 0) throw new Error(`Invalid batch size: ${size}`)
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/** Parse CLI flags with safe defaults (`dryRun: true`, `targetDb: 'freshnest-dev'`). */
function parseArgs(argv) {
  const opts = {
    sourceProject: 'lilypad-strategy-design',
    sourceDb: '(default)',
    targetProject: 'freshnest-aa51e',
    targetDb: 'freshnest-dev',
    apply: false,
    help: false,
    collections: [...OPS_COLLECTIONS],
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') opts.help = true
    else if (arg === '--dry-run') opts.apply = false
    else if (arg === '--apply') opts.apply = true
    else if (arg.startsWith('--source-project=')) opts.sourceProject = arg.slice('--source-project='.length)
    else if (arg.startsWith('--source-db=')) opts.sourceDb = arg.slice('--source-db='.length)
    else if (arg.startsWith('--target-project=')) opts.targetProject = arg.slice('--target-project='.length)
    else if (arg.startsWith('--target-db=')) opts.targetDb = arg.slice('--target-db='.length)
    else if (arg.startsWith('--collections=')) {
      const requested = arg
        .slice('--collections='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const unknown = requested.filter((c) => !OPS_COLLECTIONS.includes(c))
      if (unknown.length) throw new Error(`Unknown ops collection(s): ${unknown.join(', ')}`)
      if (!requested.length) throw new Error('--collections must name at least one collection')
      opts.collections = requested
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (opts.sourceProject === opts.targetProject && opts.sourceDb === opts.targetDb) {
    throw new Error('Source and target project/database cannot be identical')
  }
  return opts
}

/** Format a count verification summary table and detect any post-apply count mismatches. */
function summarizeCounts(rows, applied) {
  const lines = [
    '| Collection | Source | Target (before) | Target (after) | Status |',
    '| --- | ---: | ---: | ---: | --- |',
  ]
  let mismatches = 0
  for (const r of rows) {
    const ok = !applied || r.targetAfter >= r.source
    if (!ok) mismatches++
    const status = applied ? (ok ? 'OK' : 'MISMATCH') : 'DRY-RUN'
    const afterCol = applied ? String(r.targetAfter) : '-'
    lines.push(`| ${r.collection} | ${r.source} | ${r.targetBefore} | ${afterCol} | ${status} |`)
  }
  return { table: lines.join('\n'), mismatches }
}

/** Resolve firebase-admin from functions-ops/ or functions/ so the script needs no root install. */
function loadFirebaseAdmin() {
  const repoRoot = path.resolve(__dirname, '../..')
  const candidates = [
    path.join(repoRoot, 'functions-ops', 'package.json'),
    path.join(repoRoot, 'functions', 'package.json'),
  ]
  for (const pkgPath of candidates) {
    try {
      const req = createRequire(pkgPath)
      return {
        app: req('firebase-admin/app'),
        firestore: req('firebase-admin/firestore'),
      }
    } catch {
      // try next candidate
    }
  }
  throw new Error('Could not resolve firebase-admin. Run `npm --prefix functions-ops ci` or `npm --prefix functions ci` first.')
}

async function copyCollection(sourceDb, targetDb, name, apply) {
  const [srcSnap, dstBeforeSnap] = await Promise.all([
    sourceDb.collection(name).get(),
    targetDb.collection(name).count().get(),
  ])
  const sourceCount = srcSnap.size
  const targetBefore = dstBeforeSnap.data().count

  if (!apply) {
    return { collection: name, source: sourceCount, targetBefore, targetAfter: null }
  }

  const batches = chunkArray(srcSnap.docs, BATCH_SIZE)
  for (const docs of batches) {
    const batch = targetDb.batch()
    for (const docSnap of docs) {
      batch.set(targetDb.collection(name).doc(docSnap.id), docSnap.data())
    }
    await batch.commit()
  }

  const dstAfterSnap = await targetDb.collection(name).count().get()
  return { collection: name, source: sourceCount, targetBefore, targetAfter: dstAfterSnap.data().count }
}

async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv)
  if (opts.help) {
    console.log(`Usage: node scripts/ops-migration/copy-schedule-collections.cjs [options]

Options:
  --dry-run                         Count only, write nothing (default)
  --apply                           Write documents idempotently to target database
  --source-project=<id>             Default: lilypad-strategy-design
  --source-db=<dbId>                Default: (default)
  --target-project=<id>             Default: freshnest-aa51e
  --target-db=<dbId>                Default: freshnest-dev  (pass "(default)" for prod)
  --collections=a,b                 Subset of the 11 schedule* collections
`)
    return
  }

  const { app, firestore } = loadFirebaseAdmin()
  const credential = app.applicationDefault()
  const srcApp = app.initializeApp({ projectId: opts.sourceProject, credential }, 'ops-migration-source')
  const dstApp = app.initializeApp({ projectId: opts.targetProject, credential }, 'ops-migration-target')

  const srcDb = firestore.getFirestore(srcApp, opts.sourceDb)
  const dstDb = firestore.getFirestore(dstApp, opts.targetDb)

  console.log(
    `Mode: ${opts.apply ? 'APPLY (WRITING)' : 'DRY-RUN (read-only)'}\n` +
      `Source: ${opts.sourceProject} / ${opts.sourceDb}\n` +
      `Target: ${opts.targetProject} / ${opts.targetDb}\n` +
      `Collections: ${opts.collections.length}\n`,
  )

  const rows = []
  for (const name of opts.collections) {
    const row = await copyCollection(srcDb, dstDb, name, opts.apply)
    rows.push(row)
  }

  const { table, mismatches } = summarizeCounts(rows, opts.apply)
  console.log(table)

  await Promise.all([app.deleteApp(srcApp), app.deleteApp(dstApp)])

  if (mismatches > 0) {
    console.error(`\nERROR: ${mismatches} collection(s) failed post-copy count verification.`)
    process.exitCode = 1
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}

module.exports = {
  OPS_COLLECTIONS,
  BATCH_SIZE,
  chunkArray,
  parseArgs,
  summarizeCounts,
}
