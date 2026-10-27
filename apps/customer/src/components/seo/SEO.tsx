import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SITE_URL } from '@/lib/config'

interface SEOProps {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  /** Keep private or transactional pages (admin, login, thank-you, 404…) out of search results. */
  noindex?: boolean
}

/**
 * Reusable SEO component utilizing React 19 native metadata hoisting.
 * Renders title, meta description, canonical, Open Graph, and bilingual hreflang links.
 *
 * French is served at `?lang=fr` (read by the i18n language detector), so each language has its
 * own self-canonical URL and the hreflang pair points at canonical URLs.
 */
export default function SEO({ title, description, image, type = 'website', noindex = false }: SEOProps) {
  const location = useLocation()
  const { i18n } = useTranslation()
  const isFr = i18n.language === 'fr'

  const enUrl = `${SITE_URL}${location.pathname}`
  const frUrl = `${enUrl}?lang=fr`
  const canonicalUrl = isFr ? frUrl : enUrl
  const ogImage = image || `${SITE_URL}/images/og-image-1200x630.jpg`

  // index.html carries site-wide defaults (marked data-default) for crawlers that don't run
  // JavaScript. Once a page renders its own tags, drop the defaults so there's one of each.
  useEffect(() => {
    document.head.querySelectorAll('[data-default]').forEach((node) => node.remove())
  }, [])

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="fr" href={frUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={isFr ? 'fr_CA' : 'en_CA'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  )
}
