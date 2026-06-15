import { useContext } from 'react'
import { OfflineUploadContext } from '../context/OfflineUploadContext'

export function useOfflineUploads() {
  const context = useContext(OfflineUploadContext)
  if (context === undefined) {
    throw new Error('useOfflineUploads must be used within an OfflineUploadProvider')
  }
  return context
}
