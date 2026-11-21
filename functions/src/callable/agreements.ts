import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { z } from 'zod'
import {
  RESEND_API_KEY,
  OWNER_EMAIL,
  logError,
  replyToEmail,
} from '../lib/shared'
import { requireOffice, resolveOfficeRole } from '../lib/roles'
import {
  generateAgreementToken,
  hashAgreementDocument,
  hashAgreementToken,
  isValidTokenFormat,
} from '../lib/agreementToken'
import { buildSignedAgreementPdf } from '../lib/agreementPdf'
import {
  sendAgreementInviteEmail,
  sendAgreementSignedClientEmail,
  sendAgreementSignedOfficeEmail,
  type EmailConfig,
} from '../sendEmail'
import {
  AGREEMENT_ENTRY_METHODS,
  AGREEMENT_FREQUENCIES,
  AGREEMENT_LANGUAGES,
  AGREEMENT_LINK_VALIDITY_DAYS,
  AGREEMENT_RATE_TYPES,
  AGREEMENT_SERVICE_TYPES,
  AGREEMENT_TYPES,
  DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS,
  MAX_SIGN_FAILED_ATTEMPTS,
  agreementPdfStoragePath,
  buildAgreementTermsFromPolicy,
  buildCanonicalAgreementText,
  interpolateAgreementBody,
  isValidDatabaseId,
  normalizeDatabaseId,
  type AgreementAccessRecord,
  type AgreementAnswers,
  type AgreementLanguage,
  type AgreementParty,
  type AgreementTerms,
  type AgreementType,
  type AllowedDatabaseId,
  type PublicAgreementView,
} from '../shared/agreements'
import { normalizePolicySettings } from '../shared/policy'

/** Uniform refusal message for unknown, expired, locked, used, or malformed links (ADR-021 §3). */
export const INVALID_LINK_MESSAGE = 'This agreement link is invalid or has expired.'

const ENFORCE_APP_CHECK = process.env['FUNCTIONS_EMULATOR'] !== 'true'

const ALLOWED_SITE_ORIGINS = [
  'https://www.freshnestco.ca',
  'https://freshnestco.ca',
  'https://lilypad-freshnest.web.app',
  'https://freshnest-aa51e.web.app',
]

export function resolveSigningOrigin(rawOrigin: unknown, databaseId: AllowedDatabaseId): string {
  const defaultUrl = (process.env['CLIENT_APP_URL'] || 'https://www.freshnestco.ca').replace(/\/$/, '')
  if (typeof rawOrigin !== 'string' || !rawOrigin.trim()) return defaultUrl
  const cleaned = rawOrigin.trim().replace(/\/$/, '')
  if (ALLOWED_SITE_ORIGINS.includes(cleaned)) return cleaned
  // Preview/dev origins are accepted only when targeting the dev database or emulator
  if (
    (databaseId === 'freshnest-dev' || process.env['FUNCTIONS_EMULATOR'] === 'true') &&
    (/^https:\/\/freshnest-aa51e--[a-z0-9-]+\.web\.app$/i.test(cleaned) ||
      /^https:\/\/lilypad-freshnest--[a-z0-9-]+\.web\.app$/i.test(cleaned) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleaned))
  ) {
    return cleaned
  }
  return defaultUrl
}

function getDbForRequest(rawDbId: unknown): { db: Firestore; databaseId: AllowedDatabaseId } {
  if (!isValidDatabaseId(rawDbId)) {
    throw new HttpsError('invalid-argument', 'Invalid databaseId.')
  }
  const databaseId = normalizeDatabaseId(rawDbId)
  const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId)
  return { db, databaseId }
}

function resolveEmailConfig(): EmailConfig | null {
  const apiKey = process.env['RESEND_API_KEY'] || RESEND_API_KEY.value()
  if (!apiKey || apiKey === 'test' || apiKey.startsWith('re_test_disabled')) {
    return null
  }
  return {
    resendApiKey: apiKey,
    fromEmail: process.env['FROM_EMAIL'] || 'Fresh Nest Co. <noreply@freshnestco.ca>',
    ownerEmail: process.env['OWNER_EMAIL'] || OWNER_EMAIL.value() || '',
    replyTo: replyToEmail(),
  }
}

