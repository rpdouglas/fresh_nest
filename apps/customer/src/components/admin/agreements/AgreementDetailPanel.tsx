import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AGREEMENT_LINK_VALIDITY_DAYS,
  DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS,
  formatAgreementRate,
  getAgreementFrequencyLabel,
  getAgreementServiceLabel,
  toMillis,
  type AgreementAccessRecord,
  type AgreementLinkValidityDays,
  type AgreementRecord,
  type AgreementSignature,
} from '@freshnest/shared'
import {
  expireClientAgreement,
  getAgreementAccessRecord,
  getAgreementPdfDownloadUrl,
  getAgreementSignatures,
  redactClientAgreementData,
  reissueClientAgreementLink,
} from '@/lib/firebase/agreements'
import { RecordHistory } from '@/components/admin/audit/RecordHistory'

interface AgreementDetailPanelProps {
  agreement: AgreementRecord & { id: string }
  isOwner: boolean
  onClose: () => void
  onUpdated: () => void
}

function formatTs(value: unknown, lang: string): string {
  const ms = toMillis(value)
  if (ms === null) return '—'
  return new Intl.DateTimeFormat(lang.startsWith('fr') ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(new Date(ms))
}

export function AgreementDetailPanel({
  agreement,
  isOwner,
  onClose,
  onUpdated,
}: AgreementDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'

  const [signatures, setSignatures] = useState<Array<AgreementSignature & { id: string }>>([])
  const [accessRecord, setAccessRecord] = useState<AgreementAccessRecord | null>(null)
  const [accessLoaded, setAccessLoaded] = useState(false)
  const [accessVisible, setAccessVisible] = useState(false)

  const [reissueValidity, setReissueValidity] = useState<AgreementLinkValidityDays>(
    DEFAULT_AGREEMENT_LINK_VALIDITY_DAYS,
  )
  const [reissueEmail, setReissueEmail] = useState(false)
  const [reissuedUrl, setReissuedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [showRedactForm, setShowRedactForm] = useState(false)
  const [redactReason, setRedactReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getAgreementSignatures(agreement.id)
      .then((list) => {
        if (active) setSignatures(list)
      })
      .catch(() => {
        if (active) setSignatures([])
      })

    return () => {
      active = false
    }
  }, [agreement.id])

  const handleToggleAccess = async () => {
    if (accessVisible) {
      setAccessVisible(false)
      return
    }
    if (!accessLoaded) {
      try {
        const rec = await getAgreementAccessRecord(agreement.id)
        setAccessRecord(rec)
        setAccessLoaded(true)
      } catch {
        setError(t('admin.agreements.detail.accessLoadError'))
        return
      }
    }
    setAccessVisible(true)
  }

  const handleReissue = async () => {
    setBusy(true)
    setError(null)
    setFeedback(null)
    setCopied(false)
    try {
      const res = await reissueClientAgreementLink({
        agreementId: agreement.id,
        linkValidityDays: reissueValidity,
        sendEmail: reissueEmail,
      })
      setReissuedUrl(res.signingUrl)
      setFeedback(
        res.emailSent
          ? t('admin.agreements.detail.reissuedAndEmailed')
          : t('admin.agreements.detail.reissuedReady'),
      )
      onUpdated()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || t('admin.agreements.detail.actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handleExpire = async () => {
    setBusy(true)
    setError(null)
    setFeedback(null)
    try {
      await expireClientAgreement({ agreementId: agreement.id })
      setFeedback(t('admin.agreements.detail.expiredSuccess'))
      onUpdated()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || t('admin.agreements.detail.actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!agreement.pdfPath) return
    setBusy(true)
    setError(null)
    try {
      const url = await getAgreementPdfDownloadUrl(agreement.pdfPath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError(t('admin.agreements.detail.pdfDownloadError'))
    } finally {
      setBusy(false)
    }
  }

  const handleRedact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (redactReason.trim().length < 3) {
      setError(t('admin.agreements.detail.redactReasonRequired'))
      return
    }
    setBusy(true)
    setError(null)
    setFeedback(null)
    try {
      await redactClientAgreementData({
        agreementId: agreement.id,
        reason: redactReason.trim(),
      })
      setFeedback(t('admin.agreements.detail.redactedSuccess'))
      setShowRedactForm(false)
      setAccessLoaded(false)
      setAccessVisible(false)
      onUpdated()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || t('admin.agreements.detail.actionError'))
    } finally {
      setBusy(false)
    }
  }

  const canReissueOrExpire = agreement.status === 'sent' || agreement.status === 'expired' || agreement.status === 'draft'
  const latestSignature = signatures[0] ?? null

  return (
    <div className="bg-white border border-sand rounded p-5 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sand pb-4">
        <div>
          <h3 className="font-display text-3xl text-charcoal">{agreement.party.name}</h3>
          <p className="font-body text-base text-text-muted">
            {agreement.party.email} · {agreement.party.phone}
          </p>
          <p className="font-body text-base text-text-muted">{agreement.party.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal hover:bg-cream"
        >
          {t('admin.agreements.actions.close')}
        </button>
      </div>

      {/* Summary Grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.statusLabel')}</dt>
          <dd className="font-body text-base font-medium text-charcoal mt-0.5">
            {t(`admin.agreements.statuses.${agreement.status}`)}
            {agreement.status === 'sent' && agreement.viewedAt ? ` (${t('admin.agreements.detail.viewedBadge')})` : ''}
          </dd>
        </div>
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.serviceLabel')}</dt>
          <dd className="font-body text-base font-medium text-charcoal mt-0.5">
            {getAgreementServiceLabel(agreement.terms.serviceType, lang)} ·{' '}
            {getAgreementFrequencyLabel(agreement.terms.frequency, lang)}
          </dd>
        </div>
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.rateLabel')}</dt>
          <dd className="font-body text-base font-medium text-charcoal mt-0.5">
            {formatAgreementRate(agreement.terms.rateCents, agreement.terms.rateType, lang)}
          </dd>
        </div>
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.sentAtLabel')}</dt>
          <dd className="font-body text-base text-charcoal mt-0.5">{formatTs(agreement.sentAt, lang)}</dd>
        </div>
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.viewedAtLabel')}</dt>
          <dd className="font-body text-base text-charcoal mt-0.5">{formatTs(agreement.viewedAt, lang)}</dd>
        </div>
        <div className="bg-cream border border-sand rounded p-3">
          <dt className="font-body text-sm text-text-muted">{t('admin.agreements.detail.signedAtLabel')}</dt>
          <dd className="font-body text-base text-charcoal mt-0.5">{formatTs(agreement.signedAt, lang)}</dd>
        </div>
      </dl>

      {feedback && (
        <p role="status" className="bg-slate-pale text-slate-dark rounded p-3 font-body text-base">
          {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="bg-red-50 border border-red-300 text-red-800 rounded p-3 font-body text-base">
          {error}
        </p>
      )}

      {/* Reissued one-time link box */}
      {reissuedUrl && (
        <div className="bg-cream border border-sand-dark rounded p-4 space-y-2">
          <p className="font-body text-base font-medium text-charcoal">
            {t('admin.agreements.modal.oneTimeLinkWarning')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={reissuedUrl}
              aria-label={t('admin.agreements.modal.signingLinkLabel')}
              className="flex-1 min-h-[48px] px-3 bg-white border border-sand rounded font-mono text-sm text-charcoal"
            />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(reissuedUrl).then(() => setCopied(true))
              }}
              className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark text-white rounded font-body font-medium text-base shrink-0"
            >
              {copied ? t('admin.agreements.actions.copied') : t('admin.agreements.actions.copyLink')}
            </button>
          </div>
        </div>
      )}

      {/* Actions for unsigned agreements */}
      {canReissueOrExpire && (
        <div className="bg-cream border border-sand rounded p-4 space-y-3">
          <p className="font-body text-base font-medium text-charcoal">
            {t('admin.agreements.detail.linkControlsHeading')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label={t('admin.agreements.modal.linkValidityLabel')}
              value={reissueValidity}
              onChange={(e) =>
                setReissueValidity(Number(e.target.value) as AgreementLinkValidityDays)
              }
              className="min-h-[48px] px-3 bg-white border border-sand rounded font-body text-base text-charcoal"
            >
              {AGREEMENT_LINK_VALIDITY_DAYS.map((d) => (
                <option key={d} value={d}>
                  {t('admin.agreements.modal.daysOption', { count: d })}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 min-h-[48px] cursor-pointer">
              <input
                type="checkbox"
                checked={reissueEmail}
                onChange={(e) => setReissueEmail(e.target.checked)}
                className="h-5 w-5 rounded border-sand-dark text-slate-brand"
              />
              <span className="font-body text-base text-charcoal">
                {t('admin.agreements.modal.sendEmailLabel')}
              </span>
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={() => { void handleReissue() }}
              className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white rounded font-body font-medium text-base"
            >
              {t('admin.agreements.actions.reissueLink')}
            </button>

            {agreement.status !== 'expired' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => { void handleExpire() }}
                className="min-h-[48px] px-5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60 rounded font-body font-medium text-base"
              >
                {t('admin.agreements.actions.expireLink')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Signed PDF & Signature Evidence */}
      {agreement.status === 'signed' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {agreement.pdfPath && (
              <button
                type="button"
                disabled={busy}
                onClick={() => { void handleDownloadPdf() }}
                className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white rounded font-body font-medium text-base"
              >
                {t('admin.agreements.actions.downloadPdf')}
              </button>
            )}

            <button
              type="button"
              onClick={() => { void handleToggleAccess() }}
              className="min-h-[48px] px-5 border border-slate-brand text-slate-brand hover:bg-slate-pale rounded font-body font-medium text-base"
            >
              {accessVisible
                ? t('admin.agreements.actions.hideAccessCodes')
                : t('admin.agreements.actions.revealAccessCodes')}
            </button>

            {isOwner && !agreement.redactedAt && (
              <button
                type="button"
                onClick={() => setShowRedactForm((v) => !v)}
                className="min-h-[48px] px-5 border border-red-300 text-red-700 hover:bg-red-50 rounded font-body font-medium text-base"
              >
                {t('admin.agreements.actions.redactClientData')}
              </button>
            )}
          </div>

          {Boolean(agreement.redactedAt) && (
            <p className="font-body text-base text-text-muted bg-cream border border-sand rounded p-3">
              {t('admin.agreements.detail.redactedNotice', {
                by: agreement.redactedBy || 'owner',
                at: formatTs(agreement.redactedAt, lang),
              })}
            </p>
          )}

          {/* Owner-only privacy redaction form */}
          {isOwner && showRedactForm && (
            <form onSubmit={(e) => { void handleRedact(e) }} className="bg-red-50 border border-red-200 rounded p-4 space-y-3">
              <p className="font-body text-base font-medium text-red-900">
                {t('admin.agreements.detail.redactWarning')}
              </p>
              <label htmlFor="redact-reason" className="block font-body text-sm font-medium text-red-900">
                {t('admin.agreements.detail.redactReasonLabel')} *
              </label>
              <input
                id="redact-reason"
                type="text"
                required
                value={redactReason}
                onChange={(e) => setRedactReason(e.target.value)}
                placeholder={t('admin.agreements.detail.redactReasonPlaceholder')}
                className="w-full min-h-[48px] px-3 bg-white border border-red-300 rounded font-body text-base text-charcoal"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[48px] px-5 bg-red-700 hover:bg-red-800 text-white rounded font-body font-medium text-base"
                >
                  {t('admin.agreements.actions.confirmRedact')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRedactForm(false)}
                  className="min-h-[48px] px-4 border border-sand bg-white rounded font-body text-base text-charcoal"
                >
                  {t('admin.agreements.actions.cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Restricted access record panel */}
          {accessVisible && (
            <div className="bg-cream border border-sand-dark rounded p-4 space-y-2 font-body text-base text-charcoal">
              <h4 className="font-sub text-xl text-charcoal">
                {t('admin.agreements.detail.accessHeading')}
              </h4>
              {accessRecord ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p>
                    <span className="font-medium">{t('agreement.access.doorCodeLabel')}:</span>{' '}
                    {accessRecord.doorCode || '—'}
                  </p>
                  <p>
                    <span className="font-medium">{t('agreement.access.alarmCodeLabel')}:</span>{' '}
                    {accessRecord.alarmCode || '—'}
                  </p>
                  <p>
                    <span className="font-medium">{t('agreement.access.keyLocationLabel')}:</span>{' '}
                    {accessRecord.keyLocation || '—'}
                  </p>
                  <p>
                    <span className="font-medium">{t('agreement.access.accessNotesLabel')}:</span>{' '}
                    {accessRecord.accessNotes || '—'}
                  </p>
                </div>
              ) : (
                <p className="text-text-muted">{t('admin.agreements.detail.noAccessRecord')}</p>
              )}
            </div>
          )}

          {/* Signature Evidence summary */}
          {latestSignature && (
            <div className="bg-cream border border-sand rounded p-4 space-y-1.5 font-body text-base text-charcoal">
              <h4 className="font-sub text-xl text-charcoal">
                {t('admin.agreements.detail.evidenceHeading')}
              </h4>
              <p>
                <span className="font-medium">{t('agreement.signed.signedByLabel')}:</span>{' '}
                {latestSignature.signedName}
              </p>
              <p>
                <span className="font-medium">{t('admin.agreements.detail.versionLabel')}:</span>{' '}
                {latestSignature.versionId} ({latestSignature.language.toUpperCase()})
              </p>
              <p className="break-all">
                <span className="font-medium">{t('admin.agreements.detail.hashLabel')}:</span>{' '}
                <code className="text-sm">{latestSignature.documentHash}</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* P3-E37 Audit History */}
      <div className="pt-4 border-t border-sand">
        <RecordHistory records={[{ collection: 'agreements', id: agreement.id }]} />
      </div>
    </div>
  )
}
