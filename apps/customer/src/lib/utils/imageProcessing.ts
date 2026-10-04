// P3-E32: fits a phone photo to the uniform gallery format in the browser, before upload.
// Drawing to a canvas and re-encoding drops all embedded metadata, including GPS location.

export const GALLERY_PHOTO_SIZE = 1200
export const GALLERY_PHOTO_MIN_SIZE = 600
export const GALLERY_PHOTO_QUALITY = 0.8
export const GALLERY_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type ImageProcessingError = 'unsupported' | 'unreadable' | 'tooSmall'

export class GalleryImageError extends Error {
  readonly code: ImageProcessingError
  constructor(code: ImageProcessingError) {
    super(code)
    this.code = code
  }
}

export interface SquareCrop {
  sx: number
  sy: number
  size: number
}

/**
 * The largest square that fits the photo, slid along the photo's long side.
 * `position` runs from 0 (left / top) to 1 (right / bottom); 0.5 is centred.
 * This matches CSS `object-fit: cover` with `object-position` at the same percentage,
 * so the preview shows exactly what is saved.
 */
export function computeSquareCrop(width: number, height: number, position: number): SquareCrop {
  const size = Math.min(width, height)
  const p = Math.min(1, Math.max(0, position))
  return {
    sx: Math.round((width - size) * p),
    sy: Math.round((height - size) * p),
    size,
  }
}

/** Output edge length: the uniform size, but never upscaled past the source. */
export function outputSize(cropSize: number): number {
  return Math.min(GALLERY_PHOTO_SIZE, cropSize)
}

async function decode(file: File): Promise<ImageBitmap> {
  if (!GALLERY_ACCEPTED_TYPES.includes(file.type)) throw new GalleryImageError('unsupported')
  try {
    // 'from-image' applies the phone's rotation flag so portrait photos come out upright.
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new GalleryImageError('unreadable')
  }
}

export async function processGalleryPhoto(file: File, position: number): Promise<Blob> {
  const bitmap = await decode(file)
  try {
    const crop = computeSquareCrop(bitmap.width, bitmap.height, position)
    if (crop.size < GALLERY_PHOTO_MIN_SIZE) throw new GalleryImageError('tooSmall')

    const edge = outputSize(crop.size)
    const canvas = document.createElement('canvas')
    canvas.width = edge
    canvas.height = edge
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new GalleryImageError('unreadable')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, crop.sx, crop.sy, crop.size, crop.size, 0, 0, edge, edge)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new GalleryImageError('unreadable'))),
        'image/jpeg',
        GALLERY_PHOTO_QUALITY,
      )
    })
  } finally {
    bitmap.close()
  }
}

/** Checks a picked file can be used, before the admin fills in the rest of the form. */
export async function checkGalleryPhoto(file: File): Promise<void> {
  const bitmap = await decode(file)
  const shortSide = Math.min(bitmap.width, bitmap.height)
  bitmap.close()
  if (shortSide < GALLERY_PHOTO_MIN_SIZE) throw new GalleryImageError('tooSmall')
}
