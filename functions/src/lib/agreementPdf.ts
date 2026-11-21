import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import {
  LEGAL_BUSINESS_NAME,
  OFFICE_PHONE_DISPLAY,
  formatAgreementRate,
  formatBasisPointsPercent,
  getAgreementFrequencyLabel,
  getAgreementServiceLabel,
  parseMarkdownLite,
  type AgreementAnswers,
  type AgreementLanguage,
  type AgreementParty,
  type AgreementTerms,
  type AgreementType,
} from '../shared/agreements'
import { formatCents } from '../shared/money'

export interface SignedAgreementPdfInput {
  agreementId: string
  type: AgreementType
  language: AgreementLanguage
  versionId: string
  versionLabel: string
  party: Pick<AgreementParty, 'name' | 'email' | 'phone' | 'address'>
  terms: AgreementTerms
  /** Already-interpolated agreement body (Markdown-lite). */
  mergedBody: string
  /** Non-secret client answers (strictly NO access codes). */
  answers: AgreementAnswers
  evidence: {
    signedName: string
    signedAtIso: string
    ip: string
    userAgent: string
    documentHash: string
    signatureId: string
  }
}

/**
 * Replaces characters outside PDF WinAnsi (such as narrow no-break spaces `\u202F` emitted by
 * `Intl.NumberFormat('fr-CA')`) so French currency and accented text never throw in `pdf-lib`.
 */
export function sanitizeWinAnsi(input: string): string {
  const normalized = input
    .replace(/[\u00A0\u202F\u2007]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2026/g, '...')

  let out = ''
  for (const ch of normalized) {
    const code = ch.charCodeAt(0)
    // Printable ASCII + Latin-1 Supplement (covers French accents: éèêëàâçîïôùûüÉÈÊÀÇÔÙ, «», ·)
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) {
      out += ch
    } else if (code === 0x0a || code === 0x09) {
      out += ' '
    } else {
      // Fallback for rare characters (e.g. Mohawk diacritics or emoji): strip combining marks via NFKD
      const ascii = ch.normalize('NFKD').replace(/[^\x20-\x7e\xa0-\xff]/g, '')
      out += ascii || '?'
    }
  }
  return out
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const safe = sanitizeWinAnsi(text)
  if (!safe.trim()) return []
  const words = safe.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      // Break overly long unspaced tokens (such as SHA-256 hashes or user agents)
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = ''
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, fontSize) <= maxWidth) {
            chunk += char
          } else {
            if (chunk) lines.push(chunk)
            chunk = char
          }
        }
        current = chunk
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

const SLATE = rgb(0.329, 0.467, 0.533) // #547788 slate-brand
const CHARCOAL = rgb(0.173, 0.227, 0.251) // #2c3a40 charcoal
const MUTED = rgb(0.373, 0.447, 0.486) // #5f727c text-muted
const SAND = rgb(0.91, 0.867, 0.816) // #e8ddd0 sand
const CREAM = rgb(0.969, 0.953, 0.933) // #f7f3ee cream

const PAGE_WIDTH = 612 // US Letter portrait (8.5 in * 72)
const PAGE_HEIGHT = 792 // 11 in * 72
const MARGIN_X = 50
const MARGIN_TOP = 54
const MARGIN_BOTTOM = 54
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

/**
 * Generates the signed client agreement PDF with an appended signature & audit evidence page.
 * Strictly never accepts or renders door codes, alarm codes, or key locations.
 */
