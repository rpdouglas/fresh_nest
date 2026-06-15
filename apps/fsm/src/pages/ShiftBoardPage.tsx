import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase/firebase'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useShifts } from '../hooks/useShifts'
import { useMyAssignedShifts } from '../hooks/useMyAssignedShifts'
import { cn } from '../lib/utils/utils'
import type { Job } from '../types'

// F06 Helpers
const timeToMinutes = (timeStr: string): number => {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  } catch {
    return 0
  }
}

const extractPostalPrefix = (address: string): string | null => {
  if (!address) return null
  const match = address.match(/([A-Za-z]\d[A-Za-z])/i)
  return match ? match[1].toUpperCase() : null
}

interface TravelShift {
  startTime: string
  endTime: string
  address: string
}

const hasTravelConflict = (
  candidate: TravelShift,
  existing: TravelShift,
  bufferMinutes: number
): boolean => {
  const startC = timeToMinutes(candidate.startTime)
  const endC = timeToMinutes(candidate.endTime)
  const startA = timeToMinutes(existing.startTime)
  const endA = timeToMinutes(existing.endTime)

  // 1. Direct overlap check
  if (startC < endA && endC > startA) {
    return true
  }

  // 2. Waive buffer if they share the same postal prefix
  const fsaC = extractPostalPrefix(candidate.address)
  const fsaA = extractPostalPrefix(existing.address)
  if (fsaC && fsaA && fsaC === fsaA) {
    return false
  }

  // 3. Buffer check
  if (endC <= startA) {
    const gap = startA - endC
    if (gap < bufferMinutes) {
      return true
    }
  } else if (endA <= startC) {
    const gap = startC - endA
    if (gap < bufferMinutes) {
      return true
    }
  }

  return false
}

