#!/usr/bin/env node
/**
 * W0-5 (MP-S6.P4): Repeatable Firestore backup & restore drill script.
 *
 * Exports the production `(default)` database (nam5) to `gs://freshnest-aa51e-firestore-backups`,
 * stages a regional copy in `gs://freshnest-aa51e-firestore-restore-ca` (northamerica-northeast1),
 * imports it into `freshnest-dev`, and verifies collection counts between `(default)` and `freshnest-dev`.
 *
 * Safety:
 * - Target database defaults to `freshnest-dev`.
 * - Importing into `(default)` is HARD-BLOCKED unless `--i-understand-this-overwrites-prod` is passed.
 *
 * Usage (requires ADC with Firestore Import/Export + Storage Object Admin):
 *   node functions/scripts/firestore-restore-drill.cjs
 *   node functions/scripts/firestore-restore-drill.cjs --source=gs://freshnest-aa51e-firestore-backups/daily/2026-11-21
 *   node functions/scripts/firestore-restore-drill.cjs --export-only
 */

const { execSync } = require('node:child_process')
const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'freshnest-aa51e'
const SOURCE_DB = '(default)'
const BACKUP_BUCKET = process.env.BACKUP_BUCKET || 'freshnest-aa51e-firestore-backups'
const STAGING_BUCKET = process.env.RESTORE_STAGING_BUCKET || 'freshnest-aa51e-firestore-restore-ca'

const COLLECTIONS_TO_VERIFY = [
  'admins',
  'agreements',
  'agreementTemplates',
  'auditLog',
  'bookings',
  'checklistTemplates',
  'galleryPairs',
  'jobs',
  'payRates',
  'reviews',
  'settings',
  'staff',
]

function parseArgs(argv) {
  const args = { targetDb: 'freshnest-dev', sourceUri: null, exportOnly: false, allowProd: false }
  for (const arg of argv) {
    if (arg.startsWith('--target=')) args.targetDb = arg.slice('--target='.length)
    else if (arg.startsWith('--source=')) args.sourceUri = arg.slice('--source='.length).replace(/\/+$/, '')
    else if (arg === '--export-only') args.exportOnly = true
    else if (arg === '--i-understand-this-overwrites-prod') args.allowProd = true
  }
  return args
}

function getAdcToken() {
  return execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' }).trim()
}

async function api(url, token, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': PROJECT_ID,
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  return data
}

