import { useEffect, useState, useCallback } from 'react'
import { onSnapshot, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import {
  DEFAULT_POLICY_SETTINGS,
  policySettingsDoc,
  policyHistoryCollection,
  type PolicySettingsValues,
  type PolicyHistoryEntry,
} from '@freshnest/shared'
import { db, functions } from '@/lib/firebase/firebase'

export interface UsePolicySettingsResult {
  policy: PolicySettingsValues
  version: number
  updatedAt: Date | null
  updatedBy: string | null
  lastChangeReason: string | null
  history: PolicyHistoryEntry[]
  loading: boolean
  error: string | null
  saveSettings: (
    values: PolicySettingsValues,
    reason?: string,
  ) => Promise<{ version: number; changesCount: number }>
}

type UpdatePolicyCallable = (
  data: PolicySettingsValues & { reason?: string },
) => Promise<{ data: { success: boolean; version: number; changesCount: number } }>

/**
 * P3-E36 (W0-2): Subscribes to `settings/policy` (and optionally `settings/policy/history`)
 * with safe fallback to `DEFAULT_POLICY_SETTINGS` when the document has not been saved yet.
 */
export function usePolicySettings(
  enabled: boolean,
  options?: { includeHistory?: boolean },
): UsePolicySettingsResult {
  const includeHistory = options?.includeHistory ?? false
  const [policy, setPolicy] = useState<PolicySettingsValues>(DEFAULT_POLICY_SETTINGS)
  const [version, setVersion] = useState<number>(0)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [updatedBy, setUpdatedBy] = useState<string | null>(null)
  const [lastChangeReason, setLastChangeReason] = useState<string | null>(null)
  const [history, setHistory] = useState<PolicyHistoryEntry[]>([])
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubDoc = onSnapshot(
      policySettingsDoc(db),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const {
            version: docVersion,
            updatedAt: docUpdatedAt,
            updatedBy: docUpdatedBy,
            lastChangeReason: docReason,
            ...values
          } = data
          setPolicy(values)
          setVersion(docVersion)
          setUpdatedAt(docUpdatedAt)
          setUpdatedBy(docUpdatedBy)
          setLastChangeReason(docReason ?? null)
        } else {
          setPolicy(DEFAULT_POLICY_SETTINGS)
          setVersion(0)
          setUpdatedAt(null)
          setUpdatedBy(null)
          setLastChangeReason(null)
        }
        setLoaded(true)
        setError(null)
      },
      (err) => {
        console.error('[usePolicySettings] Failed to read settings/policy:', err)
        setError(err.message)
        setLoaded(true)
      },
    )

    let unsubHistory: (() => void) | undefined
    if (includeHistory) {
      const historyQuery = query(policyHistoryCollection(db), orderBy('version', 'desc'))
      unsubHistory = onSnapshot(
        historyQuery,
        (snap) => {
          setHistory(snap.docs.map((d) => d.data()))
        },
        (err) => {
          console.error('[usePolicySettings] Failed to read settings/policy/history:', err)
        },
      )
    }

    return () => {
      unsubDoc()
      unsubHistory?.()
    }
  }, [enabled, includeHistory])

  const saveSettings = useCallback(
    async (values: PolicySettingsValues, reason?: string) => {
      const callable = httpsCallable(functions, 'updatePolicySettings') as unknown as UpdatePolicyCallable
      const response = await callable({
        ...values,
        reason: reason?.trim() || undefined,
      })
      return {
        version: response.data.version,
        changesCount: response.data.changesCount,
      }
    },
    [],
  )

  return {
    policy,
    version,
    updatedAt,
    updatedBy,
    lastChangeReason,
    history,
    loading: enabled && !loaded,
    error,
    saveSettings,
  }
}
