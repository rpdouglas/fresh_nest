import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AGREEMENT_FREQUENCIES,
  AGREEMENT_LANGUAGES,
  AGREEMENT_LINK_VALIDITY_DAYS,
  AGREEMENT_RATE_TYPES,
  AGREEMENT_SERVICE_TYPES,
  AGREEMENT_TYPES,
  DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS,
  DEFAULT_COMMERCIAL_NOTICE_DAYS,
  DEFAULT_RESIDENTIAL_NOTICE_DAYS,
  centsToDollars,
  isDeepCancelService,
  toCents,
  todayInZone,
  type AgreementFrequency,
  type AgreementLanguage,
  type AgreementLinkValidityDays,
  type AgreementRateType,
  type AgreementServiceType,
  type AgreementType,
  type Booking,
  type PolicySettingsValues,
} from '@freshnest/shared'
import { AdminDialog } from '@/components/admin/ui/AdminDialog'
import { PHONE_STICKY_ACTIONS } from '@/components/admin/ui/dialogClasses'
import {
  createClientAgreement,
  type CreateAgreementResult,
} from '@/lib/firebase/agreements'

interface NewAgreementModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  bookings: Booking[]
  policy: PolicySettingsValues
}

const INPUT_CLASS =
  'w-full min-h-[48px] px-3 py-2 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

