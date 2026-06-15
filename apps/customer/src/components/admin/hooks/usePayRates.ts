import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { createPayRate } from '@/lib/firebase/firestore'
import type { PayRate, StaffRole } from '@/types'
import { useAdminAuth } from './useAdminAuth'

export function usePayRates(enabled: boolean) {
  const queryClient = useQueryClient()
  const { user } = useAdminAuth()

  const payRatesQuery = useMemo(() => {
    return query(collection(db, 'payRates'), orderBy('effectiveFrom', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(payRatesQuery, {
    queryKey: ['payRates'],
    enabled,
  })

  const payRates = useMemo<PayRate[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => {
      const docData = docSnap.data()
      return {
        id: docSnap.id,
        ...docData,
        effectiveFrom: docData.effectiveFrom instanceof Timestamp ? docData.effectiveFrom.toDate() : new Date(),
        effectiveTo: docData.effectiveTo instanceof Timestamp ? docData.effectiveTo.toDate() : null,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : new Date(),
      } as PayRate
    })
  }, [data])

  // Calculate the currently active rate for each role
  const activeRates = useMemo<Record<StaffRole, PayRate | null>>(() => {
    const now = new Date()
    const result: Record<StaffRole, PayRate | null> = {
      cleaner: null,
      lead: null,
      supervisor: null,
    }

    // Go through all rates (already sorted by effectiveFrom desc)
    for (const rate of payRates) {
      if (rate.effectiveFrom <= now && !result[rate.role]) {
        result[rate.role] = rate
      }
    }

    return result
  }, [payRates])

  const createRate = async (input: { role: StaffRole; amount: number; effectiveFrom: Date }) => {
    if (!user) throw new Error('Unauthorized')

    await createPayRate({
      role: input.role,
      amount: input.amount,
      currency: 'CAD',
      effectiveFrom: input.effectiveFrom,
      effectiveTo: null,
      createdBy: user.email || 'Admin',
    })

    await queryClient.invalidateQueries({ queryKey: ['payRates'] })
  }

  return {
    payRates,
    activeRates,
    isLoading,
    error,
    createRate,
  }
}
