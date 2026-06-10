import { useLocation } from 'react-router-dom'

interface SEOProps {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}

/**
 * Reusable SEO component utilizing React 19 native metadata hoisting.
 * Renders title, meta description, Open Graph, and bilingual hreflang links.
 */
export default function SEO({ title, description, image, type = 'website' }: SEOProps) {
  const location = useLocation()
  const baseUrl = 'https://lilypad-freshnest.web.app'
  const canonicalUrl = `${baseUrl}${location.pathname}`

  // Default fallback OG image
  const ogImage = image || `${baseUrl}/images/og-image-1200x630.jpg`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang alternate links with query param */}
      <link rel="alternate" hrefLang="en" href={`${canonicalUrl}?lang=en`} />
      <link rel="alternate" hrefLang="fr" href={`${canonicalUrl}?lang=fr`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  )
}
