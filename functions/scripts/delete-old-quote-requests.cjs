#!/usr/bin/env node
/**
 * Permanently delete quote requests (bookings) created before a date, and the visits (jobs)
 * linked to them. Owner request 2026-11-14: remove every quote request from before 2026-11-11.
 *
 * - "Before" means before midnight Ontario time (America/Toronto) on the given date.
 * - Each booking's jobs are found by `booking.jobId` and by `jobs.bookingId`.
 * - Every record is stamped `lastChange.by = 'system:delete-old-quote-requests'` just before it is
 *   deleted, so the audit triggers (P3-E37) credit the script and keep a snapshot of what went.
 * - Bookings without a `createdAt` are not matched (they can't be dated) and are counted separately.
 * - Emails are masked in the output (COMPLIANCE.md: no PII in logs).
 *
 * Dry run by default: lists what would be deleted and writes nothing.
 *
 * Usage (from functions/, with Application Default Credentials for freshnest-aa51e):
 *   node scripts/delete-old-quote-requests.cjs --database=freshnest-dev --before=2026-11-11            # dry run, dev
 *   node scripts/delete-old-quote-requests.cjs --database='(default)' --before=2026-11-11              # dry run, PRODUCTION
 *   node scripts/delete-old-quote-requests.cjs --database='(default)' --before=2026-11-11 --apply      # delete, PRODUCTION
 * In CI: Actions → "Delete old quote requests" (manual workflow, from main only).
 *
 * Running against production with --apply permanently deletes data: get human approval first.
 */
'use strict'

const PROJECT_ID = 'freshnest-aa51e'
const DATABASES = ['(default)', 'freshnest-dev']
const ACTOR = 'system:delete-old-quote-requests'
const TIME_ZONE = 'America/Toronto'

function maskEmail(email) {
  const [local, domain] = String(email || '').trim().split('@')
  return `${(local || '').slice(0, 1).toLowerCase()}***@${(domain || '?').toLowerCase()}`
}

/** UTC milliseconds of midnight on `yyyy-mm-dd` in Ontario (handles EST/EDT). */
function cutoffMs(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''))
  if (!m) throw new Error(`--before must be a date like 2026-11-11 (got "${dateStr}").`)
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const utcGuess = Date.UTC(y, mo - 1, d)
  // Offset of Ontario from UTC at that moment, e.g. -300 minutes in November.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(utcGuess))
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  const asLocalUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  const offsetMs = asLocalUtc - utcGuess
  return utcGuess - offsetMs
}

function toMs(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  return null
}

/**
 * Which bookings (and their jobs) to delete. Pure, so it is unit-tested.
 * @param {{ id: string, data: Record<string, any> }[]} bookings
 * @param {{ id: string, data: Record<string, any> }[]} jobs
 * @param {number} cutoff  UTC ms; bookings created strictly before it are deleted
 */
function planDeletion(bookings, jobs, cutoff) {
  const plan = []
  let undated = 0
  for (const b of bookings) {
    const created = toMs(b.data.createdAt)
    if (created === null) { undated++; continue }
    if (created >= cutoff) continue
    const jobIds = new Set(jobs.filter((j) => j.data.bookingId === b.id).map((j) => j.id))
    if (typeof b.data.jobId === 'string' && b.data.jobId) jobIds.add(b.data.jobId)
    plan.push({ id: b.id, created, status: b.data.status ?? null, email: maskEmail(b.data.email), jobIds: [...jobIds].sort() })
  }
  plan.sort((a, c) => a.created - c.created)
  return { plan, undated }
}

function parseArgs(argv) {
  const apply = argv.includes('--apply')
  const dbArg = argv.find((a) => a.startsWith('--database='))
  const beforeArg = argv.find((a) => a.startsWith('--before='))
  if (!dbArg) throw new Error(`--database is required (${DATABASES.join(' or ')}).`)
  const database = dbArg.slice('--database='.length)
  if (!DATABASES.includes(database)) throw new Error(`Unknown database "${database}". Use ${DATABASES.join(' or ')}.`)
  if (!beforeArg) throw new Error('--before=YYYY-MM-DD is required.')
  const before = beforeArg.slice('--before='.length)
  return { apply, database, before, cutoff: cutoffMs(before) }
}

async function main() {
  const { apply, database, before, cutoff } = parseArgs(process.argv.slice(2))
  const { initializeApp } = require('firebase-admin/app')
  const { getFirestore, FieldValue } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore(database)

  console.log(`${apply ? 'DELETING' : 'Dry run'} — quote requests created before ${before} 00:00 (${TIME_ZONE}) in ${database}.`)
  const [bookingSnap, jobSnap] = await Promise.all([db.collection('bookings').get(), db.collection('jobs').get()])
  const toDoc = (d) => ({ id: d.id, data: d.data() })
  const { plan, undated } = planDeletion(bookingSnap.docs.map(toDoc), jobSnap.docs.map(toDoc), cutoff)

  for (const p of plan) {
    console.log(`  ${new Date(p.created).toISOString().slice(0, 10)}  ${p.id}  ${p.status ?? '-'}  ${p.email}${p.jobIds.length ? `  jobs: ${p.jobIds.join(', ')}` : ''}`)
  }
  const jobCount = plan.reduce((n, p) => n + p.jobIds.length, 0)
  const byStatus = plan.reduce((acc, p) => ({ ...acc, [p.status ?? 'none']: (acc[p.status ?? 'none'] || 0) + 1 }), {})
  console.log(`${plan.length} booking(s) and ${jobCount} linked job(s) match. By status: ${JSON.stringify(byStatus)}.`)
  console.log(`${bookingSnap.size - plan.length - undated} newer booking(s) kept.${undated ? ` ${undated} booking(s) without createdAt skipped.` : ''}`)

  if (!apply) {
    console.log(plan.length ? 'Nothing deleted. Re-run with --apply to delete.' : 'Nothing to delete.')
    return
  }

  const stamp = { lastChange: { by: ACTOR, at: FieldValue.serverTimestamp(), source: 'system', reason: `Owner request: remove quote requests before ${before}`, overrideType: null } }
  const refs = []
  for (const p of plan) {
    for (const jobId of p.jobIds) refs.push(db.collection('jobs').doc(jobId))
    refs.push(db.collection('bookings').doc(p.id))
  }
  let deleted = 0
  // Stamp then delete, in chunks (a batch holds up to 500 writes).
  for (let i = 0; i < refs.length; i += 200) {
    const chunk = refs.slice(i, i + 200)
    const existing = (await db.getAll(...chunk)).filter((s) => s.exists).map((s) => s.ref)
    const stampBatch = db.batch()
    existing.forEach((ref) => stampBatch.update(ref, stamp))
    await stampBatch.commit()
    const deleteBatch = db.batch()
    existing.forEach((ref) => deleteBatch.delete(ref))
    await deleteBatch.commit()
    deleted += existing.length
  }
  console.log(`Deleted ${deleted} document(s) (bookings and linked jobs). The audit log keeps a snapshot of each.`)
}

module.exports = { cutoffMs, planDeletion, parseArgs, maskEmail }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
