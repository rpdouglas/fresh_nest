import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/firebase'

export type AnalyticsTimeRange = 'all' | '30days' | '90days' | 'ytd' | 'month'

export const LEAD_COLORS: Record<string, string> = {
  organic: '#5b7e8f',  // slate-brand
  google: '#7fa0b0',   // slate-light
  referral: '#c4b09a', // sand-dark
  facebook: '#3f5f6e', // slate-dark
  direct: '#7a8f96',   // text-muted
}

export interface AnalyticsPayload {
  analyticsTotalBookings: number
  analyticsTotalRevenue: number
  analyticsAvgBookingValue: number
  leadSourceData: Array<{ name: string; value: number; revenue: number; key: string }>
  monthlyTrendData: Array<{ monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }>
  channelsPerformance: Array<{ source: string; name: string; volume: number; revenue: number; avgValue: number; share: number }>
  referredBookingsCount: number
}

export function useAdminAnalytics() {
  const { i18n } = useTranslation()
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<AnalyticsTimeRange>('all')

  const { data: payload, isLoading, error } = useQuery<AnalyticsPayload>({
    queryKey: ['adminAnalytics', analyticsTimeRange],
    queryFn: async () => {
      const getKPIs = httpsCallable<{ timeRange: AnalyticsTimeRange }, AnalyticsPayload>(
        functions,
        'getAnalyticsKPIs'
      )
      const res = await getKPIs({ timeRange: analyticsTimeRange })
      return res.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  })

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
    analyticsTotalBookings: payload?.analyticsTotalBookings ?? 0,
    analyticsTotalRevenue: payload?.analyticsTotalRevenue ?? 0,
    analyticsAvgBookingValue: payload?.analyticsAvgBookingValue ?? 0,
    leadSourceData: payload?.leadSourceData ?? [],
    monthlyTrendData: payload?.monthlyTrendData ?? [],
    channelsPerformance: payload?.channelsPerformance ?? [],
    referredBookingsCount: payload?.referredBookingsCount ?? 0,
    formatCurrency,
    isLoading,
    error: error ? String(error) : null,
  }
}
