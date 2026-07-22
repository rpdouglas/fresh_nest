import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import type { Staff, BackgroundCheckStatus, ProbationCheckIn, ProbationOutcome, DepartureReason } from '@/types'
import type { AdminChecklistItem, OffboardingChecklistItem } from './hooks/useStaff'

const TRAINING_MODULE_ORDER: { key: string; labelKey: string }[] = [
  { key: 'module1Welcome', labelKey: 'admin.staff.detail.training.module1' },
  { key: 'module2AppTraining', labelKey: 'admin.staff.detail.training.module2' },
  { key: 'module3CleaningTechniques', labelKey: 'admin.staff.detail.training.module3' },
  { key: 'module4Whmis', labelKey: 'admin.staff.detail.training.module4' },
  { key: 'module5ClientStandards', labelKey: 'admin.staff.detail.training.module5' },
  { key: 'module6EmergencyProcedures', labelKey: 'admin.staff.detail.training.module6' },
]

interface StaffDetailPanelProps {
  staff: Staff
  adminEmail: string
  updateBackgroundCheckStatus: (input: { uid: string; status: BackgroundCheckStatus; provider?: string; notes?: string }) => Promise<unknown>
  updateChecklistItem: (uid: string, item: AdminChecklistItem, value: boolean) => Promise<void>
  activateEmployee: (uid: string) => Promise<void>
  completeCheckIn: (uid: string, checkIns: ProbationCheckIn[]) => Promise<void>
  setProbationOutcome: (uid: string, outcome: ProbationOutcome) => Promise<void>
  extendProbation: (uid: string, currentEndDate: string) => Promise<void>
  updateOffboardingChecklist: (uid: string, item: OffboardingChecklistItem, value: boolean) => Promise<void>
  setDepartureReason: (uid: string, reason: DepartureReason) => Promise<void>
  setFinalNotes: (uid: string, notes: string) => Promise<void>
  reactivateStaff: (uid: string) => Promise<unknown>
  onResendInvite: (uid: string) => void
  onExport: (staff: Staff) => void
  resendingId: string | null
}

type CheckInStatus = 'complete' | 'overdue' | 'due' | 'upcoming'

function getCheckInStatus(checkIn: ProbationCheckIn, today: string): CheckInStatus {
  if (checkIn.completedDate) return 'complete'
  if (checkIn.scheduledDate < today) return 'overdue'
  if (checkIn.scheduledDate === today) return 'due'
  return 'upcoming'
}

function ChecklistStatus({ complete }: { complete: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium shrink-0',
      complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
    )}>
      {complete ? t('admin.staff.detail.checklist.complete', { defaultValue: 'Complete' }) : t('admin.staff.detail.checklist.incomplete', { defaultValue: 'Incomplete' })}
    </span>
  )
}

