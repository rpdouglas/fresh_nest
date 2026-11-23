#!/usr/bin/env node
/**
 * P3-E40: Idempotent back-fill script to add `pipeline` metadata onto legacy `bookings` documents.
 *
 * Rules:
 *   - Skips recurring renewals (`createdBy === 'system:recurring-renewal'`)
 *   - Skips bookings that already have a `pipeline.stage`
 *   - Maps `pending` -> `stage: 'new'` (ownerEmail = defaultLeadOwnerEmail from settings/policy or --default-owner)
 *   - Maps `confirmed` / `completed` -> `stage: 'won'` (closedAt = createdAt)
 *   - Maps `cancelled` -> `stage: 'lost'` (lostReason: 'other', lostNote: 'legacy', closedAt = createdAt)
 *
 * Usage:
 *   node functions/scripts/backfill-booking-pipeline.cjs                  # dry-run on (default)
 *   node functions/scripts/backfill-booking-pipeline.cjs --db=freshnest-dev
 *   node functions/scripts/backfill-booking-pipeline.cjs --db=freshnest-dev --apply
 *   node functions/scripts/backfill-booking-pipeline.cjs --apply --default-owner=lauren@freshnestco.ca
 */

const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

function planPipelineBackfill(booking, defaultOwnerEmail, defaultOwnerRole = 'owner') {
  if (!booking || typeof booking !== 'object') return null
  if (booking.createdBy === 'system:recurring-renewal') return null
  if (booking.pipeline && typeof booking.pipeline.stage === 'string') return null

  const needsSiteVisit =
    booking.serviceType === 'commercial' || booking.serviceType === 'postconstruction'
  const createdAt = booking.createdAt ?? new Date()
  const ownerEmail = defaultOwnerEmail ? String(defaultOwnerEmail).trim().toLowerCase() : null
  const ownerRole = ownerEmail ? defaultOwnerRole : null

  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return {
      stage: 'won',
      ownerEmail,
      ownerRole,
      ownerAssignedAt: ownerEmail ? createdAt : null,
      ownerAssignedBy: 'system:backfill-booking-pipeline',
      needsSiteVisit,
      nextFollowUpDate: null,
      firstContactAt: createdAt,
      quotedPriceCents: typeof booking.estimatedPriceCents === 'number' ? booking.estimatedPriceCents : null,
      quoteSentAt: null,
      closedAt: createdAt,
      lostReason: null,
      lostNote: null,
    }
  }

  if (booking.status === 'cancelled') {
    return {
      stage: 'lost',
      ownerEmail,
      ownerRole,
      ownerAssignedAt: ownerEmail ? createdAt : null,
      ownerAssignedBy: 'system:backfill-booking-pipeline',
      needsSiteVisit,
      nextFollowUpDate: null,
      firstContactAt: null,
      quotedPriceCents: null,
      quoteSentAt: null,
      closedAt: createdAt,
      lostReason: 'other',
      lostNote: 'legacy',
    }
  }

  return {
    stage: 'new',
    ownerEmail,
    ownerRole,
    ownerAssignedAt: ownerEmail ? createdAt : null,
    ownerAssignedBy: 'system:backfill-booking-pipeline',
    needsSiteVisit,
    nextFollowUpDate: null,
    firstContactAt: null,
    quotedPriceCents: null,
    quoteSentAt: null,
    closedAt: null,
    lostReason: null,
    lostNote: null,
  }
}

async function runBackfill({ db, apply = false, defaultOwnerEmail = '' }) {
  let ownerEmail = defaultOwnerEmail.trim().toLowerCase()
  if (!ownerEmail) {
    const policySnap = await db.collection('settings').doc('policy').get()
    if (policySnap.exists && typeof policySnap.data().defaultLeadOwnerEmail === 'string') {
      ownerEmail = policySnap.data().defaultLeadOwnerEmail.trim().toLowerCase()
    }
  }

  const snap = await db.collection('bookings').get()
  const summary = { total: snap.size, planned: 0, skipped: 0, byStage: { new: 0, won: 0, lost: 0 } }
  const ops = []

  for (const docSnap of snap.docs) {
    const planned = planPipelineBackfill(docSnap.data(), ownerEmail)
    if (!planned) {
      summary.skipped++
      continue
    }
    summary.planned++
    summary.byStage[planned.stage]++
    ops.push({ ref: docSnap.ref, pipeline: planned })
  }

  if (apply && ops.length > 0) {
    const CHUNK = 400
    for (let i = 0; i < ops.length; i += CHUNK) {
      const batch = db.batch()
      for (const op of ops.slice(i, i + CHUNK)) {
        batch.update(op.ref, {
          pipeline: op.pipeline,
          lastChange: {
            by: 'system:backfill-booking-pipeline',
            at: FieldValue.serverTimestamp(),
            source: 'system',
            reason: 'P3-E40 pipeline backfill',
            overrideType: null,
          },
        })
      }
      await batch.commit()
    }
  }

  return summary
}

module.exports = { planPipelineBackfill, runBackfill }

if (require.main === module) {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dbArg = args.find((a) => a.startsWith('--db='))
  const ownerArg = args.find((a) => a.startsWith('--default-owner='))
  const databaseId = dbArg ? dbArg.slice('--db='.length) : '(default)'
  const defaultOwnerEmail = ownerArg ? ownerArg.slice('--default-owner='.length) : ''

  if (!getApps().length) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'freshnest-aa51e' })
  }
  const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId)

  runBackfill({ db, apply, defaultOwnerEmail })
    .then((summary) => {
      console.log(
        `[${apply ? 'APPLY' : 'DRY-RUN'}] DB=${databaseId} total=${summary.total} planned=${summary.planned} skipped=${summary.skipped} breakdown=${JSON.stringify(summary.byStage)}`,
      )
      process.exit(0)
    })
    .catch((err) => {
      console.error('Backfill failed:', err)
      process.exit(1)
    })
}
