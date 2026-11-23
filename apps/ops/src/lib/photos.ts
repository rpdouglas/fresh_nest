// Shrinking a photo on the phone before it is sent (decision 0044): a phone's camera makes 3-8 MB pictures, and a
// visit needs a clear one, not a huge one. The longest side becomes at most MAX_SIDE pixels, saved as a JPEG.
import type { VisitPhoto } from '../types'

const MAX_SIDE = 1600
const QUALITY = 0.75

/** The picture's size once shrunk to fit MAX_SIDE, keeping its shape. Pure, so it is tested on its own. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Groups a list of photos by shift id, sharing a visit's photos across partner shifts
 * (`shiftPartners`) so both cleaners' rows show the visit's photos regardless of which
 * partner took them (decision 0044).
 */
export function groupVisitPhotos(
  shifts: readonly { id: string; shiftPartners?: readonly { id: string }[] | null }[],
  photos: readonly VisitPhoto[],
): Map<string, VisitPhoto[]> {
  const own = new Map<string, VisitPhoto[]>()
  for (const p of photos) {
    const list = own.get(p.shiftId)
    if (list) list.push(p)
    else own.set(p.shiftId, [p])
  }
  const byVisit = new Map<string, VisitPhoto[]>(own)
  for (const s of shifts) {
    const ids = [s.id, ...(s.shiftPartners ?? []).map((p) => p.id)]
    const seen = new Set<string>()
    const combined: VisitPhoto[] = []
    for (const id of ids) {
      for (const p of own.get(id) ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          combined.push(p)
        }
      }
    }
    if (combined.length > 0) {
      combined.sort((a, b) => a.takenAt - b.takenAt)
      byVisit.set(s.id, combined)
    }
  }
  return byVisit
}

/** Looks up the photos for a visit id (or a `s1+s2` merged team visit key). */
export function photosForVisit(byVisit: Map<string, VisitPhoto[]>, visitId: string): VisitPhoto[] {
  if (byVisit.has(visitId)) return byVisit.get(visitId) ?? []
  if (!visitId.includes('+')) return []
  const seen = new Set<string>()
  const out: VisitPhoto[] = []
  for (const id of visitId.split('+')) {
    for (const p of byVisit.get(id) ?? []) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        out.push(p)
      }
    }
  }
  return out.sort((a, b) => a.takenAt - b.takenAt)
}

/** A photo from the camera or the gallery as a shrunk JPEG, base64 without its `data:` prefix. */
export async function shrinkPhoto(file: Blob): Promise<string> {
  // the photo's own orientation is applied, so a portrait shot stays upright
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const size = fitWithin(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}