export function extractClientIp(request: CallableRequest): string {
  const forwarded = request.rawRequest?.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 128)
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0].trim().slice(0, 128)
  }
  const rawIp = request.rawRequest?.ip
  return typeof rawIp === 'string' ? rawIp.slice(0, 128) : ''
}

export function extractUserAgent(request: CallableRequest): string {
  const ua = request.rawRequest?.headers?.['user-agent']
  if (typeof ua === 'string') return ua.slice(0, 500)
  if (Array.isArray(ua) && ua[0]) return String(ua[0]).slice(0, 500)
  return ''
}

function toDateMs(value: unknown): number | null {
  if (value == null) return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object') {
    const v = value as { toMillis?: () => number; seconds?: number; _seconds?: number }
    if (typeof v.toMillis === 'function') return v.toMillis()
    const secs = v.seconds ?? v._seconds
    if (typeof secs === 'number') return secs * 1000
  }
  return null
}

function formatExpiryDate(expiresAt: Date, lang: AgreementLanguage): string {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Toronto',
  }).format(expiresAt)
}

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const createAgreementSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  origin: z.string().max(200).optional(),
  type: z.enum(AGREEMENT_TYPES),
  language: z.enum(AGREEMENT_LANGUAGES),
  party: z.object({
    kind: z.enum(['booking', 'client']).default('booking'),
    bookingId: z.string().max(128).nullable().optional(),
    clientId: z.string().max(128).nullable().optional(),
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(40),
    address: z.string().trim().min(4).max(300),
  }),
  terms: z.object({
    serviceType: z.enum(AGREEMENT_SERVICE_TYPES),
    frequency: z.enum(AGREEMENT_FREQUENCIES),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    rateType: z.enum(AGREEMENT_RATE_TYPES),
    rateCents: z.number().int().min(0).max(50_000_000),
    taxExempt: z.boolean().default(false),
    cancelWindowHours: z.number().int().min(0).max(168).optional(),
    lateCancellationFeeCents: z.number().int().min(0).max(1_000_000).optional(),
    lockoutFeeCents: z.number().int().min(0).max(1_000_000).optional(),
    latePaymentBasisPoints: z.number().int().min(0).max(5000).optional(),
    noticePeriodDays: z.number().int().min(0).max(365).optional(),
    scopeNotes: z.string().trim().max(1500).optional(),
  }),
  linkValidityDays: z
    .number()
    .int()
    .refine((v) => (AGREEMENT_LINK_VALIDITY_DAYS as readonly number[]).includes(v), {
      message: 'linkValidityDays must be 7, 14, 30, or 60',
    })
    .default(DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS),
  sendEmail: z.boolean().default(false),
})

const reissueAgreementSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  origin: z.string().max(200).optional(),
  agreementId: z.string().trim().min(1).max(128),
  linkValidityDays: z
    .number()
    .int()
    .refine((v) => (AGREEMENT_LINK_VALIDITY_DAYS as readonly number[]).includes(v), {
      message: 'linkValidityDays must be 7, 14, 30, or 60',
    })
    .default(DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS),
  sendEmail: z.boolean().default(false),
})

const expireAgreementSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  agreementId: z.string().trim().min(1).max(128),
  reason: z.string().trim().max(300).optional(),
})

const redactAgreementSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  agreementId: z.string().trim().min(1).max(128),
  reason: z.string().trim().min(3, 'A reason is required for privacy redaction.').max(300),
})

export const signAgreementInputSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  token: z.string().min(43).max(128),
  language: z.enum(AGREEMENT_LANGUAGES).optional(),
  answers: z.object({
    phone: z.string().trim().min(7).max(40),
    email: z.string().trim().email().max(200),
    entryMethod: z.enum(AGREEMENT_ENTRY_METHODS),
    pets: z.string().trim().max(400).default(''),
    hasAlarm: z.boolean().default(false),
    specialInstructions: z.string().trim().max(1500).default(''),
    valuables: z.string().trim().max(1000).default(''),
  }),
  access: z
    .object({
      doorCode: z.string().trim().max(120).default(''),
      alarmCode: z.string().trim().max(120).default(''),
      keyLocation: z.string().trim().max(300).default(''),
      accessNotes: z.string().trim().max(600).default(''),
    })
    .default({ doorCode: '', alarmCode: '', keyLocation: '', accessNotes: '' }),
  consentESign: z.literal(true),
  consentTerms: z.literal(true),
  signedName: z.string().trim().min(2).max(160),
  /** Honeypot field — must be empty for real users. */
  website: z.string().max(200).optional().default(''),
})

