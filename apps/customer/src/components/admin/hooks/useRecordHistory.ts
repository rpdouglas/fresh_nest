import { useCallback, useEffect, useState } from 'react'
import { getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { auditLogCollection } from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import type { AuditEntry } from '@/types'

export interface HistoryRecord {
  collection: string
  id: string
}

/** Most recent entries loaded per record; the section says when the limit is reached. */
export const HISTORY_LIMIT = 50

/**
 * P3-E37: the audit history of one or more records (e.g. a booking and its job), newest first.
 * Loads only while `enabled` (the History section is open). Uses the
 * auditLog(collection, documentId, changedAt desc) index.
 */
export function useRecordHistory(records: HistoryRecord[], enabled: boolean) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [atLimit, setAtLimit] = useState(false)
  const key = records.map((r) => `${r.collection}/${r.id}`).join('|')

  const load = useCallback(async () => {
    const list = key ? key.split('|').map((k) => { const [collection, id] = k.split('/'); return { collection, id } }) : []
    setLoading(true)
    setError(false)
    try {
      const snaps = await Promise.all(
        list.map((r) =>
          getDocs(query(
            auditLogCollection(db),
            where('collection', '==', r.collection),
            where('documentId', '==', r.id),
            orderBy('changedAt', 'desc'),
            limit(HISTORY_LIMIT),
          )),
        ),
      )
      setAtLimit(snaps.some((s) => s.size >= HISTORY_LIMIT))
      setEntries(
        snaps.flatMap((s) => s.docs.map((d) => d.data())).sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime()),
      )
    } catch (err) {
      console.error('Error loading record history:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    if (!enabled || !key) return
    // Deferred like the other admin loaders, so state isn't set synchronously inside the effect.
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [enabled, key, load])

  return { entries, loading, error, atLimit, reload: load }
}
