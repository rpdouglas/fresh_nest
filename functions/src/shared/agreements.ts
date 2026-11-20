// AUTO-SYNCED FROM packages/shared/src/domain — DO NOT EDIT DIRECTLY.
/**
 * P3-E39 (Strategy 2): Client E-Agreements — pure domain model, transitions,
 * policy-based term builder, canonical text renderer, and Markdown-lite parser.
 *
 * Pure functions only — zero Firebase / browser / Node dependencies so
 * `functions/scripts/sync-shared.cjs` syncs this directly into `functions/src/shared/agreements.ts`.
 */

import { formatCents, type Cents } from './money'
import { DEFAULT_POLICY_SETTINGS, type PolicySettingsValues } from './policy'

export const LEGAL_BUSINESS_NAME = 'Fresh Nest Co.'
export const OFFICE_PHONE_DISPLAY = '(613) 861-8812'
export const OFFICE_PHONE_HREF = 'tel:+16138618812'

export const AGREEMENT_FAMILIES = ['client'] as const
export type AgreementFamily = (typeof AGREEMENT_FAMILIES)[number]

export const AGREEMENT_TYPES = ['residential', 'commercial'] as const
export type AgreementType = (typeof AGREEMENT_TYPES)[number]

export const AGREEMENT_LANGUAGES = ['en', 'fr'] as const
export type AgreementLanguage = (typeof AGREEMENT_LANGUAGES)[number]

/**
 * Lifecycle statuses (Strategy 2 — aligns with FSM Master Spec Part 4).
 * Viewing is tracked via `viewedAt` timestamp, not a separate status.
 * Wave 1 extends with `active | paused | ending | ended`.
 */
export const AGREEMENT_STATUSES = [
  'draft',
  'sent',
  'signed',
  'expired',
  'cancelled',
  'active',
  'paused',
  'ending',
  'ended',
] as const
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number]

export const AGREEMENT_RATE_TYPES = ['hourly', 'flat', 'monthly'] as const
export type AgreementRateType = (typeof AGREEMENT_RATE_TYPES)[number]

export const AGREEMENT_FREQUENCIES = ['one-time', 'weekly', 'biweekly', 'monthly'] as const
export type AgreementFrequency = (typeof AGREEMENT_FREQUENCIES)[number]

export const AGREEMENT_SERVICE_TYPES = [
  'standard',
  'deep',
  'moveout',
  'postconstruction',
  'airbnb',
  'commercial',
] as const
export type AgreementServiceType = (typeof AGREEMENT_SERVICE_TYPES)[number]

export const AGREEMENT_ENTRY_METHODS = [
  'present',
  'key',
  'lockbox',
  'door_code',
  'smart_lock',
  'concierge',
  'other',
] as const
export type AgreementEntryMethod = (typeof AGREEMENT_ENTRY_METHODS)[number]

export const AGREEMENT_LINK_VALIDITY_DAYS = [7, 14, 30, 60] as const
export type AgreementLinkValidityDays = (typeof AGREEMENT_LINK_VALIDITY_DAYS)[number]
export const DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS: AgreementLinkValidityDays = 30

export const MAX_SIGN_FAILED_ATTEMPTS = 10

export const ALLOWED_DATABASE_IDS = ['(default)', 'freshnest-dev'] as const
export type AllowedDatabaseId = (typeof ALLOWED_DATABASE_IDS)[number]

export const DEFAULT_LATE_PAYMENT_BASIS_POINTS = 200 // 2.00%
export const DEFAULT_RESIDENTIAL_NOTICE_DAYS = 14
export const DEFAULT_COMMERCIAL_NOTICE_DAYS = 30

export const TEMPLATE_VERSION_STATUSES = ['draft', 'published', 'retired'] as const
export type TemplateVersionStatus = (typeof TEMPLATE_VERSION_STATUSES)[number]

export interface AgreementParty {
  kind: 'booking' | 'client'
  bookingId?: string | null
  clientId?: string | null
  name: string
  email: string
  phone: string
  address: string
}