async function pollOperation(opName, token, label) {
  const startedAt = Date.now()
  while (true) {
    const op = await api(`https://firestore.googleapis.com/v1/${opName}`, token)
    if (op.done) {
      if (op.error) {
        throw new Error(`${label} failed: ${JSON.stringify(op.error)}`)
      }
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
      console.log(`✓ ${label} completed in ${elapsedSec}s (${opName})`)
      return op
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
}

function parseGsUri(uri) {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri)
  if (!match) throw new Error(`Invalid gs:// URI: ${uri}`)
  return { bucket: match[1], prefix: match[2].replace(/\/+$/, '') }
}

async function copyExportPrefix(sourceUri, destBucket, destPrefix, token) {
  const { bucket: srcBucket, prefix: srcPrefix } = parseGsUri(sourceUri)
  let pageToken = ''
  const objects = []
  do {
    const q = new URLSearchParams({ prefix: `${srcPrefix}/` })
    if (pageToken) q.set('pageToken', pageToken)
    const list = await api(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(srcBucket)}/o?${q.toString()}`,
      token,
    )
    if (Array.isArray(list.items)) objects.push(...list.items)
    pageToken = list.nextPageToken || ''
  } while (pageToken)

  if (objects.length === 0) {
    throw new Error(`No export objects found under ${sourceUri}/`)
  }

  for (const obj of objects) {
    const rel = obj.name.slice(srcPrefix.length + 1)
    const dstName = `${destPrefix}/${rel}`
    let rewriteToken = ''
    do {
      const q = rewriteToken ? `?rewriteToken=${encodeURIComponent(rewriteToken)}` : ''
      const rw = await api(
        `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(srcBucket)}/o/${encodeURIComponent(obj.name)}/rewriteTo/b/${encodeURIComponent(destBucket)}/o/${encodeURIComponent(dstName)}${q}`,
        token,
        { method: 'POST' },
      )
      rewriteToken = rw.done ? '' : rw.rewriteToken
    } while (rewriteToken)
  }

  console.log(`✓ Staged ${objects.length} export object(s) into gs://${destBucket}/${destPrefix}`)
  return `gs://${destBucket}/${destPrefix}`
}

async function countDocs(db, colName) {
  const snap = await db.collection(colName).count().get()
  return snap.data().count
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.exportOnly && args.targetDb === '(default)' && !args.allowProd) {
    console.error('REFUSED: Importing into production (default) requires --i-understand-this-overwrites-prod.')
    process.exit(2)
  }

  const token = getAdcToken()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')

  // 1. Export (default) unless an existing --source URI was supplied
  let sourceUri = args.sourceUri
  let exportOpName = null
  if (!sourceUri) {
    sourceUri = `gs://${BACKUP_BUCKET}/drills/${stamp}`
    console.log(`1/4 Exporting ${SOURCE_DB} -> ${sourceUri} ...`)
    const op = await api(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(SOURCE_DB)}:exportDocuments`,
      token,
      { method: 'POST', body: JSON.stringify({ outputUriPrefix: sourceUri }) },
    )
    exportOpName = op.name
    await pollOperation(op.name, token, 'Firestore export')
  } else {
    console.log(`1/4 Using existing export: ${sourceUri}`)
  }

  if (args.exportOnly) {
    console.log('Export-only mode complete:', sourceUri)
    return
  }

  // 2. Stage copy in northamerica-northeast1 when restoring into freshnest-dev
  let importUri = sourceUri
  if (args.targetDb === 'freshnest-dev') {
    console.log(`2/4 Copying export to ${STAGING_BUCKET} (northamerica-northeast1) for cross-region restore ...`)
    importUri = await copyExportPrefix(sourceUri, STAGING_BUCKET, `drills/${stamp}`, token)
  } else {
    console.log('2/4 Same-region restore — using source URI directly.')
  }

  // 3. Import into target database
  console.log(`3/4 Importing ${importUri} -> ${args.targetDb} ...`)
  const importOp = await api(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(args.targetDb)}:importDocuments`,
    token,
    { method: 'POST', body: JSON.stringify({ inputUriPrefix: importUri }) },
  )
  await pollOperation(importOp.name, token, `Firestore import into ${args.targetDb}`)

  // 4. Verify collection counts between (default) and targetDb
  console.log(`4/4 Verifying collection counts (${SOURCE_DB} vs ${args.targetDb}) ...`)
  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID })
  }
  const prodDb = getFirestore()
  const targetDb = args.targetDb === '(default)' ? prodDb : getFirestore(args.targetDb)

  let allOk = true
  const rows = []
  for (const col of COLLECTIONS_TO_VERIFY) {
    const [prodCount, targetCount] = await Promise.all([
      countDocs(prodDb, col),
      countDocs(targetDb, col),
    ])
    const ok = targetCount >= prodCount
    if (!ok) allOk = false
    rows.push({ collection: col, prod: prodCount, restored: targetCount, status: ok ? 'OK' : 'MISSING' })
  }

  console.table(rows)
  console.log('Summary:', JSON.stringify({
    exportUri: sourceUri,
    exportOpName,
    importUri,
    importOpName: importOp.name,
    targetDb: args.targetDb,
    verified: allOk,
  }, null, 2))

  if (!allOk) {
    console.error('RESTORE VERIFICATION FAILED: one or more collections have fewer docs in target than production.')
    process.exit(1)
  }
  console.log('✓ W0-5 restore drill PASSED.')
}

main().catch((err) => {
  console.error('Restore drill failed:', err)
  process.exit(1)
})
