import type { ServiceType } from '@/types'

export interface GalleryPair {
  id: string
  serviceKey: ServiceType
  captionKey: string
  featured: boolean
  beforeSrc: string | null
  afterSrc: string | null
}

// Phase 2: all beforeSrc/afterSrc were null (placeholders).
// E27 (Phase 4 photography pass) sets real paths — no component changes needed.
export const GALLERY_PAIRS: GalleryPair[] = [
  {
    id: 'kitchen-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.kitchenDeep.caption',
    featured: true,
    beforeSrc: '/images/gallery/kitchen-deep-before.png',
    afterSrc: '/images/gallery/kitchen-deep-after.png',
  },
  {
    id: 'airbnb-turnover',
    serviceKey: 'airbnb',
    captionKey: 'gallery.pairs.airbnbTurnover.caption',
    featured: true,
    beforeSrc: '/images/gallery/airbnb-before.png',
    afterSrc: '/images/gallery/airbnb-after.png',
  },
  {
    id: 'bathroom-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.bathroomDeep.caption',
    featured: true,
    beforeSrc: '/images/gallery/bathroom-before.png',
    afterSrc: '/images/gallery/bathroom-after.png',
  },
  {
    id: 'moveout-full',
    serviceKey: 'moveout',
    captionKey: 'gallery.pairs.moveoutFull.caption',
    featured: false,
    beforeSrc: '/images/gallery/moveout-before.png',
    afterSrc: '/images/gallery/moveout-after.png',
  },
  {
    id: 'postconstruction',
    serviceKey: 'postconstruction',
    captionKey: 'gallery.pairs.postconstruction.caption',
    featured: false,
    beforeSrc: '/images/gallery/postconstruction-before.png',
    afterSrc: '/images/gallery/postconstruction-after.png',
  },
]

export const FEATURED_PAIRS = GALLERY_PAIRS.filter(p => p.featured)
