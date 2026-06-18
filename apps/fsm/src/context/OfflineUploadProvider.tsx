import React, { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase/firebase'
import { getQueuedPhotos, addQueuedPhoto, deleteQueuedPhoto, QueuedPhoto } from '../lib/utils/indexedDb'
import { OfflineUploadContext } from './OfflineUploadContext'
import type { Job, JobPhoto, ChecklistCompletion } from '../types'

export const OfflineUploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const photos = await getQueuedPhotos()
      setPendingCount(photos.length)
    } catch (err) {
      console.error('Error getting queued photo count:', err)
    }
  }, [])

  // Sync queue function
  const syncPendingPhotos = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    const photos = await getQueuedPhotos()
    if (photos.length === 0) return

    setIsSyncing(true)
    console.log(`Starting sync of ${photos.length} offline photos...`)

    for (const queuedPhoto of photos) {
      try {
        const { id, jobId, taskId, blob, capturedAt, geoLat, geoLng, staffId } = queuedPhoto
        
        // 1. Upload to Firebase Storage
        const storagePath = `jobs/${jobId}/photos/${id}`
        const storageRef = ref(storage, storagePath)
        await uploadBytes(storageRef, blob)
        const downloadUrl = await getDownloadURL(storageRef)

        // 2. Fetch latest Job document to update arrays
        const jobRef = doc(db, 'jobs', jobId)
        const jobSnap = await getDoc(jobRef)

        if (jobSnap.exists()) {
          const jobData = jobSnap.data() as Omit<Job, 'id'>
          const currentPhotos: JobPhoto[] = jobData.photos || []
          const currentCompletions: ChecklistCompletion[] = jobData.checklistCompletions || []
          const tempUrlPattern = `temp:${id}`

          const newPhoto: JobPhoto = {
            id,
            taskId,
            url: downloadUrl,
            capturedAt: new Date(capturedAt),
            lat: geoLat ?? undefined,
            lng: geoLng ?? undefined,
            staffId,
          }

          // Replace temp URL or append in photos array
          let photoExists = false
          const updatedPhotos = currentPhotos.map((p) => {
            if (p.id === id || p.url === tempUrlPattern) {
              photoExists = true
              return newPhoto
            }
            return p
          })
          if (!photoExists) {
            updatedPhotos.push(newPhoto)
          }

          // Replace temp URL in checklistCompletions array
          const updatedCompletions = currentCompletions.map((comp) => {
            if (comp.taskId === taskId) {
              const compPhotos = comp.photos || []
              let compPhotoExists = false
              const updatedCompPhotos = compPhotos.map((p) => {
                if (p.id === id || p.url === tempUrlPattern) {
                  compPhotoExists = true
                  return newPhoto
                }
                return p
              })
              if (!compPhotoExists) {
                updatedCompPhotos.push(newPhoto)
              }
              return { ...comp, photos: updatedCompPhotos }
            }
            return comp
          })

          // Save updates back to Firestore
          await updateDoc(jobRef, {
            photos: updatedPhotos,
            checklistCompletions: updatedCompletions,
          })
        }

        // 3. Delete from IndexedDB queue
        await deleteQueuedPhoto(id)
      } catch (err) {
        console.error(`Failed to sync queued photo ${queuedPhoto.id}:`, err)
      }
    }

    await refreshPendingCount()
    setIsSyncing(false)
  }, [isSyncing, refreshPendingCount])

  // Monitor online transition
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        void syncPendingPhotos()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncPendingPhotos])

  // Initialize pending count on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshPendingCount()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshPendingCount])

  // Queue photo upload
  const queuePhotoUpload = async (
    jobId: string,
    taskId: string,
    blob: Blob,
    staffId: string,
    geoCoords: { lat: number; lng: number } | null
  ): Promise<string> => {
    const photoId = crypto.randomUUID ? crypto.randomUUID() : `photo-${Math.random().toString(36).substring(2)}-${Date.now()}`
    const tempUrlPattern = `temp:${photoId}`
    const capturedAtIso = new Date().toISOString()

    const queuedPhoto: QueuedPhoto = {
      id: photoId,
      jobId,
      taskId,
      blob,
      capturedAt: capturedAtIso,
      geoLat: geoCoords ? geoCoords.lat : null,
      geoLng: geoCoords ? geoCoords.lng : null,
      geoTagged: !!geoCoords,
      staffId,
    }

    // 1. Save to local IndexedDB queue
    await addQueuedPhoto(queuedPhoto)
    await refreshPendingCount()

    // 2. Write temp reference immediately to Firestore cache
    try {
      const jobRef = doc(db, 'jobs', jobId)
      const jobSnap = await getDoc(jobRef)
      if (jobSnap.exists()) {
        const jobData = jobSnap.data() as Omit<Job, 'id'>
        const currentPhotos: JobPhoto[] = jobData.photos || []
        const currentCompletions: ChecklistCompletion[] = jobData.checklistCompletions || []

        const tempPhotoMeta: JobPhoto = {
          id: photoId,
          taskId,
          url: tempUrlPattern,
          capturedAt: new Date(capturedAtIso),
          lat: queuedPhoto.geoLat ?? undefined,
          lng: queuedPhoto.geoLng ?? undefined,
          staffId,
        }

        const updatedPhotos = [...currentPhotos, tempPhotoMeta]

        const updatedCompletions = currentCompletions.map((comp) => {
          if (comp.taskId === taskId) {
            const compPhotos = comp.photos || []
            return {
              ...comp,
              photos: [...compPhotos, tempPhotoMeta],
            }
          }
          return comp
        })

        // This update will save in local IndexedDB Firestore cache immediately
        await updateDoc(jobRef, {
          photos: updatedPhotos,
          checklistCompletions: updatedCompletions,
        })
      }
    } catch (err) {
      console.error('Error writing temporary photo reference to Firestore:', err)
    }

    // 3. Attempt to upload immediately if online
    if (navigator.onLine) {
      setTimeout(() => {
        void syncPendingPhotos()
      }, 0)
    }

    return tempUrlPattern
  }

  return (
    <OfflineUploadContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        queuePhotoUpload,
        syncPendingPhotos,
      }}
    >
      {children}
    </OfflineUploadContext.Provider>
  )
}
