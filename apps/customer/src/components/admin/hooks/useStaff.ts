import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/firebase'
import { staffCollection } from '@freshnest/shared'
import type { Staff, StaffRole, StaffStatus, StaffLanguage, TransportMode, BackgroundCheckStatus } from '@/types'

// P3-E27-D1: the four admin-only onboarding checklist items with no employee-facing
// counterpart. Written directly — isAdmin() already grants unrestricted staff-doc
// write access, and onStaffUpdatedTrigger picks these up for auditLog automatically.
export type AdminChecklistItem = 'idVerified' | 'supervisedShiftCompleted' | 'uniformIssued' | 'directDepositOnFile'

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

  const updateBackgroundCheckStatus = async (input: {
    uid: string
    status: BackgroundCheckStatus
    provider?: string
    notes?: string
  }) => {
    const updateStatusFn = httpsCallable<typeof input, { success: boolean }>(
      functions,
      'updateBackgroundCheckStatus'
    )
    const result = await updateStatusFn(input)
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
    return result.data
  }

  const updateChecklistItem = async (uid: string, item: AdminChecklistItem, value: boolean) => {
    const staffRef = doc(staffCollection(db), uid)
    await updateDoc(staffRef, { [`onboardingChecklist.${item}`]: value })
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
  }

  const activateEmployee = async (uid: string) => {
    const staffRef = doc(staffCollection(db), uid)
    await updateDoc(staffRef, { status: 'active' })
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
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
    updateBackgroundCheckStatus,
    updateChecklistItem,
    activateEmployee,
  }
}
