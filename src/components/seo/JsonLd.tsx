import type { SchemaOrgObject } from '@/lib/utils/seo'

interface Props {
  schema: SchemaOrgObject
}

/**
 * Reusable component to safely render JSON-LD schema markup
 * into the DOM for search engine crawlers.
 */
export default function JsonLd({ schema }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
