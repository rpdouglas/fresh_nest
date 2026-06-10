import type { TFunction } from 'i18next'
import { STATIC_REVIEWS } from './reviewsData'

// Types for JSON-LD schemas to ensure valid outputs
export interface SchemaOrgObject {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

export const BASE_URL = 'https://lilypad-freshnest.web.app'

/**
 * Returns the LocalBusiness (specifically HomeAndConstructionBusiness) JSON-LD schema.
 */
export function getLocalBusinessSchema(t: TFunction): SchemaOrgObject {
  // Format reviews to match Schema.org format
  const reviews = STATIC_REVIEWS.map(r => ({
    '@type': 'Review',
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': r.rating,
      'bestRating': 5,
    },
    'author': {
      '@type': 'Person',
      'name': r.name,
    },
    'reviewBody': r.text,
    'publisher': {
      '@type': 'Organization',
      'name': 'Google'
    }
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${BASE_URL}/#organization`,
    'name': 'Fresh Nest Co.',
    'description': t('hero.subhead'),
    'url': BASE_URL,
    'logo': `${BASE_URL}/assets/logo-navbar-160px@2x-CvrLo3Hv.png`, // Matches resolved assets
    'image': `${BASE_URL}/assets/hero-CLDdwZDr.png`,
    'telephone': '+1-613-935-3555',
    'priceRange': '$$',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Cornwall',
      'addressRegion': 'ON',
      'addressCountry': 'CA',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 45.0216,
      'longitude': -74.7280,
    },
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '08:00',
        'closes': '18:00',
      }
    ],
    'areaServed': [
      { '@type': 'AdministrativeArea', 'name': 'Cornwall, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Akwesasne' },
      { '@type': 'AdministrativeArea', 'name': 'Snye, QC' },
      { '@type': 'AdministrativeArea', 'name': 'Long Sault, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Morrisburg, ON' },
    ],
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': 4.9,
      'reviewCount': STATIC_REVIEWS.length,
      'bestRating': 5,
    },
    'review': reviews,
  }
}

/**
 * Returns the Service JSON-LD schema for a specific service.
 */
export function getServiceSchema(
  serviceKey: 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'commercial' | 'airbnb',
  t: TFunction
): SchemaOrgObject {
  let serviceTitle: string
  let serviceDescription: string

  if (serviceKey === 'airbnb') {
    serviceTitle = t('airbnbPage.hero.heading')
    serviceDescription = t('airbnbPage.hero.subhead')
  } else {
    serviceTitle = t(`servicePage.${serviceKey}.hero.heading`)
    serviceDescription = t(`servicePage.${serviceKey}.hero.subhead`)
  }

  let route = ''
  switch (serviceKey) {
    case 'standard':
      route = 'standard-cleaning'
      break
    case 'deep':
      route = 'deep-cleaning'
      break
    case 'moveout':
      route = 'move-out-cleaning'
      break
    case 'postconstruction':
      route = 'post-construction'
      break
    case 'commercial':
      route = 'commercial-cleaning'
      break
    case 'airbnb':
      route = 'airbnb-turnover'
      break
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${BASE_URL}/services/${route}#service`,
    'name': serviceTitle,
    'description': serviceDescription,
    'provider': {
      '@type': 'HomeAndConstructionBusiness',
      '@id': `${BASE_URL}/#organization`,
      'name': 'Fresh Nest Co.',
      'url': BASE_URL,
      'telephone': '+1-613-935-3555',
    },
    'areaServed': [
      { '@type': 'AdministrativeArea', 'name': 'Cornwall, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Akwesasne' },
      { '@type': 'AdministrativeArea', 'name': 'Snye, QC' },
      { '@type': 'AdministrativeArea', 'name': 'Long Sault, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Morrisburg, ON' },
    ],
  }
}

/**
 * Returns the FAQPage JSON-LD schema.
 */
export function getFaqSchema(t: TFunction): SchemaOrgObject {
  const faqKeys = Array.from({ length: 10 }, (_, i) => i + 1)

  const mainEntity = faqKeys.map(num => ({
    '@type': 'Question',
    'name': t(`faq.item${num}.q`),
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': t(`faq.item${num}.a`),
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': mainEntity,
  }
}