// ── Helper: load active published template version ───────────────────────────

async function loadPublishedTemplate(db: Firestore, type: AgreementType) {
  const templateId = `client-${type}`
  const templateRef = db.collection('agreementTemplates').doc(templateId)
  const templateSnap = await templateRef.get()
  if (!templateSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      `No agreement template found for '${type}'. Run seed-agreement-template.cjs first.`,
    )
  }
  const templateData = templateSnap.data() as {
    nameEn?: string
    nameFr?: string
    currentVersionId?: string
  }
  const versionId = templateData.currentVersionId
  if (!versionId) {
    throw new HttpsError('failed-precondition', `Template '${templateId}' has no published version.`)
  }
  const versionSnap = await templateRef.collection('versions').doc(versionId).get()
  if (!versionSnap.exists) {
    throw new HttpsError('failed-precondition', `Template version '${versionId}' is missing.`)
  }
  const versionData = versionSnap.data() as {
    version?: string
    status?: string
    bodyEn?: string
    bodyFr?: string
  }
  if (versionData.status !== 'published') {
    throw new HttpsError('failed-precondition', `Template version '${versionId}' is not published.`)
  }
  return {
    templateId,
    nameEn: templateData.nameEn || (type === 'commercial' ? 'Commercial Service Agreement' : 'Residential Service Agreement'),
    nameFr: templateData.nameFr || (type === 'commercial' ? 'Contrat de services commerciaux' : 'Contrat de services résidentiels'),
    versionId,
    versionLabel: versionData.version || versionId,
    bodyEn: versionData.bodyEn || '',
    bodyFr: versionData.bodyFr || '',
  }
}

// ── 1. createAgreement (Owner / Manager) ─────────────────────────────────────

export const createAgreement = onCall(
  { secrets: [RESEND_API_KEY, OWNER_EMAIL] },
  async (request) => {
    const { db, databaseId } = getDbForRequest((request.data as Record<string, unknown> | undefined)?.databaseId)
    await requireOffice(request.auth, db, 'create agreements')

    const parsed = createAgreementSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid agreement payload.')
    }
    const input = parsed.data
    const actorEmail = request.auth?.token.email?.trim().toLowerCase() || request.auth?.uid || 'office'

    const [template, policySnap] = await Promise.all([
      loadPublishedTemplate(db, input.type),
      db.collection('settings').doc('policy').get(),
    ])
    const policy = normalizePolicySettings(
      policySnap.exists ? (policySnap.data() as Record<string, unknown>) : undefined,
    )

    const frozenTerms = buildAgreementTermsFromPolicy(
      {
        type: input.type,
        serviceType: input.terms.serviceType,
        frequency: input.terms.frequency,
        startDate: input.terms.startDate,
        rateType: input.terms.rateType,
        rateCents: input.terms.rateCents,
        taxExempt: input.terms.taxExempt,
        cancelWindowHours: input.terms.cancelWindowHours,
        lateCancellationFeeCents: input.terms.lateCancellationFeeCents,
        lockoutFeeCents: input.terms.lockoutFeeCents,
        latePaymentBasisPoints: input.terms.latePaymentBasisPoints,
        noticePeriodDays: input.terms.noticePeriodDays,
        scopeNotes: input.terms.scopeNotes,
      },
      policy,
    )

    const rawToken = generateAgreementToken()
    const tokenHash = hashAgreementToken(rawToken)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + input.linkValidityDays * 24 * 60 * 60 * 1000)

    const party: AgreementParty = {
      kind: input.party.kind,
      bookingId: input.party.bookingId ?? null,
      clientId: input.party.clientId ?? null,
      name: input.party.name,
      email: input.party.email.toLowerCase(),
      phone: input.party.phone,
      address: input.party.address,
    }

    const agreementRef = db.collection('agreements').doc()
    await agreementRef.set({
      family: 'client',
      type: input.type,
      language: input.language,
      party,
      terms: frozenTerms,
      templateId: template.templateId,
      versionId: template.versionId,
      status: 'sent',
      tokenHash,
      tokenExpiresAt: Timestamp.fromDate(expiresAt),
      linkValidityDays: input.linkValidityDays,
      sentAt: FieldValue.serverTimestamp(),
      viewedAt: null,
      signedAt: null,
      failedAttempts: 0,
      currentSignatureId: null,
      pdfPath: null,
      documentHash: null,
      redactedAt: null,
      redactedBy: null,
      createdBy: actorEmail,
      createdAt: FieldValue.serverTimestamp(),
      lastChange: {
        by: actorEmail,
        at: FieldValue.serverTimestamp(),
        source: 'admin',
        reason: 'Created client agreement',
        overrideType: null,
      },
    })

    const origin = resolveSigningOrigin(input.origin, databaseId)
    const signingUrl = `${origin}/agreement/${rawToken}`

    let emailSent = false
    if (input.sendEmail) {
      const emailConfig = resolveEmailConfig()
      if (emailConfig) {
        try {
          await sendAgreementInviteEmail(
            party.email,
            {
              clientName: party.name,
              type: input.type,
              language: input.language,
              signingUrl,
              expiresDateText: formatExpiryDate(expiresAt, input.language),
            },
            emailConfig,
          )
          emailSent = true
        } catch (err) {
          logError(`[createAgreement] Invite email failed for ${agreementRef.id}`, err)
        }
      } else {
        logger.info(`[createAgreement] Email skipped (no RESEND_API_KEY) for ${agreementRef.id}`)
      }
    }

    logger.info(`[createAgreement] Created agreement ${agreementRef.id} (${input.type}, ${input.language}) by ${actorEmail}`)

    return {
      agreementId: agreementRef.id,
      signingUrl,
      expiresAtIso: expiresAt.toISOString(),
      emailSent,
    }
  },
)

