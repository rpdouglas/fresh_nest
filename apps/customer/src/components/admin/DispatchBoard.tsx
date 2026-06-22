import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { query, where, getDocs } from 'firebase/firestore'
import { jobsCollection } from '@freshnest/shared'
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core'
import { db, auth } from '@/lib/firebase/firebase'
import { assignCleanerTransaction } from '@/lib/firebase/firestore'
import { useStaff } from './hooks/useStaff'
import { OverrideModal } from './OverrideModal'
import { checkCleanerSchedulingConflicts, timeToMinutes } from '@/lib/utils/scheduling'
import type { Booking, Job } from '@/types'
import { cn } from '@/lib/utils/utils'

// Re-map queryClient hook since we use queryClient.invalidateQueries
import { useQueryClient as useTanstackQueryClient } from '@tanstack/react-query'

interface DispatchBoardProps {
  isAuthorized: boolean
}

// Visual helpers for P7 Carla's Safe to Earn Meter
const getEarningsBgClass = (current: number, limit: number) => {
  const diff = limit - current
  if (diff <= 0) return 'bg-red-600'
  if (diff <= 100) return 'bg-amber-500'
  return 'bg-green-600'
}

const getEarningsColorClass = (current: number, limit: number) => {
  const diff = limit - current
  if (diff <= 0) return 'text-red-700'
  if (diff <= 100) return 'text-amber-600'
  return 'text-green-700'
}

// Convert YYYY-MM-DD date string to Date object
const parseDateString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Calculate the Mon-Sun bounds for a given date
const getWeekBounds = (dateStr: string) => {
  const date = parseDateString(dateStr)
  const day = date.getDay()
  // Adjust so Monday is day 1, Sunday is day 7 (or 0)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

// Helper to calculate job duration in hours
const getJobDurationHours = (job: Job): number => {
  try {
    const [startH, startM] = job.scheduledStartTime.split(':').map(Number)
    const [endH, endM] = job.scheduledEndTime.split(':').map(Number)
    const diff = (endH + endM / 60) - (startH + startM / 60)
    return diff > 0 ? diff : 2
  } catch {
    return 2
  }
}

// Helper to translate a Job to a mock Booking for conflict checking
const jobToMockBooking = (job: Job): Booking => {
  return {
    id: job.bookingId,
    address: job.clientAddress,
    preferredDate: job.scheduledDate,
    jobId: job.id,
    firstName: job.clientName.split(' ')[0] || '',
    lastName: job.clientName.split(' ').slice(1).join(' ') || '',
    email: '',
    phone: job.clientPhone,
    language: 'en',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    frequency: 'one-time',
    pets: false,
    serviceType: job.serviceType,
    addOns: [],
    leadSource: 'organic',
    status: 'pending',
    isAirbnb: false,
    photoConfirmation: false,
    createdAt: new Date(),
  }
}

// 1. Draggable Job Card Component
const DraggableJobCard: React.FC<{ job: Job; hasConflict: boolean; conflictText?: string }> = ({
  job,
  hasConflict,
  conflictText,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id!,
  })
  const { t } = useTranslation()

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: 0.8,
        zIndex: 50,
        cursor: 'grabbing',
      }
    : {
        cursor: 'grab',
      }

  // Position absolutely if assigned inside schedule grid
  const isAssigned = job.assignedTo !== null
  let gridStyle: React.CSSProperties = {}

  if (isAssigned) {
    const startMin = timeToMinutes(job.scheduledStartTime) - 480 // 8:00 AM represents 480 minutes
    const endMin = timeToMinutes(job.scheduledEndTime) - 480
    const clampedStart = Math.max(0, Math.min(600, startMin))
    const clampedEnd = Math.max(0, Math.min(600, endMin))

    const scale = 500 / 600 // 500px track represents 600 minutes
    const top = clampedStart * scale
    const height = (clampedEnd - clampedStart) * scale

    gridStyle = {
      position: 'absolute',
      left: '4px',
      right: '4px',
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  const combinedStyle = { ...style, ...gridStyle }

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-white border rounded p-3 shadow-sm select-none transition-colors group flex flex-col justify-between overflow-hidden',
        isDragging ? 'border-slate-brand border-2' : 'border-sand hover:border-slate-brand',
        hasConflict ? 'border-red-400 bg-red-50/20' : '',
        !isAssigned ? 'min-h-[120px]' : ''
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-1">
          <span className="font-body text-base font-semibold text-charcoal truncate">
            {job.clientName}
          </span>
          {hasConflict && (
            <span
              className="text-red-600 text-base shrink-0 cursor-help"
              title={conflictText}
            >
              ⚠️
            </span>
          )}
        </div>
        <p className="font-body text-sm text-text-muted truncate">
          {job.clientAddress}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="bg-slate-pale text-slate-dark text-[10px] px-1.5 py-0.5 rounded font-body font-medium capitalize">
            {t(`services.${job.serviceType}.title`, { defaultValue: job.serviceType })}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 border-t border-sand/50 pt-2 font-body text-sm text-text-muted">
        <span>
          {job.scheduledStartTime} - {job.scheduledEndTime}
        </span>
        <span className="text-[10px] font-semibold uppercase text-slate-brand">
          {t(`booking.status.${job.status}`, { defaultValue: job.status })}
        </span>
      </div>
    </div>
  )
}

