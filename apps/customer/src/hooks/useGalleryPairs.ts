import { useQuery } from '@tanstack/react-query'
import { fetchPublishedGalleryPairs } from '@/lib/firebase/gallery'
import { SHOW_GALLERY } from '@/lib/config'

/** Published before/after pairs for the public site, in display order (P3-E32). */
export function useGalleryPairs() {
  return useQuery({
    queryKey: ['galleryPairs', 'published'],
    queryFn: fetchPublishedGalleryPairs,
    enabled: SHOW_GALLERY,
    staleTime: 5 * 60 * 1000,
  })
}