// ── 2. reissueAgreementLink (Owner / Manager) ────────────────────────────────

export const reissueAgreementLink = onCall(
  { secrets: [RESEND_API_KEY, OWNER_EMAIL] },
  async (request) => {
    const { db, databaseId } = getDbForRequest((request.data as Record<string, unknown> | undefined)?.databaseId)
    await requireOffice(request.auth, db, 'reissue agreement links')

    const parsed = reissueAgreementSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid reissue payload.')
    }
    const input = parsed.data
    const actorEmail = request.auth?.token.email?.trim().toLowerCase() || request.auth?.uid || 'office'

    const ref = db.collection('agreements').doc(input.agreementId)
    const rawToken = generateAgreementToken()
    const tokenHash = hashAgreementToken(rawToken)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + input.linkValidityDays * 24 * 60 * 60 * 1000)

    const updatedInfo = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Agreement not found.')
      }
      const data = snap.data() as Record<string, unknown>
      if (data.status === 'signed' || data.status === 'active' || data.status === 'cancelled') {
        throw new HttpsError('failed-precondition', `Cannot reissue link for a ${String(data.status)} agreement.`)
      }

      tx.update(ref, {
        status: 'sent',
        tokenHash,
        tokenExpiresAt: Timestamp.fromDate(expiresAt),
        linkValidityDays: input.linkValidityDays,
        sentAt: FieldValue.serverTimestamp(),
        failedAttempts: 0,
        lastChange: {
          by: actorEmail,
          at: FieldValue.serverTimestamp(),
          source: 'admin',
          reason: 'Reissued signing link',
          overrideType: null,
        },
      })

      return {
        type: (data.type as AgreementType) || 'residential',
        language: (data.language as AgreementLanguage) || 'en',
        party: data.party as AgreementParty,
      }
    })

    const origin = resolveSigningOrigin(input.origin, databaseId)
    const signingUrl = `${origin}/agreement/${rawToken}`

    let emailSent = false
    if (input.sendEmail && updatedInfo.party?.email) {
      const emailConfig = resolveEmailConfig()
      if (emailConfig) {
        try {
          await sendAgreementInviteEmail(
            updatedInfo.party.email,
            {
              clientName: updatedInfo.party.name,
              type: updatedInfo.type,
              language: updatedInfo.language,
              signingUrl,
              expiresDateText: formatExpiryDate(expiresAt, updatedInfo.language),
            },
            emailConfig,
          )
          emailSent = true
        } catch (err) {
          logError(`[reissueAgreementLink] Invite email failed for ${input.agreementId}`, err)
        }
      }
    }

    logger.info(`[reissueAgreementLink] Reissued link for ${input.agreementId} by ${actorEmail}`)
    return {
      agreementId: input.agreementId,
      signingUrl,
      expiresAtIso: expiresAt.toISOString(),
      emailSent,
    }
  },
)

