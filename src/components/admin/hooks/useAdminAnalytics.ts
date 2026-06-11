import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateQuote } from '@/lib/utils/quotePricing'
import type { QuotePropertySize, QuoteServiceType } from '@/lib/utils/quotePricing'
import type { Booking } from '@/types'

export type AnalyticsTimeRange = 'all' | '30days' | '90days' | 'ytd' | 'month'

export const LEAD_COLORS: Record<string, string> = {
  organic: '#5b7e8f',  // slate-brand
  google: '#7fa0b0',   // slate-light
  referral: '#c4b09a', // sand-dark
  facebook: '#3f5f6e', // slate-dark
  direct: '#7a8f96',   // text-muted
}

export function useAdminAnalytics(bookings: Booking[]) {
  const { t, i18n } = useTranslation()
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<AnalyticsTimeRange>('all')

  // Helper to calculate estimated price in-memory for analytics
  const getEstimatedPrice = useMemo(() => {
    return (booking: Booking): number => {
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
      const frequency = booking.frequency

      const quote = calculateQuote(size, service, frequency)
      if (quote.type === 'range') {
        return (quote.min + quote.max) / 2
      }
      return 150
    }
  }, [])

  // Filtering based on time range
  const filteredAnalyticsBookings = useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
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
  }, [bookings, analyticsTimeRange])

  // KPI Metrics
  const analyticsTotalBookings = filteredAnalyticsBookings.length
  const analyticsTotalRevenue = useMemo(() => {
    return filteredAnalyticsBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
  }, [filteredAnalyticsBookings, getEstimatedPrice])

  const analyticsAvgBookingValue = useMemo(() => {
    return analyticsTotalBookings > 0 ? analyticsTotalRevenue / analyticsTotalBookings : 0
  }, [analyticsTotalBookings, analyticsTotalRevenue])

  // 1. Lead Source Distribution (Pie Chart)
  const leadSourceData = useMemo(() => {
    const leadSourceKeys = ['organic', 'google', 'referral', 'facebook', 'direct']
    return leadSourceKeys.map((source) => {
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
  }, [filteredAnalyticsBookings, getEstimatedPrice, t])

  // 2. Monthly Trend Chart
  const monthlyTrendData = useMemo(() => {
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
    return Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey)
  }, [filteredAnalyticsBookings, getEstimatedPrice, i18n.language])

  // Channels Performance Table
  const channelsPerformance = useMemo(() => {
    const leadSourceKeys = ['organic', 'google', 'referral', 'facebook', 'direct']
    return leadSourceKeys.map((source) => {
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
  }, [filteredAnalyticsBookings, analyticsTotalBookings, getEstimatedPrice, t])

  const formatCurrency = useMemo(() => {
    return (val: number) => {
      return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0,
      }).format(val)
    }
  }, [i18n.language])

  return {
    analyticsTimeRange,
    setAnalyticsTimeRange,
    analyticsTotalBookings,
    analyticsTotalRevenue,
    analyticsAvgBookingValue,
    leadSourceData,
    monthlyTrendData,
    channelsPerformance,
    formatCurrency,
  }
}
