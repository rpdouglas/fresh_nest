import { useState, useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { addDays, endOfMonth, getShiftDurationHours, jobsCollection, staffCollection, startOfMonth, startOfWeek, todayInZone } from '@freshnest/shared'
import type { Job, Staff } from '@/types'

export type OpsTimeRange = 'today' | 'this_week' | 'this_month' | 'custom'

export function useOperationsDashboard(enabled: boolean) {
  const [timeRange, setTimeRange] = useState<OpsTimeRange>('this_month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Calculate start and end date bounds for jobs query based on selected timeRange
  const dateRangeBounds = useMemo(() => {
    // Calendar dates in Toronto time (P3-E38); weeks run Monday–Sunday
    const todayStr = todayInZone()
    const startOfWeekStr = startOfWeek(todayStr)
    const endOfWeekStr = addDays(startOfWeekStr, 6)
    const startOfMonthStr = startOfMonth(todayStr)
    const endOfMonthStr = endOfMonth(todayStr)

    if (timeRange === 'today') {
      return { start: todayStr, end: todayStr }
    }
    if (timeRange === 'this_week') {
      return { start: startOfWeekStr, end: endOfWeekStr }
    }
    if (timeRange === 'this_month') {
      return { start: startOfMonthStr, end: endOfMonthStr }
    }
    if (timeRange === 'custom') {
      // Fallback range if not specified
      const start = customStartDate || addDays(todayStr, -30)
      const end = customEndDate || addDays(todayStr, 30)
      return { start, end }
    }

    return { start: startOfMonthStr, end: endOfMonthStr }
  }, [timeRange, customStartDate, customEndDate])

  // Restricted jobs query based on date range bounds to save database reads
  const jobsQuery = useMemo(() => {
    return query(
      jobsCollection(db),
      where('scheduledDate', '>=', dateRangeBounds.start),
      where('scheduledDate', '<=', dateRangeBounds.end),
      orderBy('scheduledDate', 'desc')
    )
  }, [dateRangeBounds.start, dateRangeBounds.end])

  // Staff query remains unbounded since staff count is small and metadata is needed for listing
  const staffQuery = useMemo(() => {
    return query(staffCollection(db), orderBy('createdAt', 'desc'))
  }, [])

  const { data: jobsSnapshot, isLoading: isJobsLoading, error: jobsError } = useCollectionQuery(jobsQuery, {
    queryKey: ['jobs', dateRangeBounds.start, dateRangeBounds.end],
    enabled,
  })

  const { data: staffSnapshot, isLoading: isStaffLoading, error: staffError } = useCollectionQuery(staffQuery, {
    queryKey: ['staff'],
    enabled,
  })

  const rawJobs = useMemo<Job[]>(() => {
    if (!jobsSnapshot) return []
    return jobsSnapshot.docs.map((docSnap) => docSnap.data())
  }, [jobsSnapshot])

  const staffList = useMemo<Staff[]>(() => {
    if (!staffSnapshot) return []
    return staffSnapshot.docs.map((docSnap) => docSnap.data())
  }, [staffSnapshot])

  // Filter jobs by time range (double check filters client-side for dynamic edge cases).
  // 'YYYY-MM-DD' strings sort as dates, so the Toronto-date bounds above compare directly.
  const filteredJobs = useMemo(() => {
    if (timeRange === 'custom' && (!customStartDate || !customEndDate)) return rawJobs
    const { start, end } = dateRangeBounds
    return rawJobs.filter((job) => job.scheduledDate >= start && job.scheduledDate <= end)
  }, [rawJobs, timeRange, customStartDate, customEndDate, dateRangeBounds])

  const getJobDurationHours = (job: Job): number =>
    getShiftDurationHours(job.scheduledStartTime, job.scheduledEndTime)

  // KPI calculations
  const totalScheduledJobs = filteredJobs.filter(j => j.status !== 'cancelled').length
  const completedJobs = filteredJobs.filter(j => j.status === 'completed')
  const completedJobsCount = completedJobs.length

  const completionRate = useMemo(() => {
    return totalScheduledJobs > 0 ? (completedJobsCount / totalScheduledJobs) * 100 : 0
  }, [totalScheduledJobs, completedJobsCount])

  const payrollExpenses = useMemo(() => {
    return completedJobs.reduce((sum, job) => {
      const rate = job.payRateSnapshot?.amount || 0
      const hours = getJobDurationHours(job)
      return sum + (rate * hours)
    }, 0)
  }, [completedJobs])

  const averageJobDuration = useMemo(() => {
    const completedWithTimes = completedJobs.filter(j => j.checkedInAt && j.completedAt)
    if (completedWithTimes.length === 0) {
      // Fallback to scheduled duration
      if (completedJobsCount === 0) return 0
      const totalScheduledDuration = completedJobs.reduce((sum, job) => sum + getJobDurationHours(job), 0)
      return totalScheduledDuration / completedJobsCount
    }

    const totalActualDurationHours = completedWithTimes.reduce((sum, job) => {
      const diffMs = job.completedAt!.getTime() - job.checkedInAt!.getTime()
      return sum + (diffMs / (1000 * 60 * 60))
    }, 0)

    return totalActualDurationHours / completedWithTimes.length
  }, [completedJobs, completedJobsCount])

  // Cleaner utilization breakdown
  const cleanerUtilization = useMemo(() => {
    return staffList
      .filter(s => s.role === 'cleaner' || s.role === 'lead')
      .map((cleaner) => {
        const cleanerJobs = filteredJobs.filter(j => j.assignedTo === cleaner.id)
        const assigned = cleanerJobs.filter(j => j.status !== 'cancelled').length
        const completed = cleanerJobs.filter(j => j.status === 'completed').length
        const rate = assigned > 0 ? (completed / assigned) * 100 : 0

        return {
          id: cleaner.id,
          name: `${cleaner.firstName} ${cleaner.lastName}`,
          role: cleaner.role,
          status: cleaner.status,
          assigned,
          completed,
          completionRate: rate,
        }
      })
  }, [staffList, filteredJobs])

  return {
    timeRange,
    setTimeRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    filteredJobs,
    staffList,
    completionRate,
    completedJobsCount,
    payrollExpenses,
    averageJobDuration,
    cleanerUtilization,
    isLoading: isJobsLoading || isStaffLoading,
    error: jobsError || staffError ? String(jobsError || staffError) : null,
  }
}
