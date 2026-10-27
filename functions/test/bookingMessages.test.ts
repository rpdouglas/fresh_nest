import { describe, it, expect } from 'vitest'
import {
  clientSubject,
  clientHtml,
  ownerSubject,
  ownerText,
  isQuoteRequest,
  isRenewal,
  isAdminCreated,
  RENEWAL_CREATED_BY,
  type BookingData,
} from '../src/emailTemplates'
import { confirmationSms, ownerAlertSms } from '../src/smsTemplates'

// P3-E29: public submissions are quote requests — messages must not imply a confirmed,
// priced booking, and must never contain prices.

const booking = (overrides: Partial<BookingData> = {}): BookingData => ({
  firstName: 'Diane',
  lastName: 'Lafleur',
  email: 'diane@example.com',
  phone: '6135550100',
  language: 'fr',
  serviceType: 'standard',
  propertyType: '3-4bed',
  bedrooms: 3,
  bathrooms: 2,
  frequency: 'biweekly',
  preferredDate: '2026-10-15',
  address: '12 Pitt St, Cornwall ON',
  status: 'pending',
  ...overrides,
})

const PRICE = /\$\s?\d|\d\s?\$|\d+\s?%|rabais|discount|HST|TVH/i
// Visible text only — the email layout uses width="100%" attributes.
const text = (html: string) => html.replace(/<[^>]*>/g, ' ')

describe('isQuoteRequest', () => {
  it('treats pending (and missing) status as a quote request, confirmed as a booking', () => {
    expect(isQuoteRequest({ status: 'pending' })).toBe(true)
    expect(isQuoteRequest({})).toBe(true)
    expect(isQuoteRequest({ status: 'confirmed' })).toBe(false)
  })
})

describe('client confirmation email', () => {
  it('P1 Diane: French quote request says a quote will follow — not "confirmée"', () => {
    const b = booking()
    expect(clientSubject('fr', isQuoteRequest(b))).toMatch(/demande de devis/)
    const html = clientHtml(b, 'fr')
    expect(html).toMatch(/Nous avons reçu votre demande/)
    expect(html).toMatch(/devis/)
    expect(html).not.toMatch(/confirmée/)
    expect(text(html)).not.toMatch(PRICE)
  })

  it('English quote request says a quote will follow', () => {
    const b = booking({ language: 'en', firstName: 'Margaret' })
    expect(clientSubject('en', isQuoteRequest(b))).toMatch(/quote request/)
    const html = clientHtml(b, 'en')
    expect(html).toMatch(/We received your request/)
    expect(html).toMatch(/within 24 hours/)
    expect(html).not.toMatch(/booking is confirmed/)
    expect(text(html)).not.toMatch(PRICE)
  })

  it('admin-confirmed bookings keep the confirmed wording', () => {
    const b = booking({ language: 'en', status: 'confirmed' })
    expect(clientSubject('en', isQuoteRequest(b))).toMatch(/is booked/)
    expect(clientHtml(b, 'en')).toMatch(/Your booking is confirmed/)
  })
})

describe('owner notification', () => {
  it('flags quote requests for follow-up', () => {
    const b = booking()
    expect(ownerSubject(b)).toMatch(/^New quote request/)
    expect(ownerText(b, 'abc123')).toMatch(/follow up with a quote/)
  })

  it('P12 Lauren: a recurring renewal asks for confirmation, not a quote', () => {
    const b = booking({ createdBy: RENEWAL_CREATED_BY, referralCode: 'DIANE-AB12' })
    expect(isRenewal(b)).toBe(true)
    expect(isQuoteRequest(b)).toBe(false)
    expect(ownerSubject(b)).toMatch(/^Recurring renewal/)
    expect(ownerText(b, 'abc123')).toMatch(/confirm it in the admin panel/)
    expect(ownerText(b, 'abc123')).not.toMatch(/quote/)
  })

  it('admin phone-in bookings are not renewals', () => {
    expect(isRenewal(booking({ createdBy: 'lauren@freshnestco.ca' }))).toBe(false)
  })
})

describe('confirmation SMS', () => {
  it('says a quote will follow in EN and FR, with no prices', () => {
    const en = confirmationSms('Travis', 'standard', '2026-10-15', 'en', true)
    const fr = confirmationSms('Diane', 'standard', '2026-10-15', 'fr', true)
    expect(en).toMatch(/quote request/)
    expect(fr).toMatch(/demande de devis/)
    expect(en).not.toMatch(/is booked/)
    expect(fr).not.toMatch(/est réservé/)
    expect(en).not.toMatch(PRICE)
    expect(fr).not.toMatch(PRICE)
  })

  it('uses the current business phone number', () => {
    expect(confirmationSms('Travis', 'standard', '2026-10-15', 'en', true)).toContain('(613) 861-8812')
    expect(clientHtml(booking({ language: 'en' }), 'en')).toContain('tel:+16138618812')
  })
})

describe('owner alert SMS (P12 Lauren — never miss a request while email is down)', () => {
  it('a website quote request gives the client, phone and short reference — no prices', () => {
    const sms = ownerAlertSms(booking(), 'abcd1234wxyz', false)
    expect(sms).toMatch(/^Fresh Nest Co\.: New quote request — Diane Lafleur/)
    expect(sms).toContain('Standard Clean')
    expect(sms).toContain('2026-10-15')
    expect(sms).toContain('6135550100')
    expect(sms).toContain('Ref #ABCD1234') // matches the thank-you page reference
    expect(sms).toMatch(/within 24 hours/)
    expect(sms).not.toMatch(PRICE)
  })

  it('a renewal asks for confirmation instead of a quote', () => {
    const sms = ownerAlertSms(booking(), 'abcd1234wxyz', true)
    expect(sms).toMatch(/Recurring renewal — Diane Lafleur/)
    expect(sms).toMatch(/Confirm it in the admin panel/)
    expect(sms).not.toMatch(/quote/)
  })

  it('is skipped only for admin phone-in bookings', () => {
    expect(isAdminCreated(booking())).toBe(false)
    expect(isAdminCreated(booking({ createdBy: RENEWAL_CREATED_BY }))).toBe(false)
    expect(isAdminCreated(booking({ createdBy: 'lauren@freshnestco.ca' }))).toBe(true)
  })
})
