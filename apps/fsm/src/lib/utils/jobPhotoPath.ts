/**
 * Storage path for a crew job photo. storage.rules only lets a staff member create files in
 * their own folder (`{staffId}` = their auth uid), so the path carries the uploader's uid.
 */
export function jobPhotoPath(jobId: string, staffId: string, photoId: string): string {
  return `jobs/${jobId}/photos/${staffId}/${photoId}`
}
