import { describe, it, expect } from 'vitest'
import {
  buildAgreementTermsFromPolicy,
  buildCanonicalAgreementText,
  canTransitionAgreementStatus,
  formatAgreementRate,
  formatBasisPointsPercent,
  interpolateAgreementBody,
  parseMarkdownLite,
  normalizeDatabaseId,
  isValidDatabaseId,
  agreementPdfStoragePath,
  DEFAULT_LATE_PAYMENT_BASIS_POINTS,
  DEFAULT_RESIDENTIAL_NOTICE_DAYS,
  DEFAULT_COMMERCIAL_NOTICE_DAYS,
} from './agreements'
import { DEFAULT_POLICY_SETTINGS } from './policy'

describe('agreements domain (P3-E39)', () => {
  it('enforces allowed status transitions', () => {
    expect(canTransitionAgreementStatus('sent', 'signed')).toBe(true)
    expect(canTransitionAgreementStatus('sent', 'expired')).toBe(true)
    expect(canTransitionAgreementStatus('expired', 'sent')).toBe(true) // reissue
    expect(canTransitionAgreementStatus('signed', 'sent')).toBe(false)
    expect(canTransitionAgreementStatus('cancelled', 'sent')).toBe(false)
    expect(canTransitionAgreementStatus('signed', 'active')).toBe(true)
  })

  it('builds frozen terms from settings/policy defaults', () => {
    const residential = buildAgreementTermsFromPolicy(
      {
        type: 'residential',
        serviceType: 'standard',
        frequency: 'biweekly',
        startDate: '2026-12-01',
        rateType: 'flat',
        rateCents: 18500,
      },
      {
        ...DEFAULT_POLICY_SETTINGS,
        standardCancelWindowHours: 24,
        lateCancellationFeeCents: 5000,
        lockoutFeeCents: 3500,
      },
    )

    expect(residential.cancelWindowHours).toBe(24)
    expect(residential.lateCancellationFeeCents).toBe(5000)
    expect(residential.lockoutFeeCents).toBe(3500)
    expect(residential.latePaymentBasisPoints).toBe(DEFAULT_LATE_PAYMENT_BASIS_POINTS)
    expect(residential.noticePeriodDays).toBe(DEFAULT_RESIDENTIAL_NOTICE_DAYS)
    expect(residential.taxExempt).toBe(false)

    const deepCommercial = buildAgreementTermsFromPolicy(
      {
        type: 'commercial',
        serviceType: 'deep',
        frequency: 'monthly',
        startDate: '2026-12-15',
        rateType: 'monthly',
        rateCents: 120000,
        taxExempt: true,
      },
      DEFAULT_POLICY_SETTINGS,
    )
    expect(deepCommercial.cancelWindowHours).toBe(48)
    expect(deepCommercial.noticePeriodDays).toBe(DEFAULT_COMMERCIAL_NOTICE_DAYS)
    expect(deepCommercial.taxExempt).toBe(true)
  })

  it('formats rates and basis points in EN and FR', () => {
    expect(formatAgreementRate(4500, 'hourly', 'en')).toContain('45.00/hr')
    expect(formatAgreementRate(4500, 'hourly', 'fr')).toContain('/h')
    expect(formatAgreementRate(18500, 'flat', 'en')).toContain('per visit')
    expect(formatAgreementRate(120000, 'monthly', 'fr')).toContain('/mois')
    expect(formatBasisPointsPercent(200, 'en')).toBe('2%')
    expect(formatBasisPointsPercent(250, 'fr')).toBe('2,5 %')
  })

  it('interpolates placeholders and builds deterministic canonical text', () => {
    const terms = buildAgreementTermsFromPolicy({
      type: 'residential',
      serviceType: 'standard',
      frequency: 'biweekly',
      startDate: '2026-12-01',
      rateType: 'flat',
      rateCents: 18000,
      taxExempt: false,
    })
    const party = {
      name: 'Diane Lafleur',
      email: 'diane@example.com',
      phone: '613-555-0101',
      address: '12 rue Riverdale, Cornwall ON',
    }
    const body = '## Résumé\nClient : {{clientName}}\nTarif : {{rate}} ({{taxNote}})'
    const interpolated = interpolateAgreementBody({ body, language: 'fr', party, terms })
    expect(interpolated).toContain('Diane Lafleur')
    expect(interpolated).toContain('plus taxes applicables')

    const canonical = buildCanonicalAgreementText({
      type: 'residential',
      language: 'fr',
      versionLabel: 'v1',
      party,
      terms,
      body,
    })
    expect(canonical).toContain('Fresh Nest Co. — Contrat de services résidentiels (v1)')
    expect(canonical).toContain('12 rue Riverdale, Cornwall ON')
    expect(canonical).toContain('Diane Lafleur')
  })

  it('parses Markdown-lite blocks safely', () => {
    const blocks = parseMarkdownLite(
      '# Title\n\nParagraph line 1\nline 2\n\n## Section\n- Item A\n* Item B\n\n---\n### Sub\nEnd',
    )
    expect(blocks).toEqual([
      { type: 'h1', text: 'Title' },
      { type: 'paragraph', text: 'Paragraph line 1 line 2' },
      { type: 'h2', text: 'Section' },
      { type: 'list', items: ['Item A', 'Item B'] },
      { type: 'divider' },
      { type: 'h3', text: 'Sub' },
      { type: 'paragraph', text: 'End' },
    ])
  })

  it('validates database IDs and maps dev/prod PDF storage paths', () => {
    expect(isValidDatabaseId(undefined)).toBe(true)
    expect(isValidDatabaseId('(default)')).toBe(true)
    expect(isValidDatabaseId('freshnest-dev')).toBe(true)
    expect(isValidDatabaseId('evil-db')).toBe(false)
    expect(normalizeDatabaseId('freshnest-dev')).toBe('freshnest-dev')
    expect(normalizeDatabaseId('(default)')).toBe('(default)')
    expect(agreementPdfStoragePath('agr-1', '(default)')).toBe('agreements/agr-1/signed.pdf')
    expect(agreementPdfStoragePath('agr-1', 'freshnest-dev')).toBe('agreements-dev/agr-1/signed.pdf')
  })
})
