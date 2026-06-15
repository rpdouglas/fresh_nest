import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import type { Job } from '../types'

export function useShifts(enabled: boolean) {
  const shiftsQuery = useMemo(() => {
    return query(
      collection(db, 'jobs'),
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
    return data.docs.map((docSnap) => {
      const docData = docSnap.data()
      return {
        id: docSnap.id,
        ...docData,
        createdAt:   docData.createdAt instanceof Timestamp ? docData.createdAt.toDate()   : new Date(),
        checkedInAt: docData.checkedInAt instanceof Timestamp ? docData.checkedInAt.toDate() : null,
        completedAt: docData.completedAt instanceof Timestamp ? docData.completedAt.toDate() : null,
      } as Job
    })
  }, [data])

  return {
    shifts,
    isLoading,
    error,
  }
}
