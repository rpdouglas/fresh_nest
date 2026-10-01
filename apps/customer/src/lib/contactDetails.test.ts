import { describe, it, expect } from 'vitest'
import en from '@/i18n/locales/en.json'
import fr from '@/i18n/locales/fr.json'
import { BUSINESS_PHONE_DISPLAY, BUSINESS_PHONE_HREF, BUSINESS_PHONE_E164, BUSINESS_EMAIL } from '@/lib/config'

// Contact details live in lib/config.ts; the i18n copies must match (P3 Margaret: phone visible).
describe('business contact details', () => {
  it('phone formats all describe the same number', () => {
    const digits = (s: string) => s.replace(/\D/g, '').replace(/^1/, '')
    expect(digits(BUSINESS_PHONE_HREF)).toBe(digits(BUSINESS_PHONE_DISPLAY))
    expect(digits(BUSINESS_PHONE_E164)).toBe(digits(BUSINESS_PHONE_DISPLAY))
  })

  it.each([['en', en], ['fr', fr]] as const)('%s strings match lib/config.ts', (_lang, locale) => {
    expect(locale.phone).toBe(BUSINESS_PHONE_DISPLAY)
    expect(locale.offline.phoneNumber).toBe(BUSINESS_PHONE_DISPLAY)
    expect(locale.footer.email).toBe(BUSINESS_EMAIL)
    expect(JSON.stringify(locale)).not.toMatch(/935-3555|hello@freshnestco\.ca/)
  })
})
