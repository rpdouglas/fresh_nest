import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  POLICY_NUMERIC_BOUNDS,
  POLICY_MONEY_KEYS,
  centsToDollars,
  formatCents,
  toCents,
  validatePolicySettingsInput,
  type NumericPolicyKey,
  type PolicySettingsValues,
} from '@freshnest/shared'
import { cn } from '@/lib/utils/utils'
import { usePolicySettings } from './hooks/usePolicySettings'

interface SettingsTabProps {
  isAuthorized: boolean
  isOwner: boolean
}

interface NumericFieldMeta {
  key: NumericPolicyKey
  unitKey: string
}

const SCHEDULING_FIELDS: NumericFieldMeta[] = [
  { key: 'defaultVehicleBufferMinutes', unitKey: 'minutes' },
  { key: 'defaultTransitBufferMinutes', unitKey: 'minutes' },
  { key: 'baseDriveBufferMinutes', unitKey: 'minutes' },
  { key: 'maxHoursPerDay', unitKey: 'hours' },
  { key: 'rollingScheduleWeeks', unitKey: 'weeks' },
  { key: 'scheduleFreezeDays', unitKey: 'days' },
  { key: 'undoWindowMinutes', unitKey: 'minutes' },
  { key: 'swapNoticeHours', unitKey: 'hours' },
]

const EARNINGS_TIME_FIELDS: NumericFieldMeta[] = [
  { key: 'defaultOdspMonthlyLimitCents', unitKey: 'cad' },
  { key: 'earningsCautionThresholdCents', unitKey: 'cad' },
  { key: 'vacationNoticeDays', unitKey: 'days' },
  { key: 'maxConcurrentOff', unitKey: 'staff' },
  { key: 'checkInGeofenceMeters', unitKey: 'meters' },
  { key: 'timesheetVarianceMinutes', unitKey: 'minutes' },
]

const CLIENT_POLICY_FIELDS: NumericFieldMeta[] = [
  { key: 'standardCancelWindowHours', unitKey: 'hours' },
  { key: 'deepCancelWindowHours', unitKey: 'hours' },
  { key: 'complaintWindowHours', unitKey: 'hours' },
  { key: 'lateCancellationFeeCents', unitKey: 'cad' },
  { key: 'lockoutFeeCents', unitKey: 'cad' },
]

const COMPLIANCE_NUMERIC_FIELDS: NumericFieldMeta[] = [
  { key: 'photoRetentionDays', unitKey: 'days' },
  { key: 'agreementRetentionYears', unitKey: 'years' },
]

const isMoneyKey = (key: NumericPolicyKey) => POLICY_MONEY_KEYS.includes(key)

const inputClass =
  'w-full min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:bg-cream disabled:text-text-muted'

