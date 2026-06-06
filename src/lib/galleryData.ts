import type { ServiceType } from '@/types'

export interface GalleryPair {
  id: string
  serviceKey: ServiceType
  captionKey: string
  featured: boolean
  beforeSrc: string | null
  afterSrc: string | null
}

// Phase 2: all beforeSrc/afterSrc are null (placeholders).
// E27 (Phase 4 photography pass) sets real paths — no component changes needed.
export const GALLERY_PAIRS: GalleryPair[] = [
  {
    id: 'kitchen-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.kitchenDeep.caption',
    featured: true,
    beforeSrc: null,
    afterSrc: null,
  },
  {
    id: 'airbnb-turnover',
    serviceKey: 'airbnb',
    captionKey: 'gallery.pairs.airbnbTurnover.caption',
    featured: true,
    beforeSrc: null,
    afterSrc: null,
  },
  {
    id: 'bathroom-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.bathroomDeep.caption',
    featured: true,
    beforeSrc: null,
    afterSrc: null,
  },
  {
    id: 'moveout-full',
    serviceKey: 'moveout',
    captionKey: 'gallery.pairs.moveoutFull.caption',
    featured: false,
    beforeSrc: null,
    afterSrc: null,
  },
  {
    id: 'postconstruction',
    serviceKey: 'postconstruction',
    captionKey: 'gallery.pairs.postconstruction.caption',
    featured: false,
    beforeSrc: null,
    afterSrc: null,
  },
]

export const FEATURED_PAIRS = GALLERY_PAIRS.filter(p => p.featured)
