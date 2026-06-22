import { useState, useMemo } from 'react'
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { bookingsCollection } from '@freshnest/shared'
import { query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { updateBookingStatus, updateBookingAssignment, createAdminBooking } from '@/lib/firebase/firestore'
import type { Booking, BookingStatus } from '@/types'
import type { AdminBookingFormData } from '@/lib/schemas/bookingSchema'

export function useBookings(enabled: boolean) {
  const queryClient = useQueryClient()

  // Date window (default: last 90 days to 180 days in future)
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

  // Server-side filter state — all three live in the queryKey so a change triggers a fresh Firestore fetch
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')

  // Client-side sort state — kept client-side because cursor-based pagination depends on the Firestore orderBy field (preferredDate)
  const [sortBy, setSortBy] = useState<'preferredDate' | 'createdAt'>('preferredDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Free-text search — client-side only; Firestore does not support full-text search
  const [searchQuery, setSearchQuery] = useState<string>('')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['bookings', startDate, endDate, statusFilter, serviceFilter, languageFilter],
    queryFn: async ({ pageParam }) => {
      let q = query(
        bookingsCollection(db),
        where('preferredDate', '>=', startDate),
        where('preferredDate', '<=', endDate),
        orderBy('preferredDate', 'desc'),
        limit(50)
      )
      if (statusFilter !== 'all')   q = query(q, where('status', '==', statusFilter))
      if (serviceFilter !== 'all')  q = query(q, where('serviceType', '==', serviceFilter))
      if (languageFilter !== 'all') q = query(q, where('language', '==', languageFilter))
      if (pageParam)                q = query(q, startAfter(pageParam))
      return await getDocs(q)
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData, DocumentData> | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.docs.length < 50) return undefined
      return lastPage.docs[lastPage.docs.length - 1]
    },
    enabled,
  })

  const bookings = useMemo<Booking[]>(() => {
    if (!data) return []
    return data.pages.flatMap((page) =>
      page.docs.map((docSnap) => docSnap.data())
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

  // Statistics counters (over the server-filtered + client-searched result set)
  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!searchQuery) return true
        const fullName = `${b.firstName} ${b.lastName}`.toLowerCase()
        const qVal = searchQuery.toLowerCase()
        return (
          fullName.includes(qVal) ||
          b.email.toLowerCase().includes(qVal) ||
          b.phone.includes(qVal) ||
          b.address.toLowerCase().includes(qVal)
        )
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
  }, [bookings, sortBy, sortOrder, searchQuery])

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Pure data mutation — UI toggle for showCustomInput is handled in BookingsTable
  const handleAssignmentChange = async (bookingId: string, cleanerName: string | null) => {
    try {
      await updateBookingAssignment(bookingId, cleanerName)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error updating cleaner assignment:', err)
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
    handleStatusChange,
    handleAssignmentChange,
    handleAdminCreate,
    isCreating,
  }
}
