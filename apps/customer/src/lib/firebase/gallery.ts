import {
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { galleryPairsCollection } from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import type { GalleryPair, ServiceType } from '@/types'

export type GalleryPhotoSlot = 'before' | 'after'

export function sortGalleryPairs(pairs: GalleryPair[]): GalleryPair[] {
  return [...pairs].sort((a, b) => a.order - b.order)
}

/** Caption in the visitor's language. */
export function galleryCaption(pair: GalleryPair, language: string): string {
  return language.startsWith('fr') ? pair.captionFr : pair.captionEn
}

// ── Public read ──────────────────────────────────────────────────────────────

// Sorted in the browser so no composite index (published + order) is needed.
export async function fetchPublishedGalleryPairs(): Promise<GalleryPair[]> {
  const snapshot = await getDocs(query(galleryPairsCollection(db), where('published', '==', true)))
  return sortGalleryPairs(snapshot.docs.map((d) => d.data()))
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function subscribeToAllGalleryPairs(
  isAuthorized: boolean,
  callback: (pairs: GalleryPair[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (!isAuthorized) return () => {}
  return onSnapshot(
    galleryPairsCollection(db),
    (snapshot) => callback(sortGalleryPairs(snapshot.docs.map((d) => d.data()))),
    onError,
  )
}

async function uploadGalleryPhoto(pairId: string, slot: GalleryPhotoSlot, blob: Blob) {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
  const { storage } = await import('@/lib/firebase/storage')
  // A new file name per upload, so a replaced photo is never served from a stale cache.
  const path = `gallery/${pairId}/${slot}-${Date.now()}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' })
  return { path, url: await getDownloadURL(storageRef) }
}

async function deleteGalleryPhoto(path: string): Promise<void> {
  const { ref, deleteObject } = await import('firebase/storage')
  const { storage } = await import('@/lib/firebase/storage')
  try {
    await deleteObject(ref(storage, path))
  } catch (err) {
    // The pair is already gone or updated; an orphaned file is not worth failing the action.
    console.error(`Failed to delete gallery photo ${path}:`, err)
  }
}

export interface GalleryPairDetails {
  serviceKey: ServiceType
  captionEn: string
  captionFr: string
  consentConfirmed: boolean
}

export async function createGalleryPair(
  details: GalleryPairDetails,
  before: Blob,
  after: Blob,
  adminUid: string,
  order: number,
): Promise<string> {
  const docRef = doc(galleryPairsCollection(db))
  const [beforePhoto, afterPhoto] = await Promise.all([
    uploadGalleryPhoto(docRef.id, 'before', before),
    uploadGalleryPhoto(docRef.id, 'after', after),
  ])
  const now = new Date()
  // New pairs start unpublished: the admin reviews the result before it goes public.
  await setDoc(docRef, {
    ...details,
    beforePath: beforePhoto.path,
    beforeUrl: beforePhoto.url,
    afterPath: afterPhoto.path,
    afterUrl: afterPhoto.url,
    published: false,
    featured: false,
    order,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
  })
  return docRef.id
}

export async function updateGalleryPair(
  pair: GalleryPair,
  details: GalleryPairDetails,
  photos: { before?: Blob; after?: Blob },
): Promise<void> {
  const patch: Partial<GalleryPair> = { ...details, updatedAt: new Date() }
  const replaced: string[] = []
  if (photos.before) {
    const photo = await uploadGalleryPhoto(pair.id!, 'before', photos.before)
    patch.beforePath = photo.path
    patch.beforeUrl = photo.url
    replaced.push(pair.beforePath)
  }
  if (photos.after) {
    const photo = await uploadGalleryPhoto(pair.id!, 'after', photos.after)
    patch.afterPath = photo.path
    patch.afterUrl = photo.url
    replaced.push(pair.afterPath)
  }
  await updateDoc(doc(galleryPairsCollection(db), pair.id), patch)
  await Promise.all(replaced.map(deleteGalleryPhoto))
}

export async function setGalleryPairFlag(
  pairId: string,
  flag: 'published' | 'featured',
  value: boolean,
): Promise<void> {
  await updateDoc(doc(galleryPairsCollection(db), pairId), { [flag]: value, updatedAt: new Date() })
}

/** Swaps the display position of two pairs. */
export async function swapGalleryPairOrder(a: GalleryPair, b: GalleryPair): Promise<void> {
  const batch = writeBatch(db)
  const now = new Date()
  batch.update(doc(galleryPairsCollection(db), a.id), { order: b.order, updatedAt: now })
  batch.update(doc(galleryPairsCollection(db), b.id), { order: a.order, updatedAt: now })
  await batch.commit()
}

export async function deleteGalleryPair(pair: GalleryPair): Promise<void> {
  await deleteDoc(doc(galleryPairsCollection(db), pair.id))
  await Promise.all([deleteGalleryPhoto(pair.beforePath), deleteGalleryPhoto(pair.afterPath)])
}
