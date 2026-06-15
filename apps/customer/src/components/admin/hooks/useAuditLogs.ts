import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import type { AuditEntry } from '@/types'

interface FirestoreTimestamp {
  seconds: number
  nanoseconds: number
  toDate?: () => Date
}

interface RawAuditDoc {
  collection: string
  documentId: string
  field: string
  oldValue: unknown
  newValue: unknown
  changedBy: string
  changedAt: FirestoreTimestamp | string | number | Date
  reason?: string | null
  overrideType?: string | null
}

/**
 * useAuditLogs — fetches administrative overrides and logs from /auditLog.
 * Uses useCollectionQuery to subscribe to audit log updates.
 */
export function useAuditLogs(isAuthorized: boolean) {
  const auditQuery = useMemo(() => {
    return query(collection(db, 'auditLog'), orderBy('changedAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(auditQuery, {
    queryKey: ['auditLogs'],
    enabled: isAuthorized,
  })

  const logs = useMemo<AuditEntry[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => {
      const docData = docSnap.data() as RawAuditDoc
      
      let changedAtDate: Date
      const rawChangedAt = docData.changedAt
      if (
        rawChangedAt &&
        typeof rawChangedAt === 'object' &&
        'toDate' in rawChangedAt &&
        typeof rawChangedAt.toDate === 'function'
      ) {
        changedAtDate = rawChangedAt.toDate()
      } else if (rawChangedAt) {
        changedAtDate = new Date(rawChangedAt as string | number | Date)
      } else {
        changedAtDate = new Date()
      }
      
      return {
        id: docSnap.id,
        collection: docData.collection,
        documentId: docData.documentId,
        field: docData.field,
        oldValue: docData.oldValue,
        newValue: docData.newValue,
        changedBy: docData.changedBy,
        changedAt: changedAtDate,
        reason: docData.reason ?? null,
        overrideType: docData.overrideType ?? null,
      }
    })
  }, [data])

  return {
    logs,
    isLoading,
    error: error ? String(error) : null,
  }
}

