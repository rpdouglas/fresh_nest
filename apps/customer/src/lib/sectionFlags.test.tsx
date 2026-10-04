import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { SHOW_GALLERY, SHOW_TEAM, SHOW_REVIEWS } from '@/lib/config'
import { getLocalBusinessSchema } from '@/lib/utils/seo'
import Hero from '@/components/home/Hero'
import TrustBar from '@/components/home/TrustBar'
import Footer from '@/components/layout/Footer'
import en from '@/i18n/locales/en.json'
import fr from '@/i18n/locales/fr.json'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}))

vi.mock('@/lib/firebase/analytics', () => ({ logPhoneClicked: vi.fn() }))

vi.mock('framer-motion', () => {
  const strip = (Tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) => {
      const El = Tag as 'div'
      return <El className={className}>{children}</El>
    }
  return { motion: { div: strip('div'), h1: strip('h1'), p: strip('p'), ul: strip('ul'), li: strip('li') } }
})

const t = ((key: string) => key) as unknown as TFunction

// P3-E31: the gallery, team and reviews stay hidden until a human flips the flags in config.ts.
describe('P3-E31 hidden sections', () => {
  it('ships with the three sections switched off', () => {
    expect(SHOW_GALLERY).toBe(false)
    expect(SHOW_TEAM).toBe(false)
    expect(SHOW_REVIEWS).toBe(false)
  })

  it('footer has no gallery or reviews link', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/about')
    expect(hrefs).not.toContain('/gallery')
    expect(hrefs).not.toContain('/reviews')
  })

  it('trust bar does not claim a rating', () => {
    render(<MemoryRouter><TrustBar /></MemoryRouter>)
    expect(screen.getByText('trustBar.insured')).toBeInTheDocument()
    expect(screen.queryByText('trustBar.rating')).not.toBeInTheDocument()
  })

  it('business JSON-LD carries no rating or review markup', () => {
    const schema = getLocalBusinessSchema(t)
    expect(schema).not.toHaveProperty('aggregateRating')
    expect(schema).not.toHaveProperty('review')
  })
})

describe('P3-E31 hero order', () => {
  it('shows the logo, then the serving statement, then the headline, then the button', () => {
    render(<MemoryRouter><Hero /></MemoryRouter>)
    const logo = screen.getByAltText('Fresh Nest Co.')
    const subhead = screen.getByText('hero.subhead')
    const headline = screen.getByRole('heading', { level: 1 })
    const button = screen.getByRole('link', { name: 'common.bookNow' })
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(logo, subhead)).toBe(true)
    expect(follows(subhead, headline)).toBe(true)
    expect(follows(headline, button)).toBe(true)
  })
})

describe('P3-E31 FAQ payment methods', () => {
  it.each([['en', en], ['fr', fr]])('%s FAQ does not mention credit cards', (_lang, locale) => {
    expect(JSON.stringify(locale.faq)).not.toMatch(/credit card|cartes? de crédit/i)
  })
})
