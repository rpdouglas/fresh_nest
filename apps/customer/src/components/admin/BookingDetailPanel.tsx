import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/firebase'
import { useStaff } from './hooks/useStaff'
import { assignCleanerTransaction } from '@/lib/firebase/firestore'
import { OverrideModal } from './OverrideModal'
import { cn } from '@/lib/utils/utils'
import type { Booking, BookingStatus, Job } from '@/types'

interface BookingDetailPanelProps {
  booking: Booking
  customCleanerNames: Record<string, string>
  showCustomInput: Record<string, boolean>
  setCustomCleanerNames: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleStatusChange: (bookingId: string, status: BookingStatus) => Promise<void> | void
  handleAssignmentChange: (bookingId: string, value: string) => Promise<void> | void
}

export function BookingDetailPanel({
  booking: b,
  customCleanerNames,
  showCustomInput,
  setCustomCleanerNames,
  handleStatusChange,
  handleAssignmentChange,
}: BookingDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { staffList } = useStaff(true)

  const [job, setJob] = useState<Job | null>(null)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<{
    cleanerId: string | null
    cleanerName: string | null
    oldCleanerId: string | null
    estimatedPay: number
  } | null>(null)

  // Fetch job details dynamically when panel expands
  useEffect(() => {
    if (b.jobId) {
      const jobRef = doc(db, 'jobs', b.jobId)
      getDoc(jobRef)
        .then((snap) => {
          if (snap.exists()) {
            setJob({ id: snap.id, ...snap.data() } as Job)
          }
        })
        .catch((err) => console.error('Error fetching job details:', err))
    }
  }, [b.jobId])

  // Get job duration
  const getJobDurationHours = (jobDoc: Job): number => {
    try {
      const [startH, startM] = jobDoc.scheduledStartTime.split(':').map(Number)
      const [endH, endM] = jobDoc.scheduledEndTime.split(':').map(Number)
      const diff = (endH + endM / 60) - (startH + startM / 60)
      return diff > 0 ? diff : 2
    } catch {
      return 2
    }
  }

  // Map cleaner UIDs to select value
  const getSelectedValue = () => {
    if (showCustomInput[b.id!]) return 'custom'
    if (!b.assignedTo) return 'unassigned'

    const matchedStaff = staffList.find(
      (s) => `${s.firstName} ${s.lastName}` === b.assignedTo
    )
    if (matchedStaff) return matchedStaff.id

    return 'custom'
  }

  const handleSelectCleaner = async (selectedVal: string) => {
    if (selectedVal === 'custom') {
      await handleAssignmentChange(b.id!, 'custom')
      return
    }

    const currentlyAssignedStaffUid = staffList.find(
      (s) => `${s.firstName} ${s.lastName}` === b.assignedTo
    )?.id || null

    const payRate = job?.payRateSnapshot?.amount || 25
    const duration = job ? getJobDurationHours(job) : 2
    const estPay = payRate * duration

    if (selectedVal === 'unassigned') {
      try {
        await assignCleanerTransaction({
          bookingId: b.id!,
          jobId: b.jobId || null,
          cleanerId: null,
          cleanerName: null,
          oldCleanerId: currentlyAssignedStaffUid,
          estimatedPay: estPay,
          changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
        })
        await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      } catch (err) {
        console.error('Error unassigning cleaner:', err)
      }
      return
    }

    const selectedStaff = staffList.find((s) => s.id === selectedVal)
    if (!selectedStaff) return

    const newCleanerName = `${selectedStaff.firstName} ${selectedStaff.lastName}`

    // Check earnings cap
    const limit = selectedStaff.financials?.monthlyEarningsLimit ?? null
    const current = selectedStaff.financials?.currentMonthEarnings ?? 0

    if (limit !== null && current + estPay > limit) {
      setPendingAssignment({
        cleanerId: selectedStaff.id,
        cleanerName: newCleanerName,
        oldCleanerId: currentlyAssignedStaffUid,
        estimatedPay: estPay,
      })
      setIsOverrideOpen(true)
    } else {
      try {
        await assignCleanerTransaction({
          bookingId: b.id!,
          jobId: b.jobId || null,
          cleanerId: selectedStaff.id,
          cleanerName: newCleanerName,
          oldCleanerId: currentlyAssignedStaffUid,
          estimatedPay: estPay,
          changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
        })
        await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      } catch (err) {
        console.error('Error assigning cleaner:', err)
      }
    }
  }

  const handleOverrideConfirm = async (reason: string) => {
    setIsOverrideOpen(false)
    if (!pendingAssignment) return

    try {
      await assignCleanerTransaction({
        bookingId: b.id!,
        jobId: b.jobId || null,
        cleanerId: pendingAssignment.cleanerId,
        cleanerName: pendingAssignment.cleanerName,
        oldCleanerId: pendingAssignment.oldCleanerId,
        estimatedPay: pendingAssignment.estimatedPay,
        overrideReason: reason,
        overrideType: 'earnings_cap_exceeded',
        changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
      })
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error assigning with override:', err)
    } finally {
      setPendingAssignment(null)
    }
  }

  const handleSaveCustomCleaner = async () => {
    const customName = customCleanerNames[b.id!]?.trim() || b.assignedTo || ''
    if (!customName) return

    const currentlyAssignedStaffUid = staffList.find(
      (s) => `${s.firstName} ${s.lastName}` === b.assignedTo
    )?.id || null

    const payRate = job?.payRateSnapshot?.amount || 25
    const duration = job ? getJobDurationHours(job) : 2
    const estPay = payRate * duration

    try {
      await assignCleanerTransaction({
        bookingId: b.id!,
        jobId: b.jobId || null,
        cleanerId: null,
        cleanerName: customName,
        oldCleanerId: currentlyAssignedStaffUid,
        estimatedPay: estPay,
        changedByEmail: auth.currentUser?.email || 'admin@freshnest.ca',
      })
      setCustomCleanerNames((prev) => ({ ...prev, [b.id!]: '' }))
      await handleAssignmentChange(b.id!, customName)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error saving custom cleaner:', err)
    }
  }

  return (
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
                <div className="pt-2">
                  <span className="font-medium block mb-1">
                    {t('admin.dashboard.details.address')}:
                  </span>
                  <span className="text-text-muted block leading-snug">
                    {b.address}
                  </span>
                </div>
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
                  onChange={(e) => {
                    void handleStatusChange(b.id!, e.target.value as BookingStatus)
                  }}
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
                  value={getSelectedValue()}
                  onChange={(e) => { void handleSelectCleaner(e.target.value) }}
                  className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  <option value="unassigned">
                    {t('admin.dashboard.details.unassigned')}
                  </option>
                  {staffList
                    .filter((s) => s.role === 'cleaner' || s.role === 'lead')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({t(`admin.staff.modal.roleOption.${s.role}`)})
                      </option>
                    ))}
                  <option value="custom">
                    {t('admin.dashboard.details.customOption')}
                  </option>
                </select>

                {/* Custom cleaner text input fallback */}
                {(showCustomInput[b.id!] ||
                  (b.assignedTo &&
                    !staffList.some((s) => `${s.firstName} ${s.lastName}` === b.assignedTo))) && (
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
                        onClick={() => { void handleSaveCustomCleaner() }}
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
            {b.referredBy && (
              <p>
                <span className="font-medium text-charcoal">
                  {t('admin.dashboard.details.referredBy')}:{' '}
                </span>
                <span className="bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded">
                  {b.referredBy}
                </span>
              </p>
            )}
            {b.referralCode && (
              <p>
                <span className="font-medium text-charcoal">
                  {t('admin.dashboard.details.referralCode')}:{' '}
                </span>
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-mono">
                  {b.referralCode}
                </span>
              </p>
            )}
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
          <OverrideModal
            isOpen={isOverrideOpen}
            cleanerName={pendingAssignment?.cleanerName || ''}
            onConfirm={(reason) => { void handleOverrideConfirm(reason) }}
            onCancel={() => {
              setIsOverrideOpen(false)
              setPendingAssignment(null)
            }}
          />
        </motion.div>
      </td>
    </tr>
  )
}