export interface AgreementTerms {
  serviceType: AgreementServiceType
  frequency: AgreementFrequency
  /** ISO calendar date YYYY-MM-DD (America/Toronto) */
  startDate: string
  rateType: AgreementRateType
  /** Integer cents (ADR-020), CAD */
  rateCents: Cents
  /** True for tax-exempt clients (e.g., Cornwall Island / Akwesasne P4) */
  taxExempt: boolean
  cancelWindowHours: number
  lateCancellationFeeCents: Cents
  lockoutFeeCents: Cents
  /** Late payment interest in basis points (e.g. 200 = 2%) */
  latePaymentBasisPoints: number
  noticePeriodDays: number
  /** Optional schedule/scope summary included in the client agreement */
  scopeNotes?: string
}

export interface AgreementAnswers {
  phone: string
  email: string
  entryMethod: AgreementEntryMethod
  pets: string
  hasAlarm: boolean
  specialInstructions: string
  valuables: string
}

/**
 * Restricted access subdocument (`agreements/{id}/private/access`).
 * NEVER returned by public callables, NEVER included in PDFs or emails.
 */
export interface AgreementAccessRecord {
  entryMethod: AgreementEntryMethod
  doorCode: string
  alarmCode: string
  keyLocation: string
  accessNotes: string
  updatedAt?: unknown
  redactedAt?: unknown
  redactedBy?: string | null
}

/** Append-only signature evidence record (`agreements/{id}/signatures/{sigId}`). */
export interface AgreementSignature {
  id?: string
  signedName: string
  consentESign: boolean
  consentTerms: boolean
  signedAt: unknown
  ip: string
  userAgent: string
  language: AgreementLanguage
  versionId: string
  documentHash: string
  answers: AgreementAnswers
  answersRedactedAt?: unknown
  answersRedactedBy?: string | null
}

export interface AgreementTemplate {
  id?: string
  family: AgreementFamily
  type: AgreementType
  nameEn: string
  nameFr: string
  currentVersionId: string
}

export interface AgreementTemplateVersion {
  id?: string
  version: string
  status: TemplateVersionStatus
  bodyEn: string
  bodyFr: string
  bodyHashEn: string
  bodyHashFr: string
  publishedAt: unknown
  publishedBy: string
}

export interface AgreementRecord {
  id?: string
  family: AgreementFamily
  type: AgreementType
  language: AgreementLanguage
  party: AgreementParty
  terms: AgreementTerms
  templateId: string
  versionId: string
  status: AgreementStatus
  /** SHA-256 hex digest of the active bearer token; null once signed/expired/cancelled */
  tokenHash: string | null
  tokenExpiresAt: unknown
  linkValidityDays: number
  sentAt: unknown
  viewedAt: unknown
  signedAt?: unknown
  failedAttempts: number
  currentSignatureId: string | null
  pdfPath: string | null
  documentHash: string | null
  redactedAt?: unknown
  redactedBy?: string | null
  createdBy: string
  createdAt: unknown
  lastChange?: unknown
}

/**
 * Strictly minimal payload returned by `getAgreementForSigning`.
 * Never exposes `tokenHash`, `failedAttempts`, access codes, or internal admin data.
 */
export interface PublicAgreementView {
  agreementId: string
  type: AgreementType
  language: AgreementLanguage
  status: 'sent' | 'signed'
  party: {
    name: string
    email: string
    phone: string
    address: string
  }
  terms: AgreementTerms
  templateName: string
  versionId: string
  versionLabel: string
  bodyEn: string
  bodyFr: string
  signedAtIso: string | null
  signedName: string | null
}

export const ALLOWED_AGREEMENT_TRANSITIONS: Readonly<Record<AgreementStatus, readonly AgreementStatus[]>> = {
  draft: ['sent', 'cancelled'],
  sent: ['signed', 'expired', 'cancelled'],
  signed: ['active', 'ended', 'cancelled'],
  expired: ['sent', 'cancelled'], // reissuing a link returns expired -> sent
  cancelled: [],
  active: ['paused', 'ending', 'ended'],
  paused: ['active', 'ending', 'ended'],
  ending: ['active', 'ended'],
  ended: [],
}

export function canTransitionAgreementStatus(from: AgreementStatus, to: AgreementStatus): boolean {
  return ALLOWED_AGREEMENT_TRANSITIONS[from]?.includes(to) ?? false
}

