import { describe, it, expect } from 'vitest'
import {
  FALLBACK_CORNWALL_COORDS,
  buildDefaultClientComment,
  buildDefaultJobSiteNote,
  matchCameloClients,
  normalizePhoneDigits,
  pickDefaultCameloScheduleId,
  type CameloClientSummary,
} from './cameloBridge'

describe('cameloBridge (P3-E42)', () => {
  const clients: CameloClientSummary[] = [
    {
      id: 'c-1',
      name: 'Diane Lafleur',
      email: 'diane@example.com',
      phoneNumber: '(613) 555-0101',
      clientNumber: null,
      billingAddress: '100 Pitt St, Cornwall, ON',
    },
    {
      id: 'c-2',
      name: 'Travis McLeod',
      email: 'travis@other.com',
      phoneNumber: '+1 613-555-0199',
      clientNumber: 'FN-02',
      billingAddress: null,
    },
    {
      id: 'c-3',
      name: 'Sophie Tremblay-Gagnon',
      email: null,
      phoneNumber: null,
      clientNumber: null,
      billingAddress: null,
    },
  ]

  it('normalizes 10- and 11-digit North American phone numbers', () => {
    expect(normalizePhoneDigits('+1 (613) 555-0199')).toBe('6135550199')
    expect(normalizePhoneDigits('613.555.0199')).toBe('6135550199')
    expect(normalizePhoneDigits(null)).toBe('')
  })

  it('ranks Camelo client matches by email > phone > name', () => {
    const emailAndPhone = matchCameloClients(
      { firstName: 'Diane', lastName: 'Lafleur', email: 'DIANE@example.com', phone: '613-555-0101' },
      clients,
    )
    expect(emailAndPhone).toHaveLength(1)
    expect(emailAndPhone[0].client.id).toBe('c-1')
    expect(emailAndPhone[0].reasons).toEqual(['email', 'phone', 'name'])
    expect(emailAndPhone[0].score).toBe(220)

    const phoneMatch = matchCameloClients(
      { firstName: 'T.', lastName: 'McLeod', email: 'new@example.com', phone: '6135550199' },
      clients,
    )
    expect(phoneMatch).toHaveLength(1)
    expect(phoneMatch[0].client.id).toBe('c-2')
    expect(phoneMatch[0].reasons).toEqual(['phone'])

    const nameMatch = matchCameloClients(
      { firstName: 'Sophie', lastName: 'Tremblay-Gagnon', email: 'sophie@snye.qc.ca', phone: '450-555-0100' },
      clients,
    )
    expect(nameMatch).toHaveLength(1)
    expect(nameMatch[0].client.id).toBe('c-3')
    expect(nameMatch[0].reasons).toEqual(['name'])
  })

  it('picks the Clients schedule by default and falls back to the first schedule', () => {
    expect(
      pickDefaultCameloScheduleId([
        { id: 's-1', name: 'Internal' },
        { id: 's-2', name: 'Clients' },
        { id: 's-3', name: 'On Call' },
      ]),
    ).toBe('s-2')
    expect(pickDefaultCameloScheduleId([{ id: 's-9', name: 'Main' }])).toBe('s-9')
    expect(pickDefaultCameloScheduleId([])).toBeNull()
  })

  it('builds cleaner-visible jobSite.note with pets, Airbnb, FR language, and property basics', () => {
    const note = buildDefaultJobSiteNote({
      notes: 'Side porch lockbox. Cat friendly.',
      pets: true,
      isAirbnb: true,
      language: 'fr',
      propertyType: '3-4bed',
      bedrooms: 3,
      bathrooms: 2,
      addOns: ['oven', 'fridge'],
    })
    expect(note).toContain('Side porch lockbox. Cat friendly.')
    expect(note).toContain('Pets on site (use pet-safe products)')
    expect(note).toContain('Airbnb turnover')
    expect(note).toContain('Preferred language: FR')
    expect(note).toContain('Property: 3-4bed, 3 bed, 2 bath, Add-ons: oven, fridge')
  })

  it('builds office-visible CLIENT comment with internal quote and selected pipeline contact notes', () => {
    const comment = buildDefaultClientComment(
      {
        serviceType: 'deep',
        frequency: 'biweekly',
        preferredDate: '2026-12-05',
        language: 'fr',
        leadSource: 'google',
        quotedPriceCents: 22500,
      },
      [
        { kind: 'call', body: 'Prefers Tuesday mornings', by: 'lauren@freshnest.ca' },
        { kind: 'sms', body: 'Confirmed eco-friendly products', by: 'ryan@freshnest.ca' },
      ],
    )
    expect(comment).toContain('Fresh Nest Sales Pipeline — Won Lead')
    expect(comment).toContain('Service: deep · Frequency: biweekly · Preferred start: 2026-12-05')
    expect(comment).toContain('Language: FR · Source: google · Quoted: $225.00 CAD')
    expect(comment).toContain('- [call] Prefers Tuesday mornings (lauren@freshnest.ca)')
    expect(comment).toContain('- [sms] Confirmed eco-friendly products (ryan@freshnest.ca)')
  })

  it('exposes Cornwall fallback coordinates for rural geocoding misses', () => {
    expect(FALLBACK_CORNWALL_COORDS.lat).toBeCloseTo(45.0213, 3)
    expect(FALLBACK_CORNWALL_COORDS.lon).toBeCloseTo(-74.7303, 3)
  })
})
