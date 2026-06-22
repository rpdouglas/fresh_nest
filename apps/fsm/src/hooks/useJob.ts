import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { jobsCollection } from '@freshnest/shared'
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

    const jobRef = doc(jobsCollection(db), jobId)

    const unsubscribe = onSnapshot(
      jobRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setJob(docSnap.data() || null)
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