export function normalizeDatabaseId(raw: unknown): AllowedDatabaseId {
  if (raw === 'freshnest-dev') return 'freshnest-dev'
  return '(default)'
}

export function isValidDatabaseId(raw: unknown): raw is AllowedDatabaseId {
  return raw === undefined || raw === null || raw === '(default)' || raw === 'freshnest-dev'
}

export function agreementPdfStoragePath(agreementId: string, databaseId: AllowedDatabaseId): string {
  const prefix = databaseId === 'freshnest-dev' ? 'agreements-dev' : 'agreements'
  return `${prefix}/${agreementId}/signed.pdf`
}

export function isDeepCancelService(serviceType: AgreementServiceType): boolean {
  return serviceType === 'deep' || serviceType === 'moveout' || serviceType === 'postconstruction'
}

export interface BuildTermsInput {
  type: AgreementType
  serviceType: AgreementServiceType
  frequency: AgreementFrequency
  startDate: string
  rateType: AgreementRateType
  rateCents: Cents
  taxExempt?: boolean
  cancelWindowHours?: number
  lateCancellationFeeCents?: Cents
  lockoutFeeCents?: Cents
  latePaymentBasisPoints?: number
  noticePeriodDays?: number
  scopeNotes?: string
}

/**
 * Builds frozen `AgreementTerms` by snapshotting `settings/policy` defaults and
 * applying explicit office overrides from the New Agreement form.
 */
export function buildAgreementTermsFromPolicy(
  input: BuildTermsInput,
  policy: Partial<PolicySettingsValues> = DEFAULT_POLICY_SETTINGS,
): AgreementTerms {
  const defaultCancelHours = isDeepCancelService(input.serviceType)
    ? (policy.deepCancelWindowHours ?? DEFAULT_POLICY_SETTINGS.deepCancelWindowHours)
    : (policy.standardCancelWindowHours ?? DEFAULT_POLICY_SETTINGS.standardCancelWindowHours)

  const defaultNoticeDays =
    input.type === 'commercial' ? DEFAULT_COMMERCIAL_NOTICE_DAYS : DEFAULT_RESIDENTIAL_NOTICE_DAYS

  const trimmedNotes = input.scopeNotes?.trim()
  return {
    serviceType: input.serviceType,
    frequency: input.frequency,
    startDate: input.startDate,
    rateType: input.rateType,
    rateCents: Math.round(input.rateCents),
    taxExempt: Boolean(input.taxExempt),
    cancelWindowHours:
      input.cancelWindowHours !== undefined ? Math.round(input.cancelWindowHours) : defaultCancelHours,
    lateCancellationFeeCents:
      input.lateCancellationFeeCents !== undefined
        ? Math.round(input.lateCancellationFeeCents)
        : (policy.lateCancellationFeeCents ?? DEFAULT_POLICY_SETTINGS.lateCancellationFeeCents),
    lockoutFeeCents:
      input.lockoutFeeCents !== undefined
        ? Math.round(input.lockoutFeeCents)
        : (policy.lockoutFeeCents ?? DEFAULT_POLICY_SETTINGS.lockoutFeeCents),
    latePaymentBasisPoints:
      input.latePaymentBasisPoints !== undefined
        ? Math.round(input.latePaymentBasisPoints)
        : DEFAULT_LATE_PAYMENT_BASIS_POINTS,
    noticePeriodDays:
      input.noticePeriodDays !== undefined ? Math.round(input.noticePeriodDays) : defaultNoticeDays,
    ...(trimmedNotes ? { scopeNotes: trimmedNotes } : {}),
  }
}

export function formatBasisPointsPercent(basisPoints: number, lang: AgreementLanguage = 'en'): string {
  const pct = basisPoints / 100
  const formatted = Number.isInteger(pct)
    ? String(pct)
    : pct.toFixed(2).replace(/\.?0+$/, '')
  return lang === 'fr' ? `${formatted.replace('.', ',')} %` : `${formatted}%`
}