// ── 3. expireAgreement (Owner / Manager) ─────────────────────────────────────

export const expireAgreement = onCall(async (request) => {
  const { db } = getDbForRequest((request.data as Record<string, unknown> | undefined)?.databaseId)
  await requireOffice(request.auth, db, 'expire agreements')

  const parsed = expireAgreementSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid expire payload.')
  }
  const input = parsed.data
  const actorEmail = request.auth?.token.email?.trim().toLowerCase() || request.auth?.uid || 'office'
  const ref = db.collection('agreements').doc(input.agreementId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Agreement not found.')
    }
    const data = snap.data() as Record<string, unknown>
    if (data.status === 'signed' || data.status === 'active') {
      throw new HttpsError('failed-precondition', 'Cannot expire an already signed agreement.')
    }
    tx.update(ref, {
      status: 'expired',
      tokenHash: null,
      lastChange: {
        by: actorEmail,
        at: FieldValue.serverTimestamp(),
        source: 'admin',
        reason: input.reason || 'Expired by office',
        overrideType: null,
      },
    })
  })

  logger.info(`[expireAgreement] Expired agreement ${input.agreementId} by ${actorEmail}`)
  return { success: true, agreementId: input.agreementId }
})

// ── 4. redactAgreementClientData (Owner ONLY — Q4 retention & privacy) ───────

export const redactAgreementClientData = onCall(async (request) => {
  const { db } = getDbForRequest((request.data as Record<string, unknown> | undefined)?.databaseId)
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.')
  }
  const role = await resolveOfficeRole(request.auth, db)
  if (role !== 'owner') {
    throw new HttpsError('permission-denied', 'Only an Owner can redact client access codes and answers.')
  }

  const parsed = redactAgreementSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid redaction payload.')
  }
  const input = parsed.data
  const actorEmail = request.auth.token.email?.trim().toLowerCase() || request.auth.uid

  const agreementRef = db.collection('agreements').doc(input.agreementId)
  const accessRef = agreementRef.collection('private').doc('access')

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(agreementRef)
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Agreement not found.')
    }
    const data = snap.data() as Record<string, unknown>
    const currentSignatureId = typeof data.currentSignatureId === 'string' ? data.currentSignatureId : null

    // Clear sensitive access record
    tx.set(
      accessRef,
      {
        entryMethod: 'other',
        doorCode: '',
        alarmCode: '',
        keyLocation: '',
        accessNotes: '',
        updatedAt: FieldValue.serverTimestamp(),
        redactedAt: FieldValue.serverTimestamp(),
        redactedBy: actorEmail,
      } satisfies AgreementAccessRecord,
      { merge: false },
    )

    // Redact non-contract client answers on the current signature while preserving legal evidence
    if (currentSignatureId) {
      const sigRef = agreementRef.collection('signatures').doc(currentSignatureId)
      const sigSnap = await tx.get(sigRef)
      if (sigSnap.exists) {
        tx.update(sigRef, {
          answers: {
            phone: '[redacted]',
            email: '[redacted]',
            entryMethod: 'other',
            pets: '',
            hasAlarm: false,
            specialInstructions: '',
            valuables: '',
          } satisfies AgreementAnswers,
          answersRedactedAt: FieldValue.serverTimestamp(),
          answersRedactedBy: actorEmail,
        })
      }
    }

    tx.update(agreementRef, {
      redactedAt: FieldValue.serverTimestamp(),
      redactedBy: actorEmail,
      lastChange: {
        by: actorEmail,
        at: FieldValue.serverTimestamp(),
        source: 'admin',
        reason: input.reason,
        overrideType: 'privacy_redaction',
      },
    })
  })

  logger.info(`[redactAgreementClientData] Redacted access & answers for ${input.agreementId} by ${actorEmail}`)
  return { success: true, agreementId: input.agreementId }
})

// ── 5. getAgreementForSigning (Public, App Check enforced in prod) ───────────