export const ShiftBoardPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const { shifts, isLoading, error } = useShifts(!!staffProfile)
  const { assignedShifts } = useMyAssignedShifts(staffProfile?.uid, !!staffProfile)

  // Feedback states
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Calculate shift duration in hours
  const getShiftDurationHours = (startTime: string, endTime: string): number => {
    try {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const diff = (endH + endM / 60) - (startH + startM / 60)
      return diff > 0 ? diff : 2
    } catch {
      return 2
    }
  }

  // Format date based on selected locale
  const formatShiftDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Handle shift claim action
  const handleClaimShift = async (jobId: string) => {
    setClaimingId(jobId)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const claimJobFn = httpsCallable<{ jobId: string }, { success: boolean; newEarnings: number }>(
        functions,
        'claimJob'
      )
      await claimJobFn({ jobId })

      // Show success feedback
      setSuccessMsg(t('fsm.shifts.claimingSuccess'))
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : t('fsm.shifts.claimingError')
      setErrorMsg(message)
    } finally {
      setClaimingId(null)
    }
  }

  if (!staffProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  // Get current financials
  const currentEarnings = staffProfile.financials?.currentMonthEarnings ?? 0
  const limitValue = staffProfile.financials?.monthlyEarningsLimit ?? null
  const isCapConfigured = limitValue !== null && limitValue > 0

  // Calculate limit warnings
  let percentage = 0
  let safetyState: 'safe' | 'caution' | 'at_limit' = 'safe'

  if (isCapConfigured && limitValue) {
    percentage = Math.min((currentEarnings / limitValue) * 100, 100)
    const remaining = limitValue - currentEarnings
    if (percentage > 90 || remaining <= 0) {
      safetyState = 'at_limit'
    } else if (percentage >= 75 || remaining <= 100) {
      safetyState = 'caution'
    } else {
      safetyState = 'safe'
    }
  }

  return (
    <main className="min-h-screen bg-warm-white py-12 px-4 md:py-16 md:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="font-display text-5xl text-charcoal font-bold">
            {t('fsm.shifts.title')}
          </h1>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.shifts.subtitle')}
          </p>
        </div>

        {/* Global Feedback Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-body text-base">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {errorMsg}
          </div>
        )}

        {/* ODSP Tracker Top Card (Carla P7 Compliance) */}
        {isCapConfigured && limitValue && (
          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sand pb-3">
              <div>
                <h2 className="font-sub text-xl text-charcoal font-bold">
                  {t('fsm.profile.odsp.title')}
                </h2>
                <p className="font-body text-sm text-text-muted">
                  {t('fsm.profile.odsp.subtitle')}
                </p>
              </div>
              <div className="text-right sm:text-right text-left">
                <span className="font-body text-xs text-text-muted block">
                  {t('fsm.profile.odsp.currentEarnings')}
                </span>
                <span className="font-display text-2xl text-charcoal font-bold">
                  ${currentEarnings} / ${limitValue}
                </span>
              </div>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-slate-pale rounded h-5 overflow-hidden border border-sand">
              <div 
                className={cn(
                  'h-full transition-all duration-300',
                  safetyState === 'safe' && 'bg-emerald-500',
                  safetyState === 'caution' && 'bg-amber-500',
                  safetyState === 'at_limit' && 'bg-red-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                safetyState === 'safe' && 'bg-emerald-500',
                safetyState === 'caution' && 'bg-amber-500',
                safetyState === 'at_limit' && 'bg-red-500'
              )} />
              <span className={cn(
                'font-body text-sm font-semibold',
                safetyState === 'safe' && 'text-emerald-700',
                safetyState === 'caution' && 'text-amber-700',
                safetyState === 'at_limit' && 'text-red-700'
              )}>
                {t(`fsm.profile.odsp.gauge.${safetyState}`)}: {t(`fsm.profile.odsp.messages.${safetyState}`)}
              </span>
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-brand"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {t('fsm.shifts.claimingError')}: {error.message}
          </div>
        ) : shifts.length === 0 ? (
          <div className="bg-white border border-sand rounded p-8 text-center text-text-muted italic font-body text-base shadow-sm">
            {t('fsm.shifts.noShifts')}
          </div>
        ) : (
          /* Shift Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shifts.map((job) => {
              const duration = getShiftDurationHours(job.scheduledStartTime, job.scheduledEndTime)
              const rate = job.payRateSnapshot?.amount || 0
              const estPay = rate * duration

              // Earnings cap restriction checks
              const remainingLimit = limitValue !== null ? limitValue - currentEarnings : null
              const isOverLimit = remainingLimit !== null && estPay > remainingLimit
              const overage = remainingLimit !== null && isOverLimit ? estPay - remainingLimit : 0

              // Travel buffer checks
              const constraints = staffProfile.constraints || {}
              const transportMode = constraints.transportMode || 'transit'
              const defaultBuffer = transportMode === 'transit' ? 60 : 30
              const bufferMinutes = typeof constraints.transitBufferMinutes === 'number'
                ? constraints.transitBufferMinutes
                : defaultBuffer

              const sameDayAssigned = assignedShifts.filter((s) => s.scheduledDate === job.scheduledDate)
              let travelConflictShift: Job | null = null
              for (const existing of sameDayAssigned) {
                const cand = {
                  startTime: job.scheduledStartTime,
                  endTime: job.scheduledEndTime,
                  address: job.clientAddress,
                }
                const ex = {
                  startTime: existing.scheduledStartTime,
                  endTime: existing.scheduledEndTime,
                  address: existing.clientAddress,
                }
                if (hasTravelConflict(cand, ex, bufferMinutes)) {
                  travelConflictShift = existing
                  break
                }
              }
              const isConflict = !!travelConflictShift

              return (
                <div 
                  key={job.id} 
                  className={cn(
                    'bg-white border border-sand rounded p-6 shadow-sm flex flex-col justify-between gap-6 transition-all duration-200',
                    (isOverLimit || isConflict) && 'opacity-75',
                    isOverLimit && 'border-red-100 bg-red-50/5',
                    isConflict && 'border-amber-100 bg-amber-50/5'
                  )}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: Service Badge & Rate */}
                    <div className="flex justify-between items-start gap-4">
                      <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-slate-pale text-slate-dark border border-sand capitalize font-body">
                        {t(`booking.fields.propertyType.options.${job.serviceType}`, { defaultValue: job.serviceType })}
                      </span>
                      <span className="font-body text-sm font-semibold text-slate-brand">
                        {t('fsm.shifts.estimatedPay', { pay: estPay, hours: duration, rate })}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="text-left font-body">
                      <span className="text-charcoal font-bold text-base block leading-snug">
                        {formatShiftDate(job.scheduledDate)}
                      </span>
                      <span className="text-text-muted text-sm block mt-0.5">
                        {job.scheduledStartTime} - {job.scheduledEndTime} {t('fsm.shifts.durationHours', { count: duration })}
                      </span>
                    </div>

                    {/* Location Address (Accessibility: Tel / Map target) */}
                    <div className="text-left font-body pt-2 border-t border-sand/50">
                      <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                        {t('admin.dashboard.details.address')}
                      </span>
                      <span className="text-charcoal text-sm font-medium block mt-0.5 leading-snug">
                        {job.clientAddress}
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col gap-3">
                    {isOverLimit && (
                      <span className="font-body text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded text-center">
                        ⚠️ {t('fsm.shifts.disabledOverage', { overage })}
                      </span>
                    )}

                    {isConflict && travelConflictShift && (
                      <span className="font-body text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded text-center">
                        ⚠️ {t('fsm.shifts.disabledConflict', { 
                          buffer: bufferMinutes, 
                          start: travelConflictShift.scheduledStartTime, 
                          end: travelConflictShift.scheduledEndTime 
                        })}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isOverLimit || isConflict || claimingId !== null}
                      onClick={() => { void handleClaimShift(job.id) }}
                      className={cn(
                        'min-h-[48px] w-full font-body font-medium rounded text-base flex items-center justify-center transition-colors duration-200',
                        (isOverLimit || isConflict)
                          ? 'bg-slate-pale text-text-muted border border-sand cursor-not-allowed'
                          : claimingId === job.id
                          ? 'bg-slate-pale text-slate-brand border border-slate-brand'
                          : 'bg-slate-brand text-white hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                      )}
                    >
                      {claimingId === job.id ? (
                        <div className="w-5 h-5 border-2 border-slate-brand border-t-transparent rounded-full animate-spin" />
                      ) : (
                        t('fsm.shifts.claimBtn')
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default ShiftBoardPage