export function formatAgreementRate(
  rateCents: Cents,
  rateType: AgreementRateType,
  lang: AgreementLanguage = 'en',
): string {
  const amount = formatCents(rateCents, lang)
  const units: Record<AgreementRateType, Record<AgreementLanguage, string>> = {
    hourly: { en: '/hr', fr: '/h' },
    flat: { en: ' per visit', fr: ' par visite' },
    monthly: { en: '/month', fr: '/mois' },
  }
  return `${amount}${units[rateType][lang]}`
}

const SERVICE_LABELS: Record<AgreementServiceType, Record<AgreementLanguage, string>> = {
  standard: { en: 'Standard Cleaning', fr: 'Entretien ménager régulier' },
  deep: { en: 'Deep Cleaning', fr: 'Grand ménage en profondeur' },
  moveout: { en: 'Move-In / Move-Out Cleaning', fr: 'Ménage de déménagement' },
  postconstruction: { en: 'Post-Construction Cleaning', fr: 'Ménage après construction' },
  airbnb: { en: 'Airbnb / Short-Term Turnover', fr: 'Rotation Airbnb / location courte durée' },
  commercial: { en: 'Commercial Cleaning', fr: 'Entretien ménager commercial' },
}

const FREQUENCY_LABELS: Record<AgreementFrequency, Record<AgreementLanguage, string>> = {
  'one-time': { en: 'One-Time', fr: 'Ponctuel' },
  weekly: { en: 'Weekly', fr: 'Hebdomadaire' },
  biweekly: { en: 'Bi-Weekly', fr: 'Aux deux semaines' },
  monthly: { en: 'Monthly', fr: 'Mensuel' },
}

export function getAgreementServiceLabel(serviceType: AgreementServiceType, lang: AgreementLanguage): string {
  return SERVICE_LABELS[serviceType]?.[lang] ?? serviceType
}

export function getAgreementFrequencyLabel(frequency: AgreementFrequency, lang: AgreementLanguage): string {
  return FREQUENCY_LABELS[frequency]?.[lang] ?? frequency
}

/**
 * Replaces safe `{{placeholder}}` tokens in a template body with the client's frozen details.
 * Unknown placeholders are left intact so nothing is silently dropped.
 */
export function interpolateAgreementBody(params: {
  body: string
  language: AgreementLanguage
  party: Pick<AgreementParty, 'name' | 'email' | 'phone' | 'address'>
  terms: AgreementTerms
}): string {
  const { body, language, party, terms } = params
  const taxPhrase = terms.taxExempt
    ? language === 'fr'
      ? 'exonéré de taxes (certificat applicable)'
      : 'tax-exempt (applicable exemption)'
    : language === 'fr'
      ? 'plus taxes applicables'
      : 'plus applicable taxes'

  const replacements: Record<string, string> = {
    businessName: LEGAL_BUSINESS_NAME,
    officePhone: OFFICE_PHONE_DISPLAY,
    clientName: party.name,
    clientEmail: party.email,
    clientPhone: party.phone,
    clientAddress: party.address,
    serviceType: getAgreementServiceLabel(terms.serviceType, language),
    frequency: getAgreementFrequencyLabel(terms.frequency, language),
    startDate: terms.startDate,
    rate: formatAgreementRate(terms.rateCents, terms.rateType, language),
    taxNote: taxPhrase,
    cancelWindowHours: String(terms.cancelWindowHours),
    lateCancellationFee: formatCents(terms.lateCancellationFeeCents, language),
    lockoutFee: formatCents(terms.lockoutFeeCents, language),
    latePaymentRate: formatBasisPointsPercent(terms.latePaymentBasisPoints, language),
    noticePeriodDays: String(terms.noticePeriodDays),
    scopeNotes: terms.scopeNotes?.trim() || (language === 'fr' ? 'Selon le calendrier ci-dessous.' : 'As described in the schedule below.'),
  }

  return body.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match,
  )
}

/**
 * Produces the canonical rendered text of an agreement (header + interpolated body).
 * Used identically on the server to compute `documentHash` (SHA-256) and render the signed PDF,
 * guaranteeing that the hash commits to the exact terms and client details shown on screen.
 */
