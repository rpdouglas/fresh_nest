#!/usr/bin/env node
/**
 * HOTFIX-05 backfill — lowercase `bookings.email` for bookings saved before the fix.
 *
 * The customer portal and the bookings read rule match `email` against the (lowercased)
 * Firebase Auth email, so bookings stored as e.g. "Diane@Example.ca" are invisible to the
 * customer. New bookings are already stored lowercased; this fixes the old ones.
 *
 * Dry run by default — prints what would change and writes nothing. Changes only `email`
 * (trimmed + lowercased). Each write is conditional on the document not having changed since
 * it was read, so a booking edited mid-run is skipped, not overwritten. Safe to re-run.
 * Updating `email` does not re-send any message (the update triggers only act on status
 * changes). Emails are masked in the output (COMPLIANCE.md: no PII in logs).
 *
 * Usage (from functions/, with Application Default Credentials for freshnest-aa51e:
 * `gcloud auth application-default login`, or GOOGLE_APPLICATION_CREDENTIALS):
 *   node scripts/backfill-lowercase-booking-emails.cjs --database=freshnest-dev            # dry run, dev
 *   node scripts/backfill-lowercase-booking-emails.cjs --database=freshnest-dev --apply    # write, dev
 *   node scripts/backfill-lowercase-booking-emails.cjs --database='(default)'              # dry run, PRODUCTION
 *   node scripts/backfill-lowercase-booking-emails.cjs --database='(default)' --apply      # write, PRODUCTION
 *
 * Running against production with --apply is a live data change: get human approval first.
 */
'use strict'

const PROJECT_ID = 'freshnest-aa51e'
const DATABASES = ['(default)', 'freshnest-dev']
const BATCH_SIZE = 400

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

/** "Diane.Lafleur@Example.ca" -> "d***@example.ca" */
function maskEmail(email) {
  const [local, domain] = String(email).trim().split('@')
  return `${(local || '').slice(0, 1).toLowerCase()}***@${(domain || '?').toLowerCase()}`
}

/**
 * Works out which bookings need updating.
 * @param {{ id: string, email: unknown }[]} docs
 * @returns {{ updates: { id: string, from: string, to: string }[], skipped: { id: string, reason: string }[], mixedSpellings: number }}
 */
function planBackfill(docs) {
  const updates = []
  const skipped = []
  const spellings = new Map() // normalized email -> set of stored spellings
  for (const { id, email } of docs) {
    if (typeof email !== 'string' || email.trim() === '') {
      skipped.push({ id, reason: 'missing or non-string email' })
      continue
    }
    const to = normalizeEmail(email)
    if (!spellings.has(to)) spellings.set(to, new Set())
    spellings.get(to).add(email)
    if (to !== email) updates.push({ id, from: email, to })
  }
  const mixedSpellings = [...spellings.values()].filter((s) => s.size > 1).length
  return { updates, skipped, mixedSpellings }
}

function parseArgs(argv) {
  const args = { apply: false, database: null }
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true
    else if (arg.startsWith('--database=')) args.database = arg.slice('--database='.length)
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!DATABASES.includes(args.database)) {
    throw new Error(`--database is required: one of ${DATABASES.map((d) => `'${d}'`).join(', ')}`)
  }
  return args
}

async function main() {
  const { apply, database } = parseArgs(process.argv.slice(2))
  const { initializeApp } = require('firebase-admin/app')
  const { getFirestore } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore(database)
  const target = `${PROJECT_ID} / ${database}${process.env.FIRESTORE_EMULATOR_HOST ? ` (emulator ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — bookings in ${target}`)

  const snap = await db.collection('bookings').select('email').get()
  const byId = new Map(snap.docs.map((d) => [d.id, d]))
  const plan = planBackfill(snap.docs.map((d) => ({ id: d.id, email: d.get('email') })))

  console.log(`Scanned ${snap.size} bookings: ${plan.updates.length} to lowercase, ${plan.skipped.length} skipped, ${plan.mixedSpellings} client(s) stored under more than one spelling.`)
  for (const u of plan.updates) console.log(`  ${u.id}  ${maskEmail(u.from)}`)
  for (const s of plan.skipped) console.log(`  skip ${s.id}: ${s.reason}`)

  if (!apply) {
    console.log(plan.updates.length ? 'Nothing written. Re-run with --apply to update.' : 'Nothing to do.')
    return
  }

  let written = 0
  let conflicts = 0
  for (let i = 0; i < plan.updates.length; i += BATCH_SIZE) {
    const chunk = plan.updates.slice(i, i + BATCH_SIZE)
    // Per-document writes with a precondition: if one booking changed since it was read, only
    // that one fails; a batch would fail the whole chunk.
    const results = await Promise.allSettled(
      chunk.map((u) => byId.get(u.id).ref.update({ email: u.to }, { lastUpdateTime: byId.get(u.id).updateTime })),
    )
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') written++
      else {
        conflicts++
        console.log(`  not updated ${chunk[j].id}: ${r.reason && r.reason.message ? r.reason.message.split('\n')[0] : r.reason}`)
      }
    })
  }
  console.log(`Updated ${written} booking(s). ${conflicts ? `${conflicts} not updated (changed during the run, re-run to retry).` : ''}`)
  if (conflicts) process.exitCode = 1
}

module.exports = { normalizeEmail, maskEmail, planBackfill, parseArgs }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
