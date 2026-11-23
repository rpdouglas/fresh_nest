import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { RESEND_API_KEY, OWNER_EMAIL, logError, replyToEmail } from '../lib/shared'
import { BUSINESS_TZ, todayInZone } from '../shared/time'
import { normalizePolicySettings } from '../shared/policy'
import {
  computeLeadSlaStatus,
  inferPipelineStageFromBooking,
  isOpenPipelineStage,
  isRecurringRenewalBooking,
  type PipelineStage,
} from '../shared/pipeline'
import { resolveLeadRecipient } from '../lib/leadRouting'
import { sendLeadDigestEmail, type EmailConfig } from '../sendEmail'
import type { LeadDigestItem } from '../leadEmailTemplates'

/**
 * Pure/testable runner for the 08:00 America/Toronto daily follow-up digest (P3-E40).
 */
export async function runDailyLeadDigest(
  db: Firestore,
  emailConfig: EmailConfig,
  now: Date = new Date(),
): Promise<{ ownersNotified: number; leadsIncluded: number }> {
  const today = todayInZone(now, BUSINESS_TZ)
  const [bookingsSnap, policySnap] = await Promise.all([
    db.collection('bookings').where('status', '==', 'pending').get(),
    db.collection('settings').doc('policy').get().catch(() => null),
  ])
  const policy = normalizePolicySettings(
    policySnap && policySnap.exists ? (policySnap.data() as Record<string, unknown>) : undefined,
  )

  const grouped = new Map<string, LeadDigestItem[]>()

  for (const docSnap of bookingsSnap.docs) {
    const data = docSnap.data() as Record<string, unknown>
    if (isRecurringRenewalBooking(data as { createdBy?: string })) continue

    const pipeline = (data.pipeline ?? {}) as Record<string, unknown>
    const stage = inferPipelineStageFromBooking({
      status: typeof data.status === 'string' ? data.status : undefined,
      pipeline: { stage: pipeline.stage as PipelineStage | undefined },
    })
    if (!isOpenPipelineStage(stage)) continue

    const sla = computeLeadSlaStatus({
      stage,
      createdAt: data.createdAt,
      firstContactAt: pipeline.firstContactAt ?? null,
      needsSiteVisit: Boolean(pipeline.needsSiteVisit),
      nextFollowUpDate: typeof pipeline.nextFollowUpDate === 'string' ? pipeline.nextFollowUpDate : null,
      now,
      firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
      siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
    })

    if (!sla.isOverdue && !sla.isDueToday) continue

    const ownerEmail =
      (typeof pipeline.ownerEmail === 'string' && pipeline.ownerEmail.trim().toLowerCase()) ||
      policy.defaultLeadOwnerEmail ||
      emailConfig.ownerEmail.split(/[,;]/)[0]?.trim().toLowerCase() ||
      ''
    if (!ownerEmail) continue

    const clientName = `${String(data.firstName ?? '')} ${String(data.lastName ?? '')}`.trim() || 'Client'
    const item: LeadDigestItem = {
      bookingId: docSnap.id,
      clientName,
      serviceType: typeof data.serviceType === 'string' ? data.serviceType : 'standard',
      stage,
      statusLabel: sla.isOverdue ? 'OVERDUE' : 'DUE_TODAY',
      nextFollowUpDate: typeof pipeline.nextFollowUpDate === 'string' ? pipeline.nextFollowUpDate : null,
      needsSiteVisit: Boolean(pipeline.needsSiteVisit),
    }
    const existing = grouped.get(ownerEmail) ?? []
    existing.push(item)
    grouped.set(ownerEmail, existing)
  }

  let ownersNotified = 0
  let leadsIncluded = 0

  for (const [ownerEmail, items] of grouped.entries()) {
    try {
      const recipient = await resolveLeadRecipient(db, ownerEmail)
      const lang: 'en' | 'fr' = recipient?.language ?? 'en'
      const localized = items.map((item) => ({
        ...item,
        statusLabel:
          item.statusLabel === 'OVERDUE'
            ? (lang === 'fr' ? 'En retard' : 'Overdue')
            : (lang === 'fr' ? 'Prévu aujourd’hui' : 'Due today'),
      }))
      await sendLeadDigestEmail(ownerEmail, localized, today, lang, emailConfig)
      ownersNotified++
      leadsIncluded += items.length
    } catch (err) {
      logError(`[onDailyLeadDigest] Failed to send digest to ${ownerEmail}:`, err)
    }
  }

  return { ownersNotified, leadsIncluded }
}

/**
 * P3-E40: Daily 08:00 America/Toronto digest per lead owner of due/overdue open leads.
 * Targets production `(default)` explicitly to prevent dev bookings triggering real emails.
 */
export const onDailyLeadDigest = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: BUSINESS_TZ,
    secrets: [RESEND_API_KEY, OWNER_EMAIL],
  },
  async () => {
    const apiKey = process.env['RESEND_API_KEY'] || RESEND_API_KEY.value()
    if (!apiKey) {
      console.warn('[onDailyLeadDigest] RESEND_API_KEY missing — skipping.')
      return
    }
    const db = getFirestore('(default)')
    const result = await runDailyLeadDigest(db, {
      resendApiKey: apiKey,
      ownerEmail: OWNER_EMAIL.value(),
      fromEmail: process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
      replyTo: replyToEmail(),
    })
    console.log(
      `[onDailyLeadDigest] Sent ${result.ownersNotified} digest(s) covering ${result.leadsIncluded} lead(s).`,
    )
  },
)