export const StaffDetailPanel: React.FC<StaffDetailPanelProps> = ({
  staff,
  adminEmail,
  updateBackgroundCheckStatus,
  updateChecklistItem,
  activateEmployee,
  completeCheckIn,
  setProbationOutcome,
  extendProbation,
  updateOffboardingChecklist,
  setDepartureReason,
  setFinalNotes,
  reactivateStaff,
  onResendInvite,
  onExport,
  resendingId,
}) => {
  const { t, i18n } = useTranslation()
  const checklist = staff.onboardingChecklist || {}

  // Background check editor (relocated from StaffTable, P3-E27-B2 -> P3-E27-D1)
  const [isEditingBgCheck, setIsEditingBgCheck] = useState(false)
  const [bgDraft, setBgDraft] = useState<{ status: BackgroundCheckStatus; provider: string; notes: string }>({
    status: staff.backgroundCheck?.status ?? 'not_started',
    provider: staff.backgroundCheck?.provider ?? '',
    notes: staff.backgroundCheck?.notes ?? '',
  })
  const [bgSaving, setBgSaving] = useState(false)
  const [bgError, setBgError] = useState<string | null>(null)

  const [togglingItem, setTogglingItem] = useState<AdminChecklistItem | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const [isActivating, setIsActivating] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)

  // Probation check-in completion (P3-E27-D2)
  const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null)
  const [checkInDraft, setCheckInDraft] = useState<{ completedDate: string; notes: string; rating: 1 | 2 | 3 | 4 | 5 }>({
    completedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    rating: 5,
  })
  const [checkInSaving, setCheckInSaving] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [outcomeSaving, setOutcomeSaving] = useState(false)
  const [outcomeError, setOutcomeError] = useState<string | null>(null)

  // Offboarding (P3-E27-D3)
  const [togglingOffboardingItem, setTogglingOffboardingItem] = useState<OffboardingChecklistItem | null>(null)
  const [offboardingToggleError, setOffboardingToggleError] = useState<string | null>(null)
  const [departureReasonDraft, setDepartureReasonDraft] = useState<DepartureReason | ''>(staff.offboarding?.departureReason ?? '')
  const [finalNotesDraft, setFinalNotesDraft] = useState<string>(staff.offboarding?.finalNotes ?? '')
  const [offboardingSaving, setOffboardingSaving] = useState(false)
  const [offboardingSaveError, setOffboardingSaveError] = useState<string | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)
  const [reactivateError, setReactivateError] = useState<string | null>(null)

  const getBgCheckStatusLabel = (status: BackgroundCheckStatus) => {
    switch (status) {
      case 'not_started':
        return t('admin.staff.backgroundCheck.statusOption.not_started', { defaultValue: 'Not Started' })
      case 'pending':
        return t('admin.staff.backgroundCheck.statusOption.pending', { defaultValue: 'Pending' })
      case 'cleared':
        return t('admin.staff.backgroundCheck.statusOption.cleared', { defaultValue: 'Cleared' })
      case 'flagged':
        return t('admin.staff.backgroundCheck.statusOption.flagged', { defaultValue: 'Flagged' })
      default:
        return status
    }
  }

  const openBgCheckEditor = () => {
    setBgError(null)
    setBgDraft({
      status: staff.backgroundCheck?.status ?? 'not_started',
      provider: staff.backgroundCheck?.provider ?? '',
      notes: staff.backgroundCheck?.notes ?? '',
    })
    setIsEditingBgCheck(true)
  }

  const handleSaveBgCheck = async () => {
    setBgSaving(true)
    setBgError(null)
    try {
      await updateBackgroundCheckStatus({
        uid: staff.id,
        status: bgDraft.status,
        provider: bgDraft.provider.trim() || undefined,
        notes: bgDraft.notes.trim() || undefined,
      })
      setIsEditingBgCheck(false)
    } catch (err) {
      console.error('[StaffDetailPanel] Error updating background check status:', err)
      setBgError(t('admin.staff.backgroundCheck.saveError', { defaultValue: 'Failed to update background check status.' }))
    } finally {
      setBgSaving(false)
    }
  }

  const handleToggleChecklistItem = async (item: AdminChecklistItem, value: boolean) => {
    setTogglingItem(item)
    setToggleError(null)
    try {
      await updateChecklistItem(staff.id, item, value)
    } catch (err) {
      console.error('[StaffDetailPanel] Error updating checklist item:', err)
      setToggleError(t('admin.staff.detail.checklist.toggleError', { defaultValue: 'Failed to update checklist item.' }))
    } finally {
      setTogglingItem(null)
    }
  }

  const isBackgroundCheckCleared = staff.backgroundCheck?.status === 'cleared'
  const isIdVerified = checklist.idVerified === true
  const isAgreementSigned = staff.employmentAgreement != null
  const isTrainingComplete = checklist.platformTrainingCompleted === true
  const canActivate = isBackgroundCheckCleared && isIdVerified && isAgreementSigned && isTrainingComplete
  const isAlreadyActive = staff.status === 'active'
  const isDeactivated = staff.status === 'inactive'

  const handleActivate = async () => {
    if (!canActivate || isActivating || isAlreadyActive) return
    setIsActivating(true)
    setActivateError(null)
    try {
      await activateEmployee(staff.id)
    } catch (err) {
      console.error('[StaffDetailPanel] Error activating employee:', err)
      setActivateError(t('admin.staff.detail.status.activateError', { defaultValue: 'Failed to activate employee.' }))
    } finally {
      setIsActivating(false)
    }
  }

  const dateFmt = (d: Date | null | undefined) => d ? d.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA') : null

  const today = new Date().toISOString().slice(0, 10)
  const probationCheckIns = staff.probation?.checkIns ?? []
  const allCheckInsComplete = probationCheckIns.length > 0 && probationCheckIns.every((c) => c.completedDate != null)

  const openCheckInEditor = (checkIn: ProbationCheckIn) => {
    setCheckInError(null)
    setCheckInDraft({ completedDate: today, notes: '', rating: 5 })
    setEditingCheckInId(checkIn.id)
  }

  const handleSaveCheckIn = async () => {
    if (!editingCheckInId || !staff.probation) return
    setCheckInSaving(true)
    setCheckInError(null)
    try {
      const updated = staff.probation.checkIns.map((c) =>
        c.id === editingCheckInId
          ? { ...c, completedDate: checkInDraft.completedDate, notes: checkInDraft.notes.trim() || null, rating: checkInDraft.rating, completedBy: adminEmail || null }
          : c
      )
      await completeCheckIn(staff.id, updated)
      setEditingCheckInId(null)
    } catch (err) {
      console.error('[StaffDetailPanel] Error completing probation check-in:', err)
      setCheckInError(t('admin.staff.detail.probation.checkInSaveError', { defaultValue: 'Failed to save check-in.' }))
    } finally {
      setCheckInSaving(false)
    }
  }

  const handleSetOutcome = async (outcome: ProbationOutcome) => {
    if (!staff.probation) return
    setOutcomeSaving(true)
    setOutcomeError(null)
    try {
      if (outcome === 'extended') {
        await extendProbation(staff.id, staff.probation.endDate)
      } else {
        await setProbationOutcome(staff.id, outcome)
      }
    } catch (err) {
      console.error('[StaffDetailPanel] Error setting probation outcome:', err)
      setOutcomeError(t('admin.staff.detail.probation.outcomeSaveError', { defaultValue: 'Failed to update probation outcome.' }))
    } finally {
      setOutcomeSaving(false)
    }
  }

  const getCheckInStatusLabel = (status: CheckInStatus) => {
    switch (status) {
      case 'complete':
        return t('admin.staff.detail.probation.status.complete', { defaultValue: 'Complete' })
      case 'overdue':
        return t('admin.staff.detail.probation.status.overdue', { defaultValue: 'Overdue' })
      case 'due':
        return t('admin.staff.detail.probation.status.due', { defaultValue: 'Due Today' })
      default:
        return t('admin.staff.detail.probation.status.upcoming', { defaultValue: 'Upcoming' })
    }
  }

  const handleToggleOffboardingItem = async (item: OffboardingChecklistItem, value: boolean) => {
    setTogglingOffboardingItem(item)
    setOffboardingToggleError(null)
    try {
      await updateOffboardingChecklist(staff.id, item, value)
    } catch (err) {
      console.error('[StaffDetailPanel] Error updating offboarding checklist item:', err)
      setOffboardingToggleError(t('admin.staff.detail.offboarding.toggleError', { defaultValue: 'Failed to update checklist item.' }))
    } finally {
      setTogglingOffboardingItem(null)
    }
  }

  const handleSaveOffboardingDetails = async () => {
    setOffboardingSaving(true)
    setOffboardingSaveError(null)
    try {
      if (departureReasonDraft) {
        await setDepartureReason(staff.id, departureReasonDraft)
      }
      await setFinalNotes(staff.id, finalNotesDraft)
    } catch (err) {
      console.error('[StaffDetailPanel] Error saving offboarding details:', err)
      setOffboardingSaveError(t('admin.staff.detail.offboarding.saveError', { defaultValue: 'Failed to save offboarding details.' }))
    } finally {
      setOffboardingSaving(false)
    }
  }

  const handleReactivate = async () => {
    setIsReactivating(true)
    setReactivateError(null)
    try {
      await reactivateStaff(staff.id)
    } catch (err) {
      console.error('[StaffDetailPanel] Error reactivating employee:', err)
      setReactivateError(t('admin.staff.detail.offboarding.reactivateError', { defaultValue: 'Failed to reactivate employee.' }))
    } finally {
      setIsReactivating(false)
    }
  }

  const getDepartureReasonLabel = (reason: DepartureReason) => {
    switch (reason) {
      case 'voluntary':
        return t('admin.staff.detail.offboarding.reason.voluntary', { defaultValue: 'Voluntary' })
      case 'performance':
        return t('admin.staff.detail.offboarding.reason.performance', { defaultValue: 'Performance' })
      case 'seasonal':
        return t('admin.staff.detail.offboarding.reason.seasonal', { defaultValue: 'Seasonal' })
      default:
        return t('admin.staff.detail.offboarding.reason.other', { defaultValue: 'Other' })
    }
  }

  const offboardingToggleRows: { item: OffboardingChecklistItem; labelKey: string }[] = [
    { item: 'keysReturned', labelKey: 'admin.staff.detail.offboarding.keysReturned' },
    { item: 'accessCodesChanged', labelKey: 'admin.staff.detail.offboarding.accessCodesChanged' },
    { item: 'finalPayCalculated', labelKey: 'admin.staff.detail.offboarding.finalPayCalculated' },
  ]

  const adminToggleRows: { item: AdminChecklistItem; labelKey: string }[] = [
    { item: 'idVerified', labelKey: 'admin.staff.detail.checklist.idVerified' },
    { item: 'supervisedShiftCompleted', labelKey: 'admin.staff.detail.checklist.supervisedShiftCompleted' },
    { item: 'uniformIssued', labelKey: 'admin.staff.detail.checklist.uniformIssued' },
    { item: 'directDepositOnFile', labelKey: 'admin.staff.detail.checklist.directDepositOnFile' },
  ]

  return (
    <tr>
      <td colSpan={6} className="p-0 border-b border-sand bg-slate-pale/30">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden p-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Onboarding Checklist */}
            <div className="flex flex-col gap-4">
              <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                {t('admin.staff.detail.checklist.title', { defaultValue: 'Onboarding Checklist' })}
              </h4>

              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-base text-charcoal">
                  {t('admin.staff.detail.checklist.agreementSigned', { defaultValue: 'Employment Agreement Signed' })}
                  {isAgreementSigned && staff.employmentAgreement && (
                    <span className="block text-base text-text-muted">
                      {t('admin.staff.detail.signedBy', { name: staff.employmentAgreement.signedByName, defaultValue: `Signed by ${staff.employmentAgreement.signedByName}` })}
                    </span>
                  )}
                </span>
                <ChecklistStatus complete={isAgreementSigned} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-base text-charcoal">
                  {t('admin.staff.detail.checklist.consentGiven', { defaultValue: 'Background Check Consent' })}
                </span>
                <ChecklistStatus complete={staff.backgroundCheck?.consentGiven === true} />
              </div>

              {/* Background check status editor (relocated from StaffTable, B2 -> D1) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-base text-charcoal">
                    {t('admin.staff.detail.checklist.backgroundCheckCleared', { defaultValue: 'Background Check Cleared' })}
                  </span>
                  {!isEditingBgCheck && (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium',
                        staff.backgroundCheck?.status === 'cleared' ? 'bg-emerald-100 text-emerald-800' :
                        staff.backgroundCheck?.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        staff.backgroundCheck?.status === 'flagged' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      )}>
                        {getBgCheckStatusLabel(staff.backgroundCheck?.status ?? 'not_started')}
                      </span>
                      <button
                        type="button"
                        onClick={openBgCheckEditor}
                        className="text-slate-brand hover:text-slate-dark font-medium min-h-[48px] px-1 text-base transition-colors duration-150"
                      >
                        {t('admin.staff.backgroundCheck.edit', { defaultValue: 'Update' })}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingBgCheck && (
                  <div className="flex flex-col gap-2 bg-white border border-sand rounded p-3">
                    <select
                      value={bgDraft.status}
                      onChange={(e) => setBgDraft((prev) => ({ ...prev, status: e.target.value as BackgroundCheckStatus }))}
                      disabled={bgSaving}
                      className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    >
                      <option value="not_started">{getBgCheckStatusLabel('not_started')}</option>
                      <option value="pending">{getBgCheckStatusLabel('pending')}</option>
                      <option value="cleared">{getBgCheckStatusLabel('cleared')}</option>
                      <option value="flagged">{getBgCheckStatusLabel('flagged')}</option>
                    </select>
                    <input
                      type="text"
                      value={bgDraft.provider}
                      onChange={(e) => setBgDraft((prev) => ({ ...prev, provider: e.target.value }))}
                      placeholder={t('admin.staff.backgroundCheck.providerPlaceholder', { defaultValue: 'Provider (optional)' })}
                      disabled={bgSaving}
                      className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {bgError && <span className="text-base text-red-600">{bgError}</span>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { void handleSaveBgCheck() }}
                        disabled={bgSaving}
                        className="min-h-[48px] px-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors"
                      >
                        {bgSaving ? t('admin.staff.backgroundCheck.saving', { defaultValue: 'Saving...' }) : t('admin.staff.backgroundCheck.save', { defaultValue: 'Save' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingBgCheck(false)}
                        disabled={bgSaving}
                        className="min-h-[48px] px-3 border border-sand rounded font-body font-medium text-charcoal hover:bg-cream transition-colors"
                      >
                        {t('admin.staff.backgroundCheck.cancel', { defaultValue: 'Cancel' })}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-base text-charcoal">
                  {t('admin.staff.detail.checklist.whmisComplete', { defaultValue: 'WHMIS Training Complete' })}
                </span>
                <ChecklistStatus complete={checklist.module4Whmis === true} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-base text-charcoal">
                  {t('admin.staff.detail.checklist.platformTrainingComplete', { defaultValue: 'Platform Training Complete' })}
                </span>
                <ChecklistStatus complete={isTrainingComplete} />
              </div>

              {toggleError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
                  {toggleError}
                </div>
              )}

              {adminToggleRows.map(({ item, labelKey }) => {
                const complete = checklist[item] === true
                return (
                  <div key={item} className="flex items-center justify-between gap-3">
                    <span className="font-body text-base text-charcoal">
                      {t(labelKey)}
                    </span>
                    <button
                      type="button"
                      disabled={togglingItem === item}
                      onClick={() => { void handleToggleChecklistItem(item, !complete) }}
                      className={cn(
                        'min-h-[48px] px-3 rounded font-body text-base font-medium transition-colors',
                        complete ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      )}
                    >
                      {togglingItem === item
                        ? t('admin.staff.detail.checklist.saving', { defaultValue: 'Saving...' })
                        : complete
                          ? t('admin.staff.detail.checklist.markIncomplete', { defaultValue: 'Mark Incomplete' })
                          : t('admin.staff.detail.checklist.markComplete', { defaultValue: 'Mark Complete' })}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Compliance Overview + Training Progress + Status + Quick Actions */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                  {t('admin.staff.detail.compliance.title', { defaultValue: 'Compliance Overview' })}
                </h4>
                <div className="font-body text-base text-charcoal space-y-1.5">
                  <p>
                    <span className="font-medium">{t('admin.staff.detail.compliance.termsVersion', { defaultValue: 'Terms Accepted' })}: </span>
                    {staff.compliance?.acceptedTermsVersion ?? t('admin.staff.detail.compliance.notYet', { defaultValue: 'Not yet' })}
                  </p>
                  <p>
                    <span className="font-medium">{t('admin.staff.detail.compliance.backgroundConsent', { defaultValue: 'Background Check Consent Date' })}: </span>
                    {dateFmt(staff.backgroundCheck?.consentGivenAt) ?? t('admin.staff.detail.compliance.notYet', { defaultValue: 'Not yet' })}
                  </p>
                  <p>
                    <span className="font-medium">{t('admin.staff.detail.compliance.emergencyContact', { defaultValue: 'Emergency Contact' })}: </span>
                    {staff.emergencyContact ? `${staff.emergencyContact.name} (${staff.emergencyContact.phone})` : t('admin.staff.detail.compliance.notYet', { defaultValue: 'Not yet' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                  {t('admin.staff.detail.training.title', { defaultValue: 'Training Progress' })}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {TRAINING_MODULE_ORDER.map(({ key, labelKey }) => (
                    <li key={key} className="flex items-center justify-between gap-3">
                      <span className="font-body text-base text-charcoal">{t(labelKey)}</span>
                      <ChecklistStatus complete={checklist[key] === true} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                  {t('admin.staff.detail.status.title', { defaultValue: 'Status Management' })}
                </h4>
                {activateError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
                    {activateError}
                  </div>
                )}
                {isDeactivated ? (
                  // P3-E27-D3: the plain Activate button only ever does updateDoc({status:
                  // 'active'}) — it has no way to re-enable a disabled Auth account. Showing
                  // it here for a deactivated employee would silently fail to restore real
                  // access, so it's replaced with a pointer to the Offboarding section's
                  // dedicated Reactivate flow (which goes through the reactivateStaff callable).
                  <p className="font-body text-base text-text-muted">
                    {t('admin.staff.detail.status.deactivatedPointer', { defaultValue: 'This employee is deactivated. Use Reactivate in the Offboarding section below to restore access.' })}
                  </p>
                ) : (
                  <button
                    type="button"
                    title={!canActivate ? t('admin.staff.detail.status.activateTooltip', { defaultValue: 'Complete background check, ID verification, employment agreement, and training first' }) : undefined}
                    disabled={!canActivate || isActivating || isAlreadyActive}
                    onClick={() => { void handleActivate() }}
                    className={cn(
                      'min-h-[48px] px-6 py-2 self-start rounded font-body text-base font-medium transition-colors',
                      'bg-slate-brand hover:bg-slate-dark text-white disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isAlreadyActive
                      ? t('admin.staff.detail.status.alreadyActive', { defaultValue: 'Already Active' })
                      : isActivating
                        ? t('admin.staff.detail.status.activating', { defaultValue: 'Activating...' })
                        : t('admin.staff.detail.status.activateBtn', { defaultValue: 'Activate Employee' })}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                  {t('admin.staff.detail.probation.title', { defaultValue: '30/60/90 Day Probation Tracking' })}
                </h4>
                {!staff.probation ? (
                  <p className="font-body text-base text-text-muted">
                    {t('admin.staff.detail.probation.notStarted', { defaultValue: 'Probation tracking begins once this employee is activated.' })}
                  </p>
                ) : (
                  <>
                    <ul className="flex flex-col gap-2">
                      {probationCheckIns.map((checkIn) => {
                        const status = getCheckInStatus(checkIn, today)
                        const isEditing = editingCheckInId === checkIn.id
                        return (
                          <li key={checkIn.id} className="border border-sand rounded p-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-body text-base font-medium text-charcoal">
                                {t('admin.staff.detail.probation.checkInLabel', { day: checkIn.dayOffset, defaultValue: `Day ${checkIn.dayOffset} Check-In` })}
                                <span className="block text-base text-text-muted">{checkIn.scheduledDate}</span>
                              </span>
                              <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium shrink-0',
                                status === 'complete' ? 'bg-emerald-100 text-emerald-800' :
                                status === 'overdue' ? 'bg-red-100 text-red-800' :
                                status === 'due' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-800'
                              )}>
                                {getCheckInStatusLabel(status)}
                              </span>
                            </div>

                            {checkIn.completedDate ? (
                              <p className="font-body text-base text-text-muted">
                                {t('admin.staff.detail.probation.completedOn', { date: checkIn.completedDate, defaultValue: `Completed ${checkIn.completedDate}` })}
                                {checkIn.rating != null && ` — ${checkIn.rating}/5`}
                                {checkIn.notes && <span className="block">{checkIn.notes}</span>}
                              </p>
                            ) : isEditing ? (
                              <div className="flex flex-col gap-2 bg-white border border-sand rounded p-3">
                                <input
                                  type="date"
                                  value={checkInDraft.completedDate}
                                  onChange={(e) => setCheckInDraft((prev) => ({ ...prev, completedDate: e.target.value }))}
                                  disabled={checkInSaving}
                                  className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                />
                                <select
                                  value={checkInDraft.rating}
                                  onChange={(e) => setCheckInDraft((prev) => ({ ...prev, rating: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                                  disabled={checkInSaving}
                                  className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                >
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>{n} / 5</option>
                                  ))}
                                </select>
                                <textarea
                                  value={checkInDraft.notes}
                                  onChange={(e) => setCheckInDraft((prev) => ({ ...prev, notes: e.target.value }))}
                                  placeholder={t('admin.staff.detail.probation.notesPlaceholder', { defaultValue: 'Notes (optional)' })}
                                  disabled={checkInSaving}
                                  className="min-h-[48px] px-2 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                                />
                                {checkInError && <span className="text-base text-red-600">{checkInError}</span>}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { void handleSaveCheckIn() }}
                                    disabled={checkInSaving}
                                    className="min-h-[48px] px-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors"
                                  >
                                    {checkInSaving ? t('admin.staff.detail.probation.saving', { defaultValue: 'Saving...' }) : t('admin.staff.detail.probation.save', { defaultValue: 'Save' })}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCheckInId(null)}
                                    disabled={checkInSaving}
                                    className="min-h-[48px] px-3 border border-sand rounded font-body font-medium text-charcoal hover:bg-cream transition-colors"
                                  >
                                    {t('admin.staff.detail.probation.cancel', { defaultValue: 'Cancel' })}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCheckInEditor(checkIn)}
                                className="min-h-[48px] px-3 self-start border border-sand rounded font-body text-base font-medium text-charcoal hover:bg-cream transition-colors"
                              >
                                {t('admin.staff.detail.probation.completeCheckIn', { defaultValue: 'Complete Check-In' })}
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    <div className="flex flex-col gap-2 mt-2">
                      <span className="font-body text-base text-charcoal font-medium">
                        {t('admin.staff.detail.probation.outcome', { defaultValue: 'Probation Outcome' })}: {staff.probation.probationOutcome}
                      </span>
                      {outcomeError && <span className="text-base text-red-600">{outcomeError}</span>}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!allCheckInsComplete || outcomeSaving}
                          onClick={() => { void handleSetOutcome('passed') }}
                          className="min-h-[48px] px-4 rounded font-body text-base font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('admin.staff.detail.probation.markPassed', { defaultValue: 'Mark Passed' })}
                        </button>
                        <button
                          type="button"
                          disabled={!allCheckInsComplete || outcomeSaving}
                          onClick={() => { void handleSetOutcome('extended') }}
                          className="min-h-[48px] px-4 rounded font-body text-base font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('admin.staff.detail.probation.markExtended', { defaultValue: 'Extend 90 Days' })}
                        </button>
                        <button
                          type="button"
                          disabled={!allCheckInsComplete || outcomeSaving}
                          onClick={() => { void handleSetOutcome('terminated') }}
                          className="min-h-[48px] px-4 rounded font-body text-base font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('admin.staff.detail.probation.markTerminated', { defaultValue: 'Terminate' })}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {isDeactivated && staff.offboarding && (
                <div className="flex flex-col gap-3">
                  <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                    {t('admin.staff.detail.offboarding.title', { defaultValue: 'Offboarding' })}
                  </h4>

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-base text-charcoal">
                      {t('admin.staff.detail.offboarding.authRevoked', { defaultValue: 'Auth Access Revoked' })}
                      {staff.offboarding.deactivatedAt && (
                        <span className="block text-base text-text-muted">
                          {dateFmt(staff.offboarding.deactivatedAt)}
                        </span>
                      )}
                    </span>
                    <ChecklistStatus complete={staff.offboarding.checklist.authRevoked} />
                  </div>

                  {offboardingToggleError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
                      {offboardingToggleError}
                    </div>
                  )}

                  {offboardingToggleRows.map(({ item, labelKey }) => {
                    const complete = staff.offboarding?.checklist[item] === true
                    return (
                      <div key={item} className="flex items-center justify-between gap-3">
                        <span className="font-body text-base text-charcoal">
                          {t(labelKey)}
                        </span>
                        <button
                          type="button"
                          disabled={togglingOffboardingItem === item}
                          onClick={() => { void handleToggleOffboardingItem(item, !complete) }}
                          className={cn(
                            'min-h-[48px] px-3 rounded font-body text-base font-medium transition-colors',
                            complete ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          )}
                        >
                          {togglingOffboardingItem === item
                            ? t('admin.staff.detail.offboarding.saving', { defaultValue: 'Saving...' })
                            : complete
                              ? t('admin.staff.detail.checklist.markIncomplete', { defaultValue: 'Mark Incomplete' })
                              : t('admin.staff.detail.checklist.markComplete', { defaultValue: 'Mark Complete' })}
                        </button>
                      </div>
                    )
                  })}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="departure-reason" className="font-body text-base text-charcoal font-medium">
                      {t('admin.staff.detail.offboarding.departureReason', { defaultValue: 'Departure Reason' })}
                    </label>
                    <select
                      id="departure-reason"
                      value={departureReasonDraft}
                      onChange={(e) => setDepartureReasonDraft(e.target.value as DepartureReason | '')}
                      disabled={offboardingSaving}
                      className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    >
                      <option value="">{t('admin.staff.detail.offboarding.reasonUnset', { defaultValue: 'Not set' })}</option>
                      <option value="voluntary">{getDepartureReasonLabel('voluntary')}</option>
                      <option value="performance">{getDepartureReasonLabel('performance')}</option>
                      <option value="seasonal">{getDepartureReasonLabel('seasonal')}</option>
                      <option value="other">{getDepartureReasonLabel('other')}</option>
                    </select>

                    <label htmlFor="final-notes" className="font-body text-base text-charcoal font-medium">
                      {t('admin.staff.detail.offboarding.finalNotes', { defaultValue: 'Final Notes' })}
                    </label>
                    <textarea
                      id="final-notes"
                      value={finalNotesDraft}
                      onChange={(e) => setFinalNotesDraft(e.target.value)}
                      disabled={offboardingSaving}
                      className="min-h-[48px] px-2 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />

                    {offboardingSaveError && <span className="text-base text-red-600">{offboardingSaveError}</span>}

                    <button
                      type="button"
                      onClick={() => { void handleSaveOffboardingDetails() }}
                      disabled={offboardingSaving}
                      className="min-h-[48px] px-3 self-start bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors"
                    >
                      {offboardingSaving ? t('admin.staff.detail.offboarding.saving', { defaultValue: 'Saving...' }) : t('admin.staff.detail.offboarding.save', { defaultValue: 'Save' })}
                    </button>
                  </div>

                  {reactivateError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
                      {reactivateError}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isReactivating}
                    onClick={() => { void handleReactivate() }}
                    className="min-h-[48px] px-6 py-2 self-start rounded font-body text-base font-medium bg-slate-brand hover:bg-slate-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isReactivating
                      ? t('admin.staff.detail.offboarding.reactivating', { defaultValue: 'Reactivating...' })
                      : t('admin.staff.detail.offboarding.reactivateBtn', { defaultValue: 'Reactivate' })}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                  {t('admin.staff.detail.quickActions.title', { defaultValue: 'Quick Actions' })}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={resendingId !== null}
                    onClick={() => onResendInvite(staff.id)}
                    className="min-h-[48px] px-4 border border-sand rounded font-body text-base font-medium text-charcoal hover:bg-cream transition-colors"
                  >
                    {resendingId === staff.id
                      ? t('admin.staff.table.sending', { defaultValue: 'Sending...' })
                      : t('admin.staff.table.resend', { defaultValue: 'Resend Invite' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => onExport(staff)}
                    className="min-h-[48px] px-4 border border-sand rounded font-body text-base font-medium text-charcoal hover:bg-cream transition-colors"
                  >
                    {t('admin.staff.table.export', { defaultValue: 'Export' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </tr>
  )
}
