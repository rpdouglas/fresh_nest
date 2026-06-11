/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-misused-promises */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  subscribeToBookings,
  updateBookingStatus,
  updateBookingAssignment,
} from '@/lib/firestore'
import type { Booking, BookingStatus } from '@/types'
import { cn } from '@/lib/utils'
import SEO from '@/components/seo/SEO'
import { calculateQuote } from '@/lib/quotePricing'
import type { QuotePropertySize, QuoteServiceType, QuoteFrequency } from '@/lib/quotePricing'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AdminPage() {
  const { t, i18n } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([])

  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics'>('bookings')
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'all' | '30days' | '90days' | 'ytd' | 'month'>('all')

  // Helper to calculate estimated price in-memory for analytics
  const getEstimatedPrice = (booking: Booking): number => {
    if (booking.propertyType === 'commercial') {
      return 300 // Baseline average for commercial clean estimates
    }
    const sizeMap: Record<string, QuotePropertySize> = {
      apartment: 'apartment',
      '1-2bed': '1-2bed',
      '3-4bed': '3-4bed',
      '5+bed': '5plus',
    }
    const size = sizeMap[booking.propertyType] || 'apartment'
    const validServices = ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb']
    const service = (validServices.includes(booking.serviceType) ? booking.serviceType : 'standard') as QuoteServiceType
    const frequency = booking.frequency as QuoteFrequency

    const quote = calculateQuote(size, service, frequency)
    if (quote.type === 'range') {
      return (quote.min + quote.max) / 2
    }
    return 150
  }

  // Collapsible rows state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Cleaner custom names input state
  const [customCleanerNames, setCustomCleanerNames] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'preferredDate' | 'createdAt'>('preferredDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const userEmail = currentUser.email?.trim().toLowerCase()
        if (userEmail) {
          try {
            const adminDocRef = doc(db, 'admins', userEmail)
            const adminSnap = await getDoc(adminDocRef)
            const authorized = adminSnap.exists()
            setIsAuthorized(authorized)

            if (!authorized) {
              setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
            } else {
              setAuthError(null)
            }
          } catch (err) {
            console.error('Error verifying admin authorization:', err)
            setIsAuthorized(false)
            setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
          }
        } else {
          setIsAuthorized(false)
          setAuthError(t('admin.login.authFailed'))
        }
      } else {
        setIsAuthorized(false)
        setAuthError(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [t])

  // Sync bookings in real-time once authorized
  useEffect(() => {
    if (user && isAuthorized) {
      const unsubscribe = subscribeToBookings((data) => {
        setBookings(data)
      })
      return () => unsubscribe()
    }
  }, [user, isAuthorized])

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign-in error:', err)
      setAuthError(t('admin.login.authFailed'))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status)
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
    } catch (err) {
      console.error('Error saving custom cleaner name:', err)
    }
  }

  // Statistics counters
  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length

  // Filtered & Sorted Bookings
  const filteredBookings = bookings
    .filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      const matchesService = serviceFilter === 'all' || b.serviceType === serviceFilter
      const matchesLanguage = languageFilter === 'all' || b.language === languageFilter

      const fullName = `${b.firstName} ${b.lastName}`.toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        fullName.includes(query) ||
        b.email.toLowerCase().includes(query) ||
        b.phone.includes(query) ||
        b.address.toLowerCase().includes(query)

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

  // Analytics aggregation logic
  const now = new Date()
  const filteredAnalyticsBookings = bookings.filter((b) => {
    if (!b.createdAt) return false
    const date = new Date(b.createdAt)
    if (analyticsTimeRange === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return date >= thirtyDaysAgo
    }
    if (analyticsTimeRange === '90days') {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(now.getDate() - 90)
      return date >= ninetyDaysAgo
    }
    if (analyticsTimeRange === 'ytd') {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      return date >= startOfYear
    }
    if (analyticsTimeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return date >= startOfMonth
    }
    return true // 'all'
  })

  // KPI Metrics
  const analyticsTotalBookings = filteredAnalyticsBookings.length
  const analyticsTotalRevenue = filteredAnalyticsBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
  const analyticsAvgBookingValue = analyticsTotalBookings > 0 ? analyticsTotalRevenue / analyticsTotalBookings : 0

  // 1. Lead Source Distribution (Pie Chart)
  const leadSourceKeys = ['organic', 'google', 'referral', 'facebook', 'direct']
  const leadSourceData = leadSourceKeys.map((source) => {
    const sourceBookings = filteredAnalyticsBookings.filter((b) => b.leadSource === source)
    const count = sourceBookings.length
    const revenue = sourceBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
    return {
      name: t(`admin.dashboard.leads.${source}`) || source,
      value: count,
      revenue,
      key: source,
    }
  }).filter(item => item.value > 0)

  // 2. Monthly Trend Chart
  const monthlyDataMap: Record<string, { monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }> = {}
  filteredAnalyticsBookings.forEach((b) => {
    if (!b.createdAt) return
    const date = new Date(b.createdAt)
    const year = date.getFullYear()
    const month = date.getMonth()
    const sortKey = year * 100 + month
    const monthName = date.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'short',
      year: 'numeric',
    })
    const key = `${year}-${month}`
    if (!monthlyDataMap[key]) {
      monthlyDataMap[key] = {
        monthKey: key,
        monthName,
        count: 0,
        revenue: 0,
        sortKey,
      }
    }
    monthlyDataMap[key].count += 1
    monthlyDataMap[key].revenue += getEstimatedPrice(b)
  })
  const monthlyTrendData = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey)

  // Color Mapping for Lead Sources
  const LEAD_COLORS: Record<string, string> = {
    organic: '#5b7e8f',  // slate-brand
    google: '#7fa0b0',   // slate-light
    referral: '#c4b09a', // sand-dark
    facebook: '#3f5f6e', // slate-dark
    direct: '#7a8f96',   // text-muted
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const channelsPerformance = leadSourceKeys.map((source) => {
    const sourceBookings = filteredAnalyticsBookings.filter((b) => b.leadSource === source)
    const volume = sourceBookings.length
    const revenue = sourceBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
    const avgValue = volume > 0 ? revenue / volume : 0
    const share = analyticsTotalBookings > 0 ? (volume / analyticsTotalBookings) * 100 : 0
    return {
      source,
      name: t(`admin.dashboard.leads.${source}`) || source,
      volume,
      revenue,
      avgValue,
      share,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-warm-white">
        <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[80vh] bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />

      <div className="max-w-content mx-auto">
        <AnimatePresence mode="wait">
          {/* Access Denied View */}
          {user && !isAuthorized && (
            <motion.div
              key="access-denied"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-5xl text-charcoal">
                    {t('admin.login.errorTitle')}
                  </h1>
                  <p className="font-body text-base text-text-muted">
                    {authError || t('admin.login.errorMessage', { email: user.email })}
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      'w-full bg-slate-brand text-white font-body font-medium rounded',
                      'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                    )}
                  >
                    {t('admin.login.tryAnother')}
                  </button>
                  <Link
                    to="/"
                    className={cn(
                      'w-full border border-sand text-charcoal font-body font-medium rounded',
                      'min-h-[48px] inline-flex items-center justify-center py-3 px-6',
                      'hover:bg-cream transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                    )}
                  >
                    {t('admin.login.backToHome')}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Gate View */}
          {!user && (
            <motion.div
              key="login-gate"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-5xl text-charcoal">
                    {t('admin.login.heading')}
                  </h1>
                  <p className="font-body text-base text-text-muted">
                    {t('admin.login.subhead')}
                  </p>
                </div>

                {authError && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded text-base font-body">
                    {authError}
                  </div>
                )}

                <button
                  onClick={handleSignIn}
                  className={cn(
                    'w-full bg-slate-brand text-white font-body font-medium rounded',
                    'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    'inline-flex items-center justify-center gap-3'
                  )}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.706 0 3.277.614 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.583 1 2 5.583 2 11.24s4.583 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.568-.057-1.125-.17-1.67H12.24z" />
                  </svg>
                  {t('admin.login.button')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Authenticated Bookings Dashboard */}
          {user && isAuthorized && (
            <motion.div
              key="admin-dashboard"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full flex flex-col gap-8"
            >
              {/* Header and User profile */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand pb-6">
                <div>
                  <h1 className="font-display text-5xl text-charcoal">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="font-body text-base text-text-muted mt-1">
                    {t('admin.dashboard.welcome', { name: user.displayName || user.email })}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-sand rounded p-3 self-start md:self-auto">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || t('admin.dashboard.avatarAlt')}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-sand"
                      width={40}
                      height={40}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-pale text-slate-brand font-body font-medium flex items-center justify-center shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </div>
                  )}

                  <div className="text-left">
                    <p className="font-body text-base font-medium text-charcoal leading-none">
                      {user.displayName || t('admin.dashboard.fallbackName')}
                    </p>
                    <p className="font-body text-sm text-text-muted mt-1">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className={cn(
                      'ml-2 border border-sand text-charcoal font-body font-medium rounded',
                      'min-h-[48px] px-4 py-2 text-base hover:bg-cream transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                    )}
                  >
                    {t('admin.dashboard.signOut')}
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-sand gap-2">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'bookings'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.bookings')}
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'analytics'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.analytics')}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'bookings' ? (
                  <motion.div
                    key="tab-bookings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Stats Counters Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.stats.total')}
                        </span>
                        <span className="font-display text-4xl text-charcoal font-bold">
                          {totalCount}
                        </span>
                      </div>
                      <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.stats.pending')}
                        </span>
                        <span className="font-display text-4xl text-slate-brand font-bold">
                          {pendingCount}
                        </span>
                      </div>
                      <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.stats.confirmed')}
                        </span>
                        <span className="font-display text-4xl text-green-600 font-bold">
                          {confirmedCount}
                        </span>
                      </div>
                    </div>

                    {/* Filtering Controls Bar */}
                    <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Status filter */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="status-filter" className="font-body text-base text-charcoal font-medium">
                            {t('admin.dashboard.filters.status')}
                          </label>
                          <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="all">{t('common.all')}</option>
                            <option value="pending">{t('booking.status.pending')}</option>
                            <option value="confirmed">{t('booking.status.confirmed')}</option>
                            <option value="completed">{t('booking.status.completed')}</option>
                            <option value="cancelled">{t('booking.status.cancelled')}</option>
                          </select>
                        </div>

                        {/* Service Type Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="service-filter" className="font-body text-base text-charcoal font-medium">
                            {t('admin.dashboard.filters.service')}
                          </label>
                          <select
                            id="service-filter"
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="all">{t('common.all')}</option>
                            <option value="standard">{t('services.standard.title')}</option>
                            <option value="deep">{t('services.deep.title')}</option>
                            <option value="moveout">{t('services.moveout.title')}</option>
                            <option value="postconstruction">{t('services.postconstruction.title')}</option>
                            <option value="airbnb">{t('services.airbnb.title')}</option>
                            <option value="commercial">{t('services.commercial.title')}</option>
                          </select>
                        </div>

                        {/* Language Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="language-filter" className="font-body text-base text-charcoal font-medium">
                            {t('admin.dashboard.filters.language')}
                          </label>
                          <select
                            id="language-filter"
                            value={languageFilter}
                            onChange={(e) => setLanguageFilter(e.target.value)}
                            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="all">{t('common.all')}</option>
                            <option value="en">{t('common.languages.en')}</option>
                            <option value="fr">{t('common.languages.fr')}</option>
                          </select>
                        </div>

                        {/* Sort By Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="sort-by" className="font-body text-base text-charcoal font-medium">
                            {t('admin.dashboard.filters.sortBy')}
                          </label>
                          <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'preferredDate' | 'createdAt')}
                            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="preferredDate">{t('admin.dashboard.table.date')}</option>
                            <option value="createdAt">{t('admin.dashboard.details.createdAt')}</option>
                          </select>
                        </div>

                        {/* Sort Order Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="sort-order" className="font-body text-base text-charcoal font-medium">
                            {t('admin.dashboard.filters.sortOrder')}
                          </label>
                          <select
                            id="sort-order"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="asc">{t('common.asc')}</option>
                            <option value="desc">{t('common.desc')}</option>
                          </select>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="search-query" className="font-body text-base text-charcoal font-medium">
                          {t('common.search')}
                        </label>
                        <input
                          id="search-query"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('admin.dashboard.filters.search')}
                          className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                        />
                      </div>
                    </div>

                    {/* Bookings Table */}
                    <div className="bg-white border border-sand rounded shadow-sm overflow-x-auto">
                      <table className="w-full border-collapse text-left min-w-[700px]">
                        <thead>
                          <tr className="border-b border-sand bg-cream">
                            <th className="p-4 font-sub text-base text-charcoal font-bold">
                              {t('admin.dashboard.table.client')}
                            </th>
                            <th className="p-4 font-sub text-base text-charcoal font-bold">
                              {t('admin.dashboard.table.date')}
                            </th>
                            <th className="p-4 font-sub text-base text-charcoal font-bold">
                              {t('admin.dashboard.table.service')}
                            </th>
                            <th className="p-4 font-sub text-base text-charcoal font-bold">
                              {t('admin.dashboard.table.status')}
                            </th>
                            <th className="p-4 font-sub text-base text-charcoal font-bold">
                              {t('admin.dashboard.table.assigned')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center font-body text-base text-text-muted">
                                {t('admin.dashboard.table.noResults')}
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.map((b) => {
                              const isExpanded = expandedRowId === b.id
                              const clientName = `${b.firstName} ${b.lastName}`
                              const serviceKey = b.serviceType

                              return (
                                <div key={b.id} className="contents">
                                  {/* Main table row */}
                                  <tr
                                    onClick={() => setExpandedRowId(isExpanded ? null : (b.id ?? null))}
                                    className={cn(
                                      'border-b border-sand hover:bg-warm-white transition-colors duration-150 cursor-pointer',
                                      isExpanded && 'bg-warm-white'
                                    )}
                                  >
                                    <td className="p-4 font-body text-base text-charcoal font-medium">
                                      <div className="flex flex-col">
                                        <span>{clientName}</span>
                                        <span className="text-sm text-text-muted font-normal">{b.email}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 font-body text-base text-charcoal">
                                      {b.preferredDate}
                                    </td>
                                    <td className="p-4 font-body text-base text-charcoal capitalize">
                                      {t(`services.${serviceKey}.title`)}
                                    </td>
                                    <td className="p-4">
                                      <span
                                        className={cn(
                                          'inline-flex items-center px-2.5 py-0.5 rounded font-body text-sm font-medium border',
                                          b.status === 'pending' && 'bg-yellow-50 text-yellow-800 border-yellow-200',
                                          b.status === 'confirmed' && 'bg-green-50 text-green-800 border-green-200',
                                          b.status === 'completed' && 'bg-blue-50 text-blue-800 border-blue-200',
                                          b.status === 'cancelled' && 'bg-red-50 text-red-800 border-red-200'
                                        )}
                                      >
                                        {t(`booking.status.${b.status}`)}
                                      </span>
                                    </td>
                                    <td className="p-4 font-body text-base text-charcoal">
                                      {b.assignedTo || (
                                        <span className="text-text-muted italic">
                                          {t('admin.dashboard.details.unassigned')}
                                        </span>
                                      )}
                                    </td>
                                  </tr>

                                  {/* Collapsible details panel */}
                                  <AnimatePresence initial={false}>
                                    {isExpanded && b.id && (
                                      <tr>
                                        <td colSpan={5} className="p-0 border-b border-sand bg-slate-pale/30">
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden p-6"
                                          >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                                              {/* Contact & Address Section */}
                                              <div className="flex flex-col gap-4">
                                                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                                                  {t('admin.dashboard.table.client')}
                                                </h4>
                                                <div className="font-body text-base text-charcoal space-y-2">
                                                  <p>
                                                    <span className="font-medium">{t('booking.fields.phone.label')}: </span>
                                                    <a href={`tel:${b.phone}`} className="text-slate-brand hover:underline min-h-[48px] inline-flex items-center">
                                                      {b.phone}
                                                    </a>
                                                  </p>
                                                  <p>
                                                    <span className="font-medium">{t('admin.dashboard.filters.language')}: </span>
                                                    {b.language === 'en' ? t('common.languages.enLong') : t('common.languages.frLong')}
                                                  </p>
                                                  <p className="pt-2">
                                                    <span className="font-medium block mb-1">
                                                      {t('admin.dashboard.details.address')}:
                                                    </span>
                                                    <span className="text-text-muted block leading-snug">
                                                      {b.address}
                                                    </span>
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Property Specifications */}
                                              <div className="flex flex-col gap-4">
                                                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                                                  {t('admin.dashboard.details.property')}
                                                </h4>
                                                <div className="font-body text-base text-charcoal space-y-2">
                                                  <p>
                                                    <span className="font-medium">{t('booking.fields.propertyType.label')}: </span>
                                                    {t(`booking.fields.propertyType.options.${b.propertyType}`)}
                                                  </p>
                                                  <p>
                                                    <span className="font-medium">{t('admin.dashboard.details.rooms')}: </span>
                                                    {t('admin.dashboard.details.roomsValue', { bedrooms: b.bedrooms, bathrooms: b.bathrooms })}
                                                  </p>
                                                  {b.squareFootage && (
                                                    <p>
                                                      <span className="font-medium">{t('admin.dashboard.details.size')}: </span>
                                                      {t('admin.dashboard.details.sqft', { size: b.squareFootage })}
                                                    </p>
                                                  )}
                                                  <p>
                                                    <span className="font-medium">{t('admin.dashboard.details.frequency')}: </span>
                                                    {t(`booking.fields.frequency.options.${b.frequency}`)}
                                                  </p>
                                                  <p>
                                                    <span className="font-medium">{t('admin.dashboard.details.pets')}: </span>
                                                    <span className={cn(b.pets ? 'text-amber-700 font-medium' : '')}>
                                                      {b.pets
                                                        ? t('admin.dashboard.details.petsYes')
                                                        : t('admin.dashboard.details.petsNo')}
                                                    </span>
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Workflow & Admin Controls */}
                                              <div className="flex flex-col gap-4">
                                                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                                                  {t('admin.dashboard.details.assignHeader')}
                                                </h4>

                                                {/* Status Update Control */}
                                                <div className="flex flex-col gap-1.5">
                                                  <label
                                                    htmlFor={`status-select-${b.id}`}
                                                    className="font-body text-sm text-text-muted"
                                                  >
                                                    {t('admin.dashboard.details.updateStatus')}
                                                  </label>
                                                  <select
                                                    id={`status-select-${b.id}`}
                                                    value={b.status}
                                                    onChange={(e) =>
                                                      handleStatusChange(b.id!, e.target.value as BookingStatus)
                                                    }
                                                    className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                                  >
                                                    <option value="pending">{t('booking.status.pending')}</option>
                                                    <option value="confirmed">{t('booking.status.confirmed')}</option>
                                                    <option value="completed">{t('booking.status.completed')}</option>
                                                    <option value="cancelled">{t('booking.status.cancelled')}</option>
                                                  </select>
                                                </div>

                                                {/* Cleaner Assignment Control */}
                                                <div className="flex flex-col gap-1.5 mt-1">
                                                  <label
                                                    htmlFor={`cleaner-select-${b.id}`}
                                                    className="font-body text-sm text-text-muted"
                                                  >
                                                    {t('admin.dashboard.details.assignCleaner')}
                                                  </label>
                                                  <select
                                                    id={`cleaner-select-${b.id}`}
                                                    value={
                                                      showCustomInput[b.id!]
                                                        ? 'custom'
                                                        : b.assignedTo === null
                                                        ? 'unassigned'
                                                        : b.assignedTo && ['Lauren S.', 'Sarah M.'].includes(b.assignedTo)
                                                        ? b.assignedTo
                                                        : 'custom'
                                                    }
                                                    onChange={(e) => handleAssignmentChange(b.id!, e.target.value)}
                                                    className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                                  >
                                                    <option value="unassigned">
                                                      {t('admin.dashboard.details.unassigned')}
                                                    </option>
                                                    <option value="Lauren S.">Lauren S.</option>
                                                    <option value="Sarah M.">Sarah M.</option>
                                                    <option value="custom">
                                                      {t('admin.dashboard.details.customOption')}
                                                    </option>
                                                  </select>

                                                  {/* Custom cleaner text input fallback */}
                                                  {(showCustomInput[b.id!] ||
                                                    (b.assignedTo &&
                                                      !['Lauren S.', 'Sarah M.'].includes(b.assignedTo))) && (
                                                    <div className="flex flex-col gap-1.5 mt-2">
                                                      <label
                                                        htmlFor={`custom-cleaner-input-${b.id}`}
                                                        className="font-body text-sm text-text-muted"
                                                      >
                                                        {t('admin.dashboard.details.customCleaner')}
                                                      </label>
                                                      <div className="flex gap-2">
                                                        <div className="flex-1">
                                                          <input
                                                            id={`custom-cleaner-input-${b.id}`}
                                                            type="text"
                                                            value={
                                                              customCleanerNames[b.id!] !== undefined
                                                                ? customCleanerNames[b.id!]
                                                                : b.assignedTo || ''
                                                            }
                                                            onChange={(e) =>
                                                              setCustomCleanerNames((prev) => ({
                                                                ...prev,
                                                                [b.id!]: e.target.value,
                                                              }))
                                                            }
                                                            placeholder={t('admin.dashboard.details.customPlaceholder')}
                                                            className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                                          />
                                                        </div>
                                                        <button
                                                          onClick={() => handleCustomCleanerSave(b.id!)}
                                                          className={cn(
                                                            'bg-slate-brand text-white font-body font-medium rounded',
                                                            'min-h-[48px] px-4 py-2 hover:bg-slate-dark transition-colors duration-200',
                                                            'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                                                          )}
                                                        >
                                                          {t('admin.dashboard.details.save')}
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Sub-details (Notes, Add-ons, Workflow) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8 pt-6 border-t border-sand">
                                              {/* Extras & Add-ons */}
                                              <div className="flex flex-col gap-2">
                                                <h4 className="font-sub text-xl text-charcoal font-bold">
                                                  {t('admin.dashboard.details.addons')}
                                                </h4>
                                                {b.addOns && b.addOns.length > 0 ? (
                                                  <div className="flex flex-wrap gap-2 mt-1">
                                                    {b.addOns.map((add) => (
                                                      <span
                                                        key={add}
                                                        className="bg-slate-pale text-slate-dark border border-sand px-2.5 py-1 rounded font-body text-sm font-medium"
                                                      >
                                                        {t(`booking.fields.addOns.options.${add}`)}
                                                      </span>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="font-body text-base text-text-muted italic mt-1">
                                                    {t('admin.dashboard.details.noAddons')}
                                                  </p>
                                                )}
                                              </div>

                                              {/* Notes Section */}
                                              <div className="flex flex-col gap-2">
                                                <h4 className="font-sub text-xl text-charcoal font-bold">
                                                  {t('admin.dashboard.details.notes')}
                                                </h4>
                                                <p className="font-body text-base text-charcoal bg-white border border-sand rounded p-3 mt-1 leading-normal whitespace-pre-line min-h-[60px]">
                                                  {b.notes?.trim() || t('admin.dashboard.details.noNotes')}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Lead Source, Timestamps, Flags Footer */}
                                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-left mt-8 pt-4 border-t border-sand text-base font-body text-text-muted">
                                              <p>
                                                <span className="font-medium text-charcoal">
                                                  {t('admin.dashboard.details.createdAt')}:{' '}
                                                </span>
                                                {b.createdAt?.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA')}
                                              </p>
                                              <p>
                                                <span className="font-medium text-charcoal">
                                                  {t('admin.dashboard.details.leadSource')}:{' '}
                                                </span>
                                                <span className="capitalize">
                                                   {t(`admin.dashboard.leads.${b.leadSource}`) || b.leadSource}
                                                 </span>
                                              </p>
                                              <p>
                                                <span className="font-medium text-charcoal">
                                                  {t('admin.dashboard.details.workflow')}:{' '}
                                                </span>
                                                {b.isAirbnb && (
                                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded mr-2">
                                                    {t('admin.dashboard.details.isAirbnb')}
                                                  </span>
                                                )}
                                                {b.photoConfirmation && (
                                                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                                                    {t('admin.dashboard.details.photoConf')}
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                          </motion.div>
                                        </td>
                                      </tr>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Time Range Selector */}
                    <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-4xl text-charcoal">
                          {t('admin.dashboard.analytics.title')}
                        </h2>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        <label htmlFor="analytics-range" className="font-body text-base text-charcoal font-medium whitespace-nowrap">
                          {t('admin.dashboard.analytics.rangeLabel')}:
                        </label>
                        <select
                          id="analytics-range"
                          value={analyticsTimeRange}
                          onChange={(e) => setAnalyticsTimeRange(e.target.value as 'all' | '30days' | '90days' | 'ytd' | 'month')}
                          className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                        >
                          <option value="all">{t('admin.dashboard.analytics.ranges.all')}</option>
                          <option value="30days">{t('admin.dashboard.analytics.ranges.30days')}</option>
                          <option value="90days">{t('admin.dashboard.analytics.ranges.90days')}</option>
                          <option value="ytd">{t('admin.dashboard.analytics.ranges.ytd')}</option>
                          <option value="month">{t('admin.dashboard.analytics.ranges.month')}</option>
                        </select>
                      </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.analytics.stats.bookingsCount')}
                        </span>
                        <span className="font-display text-4xl text-charcoal font-bold">
                          {analyticsTotalBookings}
                        </span>
                      </div>
                      <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.analytics.stats.estimatedRevenue')}
                        </span>
                        <span className="font-display text-4xl text-slate-brand font-bold">
                          {formatCurrency(analyticsTotalRevenue)}
                        </span>
                      </div>
                      <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
                        <span className="font-body text-sm text-text-muted">
                          {t('admin.dashboard.analytics.stats.avgBookingValue')}
                        </span>
                        <span className="font-display text-4xl text-green-600 font-bold">
                          {formatCurrency(analyticsAvgBookingValue)}
                        </span>
                      </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Lead Source Pie Chart */}
                      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
                        <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
                          {t('admin.dashboard.analytics.charts.leadDistribution')}
                        </h3>
                        <div className="h-[320px] w-full flex items-center justify-center">
                          {leadSourceData.length === 0 ? (
                            <span className="font-body text-base text-text-muted italic">
                              {t('admin.dashboard.table.noResults')}
                            </span>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={leadSourceData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {leadSourceData.map((entry) => (
                                    <Cell key={`cell-${entry.key}`} fill={LEAD_COLORS[entry.key] || '#7a8f96'} />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  formatter={(value: unknown, name: unknown, props: unknown) => {
                                    const valStr = String(value)
                                    const nameStr = String(name)
                                    const payload = (props as { payload?: { revenue?: number } })?.payload
                                    const revenue = payload?.revenue || 0
                                    return [
                                      `${valStr} ${t('admin.dashboard.analytics.charts.bookings').toLowerCase()} (${formatCurrency(revenue)})`,
                                      nameStr,
                                    ]
                                  }}
                                  contentStyle={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '14px',
                                    borderRadius: '4px',
                                    borderColor: '#c4b09a',
                                  }}
                                />
                                <RechartsLegend
                                  verticalAlign="bottom"
                                  height={36}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '14px',
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Monthly Trend Bar Chart */}
                      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
                        <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
                          {t('admin.dashboard.analytics.charts.monthlyTrend')}
                        </h3>
                        <div className="h-[320px] w-full flex items-center justify-center">
                          {monthlyTrendData.length === 0 ? (
                            <span className="font-body text-base text-text-muted italic">
                              {t('admin.dashboard.table.noResults')}
                            </span>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                                <XAxis
                                  dataKey="monthName"
                                  stroke="#7a8f96"
                                  tickLine={false}
                                  axisLine={false}
                                  style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                  }}
                                />
                                <YAxis
                                  stroke="#7a8f96"
                                  tickLine={false}
                                  axisLine={false}
                                  style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                  }}
                                />
                                <RechartsTooltip
                                  formatter={(value: unknown, name: unknown) => {
                                    const val = Number(value)
                                    const nm = String(name)
                                    if (nm === 'revenue') {
                                      return [formatCurrency(val), t('admin.dashboard.analytics.charts.revenue')];
                                    }
                                    return [val, t('admin.dashboard.analytics.charts.bookings')];
                                  }}
                                  contentStyle={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '14px',
                                    borderRadius: '4px',
                                    borderColor: '#c4b09a',
                                  }}
                                />
                                <Bar dataKey="revenue" fill="#5b7e8f" name="revenue" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Channels Performance Table */}
                    <div className="bg-white border border-sand rounded shadow-sm flex flex-col gap-4 p-6">
                      <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
                        {t('admin.dashboard.analytics.title')}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left min-w-[600px]">
                          <thead>
                            <tr className="border-b border-sand bg-cream">
                              <th className="p-4 font-sub text-base text-charcoal font-bold">
                                {t('admin.dashboard.analytics.table.channel')}
                              </th>
                              <th className="p-4 font-sub text-base text-charcoal font-bold text-center">
                                {t('admin.dashboard.analytics.table.volume')}
                              </th>
                              <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                                {t('admin.dashboard.analytics.table.revenue')}
                              </th>
                              <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                                {t('admin.dashboard.analytics.table.avgValue')}
                              </th>
                              <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                                {t('admin.dashboard.analytics.table.share')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {channelsPerformance.map((ch) => (
                              <tr key={ch.source} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                                <td className="p-4 font-body text-base text-charcoal font-medium">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: LEAD_COLORS[ch.source] || '#7a8f96' }}
                                    />
                                    {ch.name}
                                  </div>
                                </td>
                                <td className="p-4 font-body text-base text-charcoal text-center">
                                  {ch.volume}
                                </td>
                                <td className="p-4 font-body text-base text-charcoal text-right">
                                  {formatCurrency(ch.revenue)}
                                </td>
                                <td className="p-4 font-body text-base text-charcoal text-right">
                                  {formatCurrency(ch.avgValue)}
                                </td>
                                <td className="p-4 font-body text-base text-charcoal text-right">
                                  {ch.share.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