export function NewAgreementModal({
  open,
  onClose,
  onCreated,
  bookings,
  policy,
}: NewAgreementModalProps) {
  const { t } = useTranslation()

  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [type, setType] = useState<AgreementType>('residential')
  const [language, setLanguage] = useState<AgreementLanguage>('en')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [serviceType, setServiceType] = useState<AgreementServiceType>('standard')
  const [frequency, setFrequency] = useState<AgreementFrequency>('biweekly')
  const [startDate, setStartDate] = useState(() => todayInZone())
  const [rateType, setRateType] = useState<AgreementRateType>('flat')
  const [rateDollars, setRateDollars] = useState('180.00')
  const [taxExempt, setTaxExempt] = useState(false)
  const [cancelWindowHours, setCancelWindowHours] = useState(policy.standardCancelWindowHours)
  const [lateCancelFeeDollars, setLateCancelFeeDollars] = useState(
    centsToDollars(policy.lateCancellationFeeCents).toFixed(2),
  )
  const [lockoutFeeDollars, setLockoutFeeDollars] = useState(
    centsToDollars(policy.lockoutFeeCents).toFixed(2),
  )
  const [latePaymentPct, setLatePaymentPct] = useState('2')
  const [noticePeriodDays, setNoticePeriodDays] = useState(DEFAULT_RESIDENTIAL_NOTICE_DAYS)
  const [scopeNotes, setScopeNotes] = useState('')
  const [linkValidityDays, setLinkValidityDays] = useState<AgreementLinkValidityDays>(
    DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS,
  )
  const [sendEmail, setSendEmail] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdResult, setCreatedResult] = useState<CreateAgreementResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return
    const nextType: AgreementType = booking.serviceType === 'commercial' ? 'commercial' : 'residential'
    const nextService: AgreementServiceType = (AGREEMENT_SERVICE_TYPES as readonly string[]).includes(
      booking.serviceType,
    )
      ? booking.serviceType
      : 'standard'
    setType(nextType)
    setLanguage(booking.language === 'fr' ? 'fr' : 'en')
    setName(`${booking.firstName} ${booking.lastName}`.trim())
    setEmail(booking.email)
    setPhone(booking.phone)
    setAddress(booking.address)
    setServiceType(nextService)
    if ((AGREEMENT_FREQUENCIES as readonly string[]).includes(booking.frequency)) {
      setFrequency(booking.frequency)
    }
    if (booking.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate)) {
      setStartDate(booking.preferredDate)
    }
    if (typeof booking.estimatedPriceCents === 'number' && booking.estimatedPriceCents > 0) {
      setRateDollars(centsToDollars(booking.estimatedPriceCents).toFixed(2))
    }
    setCancelWindowHours(
      isDeepCancelService(nextService) ? policy.deepCancelWindowHours : policy.standardCancelWindowHours,
    )
    setNoticePeriodDays(
      nextType === 'commercial' ? DEFAULT_COMMERCIAL_NOTICE_DAYS : DEFAULT_RESIDENTIAL_NOTICE_DAYS,
    )
  }

  const handleTypeChange = (nextType: AgreementType) => {
    setType(nextType)
    setNoticePeriodDays(
      nextType === 'commercial' ? DEFAULT_COMMERCIAL_NOTICE_DAYS : DEFAULT_RESIDENTIAL_NOTICE_DAYS,
    )
    if (nextType === 'commercial') {
      setServiceType('commercial')
    }
  }

  const handleServiceChange = (nextService: AgreementServiceType) => {
    setServiceType(nextService)
    setCancelWindowHours(
      isDeepCancelService(nextService) ? policy.deepCancelWindowHours : policy.standardCancelWindowHours,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedRate = Number(rateDollars)
    const parsedLateCancel = Number(lateCancelFeeDollars)
    const parsedLockout = Number(lockoutFeeDollars)
    const parsedLatePct = Number(latePaymentPct)

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError(t('admin.agreements.modal.validationMissingClient'))
      return
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setError(t('admin.agreements.modal.validationInvalidRate'))
      return
    }

    setSubmitting(true)
    try {
      const result = await createClientAgreement({
        type,
        language,
        party: {
          kind: 'booking',
          bookingId: selectedBookingId || null,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        terms: {
          serviceType,
          frequency,
          startDate,
          rateType,
          rateCents: toCents(parsedRate),
          taxExempt,
          cancelWindowHours: Math.max(0, Math.round(cancelWindowHours)),
          lateCancellationFeeCents: Number.isFinite(parsedLateCancel) ? toCents(Math.max(0, parsedLateCancel)) : 0,
          lockoutFeeCents: Number.isFinite(parsedLockout) ? toCents(Math.max(0, parsedLockout)) : 0,
          latePaymentBasisPoints: Number.isFinite(parsedLatePct) ? Math.round(Math.max(0, parsedLatePct) * 100) : 200,
          noticePeriodDays: Math.max(0, Math.round(noticePeriodDays)),
          scopeNotes: scopeNotes.trim() || undefined,
        },
        linkValidityDays,
        sendEmail,
      })
      setCreatedResult(result)
      onCreated()
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(msg || t('admin.agreements.modal.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!createdResult) return
    try {
      await navigator.clipboard.writeText(createdResult.signingUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      labelledBy="new-agreement-modal-title"
      overlayClassName="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4 overflow-y-auto"
      panelClassName="bg-white border border-sand rounded shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 my-auto"
    >
      <div className="flex items-start justify-between gap-4 border-b border-sand pb-3">
        <h2 id="new-agreement-modal-title" className="font-display text-3xl text-charcoal">
          {createdResult
            ? t('admin.agreements.modal.createdTitle')
            : t('admin.agreements.modal.title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('admin.dialog.close')}
          className="hidden md:inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded border border-sand text-charcoal hover:bg-cream"
        >
          ✕
        </button>
      </div>

      {createdResult ? (
        <div className="space-y-5">
          <div className="bg-cream border border-sand-dark rounded p-4 space-y-2">
            <p className="font-body text-base font-medium text-charcoal">
              {t('admin.agreements.modal.oneTimeLinkWarning')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                aria-label={t('admin.agreements.modal.signingLinkLabel')}
                value={createdResult.signingUrl}
                className={`${INPUT_CLASS} font-mono text-sm`}
              />
              <button
                type="button"
                onClick={() => { void handleCopy() }}
                className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium text-base rounded shrink-0"
              >
                {copied ? t('admin.agreements.actions.copied') : t('admin.agreements.actions.copyLink')}
              </button>
            </div>
          </div>

          {createdResult.emailSent && (
            <p className="font-body text-base text-slate-dark bg-slate-pale rounded p-3">
              {t('admin.agreements.modal.emailSentConfirmation')}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-6 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium text-base rounded"
            >
              {t('admin.agreements.actions.done')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-5">
          {/* Optional prefill from existing booking */}
          <div className="space-y-1.5">
            <label htmlFor="agr-prefill-booking" className="block font-body text-sm font-medium text-text-muted">
              {t('admin.agreements.modal.prefillBookingLabel')}
            </label>
            <select
              id="agr-prefill-booking"
              value={selectedBookingId}
              onChange={(e) => handleSelectBooking(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">{t('admin.agreements.modal.prefillManualOption')}</option>
              {bookings.slice(0, 50).map((b) => (
                <option key={b.id} value={b.id ?? ''}>
                  {b.firstName} {b.lastName} — {b.preferredDate} ({b.serviceType})
                </option>
              ))}
            </select>
          </div>

          {/* Type & language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agr-type" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.typeLabel')}
              </label>
              <select
                id="agr-type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as AgreementType)}
                className={INPUT_CLASS}
              >
                {AGREEMENT_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(`admin.agreements.types.${tp}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-lang" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.languageLabel')}
              </label>
              <select
                id="agr-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value as AgreementLanguage)}
                className={INPUT_CLASS}
              >
                {AGREEMENT_LANGUAGES.map((lng) => (
                  <option key={lng} value={lng}>
                    {lng === 'fr' ? 'Français (FR)' : 'English (EN)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agr-name" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.clientNameLabel')} *
              </label>
              <input
                id="agr-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-email" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.clientEmailLabel')} *
              </label>
              <input
                id="agr-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-phone" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.clientPhoneLabel')} *
              </label>
              <input
                id="agr-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-address" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.clientAddressLabel')} *
              </label>
              <input
                id="agr-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Service & Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agr-service" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.serviceTypeLabel')}
              </label>
              <select
                id="agr-service"
                value={serviceType}
                onChange={(e) => handleServiceChange(e.target.value as AgreementServiceType)}
                className={INPUT_CLASS}
              >
                {AGREEMENT_SERVICE_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {t(`admin.agreements.serviceTypes.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-frequency" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.frequencyLabel')}
              </label>
              <select
                id="agr-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as AgreementFrequency)}
                className={INPUT_CLASS}
              >
                {AGREEMENT_FREQUENCIES.map((fr) => (
                  <option key={fr} value={fr}>
                    {t(`admin.agreements.frequencies.${fr}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-start-date" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.startDateLabel')}
              </label>
              <input
                id="agr-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label htmlFor="agr-rate-type" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.rateTypeLabel')}
              </label>
              <select
                id="agr-rate-type"
                value={rateType}
                onChange={(e) => setRateType(e.target.value as AgreementRateType)}
                className={INPUT_CLASS}
              >
                {AGREEMENT_RATE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {t(`admin.agreements.rateTypes.${rt}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agr-rate-dollars" className="block font-body text-sm font-medium text-text-muted">
                {t('admin.agreements.modal.rateDollarsLabel')} *
              </label>
              <input
                id="agr-rate-dollars"
                type="number"
                step="0.01"
                min="0"
                required
                value={rateDollars}
                onChange={(e) => setRateDollars(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
              <input
                type="checkbox"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
                className="h-5 w-5 rounded border-sand-dark text-slate-brand"
              />
              <span className="font-body text-base text-charcoal">
                {t('admin.agreements.modal.taxExemptLabel')}
              </span>
            </label>
          </div>

          {/* Frozen policy terms (editable before creation) */}
          <div className="bg-cream border border-sand rounded p-4 space-y-4">
            <p className="font-body text-sm font-medium text-text-muted">
              {t('admin.agreements.modal.policyTermsHint')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="agr-cancel-hrs" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.cancelWindowLabel')}
                </label>
                <input
                  id="agr-cancel-hrs"
                  type="number"
                  min="0"
                  max="168"
                  value={cancelWindowHours}
                  onChange={(e) => setCancelWindowHours(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="agr-late-cancel" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.lateCancelFeeLabel')}
                </label>
                <input
                  id="agr-late-cancel"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lateCancelFeeDollars}
                  onChange={(e) => setLateCancelFeeDollars(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="agr-lockout" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.lockoutFeeLabel')}
                </label>
                <input
                  id="agr-lockout"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lockoutFeeDollars}
                  onChange={(e) => setLockoutFeeDollars(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="agr-late-pct" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.latePaymentPctLabel')}
                </label>
                <input
                  id="agr-late-pct"
                  type="number"
                  step="0.25"
                  min="0"
                  max="50"
                  value={latePaymentPct}
                  onChange={(e) => setLatePaymentPct(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="agr-notice-days" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.noticeDaysLabel')}
                </label>
                <input
                  id="agr-notice-days"
                  type="number"
                  min="0"
                  max="365"
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="agr-validity" className="block font-body text-sm text-text-muted">
                  {t('admin.agreements.modal.linkValidityLabel')}
                </label>
                <select
                  id="agr-validity"
                  value={linkValidityDays}
                  onChange={(e) =>
                    setLinkValidityDays(Number(e.target.value) as AgreementLinkValidityDays)
                  }
                  className={INPUT_CLASS}
                >
                  {AGREEMENT_LINK_VALIDITY_DAYS.map((days) => (
                    <option key={days} value={days}>
                      {t('admin.agreements.modal.daysOption', { count: days })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="agr-scope-notes" className="block font-body text-sm text-text-muted">
                {t('admin.agreements.modal.scopeNotesLabel')}
              </label>
              <textarea
                id="agr-scope-notes"
                rows={2}
                value={scopeNotes}
                onChange={(e) => setScopeNotes(e.target.value)}
                className="w-full min-h-[72px] px-3 py-2 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
            </div>
          </div>

          {/* Optional immediate email toggle */}
          <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-5 w-5 rounded border-sand-dark text-slate-brand"
            />
            <span className="font-body text-base text-charcoal">
              {t('admin.agreements.modal.sendEmailLabel')}
            </span>
          </label>

          {error && (
            <p role="alert" className="bg-red-50 border border-red-300 rounded p-3 font-body text-base text-red-800">
              {error}
            </p>
          )}

          <div className={`flex justify-end gap-3 pt-4 border-t border-sand ${PHONE_STICKY_ACTIONS}`}>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 border border-sand rounded font-body font-medium text-base text-charcoal hover:bg-cream"
            >
              {t('admin.agreements.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-6 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white rounded font-body font-medium text-base"
            >
              {submitting
                ? t('admin.agreements.modal.creating')
                : t('admin.agreements.modal.createButton')}
            </button>
          </div>
        </form>
      )}
    </AdminDialog>
  )
}
