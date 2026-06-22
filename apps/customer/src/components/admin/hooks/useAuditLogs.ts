import { useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { auditLogCollection } from '@freshnest/shared'
import type { AuditEntry } from '@/types'

/**
 * useAuditLogs — fetches administrative overrides and logs from /auditLog.
 * Uses useCollectionQuery to subscribe to audit log updates.
 */
export function useAuditLogs(isAuthorized: boolean) {
  const auditQuery = useMemo(() => {
    return query(auditLogCollection(db), orderBy('changedAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(auditQuery, {
    queryKey: ['auditLogs'],
    enabled: isAuthorized,
  })

  const logs = useMemo<AuditEntry[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => docSnap.data())
  }, [data])

  return {
    logs,
    isLoading,
    error: error ? String(error) : null,
  }
}

