import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
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
    return query(collection(db, 'staff'), orderBy('createdAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(staffQuery, {
    queryKey: ['staff'],
    enabled,
  })

  const staffList = useMemo<Staff[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => {
      const docData = docSnap.data()
      return {
        id: docSnap.id,
        ...docData,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : new Date(),
      } as Staff
    })
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
    const docData = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      role: input.role,
      status: input.status,
      preferences: {
        language: input.language,
      },
      constraints: {
        transportMode: input.transportMode,
        transitBufferMinutes: input.transitBufferMinutes,
        blockedWindows: [],
      },
      financials: {
        monthlyEarningsLimit: input.monthlyEarningsLimit,
        currentMonthEarnings: 0,
        earningsHistory: [],
      },
      compliance: {
        acceptedTermsVersion: '1.0',
        termsHistory: [
          {
            version: '1.0',
            acceptedAt: new Date(),
          },
        ],
      },
      onboardingChecklist: {
        backgroundCheck: false,
        trainingCompleted: false,
      },
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(collection(db, 'staff'), docData)
    await queryClient.invalidateQueries({ queryKey: ['staff'] })
    return ref.id
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
  }
}
