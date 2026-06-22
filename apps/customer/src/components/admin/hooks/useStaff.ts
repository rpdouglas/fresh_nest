import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/firebase'
import { staffCollection } from '@freshnest/shared'
import type { Staff, StaffRole, StaffStatus, StaffLanguage, TransportMode } from '@/types'

export interface RegisterStaffInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: StaffRole
  status: StaffStatus
  language: StaffLanguage
  transportMode: TransportMode
  transitBufferMinutes: number
  monthlyEarningsLimit: number | null
}

export function useStaff(enabled: boolean) {
  const queryClient = useQueryClient()

  const staffQuery = useMemo(() => {
    return query(staffCollection(db), orderBy('createdAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(staffQuery, {
    queryKey: ['staff'],
    enabled,
  })

  const staffList = useMemo<Staff[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => docSnap.data())
  }, [data])

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesRole = roleFilter === 'all' || s.role === roleFilter
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter

      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
      const qVal = searchQuery.toLowerCase()
      const matchesSearch =
        fullName.includes(qVal) ||
        s.email.toLowerCase().includes(qVal) ||
        s.phone.includes(qVal)

      return matchesRole && matchesStatus && matchesSearch
    })
  }, [staffList, roleFilter, statusFilter, searchQuery])

  const registerStaff = async (input: RegisterStaffInput) => {
    // P3-E27-A2: server-side CF owns Auth account creation + custom claims + staff/{uid} write.
    // Eliminates the client-side addDoc + email-migration race condition.
    const registerStaffFn = httpsCallable<RegisterStaffInput, { uid: string; email: string }>(
      functions,
      'onStaffRegistered'
    )
    const result = await registerStaffFn(input)
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
    return result.data.uid
  }

  const resendWelcome = async (uid: string) => {
    const resendWelcomeFn = httpsCallable<{ uid: string }, { success: boolean; sentAt: string }>(
      functions,
      'resendWelcomeEmail'
    )
    const result = await resendWelcomeFn({ uid })
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
    return result.data
  }

  return {
    staffList,
    filteredStaff,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    registerStaff,
    resendWelcome,
  }
}
