import { createContext } from 'react'
import type { VisitPhoto } from '../types'

/** What a page hands each visit: its photos, and whether a cleaner can add more here (decision 0044). */
export interface PhotosOnPage {
  token: string
  /** The visits that can have photos (today and earlier on My week; any with photos on the office reports). */
  byVisit: Map<string, VisitPhoto[]>
  loading: boolean
  onExpired: (message: string) => void
  /** True on My week where a cleaner adds photos; false on the office's reports where only visits with photos show them. */
  canAdd?: boolean
  /** True when the list of photos could not be loaded (Camelo or the network), with a way to ask again. */
  failed?: boolean
  retry?: () => void
}
export const PhotosContext = createContext<PhotosOnPage | null>(null)
