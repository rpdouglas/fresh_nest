import { useState, useEffect } from 'react'
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import type { Job } from '../types'

export function useJob(jobId: string | undefined) {
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(!!jobId)
  const [error, setError] = useState<Error | null>(null)
  const [prevJobId, setPrevJobId] = useState<string | undefined>(jobId)

  if (jobId !== prevJobId) {
    setPrevJobId(jobId)
    setJob(null)
    setIsLoading(!!jobId)
    setError(null)
  }

  useEffect(() => {
    if (!jobId) {
      return
    }

    const jobRef = doc(db, 'jobs', jobId)

    const unsubscribe = onSnapshot(
      jobRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const docData = docSnap.data()
          setJob({
            id: docSnap.id,
            ...docData,
            createdAt:   docData.createdAt instanceof Timestamp ? docData.createdAt.toDate()   : new Date(),
            checkedInAt: docData.checkedInAt instanceof Timestamp ? docData.checkedInAt.toDate() : null,
            completedAt: docData.completedAt instanceof Timestamp ? docData.completedAt.toDate() : null,
          } as Job)
        } else {
          setJob(null)
          setError(new Error('Job not found'))
        }
        setIsLoading(false)
      },
      (err) => {
        console.error(`Error loading job ${jobId}:`, err)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [jobId])

  return {
    job,
    isLoading,
    error,
  }
}
