import { onCall, HttpsError } from 'firebase-functions/v2/https'
import {
  getFirestore,
  Timestamp,
  AggregateField,
  QueryDocumentSnapshot,
  Query,
  CollectionReference,
} from 'firebase-admin/firestore'
import { logError } from '../lib/shared'

function calculateEstimatedPriceFallback(propertyType: string, serviceType: string, frequency: string): number {
  if (propertyType === 'commercial') {
    return 300
  }
  const basePrices: Record<string, { min: number; max: number }> = {
    apartment: { min: 100, max: 130 },
    '1-2bed':  { min: 120, max: 155 },
    '3-4bed':  { min: 160, max: 200 },
    '5+bed':   { min: 210, max: 270 },
  }
  const base = basePrices[propertyType] || { min: 100, max: 130 }

  const multipliers: Record<string, number> = {
    standard:         1.0,
    deep:             1.5,
    moveout:          1.75,
    postconstruction: 2.0,
    airbnb:           0.85,
  }
  const multiplier = multipliers[serviceType] || 1.0

  const discounts: Record<string, number> = {
    'one-time': 0,
    weekly:     0.20,
    biweekly:   0.15,
    monthly:    0.10,
  }
  const discount = discounts[frequency] || 0

  const factor = multiplier * (1 - discount)
  const minPrice = Math.round((base.min * factor) / 5) * 5
  const maxPrice = Math.round((base.max * factor) / 5) * 5

  return (minPrice + maxPrice) / 2
}

export const getAnalyticsKPIs = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to view analytics.')
  }

  const db = getFirestore()
  let isAuthorized = auth.token.role === 'admin'
  if (!isAuthorized && auth.token.email) {
    const adminSnap = await db.collection('admins').doc(auth.token.email.trim().toLowerCase()).get()
    isAuthorized = adminSnap.exists
  }

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Unauthorized access to analytics dashboard.')
  }

  const timeRange = request.data?.timeRange as string || 'all'
  if (!['all', '30days', '90days', 'ytd', 'month'].includes(timeRange)) {
    throw new HttpsError('invalid-argument', 'Invalid time range parameter.')
  }

  const cacheRef = db.collection('reports').doc(timeRange)
  try {
    const cacheSnap = await cacheRef.get()
    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data()
      if (cacheData && cacheData.expiresAt) {
        const expiresAt = cacheData.expiresAt as Timestamp
        if (expiresAt.toDate() > new Date()) {
          console.log(`[getAnalyticsKPIs] Cache hit for time range: ${timeRange}`)
          return cacheData.data
        }
      }
    }
  } catch (cacheErr) {
    console.warn(`[getAnalyticsKPIs] Failed to read cache for ${timeRange}:`, cacheErr)
  }

  console.log(`[getAnalyticsKPIs] Cache miss for time range: ${timeRange}. Computing analytics...`)

  const now = new Date()
  let startDate: Date | null = null

  if (timeRange === '30days') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 30)
  } else if (timeRange === '90days') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 90)
  } else if (timeRange === 'ytd') {
    startDate = new Date(now.getFullYear(), 0, 1)
  } else if (timeRange === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  let bookingsQuery: Query | CollectionReference = db.collection('bookings')
  if (startDate) {
    bookingsQuery = bookingsQuery.where('createdAt', '>=', Timestamp.fromDate(startDate))
  }

  let totalBookings = 0
  let totalRevenueAgg = 0
  try {
    const aggSnapshot = await bookingsQuery.aggregate({
      count: AggregateField.count(),
      sumRevenue: AggregateField.sum('estimatedPrice'),
    }).get()

    const aggData = aggSnapshot.data()
    totalBookings = aggData.count || 0
    totalRevenueAgg = aggData.sumRevenue || 0
    console.log(`[getAnalyticsKPIs] Aggregation query: count=${totalBookings}, sumRevenue=${totalRevenueAgg}`)
  } catch (aggErr) {
    logError('[getAnalyticsKPIs] Aggregation query failed:', aggErr)
  }

  const snapshot = await bookingsQuery.select(
    'leadSource',
    'createdAt',
    'estimatedPrice',
    'referredBy',
    'propertyType',
    'serviceType',
    'frequency',
  ).get()

  let referredBookingsCount = 0

  const leadSourceCounts: Record<string, { count: number; revenue: number }> = {
    organic: { count: 0, revenue: 0 },
    google: { count: 0, revenue: 0 },
    referral: { count: 0, revenue: 0 },
    facebook: { count: 0, revenue: 0 },
    direct: { count: 0, revenue: 0 },
  }

  const monthlyDataMap: Record<string, { monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }> = {}

  snapshot.docs.forEach((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data()
    const createdAtTimestamp = data['createdAt'] as Timestamp | undefined
    if (!createdAtTimestamp) return

    const date = createdAtTimestamp.toDate()

    let price = data['estimatedPrice'] as number | undefined
    if (price === undefined || price === null) {
      price = calculateEstimatedPriceFallback(
        data['propertyType'] || 'apartment',
        data['serviceType'] || 'standard',
        data['frequency'] || 'one-time',
      )
    }

    if (data['referredBy']) {
      referredBookingsCount++
    }

    const source = data['leadSource'] as string
    if (leadSourceCounts[source]) {
      leadSourceCounts[source].count++
      leadSourceCounts[source].revenue += price
    } else if (source) {
      leadSourceCounts[source] = { count: 1, revenue: price }
    }

    const year = date.getFullYear()
    const month = date.getMonth()
    const sortKey = year * 100 + month
    const monthName = date.toLocaleDateString('en-CA', {
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
    monthlyDataMap[key].revenue += price
  })

  const leadSourceData = Object.entries(leadSourceCounts).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: val.count,
    revenue: val.revenue,
    key,
  })).filter(item => item.value > 0)

  const monthlyTrendData = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey)

  const analyticsTotalBookings = totalBookings
  const channelsPerformance = Object.entries(leadSourceCounts).map(([source, val]) => {
    const avgValue = val.count > 0 ? val.revenue / val.count : 0
    const share = analyticsTotalBookings > 0 ? (val.count / analyticsTotalBookings) * 100 : 0
    return {
      source,
      name: source.charAt(0).toUpperCase() + source.slice(1),
      volume: val.count,
      revenue: val.revenue,
      avgValue,
      share,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const analyticsAvgBookingValue = analyticsTotalBookings > 0 ? totalRevenueAgg / analyticsTotalBookings : 0

  const payload = {
    analyticsTotalBookings,
    analyticsTotalRevenue: totalRevenueAgg,
    analyticsAvgBookingValue,
    leadSourceData,
    monthlyTrendData,
    referredBookingsCount,
    channelsPerformance,
  }

  const expiresAtDate = new Date()
  expiresAtDate.setHours(expiresAtDate.getHours() + 1)

  try {
    await cacheRef.set({
      computedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAtDate),
      data: payload,
    })
  } catch (cacheWriteErr) {
    logError('[getAnalyticsKPIs] Failed to write cache:', cacheWriteErr)
  }

  return payload
})