export function buildCanonicalAgreementText(params: {
  type: AgreementType
  language: AgreementLanguage
  versionLabel: string
  party: Pick<AgreementParty, 'name' | 'email' | 'phone' | 'address'>
  terms: AgreementTerms
  body: string
}): string {
  const { type, language, versionLabel, party, terms, body } = params
  const isFr = language === 'fr'
  const typeLabel =
    type === 'commercial'
      ? isFr
        ? 'Contrat de services commerciaux'
        : 'Commercial Service Agreement'
      : isFr
        ? 'Contrat de services résidentiels'
        : 'Residential Service Agreement'

  const rateText = formatAgreementRate(terms.rateCents, terms.rateType, language)
  const taxText = terms.taxExempt
    ? isFr
      ? 'Exonéré de taxes'
      : 'Tax-exempt'
    : isFr
      ? 'Plus taxes applicables'
      : 'Plus applicable taxes'

  const headerLines = isFr
    ? [
        `${LEGAL_BUSINESS_NAME} — ${typeLabel} (${versionLabel})`,
        `Client : ${party.name}`,
        `Adresse de service : ${party.address}`,
        `Service : ${getAgreementServiceLabel(terms.serviceType, 'fr')} · Fréquence : ${getAgreementFrequencyLabel(terms.frequency, 'fr')}`,
        `Date de début : ${terms.startDate}`,
        `Tarif convenu : ${rateText} (${taxText})`,
        `Préavis d'annulation : ${terms.cancelWindowHours} h · Frais d'annulation tardive : ${formatCents(terms.lateCancellationFeeCents, 'fr')} · Frais d'accès impossible : ${formatCents(terms.lockoutFeeCents, 'fr')}`,
        `Frais de retard : ${formatBasisPointsPercent(terms.latePaymentBasisPoints, 'fr')}/mois · Préavis de résiliation : ${terms.noticePeriodDays} jours`,
        ...(terms.scopeNotes?.trim() ? [`Notes de portée : ${terms.scopeNotes.trim()}`] : []),
      ]
    : [
        `${LEGAL_BUSINESS_NAME} — ${typeLabel} (${versionLabel})`,
        `Client: ${party.name}`,
        `Service Address: ${party.address}`,
        `Service: ${getAgreementServiceLabel(terms.serviceType, 'en')} · Frequency: ${getAgreementFrequencyLabel(terms.frequency, 'en')}`,
        `Start Date: ${terms.startDate}`,
        `Agreed Rate: ${rateText} (${taxText})`,
        `Cancellation Notice: ${terms.cancelWindowHours}h · Late Cancellation Fee: ${formatCents(terms.lateCancellationFeeCents, 'en')} · Lockout Fee: ${formatCents(terms.lockoutFeeCents, 'en')}`,
        `Late Payment Fee: ${formatBasisPointsPercent(terms.latePaymentBasisPoints, 'en')}/month · Termination Notice: ${terms.noticePeriodDays} days`,
        ...(terms.scopeNotes?.trim() ? [`Scope Notes: ${terms.scopeNotes.trim()}`] : []),
      ]

  const mergedBody = interpolateAgreementBody({ body, language, party, terms }).trim()
  return `${headerLines.join('\n')}\n\n---\n\n${mergedBody}\n`
}

export type MarkdownLiteBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'divider' }

/**
 * Safe, deterministic Markdown-lite parser for agreement body text.
 * Supports `#`, `##`, `###`, `- ` / `* ` bullet lists, `---` dividers, and paragraphs.
 * Zero raw HTML — safe to render directly in React and pdf-lib.
 */
export function parseMarkdownLite(source: string): MarkdownLiteBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownLiteBlock[] = []
  let paragraphBuf: string[] = []
  let listBuf: string[] = []

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphBuf.join(' ').trim() })
      paragraphBuf = []
    }
  }
  const flushList = () => {
    if (listBuf.length > 0) {
      blocks.push({ type: 'list', items: listBuf })
      listBuf = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    if (line === '---' || line === '***') {
      flushParagraph()
      flushList()
      blocks.push({ type: 'divider' })
      continue
    }
    if (line.startsWith('### ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      continue
    }
    if (line.startsWith('# ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph()
      listBuf.push(line.slice(2).trim())
      continue
    }
    flushList()
    paragraphBuf.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}
