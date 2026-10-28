#!/usr/bin/env node
/**
 * P3-E38 PR 2 migration — money fields saved in dollars get their integer-cents twin (ADR-020).
 *
 *   bookings.estimatedPrice                         → estimatedPriceCents
 *   payRates.amount                                 → amountCents
 *   jobs.payRateSnapshot.amount                     → payRateSnapshot.amountCents
 *   staff.financials.monthlyEarningsLimit           → financials.monthlyEarningsLimitCents
 *   staff.financials.currentMonthEarnings           → financials.currentMonthEarningsCents
 *   staff.financials.earningsHistory[].total        → earningsHistory[].totalCents
 *   settings/policy defaultOdspMonthlyLimit, earningsCautionThreshold, lateCancellationFeeDollars,
 *   lockoutFeeDollars                               → …Cents (settings/policy/history is left as recorded)
 *
 * Adds the cents fields only; the dollar fields stay for one release so an older open app still
 * reads something, and a follow-up PR removes them. A record that already has the cents field is
 * left alone (cents win). Rounding: half up, once — the same as toCents() in
 * packages/shared/src/domain/money.ts.
 *
 * Dry run by default — prints counts and writes nothing. Each write is conditional on the document
 * not having changed since it was read, so a record edited mid-run is skipped, not overwritten.
 * Writes to audited records carry lastChange { by: 'system:migrate-money-to-cents' }, so the audit
 * log (P3-E37) records them; settings/policy gets no stamp and no new version (same amounts).
 * Safe to re-run.
 *
 * Usage (from functions/, with Application Default Credentials for freshnest-aa51e):
 *   node scripts/migrate-money-to-cents.cjs --database=freshnest-dev            # dry run, dev
 *   node scripts/migrate-money-to-cents.cjs --database=freshnest-dev --apply    # write, dev
 *   node scripts/migrate-money-to-cents.cjs --database='(default)'              # dry run, PRODUCTION
 *   node scripts/migrate-money-to-cents.cjs --database='(default)' --apply      # write, PRODUCTION
 *
 * Running against production with --apply is a live data change: get human approval first.
 */
'use strict'

const PROJECT_ID = 'freshnest-aa51e'
const DATABASES = ['(default)', 'freshnest-dev']
const ACTOR = 'system:migrate-money-to-cents'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Dollars → integer cents, half up, once (mirror of toCents in domain/money.ts). */
function toCents(dollars) {
  const x = Math.round(dollars * 100 * 1e6) / 1e6
  const a = Math.round(Math.abs(x) * 1e6) / 1e6
  return Math.sign(x) * Math.floor(a + 0.5) || 0
}

/** The cents field to add, or null when there is nothing to convert or cents already exist. */
function centsFor(dollars, existingCents) {
  if (isNum(existingCents) || !isNum(dollars)) return null
  return toCents(dollars)
}

const POLICY_KEYS = {
  defaultOdspMonthlyLimit: 'defaultOdspMonthlyLimitCents',
  earningsCautionThreshold: 'earningsCautionThresholdCents',
  lateCancellationFeeDollars: 'lateCancellationFeeCents',
  lockoutFeeDollars: 'lockoutFeeCents',
}

/**
 * The fields to add to one document, as Firestore update paths, or null when nothing changes.
 * @param {'bookings'|'payRates'|'jobs'|'staff'|'policy'} kind
 * @param {Record<string, any>} data
 */
function planDocument(kind, data) {
  const update = {}
  if (kind === 'bookings') {
    const c = centsFor(data.estimatedPrice, data.estimatedPriceCents)
    if (c !== null) update.estimatedPriceCents = c
  } else if (kind === 'payRates') {
    const c = centsFor(data.amount, data.amountCents)
    if (c !== null) update.amountCents = c
  } else if (kind === 'jobs') {
    const snap = data.payRateSnapshot || {}
    const c = centsFor(snap.amount, snap.amountCents)
    if (c !== null) update['payRateSnapshot.amountCents'] = c
  } else if (kind === 'staff') {
    const f = data.financials || {}
    if (!('monthlyEarningsLimitCents' in f) && 'monthlyEarningsLimit' in f) {
      // null means "no cap" and stays null
      update['financials.monthlyEarningsLimitCents'] = isNum(f.monthlyEarningsLimit) ? toCents(f.monthlyEarningsLimit) : null
    }
    const current = centsFor(f.currentMonthEarnings, f.currentMonthEarningsCents)
    if (current !== null) update['financials.currentMonthEarningsCents'] = current
    const history = Array.isArray(f.earningsHistory) ? f.earningsHistory : []
    if (history.some((h) => h && !isNum(h.totalCents) && isNum(h.total))) {
      update['financials.earningsHistory'] = history.map((h) =>
        h && !isNum(h.totalCents) && isNum(h.total) ? { ...h, totalCents: toCents(h.total) } : h)
    }
  } else if (kind === 'policy') {
    for (const [dollarKey, centsKey] of Object.entries(POLICY_KEYS)) {
      const c = centsFor(data[dollarKey], data[centsKey])
      if (c !== null) update[centsKey] = c
    }
  }
  return Object.keys(update).length ? update : null
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
  const { getFirestore, FieldValue } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore(database)
  const target = `${PROJECT_ID} / ${database}${process.env.FIRESTORE_EMULATOR_HOST ? ` (emulator ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — money fields to cents in ${target}`)

  const sources = [
    ['bookings', (await db.collection('bookings').get()).docs],
    ['payRates', (await db.collection('payRates').get()).docs],
    ['jobs', (await db.collection('jobs').get()).docs],
    ['staff', (await db.collection('staff').get()).docs],
    ['policy', [await db.collection('settings').doc('policy').get()].filter((d) => d.exists)],
  ]

  let planned = 0
  let written = 0
  let conflicts = 0
  for (const [kind, docs] of sources) {
    const plans = docs.map((d) => ({ doc: d, update: planDocument(kind, d.data()) })).filter((p) => p.update)
    planned += plans.length
    console.log(`  ${kind}: ${docs.length} scanned, ${plans.length} to convert`)
    if (!apply) continue
    // Audited records carry the change stamp (P3-E37). settings/policy is versioned and audited by
    // updatePolicySettings instead; the amounts are unchanged, so no new policy version is made.
    const stamp = kind === 'policy'
      ? {}
      : { lastChange: { by: ACTOR, at: FieldValue.serverTimestamp(), source: 'system', reason: 'P3-E38: money in integer cents' } }
    const results = await Promise.allSettled(plans.map(({ doc, update }) =>
      doc.ref.update({ ...update, ...stamp }, { lastUpdateTime: doc.updateTime })))
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') written++
      else {
        conflicts++
        console.log(`  not updated ${kind}/${plans[i].doc.id}: ${r.reason && r.reason.message ? r.reason.message.split('\n')[0] : r.reason}`)
      }
    })
  }

  if (!apply) {
    console.log(planned ? `${planned} document(s) to convert. Nothing written. Re-run with --apply.` : 'Nothing to do.')
    return
  }
  console.log(`Converted ${written} document(s). ${conflicts ? `${conflicts} not updated (changed during the run, re-run to retry).` : ''}`)
  if (conflicts) process.exitCode = 1
}

module.exports = { toCents, planDocument, parseArgs }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
