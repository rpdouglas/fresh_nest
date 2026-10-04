import { useEffect, useState } from 'react'
import { subscribeToAllGalleryPairs } from '@/lib/firebase/gallery'
import type { GalleryPair } from '@/types'

/** Live list of every gallery pair, published or not, for the admin Gallery tab. */
export function useGalleryAdmin(isAuthorized: boolean) {
  const [pairs, setPairs] = useState<GalleryPair[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!isAuthorized) return
    return subscribeToAllGalleryPairs(
      isAuthorized,
      (next) => {
        setPairs(next)
        setLoadFailed(false)
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load gallery pairs:', err)
        setLoadFailed(true)
        setLoading(false)
      },
    )
  }, [isAuthorized])

  return { pairs, loading, loadFailed }
}
