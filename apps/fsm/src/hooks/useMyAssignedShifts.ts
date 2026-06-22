import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, where } from 'firebase/firestore'
import { jobsCollection } from '@freshnest/shared'
import { db } from '../lib/firebase/firebase'
import type { Job } from '../types'

export function useMyAssignedShifts(staffId: string | undefined, enabled: boolean) {
  const assignedQuery = useMemo(() => {
    return query(
      jobsCollection(db),
      where('assignedTo', '==', staffId || '')
    )
  }, [staffId])

  const { data, isLoading, error } = useCollectionQuery(assignedQuery, {
    queryKey: ['myAssignedShifts', staffId || ''],
    enabled: enabled && !!staffId,
  })

  const assignedShifts = useMemo<Job[]>(() => {
    if (!data) return []
    return data.docs
      .map((docSnap) => docSnap.data())
      .filter((job) => job.status !== 'cancelled')
  }, [data])

  return {
    assignedShifts,
    isLoading,
    error,
  }
}
