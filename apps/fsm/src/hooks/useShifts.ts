import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, where, orderBy } from 'firebase/firestore'
import { jobsCollection } from '@freshnest/shared'
import { db } from '../lib/firebase/firebase'
import type { Job } from '../types'

export function useShifts(enabled: boolean) {
  const shiftsQuery = useMemo(() => {
    return query(
      jobsCollection(db),
      where('status', '==', 'unassigned'),
      orderBy('createdAt', 'desc')
    )
  }, [])

  const { data, isLoading, error } = useCollectionQuery(shiftsQuery, {
    queryKey: ['availableShifts'],
    enabled,
  })

  const shifts = useMemo<Job[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => docSnap.data())
  }, [data])

  return {
    shifts,
    isLoading,
    error,
  }
}