export const getAgreementForSigning = onCall(
  { enforceAppCheck: ENFORCE_APP_CHECK },
  async (request): Promise<PublicAgreementView> => {
    const payload = (request.data ?? {}) as Record<string, unknown>
    const { db } = getDbForRequest(payload.databaseId)
    const rawToken = payload.token

    if (!isValidTokenFormat(rawToken)) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    const tokenHash = hashAgreementToken(rawToken)
    const querySnap = await db.collection('agreements').where('tokenHash', '==', tokenHash).limit(1).get()
    if (querySnap.empty) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    const docSnap = querySnap.docs[0]
    const data = docSnap.data() as Record<string, unknown>

    // Uniform refusal for non-sent, expired, or locked links (ADR-021 §3)
    const expiresMs = toDateMs(data.tokenExpiresAt)
    const failedAttempts = typeof data.failedAttempts === 'number' ? data.failedAttempts : 0
    if (
      data.status !== 'sent' ||
      (expiresMs !== null && expiresMs <= Date.now()) ||
      failedAttempts >= MAX_SIGN_FAILED_ATTEMPTS
    ) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    const templateId = String(data.templateId || '')
    const versionId = String(data.versionId || '')
    const [templateSnap, versionSnap] = await Promise.all([
      db.collection('agreementTemplates').doc(templateId).get(),
      db.collection('agreementTemplates').doc(templateId).collection('versions').doc(versionId).get(),
    ])
    if (!versionSnap.exists) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    // Record first view timestamp without blocking read
    if (!data.viewedAt) {
      await docSnap.ref.update({
        viewedAt: FieldValue.serverTimestamp(),
        lastChange: {
          by: 'public',
          at: FieldValue.serverTimestamp(),
          source: 'public_form',
          reason: 'Client viewed agreement link',
          overrideType: null,
        },
      })
    }

    const language: AgreementLanguage = data.language === 'fr' ? 'fr' : 'en'
    const type: AgreementType = data.type === 'commercial' ? 'commercial' : 'residential'
    const party = data.party as AgreementParty
    const terms = data.terms as AgreementTerms
    const templateData = (templateSnap.data() ?? {}) as { nameEn?: string; nameFr?: string }
    const versionData = versionSnap.data() as { version?: string; bodyEn?: string; bodyFr?: string }

    const bodyEn = interpolateAgreementBody({
      body: versionData.bodyEn || '',
      language: 'en',
      party,
      terms,
    })
    const bodyFr = interpolateAgreementBody({
      body: versionData.bodyFr || '',
      language: 'fr',
      party,
      terms,
    })

    // Strictly minimal payload: NO tokenHash, NO failedAttempts, NO access codes, NO internal notes.
    return {
      agreementId: docSnap.id,
      type,
      language,
      status: 'sent',
      party: {
        name: party.name,
        email: party.email,
        phone: party.phone,
        address: party.address,
      },
      terms,
      templateName:
        language === 'fr'
          ? templateData.nameFr || 'Contrat de services'
          : templateData.nameEn || 'Service Agreement',
      versionId,
      versionLabel: versionData.version || versionId,
      bodyEn,
      bodyFr,
      signedAtIso: null,
      signedName: null,
    }
  },
)

// ── 6. signAgreement (Public, App Check enforced in prod) ────────────────────

