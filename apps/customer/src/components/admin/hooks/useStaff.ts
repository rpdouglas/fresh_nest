import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/firebase'
import { staffCollection } from '@freshnest/shared'
import type { Staff, StaffRole, StaffStatus, StaffLanguage, TransportMode, BackgroundCheckStatus, ProbationCheckIn, ProbationOutcome } from '@/types'

// P3-E27-D1: the four admin-only onboarding checklist items with no employee-facing
// counterpart. Written directly — isAdmin() already grants unrestricted staff-doc
// write access, and onStaffUpdatedTrigger picks these up for auditLog automatically.
export type AdminChecklistItem = 'idVerified' | 'supervisedShiftCompleted' | 'uniformIssued' | 'directDepositOnFile'

// P3-E27-D2: generates the 3 extension check-ins when an admin sets outcome to 'extended'.
// Mirrors onStaffStatusActivated's makeCheckIn — kept in sync manually since one runs
// server-side (Cloud Functions) and the other client-side (admin panel), same split as
// every other duplicated date-math helper in this codebase.
function makeExtensionCheckIns(from: Date): ProbationCheckIn[] {
  return ([30, 60, 90] as const).map((dayOffset) => {
    const due = new Date(from)
    due.setUTCDate(due.getUTCDate() + dayOffset)
    return {
      id: crypto.randomUUID(),
      dayOffset,
      scheduledDate: due.toISOString().slice(0, 10),
      completedDate: null,
      notes: null,
      rating: null,
      completedBy: null,
    }
  })
}

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

  // P3-E27-D2: whole-array write of probation.checkIns, matching the established pattern
  // already used for constraints.blockedWindows in ProfilePage.tsx — admin already has
  // unrestricted staff-doc write access, single-admin low-concurrency editing context.
  const completeCheckIn = async (uid: string, checkIns: ProbationCheckIn[]) => {
    const staffRef = doc(staffCollection(db), uid)
    await updateDoc(staffRef, { 'probation.checkIns': checkIns })
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
  }

  const setProbationOutcome = async (uid: string, outcome: ProbationOutcome) => {
    const staffRef = doc(staffCollection(db), uid)
    const update: Record<string, unknown> = { 'probation.probationOutcome': outcome }
    // P3-E27-D1 decision #4 precedent: "Terminated" only transitions status — D3's future
    // offboarding trigger reacts to that transition, not built here.
    if (outcome === 'terminated') {
      update['status'] = 'inactive'
    }
    await updateDoc(staffRef, update)
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
  }

  const extendProbation = async (uid: string, currentEndDate: string) => {
    const staffRef = doc(staffCollection(db), uid)
    const extensionStart = new Date()
    const newEnd = new Date(extensionStart)
    newEnd.setUTCDate(newEnd.getUTCDate() + 90)
    const newEndDate = newEnd.toISOString() > currentEndDate ? newEnd.toISOString().slice(0, 10) : currentEndDate

    const staff = staffList.find((s) => s.id === uid)
    const existingCheckIns = staff?.probation?.checkIns ?? []
    const updatedCheckIns = [...existingCheckIns, ...makeExtensionCheckIns(extensionStart)]

    await updateDoc(staffRef, {
      'probation.checkIns': updatedCheckIns,
      'probation.endDate': newEndDate,
      'probation.probationOutcome': 'pending',
    })
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
    completeCheckIn,
    setProbationOutcome,
    extendProbation,
  }
}
