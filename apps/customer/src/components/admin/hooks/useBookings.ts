import { useState, useMemo } from 'react'
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { collection, query, orderBy, limit, startAfter, getDocs, where, Timestamp } from 'firebase/firestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { updateBookingStatus, updateBookingAssignment, createAdminBooking } from '@/lib/firebase/firestore'
import type { Booking, BookingStatus } from '@/types'
import type { AdminBookingFormData } from '@/lib/schemas/bookingSchema'

export function useBookings(enabled: boolean) {
  const queryClient = useQueryClient()

  // Filtering states (default view is last 90 days to 180 days in future)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString().split('T')[0]
  })
  
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 180)
    return d.toISOString().split('T')[0]
  })

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'preferredDate' | 'createdAt'>('preferredDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Paginated bookings fetcher
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['bookings', startDate, endDate],
    queryFn: async ({ pageParam }) => {
      let q = query(
        collection(db, 'bookings'),
        where('preferredDate', '>=', startDate),
        where('preferredDate', '<=', endDate),
        orderBy('preferredDate', 'desc'),
        limit(50)
      )
      if (pageParam) {
        q = query(q, startAfter(pageParam))
      }
      return await getDocs(q)
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData, DocumentData> | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.docs.length < 50) return undefined
      return lastPage.docs[lastPage.docs.length - 1]
    },
    enabled,
  })

  // Map the raw documents from QuerySnapshot pages to Booking[]
  const bookings = useMemo<Booking[]>(() => {
    if (!data) return []
    return data.pages.flatMap((page) =>
      page.docs.map((docSnap) => {
        const docData = docSnap.data()
        return {
          id: docSnap.id,
          ...docData,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : new Date(),
        } as Booking
      })
    )
  }, [data])

  const [isCreating, setIsCreating] = useState(false)

  const handleAdminCreate = async (data: AdminBookingFormData, adminEmail: string): Promise<void> => {
    setIsCreating(true)
    try {
      await createAdminBooking(data, adminEmail)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } finally {
      setIsCreating(false)
    }
  }

  // Collapsible rows state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Cleaner custom names input state
  const [customCleanerNames, setCustomCleanerNames] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  // Statistics counters
  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter
        const matchesService = serviceFilter === 'all' || b.serviceType === serviceFilter
        const matchesLanguage = languageFilter === 'all' || b.language === languageFilter

        const fullName = `${b.firstName} ${b.lastName}`.toLowerCase()
        const qVal = searchQuery.toLowerCase()
        const matchesSearch =
          fullName.includes(qVal) ||
          b.email.toLowerCase().includes(qVal) ||
          b.phone.includes(qVal) ||
          b.address.toLowerCase().includes(qVal)

        return matchesStatus && matchesService && matchesLanguage && matchesSearch
      })
      .sort((a, b) => {
        const dateA = sortBy === 'preferredDate'
          ? new Date(a.preferredDate).getTime()
          : a.createdAt.getTime()
        const dateB = sortBy === 'preferredDate'
          ? new Date(b.preferredDate).getTime()
          : b.createdAt.getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
  }, [bookings, statusFilter, serviceFilter, languageFilter, sortBy, sortOrder, searchQuery])

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleAssignmentChange = async (bookingId: string, value: string) => {
    if (value === 'custom') {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: true }))
    } else {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: false }))
      try {
        const cleanerName = value === 'unassigned' ? null : value
        await updateBookingAssignment(bookingId, cleanerName)
        await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      } catch (err) {
        console.error('Error updating cleaner assignment:', err)
      }
    }
  }

  const handleCustomCleanerSave = async (bookingId: string) => {
    const customName = customCleanerNames[bookingId]?.trim()
    if (!customName) return

    try {
      await updateBookingAssignment(bookingId, customName)
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: false }))
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error saving custom cleaner name:', err)
    }
  }

  return {
    bookings,
    filteredBookings,
    totalCount,
    pendingCount,
    confirmedCount,
    isLoading,
    error: error ? String(error) : null,
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    languageFilter,
    setLanguageFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    expandedRowId,
    setExpandedRowId,
    customCleanerNames,
    setCustomCleanerNames,
    showCustomInput,
    setShowCustomInput,
    handleStatusChange,
    handleAssignmentChange,
    handleCustomCleanerSave,
    handleAdminCreate,
    isCreating,
  }
}
