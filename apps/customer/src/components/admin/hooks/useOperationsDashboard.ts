import { useState, useMemo } from 'react'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import type { Job, Staff } from '@/types'

export type OpsTimeRange = 'today' | 'this_week' | 'this_month' | 'custom'

export function useOperationsDashboard(enabled: boolean) {
  const [timeRange, setTimeRange] = useState<OpsTimeRange>('this_month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const jobsQuery = useMemo(() => {
    return query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))
  }, [])

  const staffQuery = useMemo(() => {
    return query(collection(db, 'staff'), orderBy('createdAt', 'desc'))
  }, [])

  const { data: jobsSnapshot, isLoading: isJobsLoading, error: jobsError } = useCollectionQuery(jobsQuery, {
    queryKey: ['jobs'],
    enabled,
  })

  const { data: staffSnapshot, isLoading: isStaffLoading, error: staffError } = useCollectionQuery(staffQuery, {
    queryKey: ['staff'],
    enabled,
  })

  const rawJobs = useMemo<Job[]>(() => {
    if (!jobsSnapshot) return []
    return jobsSnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        checkedInAt: data.checkedInAt instanceof Timestamp ? data.checkedInAt.toDate() : null,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : null,
      } as Job
    })
  }, [jobsSnapshot])

  const staffList = useMemo<Staff[]>(() => {
    if (!staffSnapshot) return []
    return staffSnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Staff
    })
  }, [staffSnapshot])

  // Helper to parse YYYY-MM-DD to Date object
  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Filter jobs by time range
  const filteredJobs = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const todayStr = now.toISOString().split('T')[0]

    // Calculate start/end of current week (Monday - Sunday)
    const currentDay = now.getDay()
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() + diffToMonday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Calculate start/end of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    return rawJobs.filter((job) => {
      const jobDate = parseDateString(job.scheduledDate)

      if (timeRange === 'today') {
        return job.scheduledDate === todayStr
      }
      if (timeRange === 'this_week') {
        return jobDate >= startOfWeek && jobDate <= endOfWeek
      }
      if (timeRange === 'this_month') {
        return jobDate >= startOfMonth && jobDate <= endOfMonth
      }
      if (timeRange === 'custom') {
        if (!customStartDate || !customEndDate) return true
        const start = new Date(customStartDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        return jobDate >= start && jobDate <= end
      }
      return true
    })
  }, [rawJobs, timeRange, customStartDate, customEndDate])

  // Helper to calculate job duration in hours
  const getJobDurationHours = (job: Job): number => {
    try {
      const [startH, startM] = job.scheduledStartTime.split(':').map(Number)
      const [endH, endM] = job.scheduledEndTime.split(':').map(Number)
      const diff = (endH + endM / 60) - (startH + startM / 60)
      return diff > 0 ? diff : 2 // default fallback 2 hours
    } catch {
      return 2
    }
  }

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
    error: jobsError || staffError,
  }
}
