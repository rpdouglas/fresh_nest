import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import type { Job } from '../types'

export function useMyAssignedShifts(staffId: string | undefined, enabled: boolean) {
  const assignedQuery = useMemo(() => {
    return query(
      collection(db, 'jobs'),
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
      .map((docSnap) => {
        const docData = docSnap.data()
        return {
          id: docSnap.id,
          ...docData,
          createdAt:   docData.createdAt instanceof Timestamp ? docData.createdAt.toDate()   : new Date(),
          checkedInAt: docData.checkedInAt instanceof Timestamp ? docData.checkedInAt.toDate() : null,
          completedAt: docData.completedAt instanceof Timestamp ? docData.completedAt.toDate() : null,
        } as Job
      })
      .filter((job) => job.status !== 'cancelled')
  }, [data])

  return {
    assignedShifts,
    isLoading,
    error,
  }
}
