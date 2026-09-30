import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase/firebase'
import type { OpenShift } from '../types'

export const AVAILABLE_SHIFTS_QUERY_KEY = ['availableShifts'] as const

// HOTFIX-02: staff cannot query unassigned jobs directly (firestore.rules), so the
// board reads a PII-minimised, eligibility-evaluated list from the listOpenShifts callable.
export function useShifts(enabled: boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: AVAILABLE_SHIFTS_QUERY_KEY,
    queryFn: async () => {
      const listOpenShifts = httpsCallable<void, { shifts: OpenShift[] }>(functions, 'listOpenShifts')
      const result = await listOpenShifts()
      return result.data.shifts
    },
    enabled,
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  return {
    shifts: data ?? [],
    isLoading,
    error,
  }
}