export const signAgreement = onCall(
  {
    enforceAppCheck: ENFORCE_APP_CHECK,
    secrets: [RESEND_API_KEY, OWNER_EMAIL],
  },
  async (request) => {
    const rawPayload = (request.data ?? {}) as Record<string, unknown>
    const { db, databaseId } = getDbForRequest(rawPayload.databaseId)

    const rawToken = rawPayload.token
    if (!isValidTokenFormat(rawToken)) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    const tokenHash = hashAgreementToken(rawToken)

    // 1. Lookup active token first
    const activeSnap = await db.collection('agreements').where('tokenHash', '==', tokenHash).limit(1).get()

    if (activeSnap.empty) {
      // Idempotent double-submit / replay check: if this exact token already completed signing,
      // return the same confirmation without writing a second signature or leaking PII.
      const replayedSnap = await db
        .collection('agreements')
        .where('signedTokenHash', '==', tokenHash)
        .limit(1)
        .get()
      if (!replayedSnap.empty) {
        const existing = replayedSnap.docs[0].data() as Record<string, unknown>
        if (existing.status === 'signed') {
          const signedAtMs = toDateMs(existing.signedAt)
          return {
            ok: true,
            alreadySigned: true,
            agreementId: replayedSnap.docs[0].id,
            signedAtIso: signedAtMs ? new Date(signedAtMs).toISOString() : new Date().toISOString(),
          }
        }
      }
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }

    const agreementRef = activeSnap.docs[0].ref

    // 2. Honeypot check (bots fill hidden `website` field)
    if (typeof rawPayload.website === 'string' && rawPayload.website.trim().length > 0) {
      await agreementRef.update({ failedAttempts: FieldValue.increment(1) })
      throw new HttpsError('invalid-argument', 'Submission rejected.')
    }

    // 3. Zod validation — increment failedAttempts on bad submission
    const parsed = signAgreementInputSchema.safeParse(rawPayload)
    if (!parsed.success) {
      await agreementRef.update({ failedAttempts: FieldValue.increment(1) })
      throw new HttpsError(
        'invalid-argument',
        parsed.error.issues[0]?.message || 'Please complete all required fields.',
      )
    }

    const input = parsed.data
    const clientIp = extractClientIp(request)
    const userAgent = extractUserAgent(request)

    // Load template version outside transaction (published versions are immutable)
    const preData = activeSnap.docs[0].data() as Record<string, unknown>
    const templateId = String(preData.templateId || '')
    const versionId = String(preData.versionId || '')
    const versionSnap = await db
      .collection('agreementTemplates')
      .doc(templateId)
      .collection('versions')
      .doc(versionId)
      .get()
    if (!versionSnap.exists) {
      throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
    }
    const versionData = versionSnap.data() as { version?: string; bodyEn?: string; bodyFr?: string }
    const versionLabel = versionData.version || versionId

    // 4. Atomic transaction: verify token + status + expiry + attempt lock, store evidence & access, lock record
    const committed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(agreementRef)
      if (!snap.exists) {
        throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
      }
      const data = snap.data() as Record<string, unknown>

      // Double-submit race protection inside transaction
      if (data.status === 'signed' && data.signedTokenHash === tokenHash) {
        const existingMs = toDateMs(data.signedAt)
        return {
          alreadySigned: true as const,
          agreementId: snap.id,
          signedAtIso: existingMs ? new Date(existingMs).toISOString() : new Date().toISOString(),
        }
      }

      const expiresMs = toDateMs(data.tokenExpiresAt)
      const failedAttempts = typeof data.failedAttempts === 'number' ? data.failedAttempts : 0
      if (
        data.status !== 'sent' ||
        data.tokenHash !== tokenHash ||
        (expiresMs !== null && expiresMs <= Date.now()) ||
        failedAttempts >= MAX_SIGN_FAILED_ATTEMPTS
      ) {
        throw new HttpsError('not-found', INVALID_LINK_MESSAGE)
      }

      const language: AgreementLanguage =
        input.language ?? (data.language === 'fr' ? 'fr' : 'en')
      const type: AgreementType = data.type === 'commercial' ? 'commercial' : 'residential'
      const party = data.party as AgreementParty
      const terms = data.terms as AgreementTerms
      const rawBody = language === 'fr' ? versionData.bodyFr || '' : versionData.bodyEn || ''

      const canonicalText = buildCanonicalAgreementText({
        type,
        language,
        versionLabel,
        party,
        terms,
        body: rawBody,
      })
      const documentHash = hashAgreementDocument(canonicalText)
      const mergedBody = interpolateAgreementBody({ body: rawBody, language, party, terms })

      const signedAtDate = new Date()
      const signatureRef = agreementRef.collection('signatures').doc()
      const accessRef = agreementRef.collection('private').doc('access')
      const pdfPath = agreementPdfStoragePath(snap.id, databaseId)

      const answers: AgreementAnswers = {
        phone: input.answers.phone,
        email: input.answers.email.toLowerCase(),
        entryMethod: input.answers.entryMethod,
        pets: input.answers.pets,
        hasAlarm: input.answers.hasAlarm,
        specialInstructions: input.answers.specialInstructions,
        valuables: input.answers.valuables,
      }

      const accessRecord: AgreementAccessRecord = {
        entryMethod: input.answers.entryMethod,
        doorCode: input.access.doorCode,
        alarmCode: input.access.alarmCode,
        keyLocation: input.access.keyLocation,
        accessNotes: input.access.accessNotes,
        updatedAt: FieldValue.serverTimestamp(),
      }

      // Append-only signature evidence
      tx.set(signatureRef, {
        signedName: input.signedName,
        consentESign: true,
        consentTerms: true,
        signedAt: FieldValue.serverTimestamp(),
        ip: clientIp,
        userAgent,
        language,
        versionId,
        documentHash,
        answers,
      })

      // Restricted access record (NEVER in agreement doc, PDF, email, or public response)
      tx.set(accessRef, accessRecord)

      // Lock agreement and clear active tokenHash
      tx.update(agreementRef, {
        status: 'signed',
        language,
        tokenHash: null,
        signedTokenHash: tokenHash,
        signedAt: FieldValue.serverTimestamp(),
        currentSignatureId: signatureRef.id,
        documentHash,
        pdfPath,
        lastChange: {
          by: `client:${answers.email}`,
          at: FieldValue.serverTimestamp(),
          source: 'public_form',
          reason: 'Client signed agreement',
          overrideType: null,
        },
      })

      return {
        alreadySigned: false as const,
        agreementId: snap.id,
        signatureId: signatureRef.id,
        signedAtIso: signedAtDate.toISOString(),
        type,
        language,
        party,
        terms,
        answers,
        mergedBody,
        documentHash,
        pdfPath,
      }
    })

    if (committed.alreadySigned) {
      return {
        ok: true,
        alreadySigned: true,
        agreementId: committed.agreementId,
        signedAtIso: committed.signedAtIso,
      }
    }

    // 5. Post-commit: generate PDF (zero access codes), upload to Storage, send client + office emails
    try {
      const pdfBuffer = await buildSignedAgreementPdf({
        agreementId: committed.agreementId,
        type: committed.type,
        language: committed.language,
        versionId,
        versionLabel,
        party: committed.party,
        terms: committed.terms,
        mergedBody: committed.mergedBody,
        answers: committed.answers,
        evidence: {
          signedName: input.signedName,
          signedAtIso: committed.signedAtIso,
          ip: clientIp,
          userAgent,
          documentHash: committed.documentHash,
          signatureId: committed.signatureId,
        },
      })

      // Save PDF to Cloud Storage
      try {
        await getStorage().bucket().file(committed.pdfPath).save(pdfBuffer, {
          contentType: 'application/pdf',
          metadata: {
            metadata: {
              agreementId: committed.agreementId,
              signatureId: committed.signatureId,
              documentHash: committed.documentHash,
            },
          },
        })
      } catch (storageErr) {
        logError(`[signAgreement] Failed to save PDF to Storage (${committed.pdfPath})`, storageErr)
      }

      // Send emails (client + office) with PDF attachment
      const emailConfig = resolveEmailConfig()
      if (emailConfig) {
        const emailData = {
          agreementId: committed.agreementId,
          clientName: committed.party.name,
          clientEmail: committed.answers.email,
          clientAddress: committed.party.address,
          type: committed.type,
          language: committed.language,
          terms: committed.terms,
          signedName: input.signedName,
          signedAtIso: committed.signedAtIso,
          versionLabel,
          documentHash: committed.documentHash,
        }
        await Promise.allSettled([
          sendAgreementSignedClientEmail(committed.answers.email, emailData, pdfBuffer, emailConfig).catch((err) =>
            logError(`[signAgreement] Client email failed for ${committed.agreementId}`, err),
          ),
          sendAgreementSignedOfficeEmail(emailData, pdfBuffer, emailConfig).catch((err) =>
            logError(`[signAgreement] Office email failed for ${committed.agreementId}`, err),
          ),
        ])
      } else {
        logger.info(`[signAgreement] Email skipped (no RESEND_API_KEY) for ${committed.agreementId}`)
      }
    } catch (postErr) {
      logError(`[signAgreement] Post-commit PDF/email error for ${committed.agreementId}`, postErr)
    }

    logger.info(`[signAgreement] Signed agreement ${committed.agreementId} (sig ${committed.signatureId})`)

    return {
      ok: true,
      alreadySigned: false,
      agreementId: committed.agreementId,
      signedAtIso: committed.signedAtIso,
    }
  },
)