export const SettingsTab: React.FC<SettingsTabProps> = ({ isAuthorized, isOwner }) => {
  const { t, i18n } = useTranslation()
  const {
    policy,
    version,
    updatedAt,
    updatedBy,
    lastChangeReason,
    history,
    loading,
    error,
    saveSettings,
  } = usePolicySettings(isAuthorized, { includeHistory: true })

  const [draftEdits, setDraftEdits] = useState<Partial<PolicySettingsValues>>({})
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const formValues: PolicySettingsValues = {
    ...policy,
    ...draftEdits,
  }

  const handleNumericChange = (key: NumericPolicyKey, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : Number(rawValue)
    const value = Number.isFinite(parsed) ? parsed : 0
    setDraftEdits((prev) => ({
      ...prev,
      // P3-E38: money settings are typed in dollars and stored in cents
      [key]: isMoneyKey(key) ? toCents(value) : value,
    }))
  }

  const handleStringChange = (
    key: 'emergencyPrimaryPhone' | 'emergencyBackupName' | 'emergencyBackupPhone',
    value: string,
  ) => {
    setDraftEdits((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleReset = () => {
    setDraftEdits({})
    setReason('')
    setFeedback(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return

    setFeedback(null)
    const validation = validatePolicySettingsInput({
      ...formValues,
      reason,
    })
    if (!validation.ok) {
      setFeedback({ kind: 'error', text: validation.error })
      return
    }

    setSaving(true)
    try {
      const result = await saveSettings(validation.values, validation.reason ?? undefined)
      setDraftEdits({})
      setReason('')
      setFeedback({
        kind: 'ok',
        text: t('admin.settings.saveSuccess', { version: result.version }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('admin.settings.saveError')
      setFeedback({ kind: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const renderNumericField = ({ key, unitKey }: NumericFieldMeta) => {
    const bounds = POLICY_NUMERIC_BOUNDS[key]
    const money = isMoneyKey(key)
    return (
      <div key={key} className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={`policy-${key}`} className="font-body text-base font-medium text-charcoal">
            {t(`admin.settings.fields.${key}.label`)}
          </label>
          <span className="font-body text-base text-text-muted shrink-0">
            ({t(`admin.settings.units.${unitKey}`)})
          </span>
        </div>
        <p className="font-body text-base text-text-muted">
          {t(`admin.settings.fields.${key}.help`)}
        </p>
        <input
          id={`policy-${key}`}
          type="number"
          min={money ? centsToDollars(bounds.min) : bounds.min}
          max={money ? centsToDollars(bounds.max) : bounds.max}
          step={money ? 0.01 : 1}
          disabled={!isOwner || saving}
          value={money ? centsToDollars(formValues[key]) : formValues[key]}
          onChange={(e) => handleNumericChange(key, e.target.value)}
          className={inputClass}
        />
      </div>
    )
  }

  // Money settings saved since P3-E38 are cents; older history rows hold dollars under the old keys
  const historyValue = (field: string, value: number | string) =>
    typeof value === 'number' && field.endsWith('Cents') ? formatCents(value, i18n.language) : String(value)

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if (loading) {
    return (
      <div className="bg-white border border-sand rounded p-8 flex items-center justify-center">
        <p className="font-body text-base text-text-muted">{t('admin.settings.loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header card */}
      <div className="bg-white border border-sand rounded p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-charcoal">{t('admin.settings.title')}</h2>
          <p className="font-body text-base text-text-muted mt-1">{t('admin.settings.subtitle')}</p>
        </div>

        <div className="flex flex-col md:items-end gap-1 bg-cream border border-sand rounded px-4 py-3">
          <span className="font-body text-base font-medium text-charcoal">
            {version > 0
              ? t('admin.settings.versionBadge', { version })
              : t('admin.settings.defaultBadge')}
          </span>
          {updatedAt && updatedBy && (
            <span className="font-body text-base text-text-muted">
              {t('admin.settings.lastUpdated', {
                by: updatedBy,
                at: formatDate(updatedAt),
              })}
            </span>
          )}
          {lastChangeReason && (
            <span className="font-body text-base text-charcoal italic">
              &ldquo;{lastChangeReason}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* Manager Read-Only Banner */}
      {!isOwner && (
        <div
          role="status"
          className="bg-cream border border-sand rounded p-4 font-body text-base text-charcoal"
        >
          {t('admin.settings.readOnlyBanner')}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-700"
        >
          {error}
        </div>
      )}

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'rounded p-4 font-body text-base border',
            feedback.kind === 'ok'
              ? 'bg-slate-pale border-slate-brand text-charcoal'
              : 'bg-red-50 border-red-200 text-red-700',
          )}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-6">
        {/* Section 1: Scheduling & Travel Buffers */}
        <section className="bg-white border border-sand rounded p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-2xl text-charcoal">
              {t('admin.settings.sections.scheduling.title')}
            </h3>
            <p className="font-body text-base text-text-muted mt-1">
              {t('admin.settings.sections.scheduling.description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {SCHEDULING_FIELDS.map(renderNumericField)}
          </div>
        </section>

        {/* Section 2: Staff Earnings, Time & Attendance */}
        <section className="bg-white border border-sand rounded p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-2xl text-charcoal">
              {t('admin.settings.sections.earnings.title')}
            </h3>
            <p className="font-body text-base text-text-muted mt-1">
              {t('admin.settings.sections.earnings.description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {EARNINGS_TIME_FIELDS.map(renderNumericField)}
          </div>
        </section>

        {/* Section 3: Client Policies & Fees */}
        <section className="bg-white border border-sand rounded p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-2xl text-charcoal">
              {t('admin.settings.sections.client.title')}
            </h3>
            <p className="font-body text-base text-text-muted mt-1">
              {t('admin.settings.sections.client.description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {CLIENT_POLICY_FIELDS.map(renderNumericField)}
          </div>
        </section>

        {/* Section 4: Compliance, Retention & Emergency Contacts */}
        <section className="bg-white border border-sand rounded p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-2xl text-charcoal">
              {t('admin.settings.sections.compliance.title')}
            </h3>
            <p className="font-body text-base text-text-muted mt-1">
              {t('admin.settings.sections.compliance.description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {COMPLIANCE_NUMERIC_FIELDS.map(renderNumericField)}

            <div className="flex flex-col gap-1">
              <label
                htmlFor="policy-emergencyPrimaryPhone"
                className="font-body text-base font-medium text-charcoal"
              >
                {t('admin.settings.fields.emergencyPrimaryPhone.label')}
              </label>
              <p className="font-body text-base text-text-muted">
                {t('admin.settings.fields.emergencyPrimaryPhone.help')}
              </p>
              <input
                id="policy-emergencyPrimaryPhone"
                type="tel"
                disabled={!isOwner || saving}
                value={formValues.emergencyPrimaryPhone}
                onChange={(e) => handleStringChange('emergencyPrimaryPhone', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="policy-emergencyBackupName"
                className="font-body text-base font-medium text-charcoal"
              >
                {t('admin.settings.fields.emergencyBackupName.label')}
              </label>
              <p className="font-body text-base text-text-muted">
                {t('admin.settings.fields.emergencyBackupName.help')}
              </p>
              <input
                id="policy-emergencyBackupName"
                type="text"
                disabled={!isOwner || saving}
                value={formValues.emergencyBackupName}
                onChange={(e) => handleStringChange('emergencyBackupName', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="policy-emergencyBackupPhone"
                className="font-body text-base font-medium text-charcoal"
              >
                {t('admin.settings.fields.emergencyBackupPhone.label')}
              </label>
              <p className="font-body text-base text-text-muted">
                {t('admin.settings.fields.emergencyBackupPhone.help')}
              </p>
              <input
                id="policy-emergencyBackupPhone"
                type="tel"
                disabled={!isOwner || saving}
                value={formValues.emergencyBackupPhone}
                onChange={(e) => handleStringChange('emergencyBackupPhone', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Save Bar (Owner only) */}
        {isOwner && (
          <div className="bg-white border border-sand rounded p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor="policy-reason" className="font-body text-base font-medium text-charcoal">
                {t('admin.settings.reasonLabel')}
              </label>
              <input
                id="policy-reason"
                type="text"
                disabled={saving}
                value={reason}
                placeholder={t('admin.settings.reasonPlaceholder')}
                onChange={(e) => setReason(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={handleReset}
                className="min-h-[48px] px-5 py-2 border border-slate-brand text-slate-brand font-body text-base font-medium rounded hover:bg-slate-pale focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:opacity-50"
              >
                {t('admin.settings.resetButton')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body text-base font-medium rounded hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:opacity-50"
              >
                {saving ? t('admin.settings.savingButton') : t('admin.settings.saveButton')}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Version History */}
      <section className="bg-white border border-sand rounded p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-display text-2xl text-charcoal">
            {t('admin.settings.history.title')}
          </h3>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.settings.history.subtitle')}
          </p>
        </div>

        {history.length === 0 ? (
          <p className="font-body text-base text-text-muted py-4">
            {t('admin.settings.history.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((entry) => (
              <div
                key={entry.version}
                className="border border-sand rounded p-4 bg-warm-white flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-body text-base font-semibold text-charcoal">
                    {t('admin.settings.versionBadge', { version: entry.version })} — {entry.changedBy}
                  </span>
                  <span className="font-body text-base text-text-muted">
                    {formatDate(entry.changedAt)}
                  </span>
                </div>
                {entry.reason && (
                  <p className="font-body text-base text-charcoal italic">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}
                {entry.changes.length === 0 ? (
                  <p className="font-body text-base text-text-muted">
                    {t('admin.settings.history.noFieldChanges')}
                  </p>
                ) : (
                  <ul className="list-disc list-inside flex flex-col gap-1 pt-1">
                    {entry.changes.map((diff) => (
                      <li key={diff.field} className="font-body text-base text-charcoal">
                        <span className="font-medium">
                          {t(`admin.settings.fields.${diff.field}.label`)}:
                        </span>{' '}
                        <span className="text-text-muted">{historyValue(diff.field, diff.oldValue)}</span> &rarr;{' '}
                        <span className="font-medium text-slate-brand">{historyValue(diff.field, diff.newValue)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
