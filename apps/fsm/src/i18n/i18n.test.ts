import { describe, it, expect } from 'vitest'
import i18n from './index'

// Release scope: English + French only (human decision 2026-09-30).
// Adding a language requires a human decision and an update to this test.
describe('FSM i18n language scope', () => {
  it('registers only English and French resources', () => {
    expect(Object.keys(i18n.options.resources ?? {}).sort()).toEqual(['en', 'fr'])
  })

  it('supports only English and French', () => {
    const supported = (i18n.options.supportedLngs || []).filter((l) => l !== 'cimode')
    expect(supported.sort()).toEqual(['en', 'fr'])
  })

  it('ships only en.json and fr.json locale files', () => {
    const files = Object.keys(import.meta.glob('./locales/*.json')).sort()
    expect(files).toEqual(['./locales/en.json', './locales/fr.json'])
  })
})