// 2. Droppable Staff Column Component
const DroppableStaffColumn: React.FC<{
  id: string
  title: string
  subtitle: string
  weeklyHours: number
  earningsLimit: number | null
  currentEarnings: number
  children: React.ReactNode
}> = ({
  id,
  title,
  subtitle,
  weeklyHours,
  earningsLimit,
  currentEarnings,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })
  const { t } = useTranslation()

  // Generate hourly lines for 8 AM to 6 PM
  const hourlySlots = Array.from({ length: 11 }, (_, i) => 8 + i) // [8, 9, ..., 18]

  return (
    <div className="w-[260px] shrink-0 flex flex-col gap-4 border border-sand bg-cream/30 rounded p-3">
      {/* Column Header */}
      <div className="bg-white border border-sand p-3 rounded flex flex-col gap-2 shadow-sm shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-sub text-base font-bold text-charcoal leading-tight truncate max-w-[140px]">
              {title}
            </h4>
            <p className="font-body text-sm text-text-muted capitalize">
              {subtitle}
            </p>
          </div>
          <span className="font-body text-sm font-semibold text-slate-brand bg-slate-pale/50 px-2 py-0.5 rounded shrink-0">
            {t('admin.operations.hours', { val: weeklyHours.toFixed(1) })}
          </span>
        </div>

        {/* P7 Carla Safe to Earn Monthly Progress Meter */}
        {earningsLimit !== null && (
          <div className="flex flex-col gap-1 mt-1 border-t border-sand/50 pt-1.5">
            <div className="flex justify-between text-[11px] font-body">
              <span className="text-text-muted">
                {t('admin.dispatch.earned', { defaultValue: 'Earned' })}: ${currentEarnings} / ${earningsLimit}
              </span>
              <span className={cn('font-semibold', getEarningsColorClass(currentEarnings, earningsLimit))}>
                {Math.round((currentEarnings / earningsLimit) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-pale h-1.5 rounded overflow-hidden">
              <div
                className={cn('h-full rounded transition-all duration-300', getEarningsBgClass(currentEarnings, earningsLimit))}
                style={{ width: `${Math.min((currentEarnings / earningsLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Column Body Droppable zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'relative w-full h-[500px] border border-dashed rounded transition-colors duration-200 overflow-y-hidden',
          isOver ? 'bg-slate-pale/40 border-slate-brand border-2' : 'bg-white border-sand'
        )}
      >
        {/* Render background grid lines for hours */}
        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {hourlySlots.map((hour, idx) => {
            const top = idx * 50 // 50px per hour
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-sand/20"
                style={{ top: `${top}px`, height: '50px' }}
              />
            )
          })}
        </div>

        {/* Child Draggable shifts */}
        {children}
      </div>
    </div>
  )
}

export const DispatchBoard: React.FC<DispatchBoardProps> = ({ isAuthorized }) => {
  const { t } = useTranslation()
  const queryClient = useTanstackQueryClient()

  // Selected Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Collapsible sidebar for unassigned jobs
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // State to handle visual drag updates before save
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>({})

  // Fetch active staff cleaners & supervisors
  const { staffList, isLoading: isStaffLoading, error: staffError } = useStaff(isAuthorized)
  const activeStaff = useMemo(() => {
    return staffList.filter((s) => s.status === 'active' && (s.role === 'cleaner' || s.role === 'lead'))
  }, [staffList])

  // Get week bounds for jobs query isolated to active week
  const weekBounds = useMemo(() => getWeekBounds(selectedDate), [selectedDate])

  // Fetch weekly jobs list to determine daily allocations and weekly totals
  const [weeklyJobs, setWeeklyJobs] = useState<Job[]>([])
  const [isJobsLoading, setIsJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)

  const fetchWeeklyJobs = React.useCallback(async () => {
    setIsJobsLoading(true)
    setJobsError(null)
    try {
      const q = query(
        jobsCollection(db),
        where('scheduledDate', '>=', weekBounds.start),
        where('scheduledDate', '<=', weekBounds.end)
      )
      const snap = await getDocs(q)
      const list = snap.docs.map((docSnap) => docSnap.data())
      setTimeout(() => {
        setWeeklyJobs(list)
        setLocalAssignments({})
      }, 0)
    } catch (err) {
      console.error('Error fetching weekly jobs:', err)
      setTimeout(() => {
        setJobsError(String(err))
      }, 0)
    } finally {
      setTimeout(() => {
        setIsJobsLoading(false)
      }, 0)
    }
  }, [weekBounds.start, weekBounds.end])

  useEffect(() => {
    if (isAuthorized) {
      void fetchWeeklyJobs()
    }
  }, [fetchWeeklyJobs, isAuthorized])

  // Map local changes to actual display jobs
  const jobs = useMemo<Job[]>(() => {
    return weeklyJobs.map((j) => {
      if (j.id && localAssignments[j.id] !== undefined) {
        return {
          ...j,
          assignedTo: localAssignments[j.id],
        }
      }
      return j
    })
  }, [weeklyJobs, localAssignments])

  // Filter jobs for selected date
  const dailyJobs = useMemo(() => {
    return jobs.filter((j) => j.scheduledDate === selectedDate && j.status !== 'cancelled')
  }, [jobs, selectedDate])

  const unassignedJobs = useMemo(() => {
    return dailyJobs.filter((j) => j.assignedTo === null)
  }, [dailyJobs])


  // Pre-calculate weekly hours for each cleaner on the active week
  const cleanerWeeklyHours = useMemo(() => {
    const hoursMap: Record<string, number> = {}
    activeStaff.forEach((s) => {
      hoursMap[s.id] = 0
    })

    jobs
      .filter((j) => j.status !== 'cancelled' && j.assignedTo !== null)
      .forEach((job) => {
        if (job.assignedTo && hoursMap[job.assignedTo] !== undefined) {
          hoursMap[job.assignedTo] += getJobDurationHours(job)
        }
      })

    return hoursMap
  }, [activeStaff, jobs])

  // Pre-calculate scheduling conflicts for all jobs currently displayed
  const dailyConflicts = useMemo(() => {
    const conflictsMap: Record<string, { hasConflict: boolean; text?: string }> = {}

    dailyJobs.forEach((job) => {
      conflictsMap[job.id!] = { hasConflict: false }
    })

    // Group assigned jobs by staff member for detail checks
    const assignedByStaff: Record<string, Job[]> = {}
    activeStaff.forEach((s) => {
      assignedByStaff[s.id] = []
    })

    dailyJobs.forEach((job) => {
      if (job.assignedTo && assignedByStaff[job.assignedTo]) {
        assignedByStaff[job.assignedTo].push(job)
      }
    })

    // Perform checks
    activeStaff.forEach((staff) => {
      const staffJobs = assignedByStaff[staff.id].sort((a, b) =>
        timeToMinutes(a.scheduledStartTime) - timeToMinutes(b.scheduledStartTime)
      )

      // 1. Earnings cap check (simple warnings check)
      const limit = staff.financials?.monthlyEarningsLimit ?? null
      const current = staff.financials?.currentMonthEarnings ?? 0

      const isOverMonthlyCap = limit !== null && current > limit

      staffJobs.forEach((job, idx) => {
        const warnings: string[] = []

        // Earnings cap overage warning
        if (isOverMonthlyCap) {
          warnings.push(t('admin.override.earningsWarning', { name: `${staff.firstName} ${staff.lastName}`, overage: Math.max(0, current - limit) }))
        }

        // 2. Blocked Window check
        const blockedWindows = staff.constraints?.blockedWindows || []
        const shiftDayOfWeek = new Date(job.scheduledDate + 'T00:00:00').getDay()
        const startS = timeToMinutes(job.scheduledStartTime)
        const endS = timeToMinutes(job.scheduledEndTime)

        for (const window of blockedWindows) {
          let isMatch = false
          if (window.recurring) {
            isMatch = window.dayOfWeek === shiftDayOfWeek
          } else if (window.date) {
            isMatch = window.date === job.scheduledDate
          }

          if (isMatch) {
            const startW = timeToMinutes(window.startTime)
            const endW = timeToMinutes(window.endTime)
            if (startS < endW && endS > startW) {
              warnings.push(t('admin.override.blockedWindowWarning', { name: `${staff.firstName} ${staff.lastName}` }))
              break
            }
          }
        }

        // 3. Overlap & travel buffer check with previous job
        if (idx > 0) {
          const prevJob = staffJobs[idx - 1]
          const endPrev = timeToMinutes(prevJob.scheduledEndTime)

          if (startS < endPrev) {
            warnings.push(t('admin.override.overlapWarning', { name: `${staff.firstName} ${staff.lastName}`, start: prevJob.scheduledStartTime, end: prevJob.scheduledEndTime }))
          } else {
            // Buffer check
            const transportMode = staff.constraints?.transportMode || 'transit'
            const defaultBuffer = transportMode === 'transit' ? 60 : 30
            const bufferMinutes = typeof staff.constraints?.transitBufferMinutes === 'number'
              ? staff.constraints.transitBufferMinutes
              : defaultBuffer

            const gap = startS - endPrev
            const fsaC = extractPostalPrefix(job.clientAddress)
            const fsaP = extractPostalPrefix(prevJob.clientAddress)
            const sameFSA = fsaC && fsaP && fsaC === fsaP

            if (gap < bufferMinutes && !sameFSA) {
              warnings.push(t('admin.override.travelWarning', {
                name: `${staff.firstName} ${staff.lastName}`,
                buffer: bufferMinutes,
                start: prevJob.scheduledStartTime,
                end: prevJob.scheduledEndTime,
              }))
            }
          }
        }

        if (warnings.length > 0) {
          conflictsMap[job.id!] = {
            hasConflict: true,
            text: warnings.join('; '),
          }
        }
      })
    })

    return conflictsMap
  }, [activeStaff, dailyJobs, t])

  // Extract postal prefix helper locally for formatting
  const extractPostalPrefix = (address: string): string | null => {
    if (!address) return null
    const match = address.match(/([A-Za-z]\d[A-Za-z])/i)
    return match ? match[1].toUpperCase() : null
  }

  // Droppable Unassigned sidebar zone
  const { setNodeRef: setSidebarDroppableRef, isOver: isSidebarOver } = useDroppable({
    id: 'unassigned',
  })

  // Override Modal States
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<{
    jobId: string
    bookingId: string
    cleanerId: string | null
    cleanerName: string | null
    oldCleanerId: string | null
    estimatedPay: number
    warnings: string[]
    overrideTypes: string[]
  } | null>(null)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const jobId = active.id as string
    const targetCleanerId = over.id === 'unassigned' ? null : (over.id as string)

    const jobToAssign = jobs.find((j) => j.id === jobId)
    if (!jobToAssign) return

    const currentlyAssignedCleanerId = jobToAssign.assignedTo

    // If dropped in the same column, do nothing
    if (currentlyAssignedCleanerId === targetCleanerId) return

    const payRate = jobToAssign.payRateSnapshot?.amount || 25
    const duration = getJobDurationHours(jobToAssign)
    const estPay = payRate * duration

    // 1. Unassignment Flow
    if (targetCleanerId === null) {
      try {
        setLocalAssignments((prev) => ({ ...prev, [jobId]: null }))
        await assignCleanerTransaction({
          bookingId: jobToAssign.bookingId,
          jobId: jobToAssign.id!,
          cleanerId: null,
          cleanerName: null,
          oldCleanerId: currentlyAssignedCleanerId,
          estimatedPay: estPay,
          changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
        })
        await queryClient.invalidateQueries({ queryKey: ['jobs'] })
        void fetchWeeklyJobs()
      } catch (err) {
        console.error('Error unassigning cleaner:', err)
        // Revert local state
        setLocalAssignments((prev) => ({ ...prev, [jobId]: currentlyAssignedCleanerId }))
      }
      return
    }

    // 2. Assignment Flow
    const selectedStaff = staffList.find((s) => s.id === targetCleanerId)
    if (!selectedStaff) return

    const newCleanerName = `${selectedStaff.firstName} ${selectedStaff.lastName}`
    const mockBooking = jobToMockBooking(jobToAssign)

    // Check conflicts
    const conflictResult = await checkCleanerSchedulingConflicts({
      selectedStaff,
      booking: mockBooking,
      job: jobToAssign,
      estimatedPay: estPay,
      t,
    })

    if (conflictResult.warnings.length > 0) {
      // Trigger Override Dialog
      setPendingAssignment({
        jobId,
        bookingId: jobToAssign.bookingId,
        cleanerId: targetCleanerId,
        cleanerName: newCleanerName,
        oldCleanerId: currentlyAssignedCleanerId,
        estimatedPay: estPay,
        warnings: conflictResult.warnings,
        overrideTypes: conflictResult.overrideTypes,
      })
      setIsOverrideOpen(true)
    } else {
      // Save directly
      try {
        setLocalAssignments((prev) => ({ ...prev, [jobId]: targetCleanerId }))
        await assignCleanerTransaction({
          bookingId: jobToAssign.bookingId,
          jobId: jobToAssign.id!,
          cleanerId: targetCleanerId,
          cleanerName: newCleanerName,
          oldCleanerId: currentlyAssignedCleanerId,
          estimatedPay: estPay,
          changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
        })
        await queryClient.invalidateQueries({ queryKey: ['jobs'] })
        void fetchWeeklyJobs()
      } catch (err) {
        console.error('Error assigning cleaner:', err)
        setLocalAssignments((prev) => ({ ...prev, [jobId]: currentlyAssignedCleanerId }))
      }
    }
  }

  const handleOverrideConfirm = async (reason: string) => {
    setIsOverrideOpen(false)
    if (!pendingAssignment) return

    const { jobId, bookingId, cleanerId, cleanerName, oldCleanerId, estimatedPay, overrideTypes } = pendingAssignment

    try {
      setLocalAssignments((prev) => ({ ...prev, [jobId]: cleanerId }))
      await assignCleanerTransaction({
        bookingId,
        jobId,
        cleanerId,
        cleanerName,
        oldCleanerId,
        estimatedPay,
        overrideReason: reason,
        overrideType: overrideTypes.join(','),
        changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
      })
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })
      void fetchWeeklyJobs()
    } catch (err) {
      console.error('Error executing override assignment:', err)
      // Revert local state
      setLocalAssignments((prev) => ({ ...prev, [jobId]: oldCleanerId }))
    } finally {
      setPendingAssignment(null)
    }
  }

  // Navigation helpers for dates
  const handlePrevDay = () => {
    setLocalAssignments({})
    const d = parseDateString(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    setLocalAssignments({})
    const d = parseDateString(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const isLoading = isStaffLoading || isJobsLoading

  return (
    <div className="flex flex-col gap-6">
      {/* Date Navigation & Control Panel */}
      <div className="bg-white border border-sand rounded p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.dispatch.title', { defaultValue: 'Visual Dispatch Board' })}
          </h2>
          <p className="font-body text-base text-text-muted mt-0.5">
            {t('admin.operations.subtitle')}
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handlePrevDay}
            className="min-h-[48px] px-4 border border-sand rounded font-body font-medium hover:bg-cream transition-colors duration-200"
          >
            ← {t('admin.dispatch.prevDay', { defaultValue: 'Previous Day' })}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setLocalAssignments({})
              setSelectedDate(e.target.value)
            }}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand text-center"
          />
          <button
            onClick={handleNextDay}
            className="min-h-[48px] px-4 border border-sand rounded font-body font-medium hover:bg-cream transition-colors duration-200"
          >
            {t('admin.dispatch.nextDay', { defaultValue: 'Next Day' })} →
          </button>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="min-h-[48px] px-4 border border-slate-brand text-slate-brand rounded font-body font-medium hover:bg-slate-pale/30 transition-colors duration-200 ml-2"
          >
            {isSidebarOpen ? t('admin.dispatch.close', { defaultValue: 'Close' }) : t('admin.dispatch.unassigned', { defaultValue: 'Unassigned' })}
          </button>
        </div>
      </div>

      {isLoading && weeklyJobs.length === 0 ? (
        <div className="flex items-center justify-center p-12 bg-white border border-sand rounded">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staffError || jobsError ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
          {staffError ? String(staffError.message || staffError) : String(jobsError)}
        </div>
      ) : (
        <DndContext onDragEnd={(event) => { void handleDragEnd(event) }}>
          <div className="flex gap-6 items-start relative min-h-[600px] overflow-hidden">
            {/* 3. Collapsible Unassigned Sidebar */}
            {isSidebarOpen && (
              <div
                ref={setSidebarDroppableRef}
                className={cn(
                  'w-[280px] shrink-0 border border-sand bg-white rounded p-4 flex flex-col gap-4 shadow-sm h-[650px] transition-all duration-200',
                  isSidebarOver ? 'bg-red-50/20 border-red-400 border-2' : ''
                )}
              >
                <div className="border-b border-sand pb-3 shrink-0 flex justify-between items-center">
                  <h3 className="font-sub text-xl font-bold text-charcoal">
                    {t('admin.dispatch.unassigned', { defaultValue: 'Unassigned Jobs' })}
                  </h3>
                  <span className="bg-red-100 text-red-800 text-sm font-semibold px-2 py-0.5 rounded font-body shrink-0">
                    {unassignedJobs.length}
                  </span>
                </div>

                {/* Sidebar Cards Stack */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                  {unassignedJobs.length === 0 ? (
                    <p className="font-body text-base text-text-muted italic text-center py-8">
                      {t('admin.dispatch.empty', { defaultValue: 'No unassigned jobs today.' })}
                    </p>
                  ) : (
                    unassignedJobs.map((job) => (
                      <DraggableJobCard
                        key={job.id}
                        job={job}
                        hasConflict={dailyConflicts[job.id!]?.hasConflict || false}
                        conflictText={dailyConflicts[job.id!]?.text}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. Staff Columns Horizontal Grid */}
            <div className="flex-1 overflow-x-auto flex gap-4 pb-4 h-[650px]">
              {activeStaff.length === 0 ? (
                <div className="flex-1 bg-white border border-sand rounded p-8 text-center flex flex-col items-center justify-center">
                  <p className="font-body text-base text-text-muted italic">
                    {t('admin.dispatch.noCleaners', { defaultValue: 'No active cleaners found.' })}
                  </p>
                </div>
              ) : (
                activeStaff.map((cleaner) => {
                  const cleanerJobs = dailyJobs.filter((j) => j.assignedTo === cleaner.id)
                  const hours = cleanerWeeklyHours[cleaner.id] || 0

                  return (
                    <DroppableStaffColumn
                      key={cleaner.id}
                      id={cleaner.id}
                      title={`${cleaner.firstName} ${cleaner.lastName}`}
                      subtitle={t(`admin.staff.modal.roleOption.${cleaner.role}`, { defaultValue: cleaner.role })}
                      weeklyHours={hours}
                      earningsLimit={cleaner.financials?.monthlyEarningsLimit ?? null}
                      currentEarnings={cleaner.financials?.currentMonthEarnings ?? 0}
                    >
                      {cleanerJobs.map((job) => (
                        <DraggableJobCard
                          key={job.id}
                          job={job}
                          hasConflict={dailyConflicts[job.id!]?.hasConflict || false}
                          conflictText={dailyConflicts[job.id!]?.text}
                        />
                      ))}
                    </DroppableStaffColumn>
                  )
                })
              )}
            </div>
          </div>
        </DndContext>
      )}

      {/* Override Reason Prompt modal dialog */}
      <OverrideModal
        isOpen={isOverrideOpen}
        cleanerName={pendingAssignment?.cleanerName || ''}
        warnings={pendingAssignment?.warnings || []}
        onConfirm={(reason) => { void handleOverrideConfirm(reason) }}
        onCancel={() => {
          setIsOverrideOpen(false)
          setPendingAssignment(null)
        }}
      />
    </div>
  )
}
