import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import type { Staff, BackgroundCheckStatus } from '@/types'
import type { AdminChecklistItem } from './hooks/useStaff'

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
  updateBackgroundCheckStatus: (input: { uid: string; status: BackgroundCheckStatus; provider?: string; notes?: string }) => Promise<unknown>
  updateChecklistItem: (uid: string, item: AdminChecklistItem, value: boolean) => Promise<void>
  activateEmployee: (uid: string) => Promise<void>
  onResendInvite: (uid: string) => void
  onExport: (staff: Staff) => void
  resendingId: string | null
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
  updateBackgroundCheckStatus,
  updateChecklistItem,
  activateEmployee,
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
              </div>

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
