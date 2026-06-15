import { createContext } from 'react'

export interface OfflineUploadContextType {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  queuePhotoUpload: (
    jobId: string,
    taskId: string,
    blob: Blob,
    staffId: string,
    geoCoords: { lat: number; lng: number } | null
  ) => Promise<string>
  syncPendingPhotos: () => Promise<void>
}

export const OfflineUploadContext = createContext<OfflineUploadContextType | undefined>(undefined)
