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
 *   node scripts/migrate-money-to-cents.cjs --database=freshnest-dev                          # dry run, dev
 *   node scripts/migrate-money-to-cents.cjs --database=freshnest-dev --apply                  # write, dev
 *   node scripts/migrate-money-to-cents.cjs --database='(default)'                            # dry run, PRODUCTION
 *   node scripts/migrate-money-to-cents.cjs --database='(default)' --apply                    # write, PRODUCTION
 *   node scripts/migrate-money-to-cents.cjs --database='(default)' --strip-legacy             # dry run strip, PRODUCTION
 *   node scripts/migrate-money-to-cents.cjs --database='(default)' --strip-legacy --apply     # strip dollar keys, PRODUCTION
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

/**
 * F23 clean-up: fields to delete from a document once its `…Cents` fields are present.
 * Never strips a dollar field unless its `…Cents` counterpart is already set on the document.
 * @param {'bookings'|'payRates'|'jobs'|'staff'|'policy'} kind
 * @param {Record<string, any>} data
 * @param {unknown} deleteSentinel — e.g. FieldValue.delete()
 */
function planStripDocument(kind, data, deleteSentinel) {
  const update = {}
  if (kind === 'bookings') {
    if ('estimatedPrice' in data && isNum(data.estimatedPriceCents)) {
      update.estimatedPrice = deleteSentinel
    }
  } else if (kind === 'payRates') {
    if ('amount' in data && isNum(data.amountCents)) {
      update.amount = deleteSentinel
    }
  } else if (kind === 'jobs') {
    const snap = data.payRateSnapshot || {}
    if ('amount' in snap && isNum(snap.amountCents)) {
      update['payRateSnapshot.amount'] = deleteSentinel
    }
  } else if (kind === 'staff') {
    const f = data.financials || {}
    const hasLimitCents = 'monthlyEarningsLimitCents' in f && (f.monthlyEarningsLimitCents === null || isNum(f.monthlyEarningsLimitCents))
    if ('monthlyEarningsLimit' in f && hasLimitCents) {
      update['financials.monthlyEarningsLimit'] = deleteSentinel
    }
    if ('currentMonthEarnings' in f && isNum(f.currentMonthEarningsCents)) {
      update['financials.currentMonthEarnings'] = deleteSentinel
    }
    const history = Array.isArray(f.earningsHistory) ? f.earningsHistory : []
    if (history.some((h) => h && 'total' in h && isNum(h.totalCents))) {
      update['financials.earningsHistory'] = history.map((h) => {
        if (!h || !('total' in h) || !isNum(h.totalCents)) return h
        const { total: _removed, ...rest } = h
        return rest
      })
    }
  } else if (kind === 'policy') {
    for (const [dollarKey, centsKey] of Object.entries(POLICY_KEYS)) {
      if (dollarKey in data && isNum(data[centsKey])) {
        update[dollarKey] = deleteSentinel
      }
    }
  }
  return Object.keys(update).length ? update : null
}

function parseArgs(argv) {
  const args = { apply: false, stripLegacy: false, database: null }
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true
    else if (arg === '--strip-legacy') args.stripLegacy = true
    else if (arg.startsWith('--database=')) args.database = arg.slice('--database='.length)
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!DATABASES.includes(args.database)) {
    throw new Error(`--database is required: one of ${DATABASES.map((d) => `'${d}'`).join(', ')}`)
  }
  return args
}

async function main() {
  const { apply, stripLegacy, database } = parseArgs(process.argv.slice(2))
  const { initializeApp } = require('firebase-admin/app')
  const { getFirestore, FieldValue } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore(database)
  const target = `${PROJECT_ID} / ${database}${process.env.FIRESTORE_EMULATOR_HOST ? ` (emulator ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`
  const actionLabel = stripLegacy ? 'strip legacy dollar fields' : 'money fields to cents'
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${actionLabel} in ${target}`)

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
  const verb = stripLegacy ? 'to strip' : 'to convert'
  for (const [kind, docs] of sources) {
    const plans = docs
      .map((d) => ({
        doc: d,
        update: stripLegacy
          ? planStripDocument(kind, d.data(), FieldValue.delete())
          : planDocument(kind, d.data()),
      }))
      .filter((p) => p.update)
    planned += plans.length
    console.log(`  ${kind}: ${docs.length} scanned, ${plans.length} ${verb}`)
    if (!apply) continue
    // Audited records carry the change stamp (P3-E37). settings/policy is versioned and audited by
    // updatePolicySettings instead; the amounts are unchanged, so no new policy version is made.
    const reason = stripLegacy ? 'P3-E38 F23: remove legacy dollar fields' : 'P3-E38: money in integer cents'
    const stamp = kind === 'policy'
      ? {}
      : { lastChange: { by: ACTOR, at: FieldValue.serverTimestamp(), source: 'system', reason } }
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
    console.log(planned ? `${planned} document(s) ${verb}. Nothing written. Re-run with --apply.` : 'Nothing to do.')
    return
  }
  console.log(`${stripLegacy ? 'Stripped' : 'Converted'} ${written} document(s). ${conflicts ? `${conflicts} not updated (changed during the run, re-run to retry).` : ''}`)
  if (conflicts) process.exitCode = 1
}

module.exports = { toCents, planDocument, planStripDocument, parseArgs }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
