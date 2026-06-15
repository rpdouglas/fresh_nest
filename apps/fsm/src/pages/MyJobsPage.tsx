import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useMyAssignedShifts } from '../hooks/useMyAssignedShifts'
import { cn } from '@freshnest/shared'

export const MyJobsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const { assignedShifts, isLoading, error } = useMyAssignedShifts(
    staffProfile?.uid,
    !!staffProfile
  )

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming')

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

  // Split shifts into Upcoming vs Completed
  const upcomingJobs = assignedShifts.filter((job) =>
    ['assigned', 'acknowledged', 'in_progress'].includes(job.status)
  )

  const completedJobs = assignedShifts.filter((job) =>
    ['completed', 'disputed'].includes(job.status)
  )

  // Prefetch templates for caching (mitigates offline opening risk)
  useEffect(() => {
    if (upcomingJobs.length === 0) return
    const unsubscribes = upcomingJobs.map((job) => {
      if (!job.checklistTemplate) return () => {}
      const templateRef = doc(db, 'checklistTemplates', job.checklistTemplate)
      return onSnapshot(templateRef, () => {})
    })
    return () => {
      unsubscribes.forEach((unsub) => {
        if (unsub) unsub()
      })
    }
  }, [upcomingJobs])

  if (!staffProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  const displayedJobs = activeTab === 'upcoming' ? upcomingJobs : completedJobs


  return (
    <main className="min-h-screen bg-warm-white py-12 px-4 md:py-16 md:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="font-display text-5xl text-charcoal font-bold">
            {t('fsm.myJobs.title')}
          </h1>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.myJobs.subtitle')}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {t('fsm.shifts.claimingError')}: {error.message}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-sand">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              'min-h-[48px] px-6 py-3 font-sub text-lg font-bold border-b-2 transition-all duration-200 focus:outline-none',
              activeTab === 'upcoming'
                ? 'border-slate-brand text-slate-dark bg-slate-pale/20'
                : 'border-transparent text-text-muted hover:text-charcoal'
            )}
          >
            {t('fsm.myJobs.upcomingTab')} ({upcomingJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'min-h-[48px] px-6 py-3 font-sub text-lg font-bold border-b-2 transition-all duration-200 focus:outline-none',
              activeTab === 'completed'
                ? 'border-slate-brand text-slate-dark bg-slate-pale/20'
                : 'border-transparent text-text-muted hover:text-charcoal'
            )}
          >
            {t('fsm.myJobs.completedTab')} ({completedJobs.length})
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-brand"></div>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="bg-white border border-sand rounded p-8 text-center text-text-muted italic font-body text-base shadow-sm">
            {activeTab === 'upcoming'
              ? t('fsm.myJobs.noJobsUpcoming')
              : t('fsm.myJobs.noJobsCompleted')}
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedJobs.map((job) => {
              const duration = getShiftDurationHours(job.scheduledStartTime, job.scheduledEndTime)
              const rate = job.payRateSnapshot?.amount || 0
              const estPay = rate * duration

              return (
                <div 
                  key={job.id} 
                  className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: Service Badge & Status */}
                    <div className="flex justify-between items-start gap-4">
                      <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-slate-pale text-slate-dark border border-sand capitalize font-body">
                        {t(`booking.fields.propertyType.options.${job.serviceType}`, { defaultValue: job.serviceType })}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={cn(
                        'px-2.5 py-0.5 rounded text-xs font-bold font-body uppercase border',
                        job.status === 'assigned' && 'bg-blue-50 text-blue-700 border-blue-200',
                        job.status === 'acknowledged' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        job.status === 'in_progress' && 'bg-amber-50 text-amber-700 border-amber-200',
                        job.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        job.status === 'disputed' && 'bg-red-50 text-red-700 border-red-200'
                      )}>
                        {t(`fsm.myJobs.jobCard.status.${job.status}`, { defaultValue: job.status })}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="text-left font-body">
                      <span className="text-charcoal font-bold text-base block leading-snug">
                        {formatShiftDate(job.scheduledDate)}
                      </span>
                      <span className="text-text-muted text-sm block mt-0.5">
                        {job.scheduledStartTime} - {job.scheduledEndTime} {t('fsm.myJobs.jobCard.duration', { count: duration })}
                      </span>
                    </div>

                    {/* Pay & Address details */}
                    <div className="text-left font-body pt-2 border-t border-sand/50 flex flex-col gap-1.5">
                      <div>
                        <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                          {t('fsm.myJobs.jobCard.estPay', { pay: estPay, hours: duration, rate })}
                        </span>
                        <span className="text-charcoal text-sm font-semibold mt-0.5">
                          ${estPay} <span className="text-text-muted font-normal">({duration}h @ ${rate}/h)</span>
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                          {t('admin.dashboard.details.address')}
                        </span>
                        <span className="text-charcoal text-sm font-medium mt-0.5 leading-snug">
                          {job.clientAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="min-h-[48px] w-full font-body font-medium rounded text-base flex items-center justify-center bg-slate-brand text-white hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 transition-colors duration-200"
                    >
                      {t('fsm.myJobs.jobCard.viewDetails')}
                    </Link>
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

export default MyJobsPage
