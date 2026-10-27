import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SITE_URL } from '@/lib/config'
import { BLOG_POSTS } from '@/lib/data/blogData'
import { getLocalBusinessSchema } from '@/lib/utils/seo'
import SEO from '@/components/seo/SEO'
import en from '@/i18n/locales/en.json'
import fr from '@/i18n/locales/fr.json'
import sitemap from '../../public/sitemap.xml?raw'
import robots from '../../public/robots.txt?raw'
import llms from '../../public/llms.txt?raw'
import indexHtml from '../../index.html?raw'
import appSource from '../App.tsx?raw'
import privacySource from '../pages/PrivacyPage.tsx?raw'
import notFoundSource from '../pages/NotFoundPage.tsx?raw'

const language = { current: 'en' }
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: language.current } }),
}))

// Stable files served from public/ (keys look like '../../public/images/og-image-1200x630.jpg').
const publicFiles = Object.keys(import.meta.glob('../../public/**/*.{png,jpg}')).map((f) => f.replace('../../public', ''))

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const enPaths = locs.filter((l) => !l.endsWith('?lang=fr')).map((l) => l.slice(SITE_URL.length))

// Every static route in App.tsx is either in the sitemap or deliberately left out.
const NOT_INDEXED = new Set([
  'pricing', 'gallery', 'reviews', 'thank-you', 'leave-review', 'offline', 'admin',
  'login', 'login-confirm', 'account', 'bookings', 'upcoming', 'profile', 'blog/:slug', '*', '/',
])
const routes = [...appSource.matchAll(/path: '([^']+)'/g)].map((m) => m[1])

describe('sitemap.xml, robots.txt and llms.txt (SEO / AEO)', () => {
  it('lists every indexable route, every blog post and the home page', () => {
    const expected = [
      '/',
      ...routes.filter((r) => !NOT_INDEXED.has(r)).map((r) => `/${r}`),
      ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
    ]
    expect([...enPaths].sort()).toEqual([...new Set(expected)].sort())
  })

  it('pairs every English URL with its French ?lang=fr URL on the canonical domain', () => {
    expect(locs.every((l) => l.startsWith(`${SITE_URL}/`))).toBe(true)
    for (const p of enPaths) expect(locs).toContain(`${SITE_URL}${p}?lang=fr`)
    expect(locs).toHaveLength(enPaths.length * 2)
  })

  it('robots.txt allows crawling and points at the sitemap', () => {
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).not.toMatch(/^Disallow: \/\s*$/m)
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it('llms.txt links only to real pages on the canonical domain, with no prices (P3-E29)', () => {
    const links = [...llms.matchAll(/\((https:\/\/[^)]+)\)/g)].map((m) => m[1])
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(enPaths).toContain(link.slice(SITE_URL.length))
    expect(llms).not.toMatch(/\$\s?\d|\d\s?\$|\d+\s?%/)
  })

  it('index.html defaults use the canonical domain', () => {
    expect(indexHtml).not.toContain('web.app')
    expect(indexHtml).toContain(`content="${SITE_URL}/"`)
  })
})

describe('LocalBusiness JSON-LD', () => {
  it('points logo and image at stable public files, not hashed build assets', () => {
    const schema = getLocalBusinessSchema(((k: string) => k) as never)
    for (const key of ['logo', 'image'] as const) {
      const url = schema[key] as string
      expect(url.startsWith(SITE_URL)).toBe(true)
      expect(url).not.toContain('/assets/')
      expect(publicFiles).toContain(url.slice(SITE_URL.length))
    }
  })
})

describe('<SEO>', () => {
  beforeEach(() => {
    document.head.innerHTML = '<title data-default>Default</title><meta name="description" content="d" data-default>'
  })

  const renderAt = (url: string, props: { noindex?: boolean } = {}) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <SEO title="Deep Clean" description="desc" {...props} />
      </MemoryRouter>,
    )
  const head = (selector: string) => [...document.head.querySelectorAll(selector)]

  it('English: self-canonical, hreflang pair, defaults removed, indexable', () => {
    language.current = 'en'
    renderAt('/services/deep-cleaning')
    expect(head('link[rel=canonical]').map((l) => l.getAttribute('href'))).toEqual([`${SITE_URL}/services/deep-cleaning`])
    expect(head('link[hreflang=fr]')[0]?.getAttribute('href')).toBe(`${SITE_URL}/services/deep-cleaning?lang=fr`)
    expect(head('link[hreflang=en]')[0]?.getAttribute('href')).toBe(`${SITE_URL}/services/deep-cleaning`)
    expect(head('title').map((t) => t.textContent)).toEqual(['Deep Clean'])
    expect(head('meta[name=description]')).toHaveLength(1)
    expect(head('meta[name=robots]')).toHaveLength(0)
  })

  it('French (P1 Diane, P5 Sophie): canonical is the ?lang=fr URL so French pages can be indexed', () => {
    language.current = 'fr'
    renderAt('/locations/snye-qc?lang=fr')
    expect(head('link[rel=canonical]')[0]?.getAttribute('href')).toBe(`${SITE_URL}/locations/snye-qc?lang=fr`)
    expect(head('meta[property="og:locale"]')[0]?.getAttribute('content')).toBe('fr_CA')
  })

  it('noindex pages carry a robots noindex tag', () => {
    language.current = 'en'
    renderAt('/admin', { noindex: true })
    expect(head('meta[name=robots]')[0]?.getAttribute('content')).toBe('noindex')
  })
})

describe('privacy policy and 404 copy', () => {
  // The privacy page shipped without any of its strings (it showed raw keys).
  const used = (source: string, ns: string) =>
    [...source.matchAll(new RegExp(`t\\('(${ns}\\.[^']+)'\\)`, 'g'))].map((m) => m[1])
  const lookup = (tree: unknown, key: string): unknown =>
    key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], tree)

  it.each([['en', en], ['fr', fr]] as const)('%s has every string the pages use', (lng, resources) => {
    const keys = [...used(privacySource, 'privacyPage'), ...used(notFoundSource, 'notFound')]
    expect(keys.length).toBeGreaterThan(15)
    for (const key of keys) {
      const value = lookup(resources, key)
      expect(typeof value === 'string' && value.length > 0, `${lng}: ${key}`).toBe(true)
    }
  })
})
