import { describe, it, expect } from 'vitest'
import en from './locales/en.json'
import fr from './locales/fr.json'
import { BLOG_POSTS } from '@/lib/data/blogData'

// P3-E29 (human decision 2026-09-30): the public site shows no prices or discounts.
// Pricing is discussed in the quote follow-up. Adding public pricing back requires a
// human decision and an update to this test.

// Internal/non-customer namespaces: admin tools, review moderation, and staff wages on Careers.
const EXCLUDED_PREFIXES = ['admin.', 'reviewsModeration.', 'careersPage.', 'team.']

const PRICE_PATTERN = new RegExp(
  [
    String.raw`\$\s?\d`, String.raw`\d\s?\$`,            // $150, 150 $
    String.raw`\$\{\{`, String.raw`\}\}\s?\$`,           // ${{min}}, {{min}} $
    String.raw`\d+\s?%\s?(off|de rabais)`,               // 20% off, 20 % de rabais
    String.raw`\bdiscount`, 'rabais', 'save up to', String.raw`\bsave \d`, 'économisez',
    'starting (at|from)', 'à partir de',
    String.raw`\bpricing\b`, String.raw`\bprices?\b`, String.raw`\bprix\b`, String.raw`\btarif`,
    String.raw`\bHST\b`, String.raw`\bTVH\b`, 'promo code', 'code promo',
  ].join('|'),
  'i',
)

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Array<[string, string]> {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value] as [string, string]] : flatten(value, `${prefix}${key}.`),
  )
}

function priceStrings(tree: Tree): string[] {
  return flatten(tree)
    .filter(([key]) => !EXCLUDED_PREFIXES.some((p) => key.startsWith(p)))
    .filter(([, value]) => PRICE_PATTERN.test(value))
    .map(([key, value]) => `${key}: ${value}`)
}

describe('No public pricing or discounts (P3-E29)', () => {
  it('English customer-facing copy has no prices or discounts', () => {
    expect(priceStrings(en as Tree)).toEqual([])
  })

  it('French customer-facing copy has no prices or discounts', () => {
    expect(priceStrings(fr as Tree)).toEqual([])
  })

  it('published blog posts contain no prices or discounts', () => {
    const offending = BLOG_POSTS.flatMap((post) =>
      [post.title, post.description, post.content]
        .flatMap((text) => [text.en, text.fr])
        .filter((text) => PRICE_PATTERN.test(text))
        .map(() => post.slug),
    )
    expect(offending).toEqual([])
  })

  it('the guard catches the kinds of strings that were removed', () => {
    for (const sample of ['Starting at ${{price}}', 'Save 20%', '20% off', 'À partir de {{min}} $', '$20 off applied', 'Transparent Pricing']) {
      expect(PRICE_PATTERN.test(sample), sample).toBe(true)
    }
  })
})
