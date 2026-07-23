import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { creditsCollection } from '@freshnest/shared'
import { query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/firebase'
import type { Credit } from '@/types'

export function useRewards(enabled: boolean) {
  const queryClient = useQueryClient()

  const creditsQuery = useMemo(() => {
    return query(creditsCollection(db), orderBy('issuedAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(creditsQuery, {
    queryKey: ['credits'],
    enabled,
  })

  const credits = useMemo<Credit[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => docSnap.data())
  }, [data])

  // P3-E10: credits stays closed to ALL direct client writes — every mutation goes
  // through the admin-gated adjustCredit callable, matching Strategy 1's "nothing
  // touching money is a raw client write" decision.
  const revokeCredit = async (creditId: string, notes?: string) => {
    const adjustCreditFn = httpsCallable<
      { action: 'revoke'; creditId: string; notes?: string },
      { success: boolean }
    >(functions, 'adjustCredit')
    const result = await adjustCreditFn({ action: 'revoke', creditId, notes })
    await queryClient.invalidateQueries({ queryKey: ['credits'] })
    return result.data
  }

  const createManualCredit = async (input: { customerEmail: string; amount: number; notes?: string }) => {
    const adjustCreditFn = httpsCallable<
      { action: 'create'; customerEmail: string; amount: number; notes?: string },
      { success: boolean; creditId: string }
    >(functions, 'adjustCredit')
    const result = await adjustCreditFn({ action: 'create', ...input })
    await queryClient.invalidateQueries({ queryKey: ['credits'] })
    return result.data
  }

  return {
    credits,
    isLoading,
    error,
    revokeCredit,
    createManualCredit,
  }
}