export async function buildSignedAgreementPdf(input: SignedAgreementPdfInput): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const isFr = input.language === 'fr'

  const docTitle =
    input.type === 'commercial'
      ? isFr
        ? 'Contrat de services commerciaux'
        : 'Commercial Service Agreement'
      : isFr
        ? 'Contrat de services résidentiels'
        : 'Residential Service Agreement'

  pdf.setTitle(sanitizeWinAnsi(`${LEGAL_BUSINESS_NAME} - ${docTitle}`))
  pdf.setAuthor(LEGAL_BUSINESS_NAME)
  pdf.setSubject(sanitizeWinAnsi(`Agreement ${input.agreementId} (${input.versionLabel})`))

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN_TOP

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN_TOP
    }
  }

  const drawWrapped = (
    text: string,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; lineGap?: number } = {},
  ) => {
    const font = opts.font ?? fontRegular
    const size = opts.size ?? 10.5
    const color = opts.color ?? CHARCOAL
    const indent = opts.indent ?? 0
    const lineHeight = size + (opts.lineGap ?? 4.5)
    const lines = wrapText(text, font, size, CONTENT_WIDTH - indent)
    for (const line of lines) {
      ensureSpace(lineHeight)
      page.drawText(line, { x: MARGIN_X + indent, y: y - size, size, font, color })
      y -= lineHeight
    }
  }

  const drawRule = (gapBefore = 6, gapAfter = 10) => {
    y -= gapBefore
    ensureSpace(10)
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness: 0.75,
      color: SAND,
    })
    y -= gapAfter
  }

  // ── Header banner ──────────────────────────────────────────────────────────
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 54,
    width: CONTENT_WIDTH,
    height: 54,
    color: CREAM,
    borderColor: SAND,
    borderWidth: 1,
  })
  page.drawText(sanitizeWinAnsi(LEGAL_BUSINESS_NAME), {
    x: MARGIN_X + 14,
    y: y - 22,
    size: 16,
    font: fontBold,
    color: SLATE,
  })
  page.drawText(sanitizeWinAnsi(`${docTitle} (${input.versionLabel})`), {
    x: MARGIN_X + 14,
    y: y - 40,
    size: 11,
    font: fontRegular,
    color: CHARCOAL,
  })
  const phoneText = sanitizeWinAnsi(OFFICE_PHONE_DISPLAY)
  const phoneWidth = fontRegular.widthOfTextAtSize(phoneText, 9.5)
  page.drawText(phoneText, {
    x: PAGE_WIDTH - MARGIN_X - 14 - phoneWidth,
    y: y - 22,
    size: 9.5,
    font: fontRegular,
    color: MUTED,
  })
  y -= 70

  // ── Client & Service Summary ───────────────────────────────────────────────
  drawWrapped(isFr ? 'Détails du client et des services' : 'Client & Service Details', {
    font: fontBold,
    size: 12.5,
    color: SLATE,
  })
  y -= 4

  const taxLabel = input.terms.taxExempt
    ? isFr
      ? 'Exonéré de taxes'
      : 'Tax-exempt'
    : isFr
      ? 'Plus taxes applicables'
      : 'Plus applicable taxes'

  const summaryRows: Array<[string, string]> = isFr
    ? [
        ['Client', input.party.name],
        ['Courriel', input.answers.email || input.party.email],
        ['Téléphone', input.answers.phone || input.party.phone],
        ['Adresse de service', input.party.address],
        ['Service', getAgreementServiceLabel(input.terms.serviceType, 'fr')],
        ['Fréquence', getAgreementFrequencyLabel(input.terms.frequency, 'fr')],
        ['Date de début', input.terms.startDate],
        ['Tarif convenu', `${formatAgreementRate(input.terms.rateCents, input.terms.rateType, 'fr')} (${taxLabel})`],
        ['Préavis d’annulation', `${input.terms.cancelWindowHours} h`],
        ['Frais d’annulation tardive', formatCents(input.terms.lateCancellationFeeCents, 'fr')],
        ['Frais d’accès impossible', formatCents(input.terms.lockoutFeeCents, 'fr')],
        ['Intérêts de retard', `${formatBasisPointsPercent(input.terms.latePaymentBasisPoints, 'fr')} / mois`],
        ['Préavis de résiliation', `${input.terms.noticePeriodDays} jours`],
      ]
    : [
        ['Client', input.party.name],
        ['Email', input.answers.email || input.party.email],
        ['Phone', input.answers.phone || input.party.phone],
        ['Service Address', input.party.address],
        ['Service', getAgreementServiceLabel(input.terms.serviceType, 'en')],
        ['Frequency', getAgreementFrequencyLabel(input.terms.frequency, 'en')],
        ['Start Date', input.terms.startDate],
        ['Agreed Rate', `${formatAgreementRate(input.terms.rateCents, input.terms.rateType, 'en')} (${taxLabel})`],
        ['Cancellation Notice', `${input.terms.cancelWindowHours} hours`],
        ['Late Cancellation Fee', formatCents(input.terms.lateCancellationFeeCents, 'en')],
        ['Lockout Fee', formatCents(input.terms.lockoutFeeCents, 'en')],
        ['Late Payment Fee', `${formatBasisPointsPercent(input.terms.latePaymentBasisPoints, 'en')} / month`],
        ['Termination Notice', `${input.terms.noticePeriodDays} days`],
      ]

  if (input.terms.scopeNotes?.trim()) {
    summaryRows.push([isFr ? 'Notes de portée' : 'Scope Notes', input.terms.scopeNotes.trim()])
  }

  for (const [label, value] of summaryRows) {
    drawWrapped(`${label}: ${value}`, { size: 10, lineGap: 3.5 })
  }

  drawRule(8, 10)

  // ── Agreement Body (Markdown-lite) ─────────────────────────────────────────
  const blocks = parseMarkdownLite(input.mergedBody)
  for (const block of blocks) {
    if (block.type === 'h1') {
      y -= 4
      drawWrapped(block.text, { font: fontBold, size: 13.5, color: SLATE, lineGap: 5 })
      y -= 2
    } else if (block.type === 'h2') {
      y -= 6
      drawWrapped(block.text, { font: fontBold, size: 11.5, color: CHARCOAL, lineGap: 4 })
      y -= 2
    } else if (block.type === 'h3') {
      y -= 4
      drawWrapped(block.text, { font: fontBold, size: 10.5, color: CHARCOAL, lineGap: 3.5 })
    } else if (block.type === 'divider') {
      drawRule(4, 8)
    } else if (block.type === 'list') {
      for (const item of block.items) {
        drawWrapped(`- ${item}`, { size: 10, indent: 12, lineGap: 3.5 })
      }
      y -= 3
    } else {
      drawWrapped(block.text, { size: 10, lineGap: 4 })
      y -= 4
    }
  }

  // ── Client Disclosures (Non-secret only; NO access codes) ──────────────────
  drawRule(8, 10)
  drawWrapped(isFr ? 'Renseignements fournis par le client' : 'Client Disclosures', {
    font: fontBold,
    size: 11.5,
    color: SLATE,
  })
  y -= 4

  const entryMethodLabels: Record<string, { en: string; fr: string }> = {
    present: { en: 'Client will be home / on site', fr: 'Client présent sur place' },
    key: { en: 'Key provided', fr: 'Clé fournie' },
    lockbox: { en: 'Lockbox', fr: 'Boîte à clés' },
    door_code: { en: 'Door / keypad code (stored separately)', fr: 'Code de porte (conservé séparément)' },
    smart_lock: { en: 'Smart lock (stored separately)', fr: 'Serrure intelligente (conservée séparément)' },
    concierge: { en: 'Concierge / reception', fr: 'Conciergerie / réception' },
    other: { en: 'Other', fr: 'Autre' },
  }
  const entryLabel =
    entryMethodLabels[input.answers.entryMethod]?.[input.language] ?? input.answers.entryMethod

  const disclosureRows: Array<[string, string]> = isFr
    ? [
        ['Méthode d’accès', entryLabel],
        ['Animaux de compagnie', input.answers.pets.trim() || 'Aucun indiqué'],
        ['Système d’alarme', input.answers.hasAlarm ? 'Oui (codes conservés séparément)' : 'Non'],
        ['Instructions particulières', input.answers.specialInstructions.trim() || 'Aucune'],
        ['Objets de valeur déclarés', input.answers.valuables.trim() || 'Aucun'],
      ]
    : [
        ['Entry Method', entryLabel],
        ['Pets', input.answers.pets.trim() || 'None listed'],
        ['Alarm System', input.answers.hasAlarm ? 'Yes (codes stored separately)' : 'No'],
        ['Special Instructions', input.answers.specialInstructions.trim() || 'None'],
        ['Valuables Disclosed', input.answers.valuables.trim() || 'None'],
      ]

  for (const [label, value] of disclosureRows) {
    drawWrapped(`${label}: ${value}`, { size: 10, lineGap: 3.5 })
  }

  drawWrapped(
    isFr
      ? 'Remarque de sécurité : les codes de porte, codes d’alarme et emplacements de clés ne figurent jamais dans ce PDF ni dans les courriels.'
      : 'Security notice: door codes, alarm codes, and key locations are stored in a restricted access record and are never included in this PDF or in emails.',
    { size: 9, color: MUTED, lineGap: 3.5 },
  )

  // ── Dedicated Signature & Audit Evidence Page ──────────────────────────────
  page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  y = PAGE_HEIGHT - MARGIN_TOP

  drawWrapped(
    isFr ? 'Certificat de signature électronique et piste d’audit' : 'Electronic Signature Certificate & Audit Trail',
    { font: fontBold, size: 14, color: SLATE, lineGap: 6 },
  )
  drawRule(4, 12)

  drawWrapped(
    isFr
      ? 'Le signataire ci-dessous a consenti à signer électroniquement, a consenti à la conservation des preuves de signature (Loi 25 / LPRPDE) et a confirmé avoir lu et accepté l’intégralité du contrat.'
      : 'The signer below consented to sign electronically, consented to retention of signing evidence, and confirmed that they read and agreed to the full service agreement.',
    { size: 10, color: CHARCOAL, lineGap: 4.5 },
  )
  y -= 10

  const evidenceRows: Array<[string, string]> = isFr
    ? [
        ['Nom signé (saisi)', input.evidence.signedName],
        ['Date et heure (serveur UTC)', input.evidence.signedAtIso],
        ['Langue de signature', 'Français (fr)'],
        ['Identifiant du contrat', input.agreementId],
        ['Identifiant de signature', input.evidence.signatureId],
        ['Version du modèle', `${input.versionLabel} (${input.versionId})`],
        ['Consentement signature électronique', 'Accepté'],
        ['Acceptation des modalités', 'Acceptée'],
        ['Adresse IP enregistrée', input.evidence.ip || 'Inconnue'],
        ['Agent utilisateur (navigateur)', input.evidence.userAgent || 'Inconnu'],
        ['Empreinte SHA-256 du document', input.evidence.documentHash],
      ]
    : [
        ['Signed Name (Typed)', input.evidence.signedName],
        ['Signed Timestamp (Server UTC)', input.evidence.signedAtIso],
        ['Signing Language', 'English (en)'],
        ['Agreement ID', input.agreementId],
        ['Signature ID', input.evidence.signatureId],
        ['Template Version', `${input.versionLabel} (${input.versionId})`],
        ['Electronic Signature Consent', 'Accepted'],
        ['Agreement Terms Consent', 'Accepted'],
        ['Recorded IP Address', input.evidence.ip || 'Unknown'],
        ['User Agent (Browser)', input.evidence.userAgent || 'Unknown'],
        ['Document SHA-256 Hash', input.evidence.documentHash],
      ]

  for (const [label, value] of evidenceRows) {
    drawWrapped(`${label}:`, { font: fontBold, size: 9.5, color: SLATE, lineGap: 2 })
    drawWrapped(value, { size: 9.5, color: CHARCOAL, indent: 8, lineGap: 4 })
    y -= 2
  }

  // Footer page numbers on all pages
  const pages = pdf.getPages()
  const totalPages = pages.length
  pages.forEach((p, idx) => {
    const footer = sanitizeWinAnsi(
      isFr
        ? `${LEGAL_BUSINESS_NAME} · ${OFFICE_PHONE_DISPLAY} · Page ${idx + 1} sur ${totalPages}`
        : `${LEGAL_BUSINESS_NAME} · ${OFFICE_PHONE_DISPLAY} · Page ${idx + 1} of ${totalPages}`,
    )
    p.drawText(footer, {
      x: MARGIN_X,
      y: 26,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    })
  })

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}
