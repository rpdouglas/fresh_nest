import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LEAD_NOTE_KINDS,
  LOST_REASONS,
  PIPELINE_STAGES,
  centsToDollars,
  computeLeadSlaStatus,
  inferPipelineStageFromBooking,
  toCents,
  type Booking,
  type LeadNote,
  type LeadNoteKind,
  type LostReason,
  type PipelineStage,
  type PolicySettingsValues,
} from '@freshnest/shared'
import { addLeadNote, subscribeToLeadNotes, updateLeadPipeline } from '@/lib/firebase/firestore'
import { RecordHistory } from './audit/RecordHistory'
import type { AssignableLeadOwner } from './hooks/useAssignableOwners'
import { cn } from '@/lib/utils/utils'

interface LeadDetailPanelProps {
  lead: Booking
  owners: AssignableLeadOwner[]
  policy: PolicySettingsValues
  onClose: () => void
  onCreateAgreement: (bookingId: string) => void
}

const INPUT_CLASS =
  'w-full min-h-[48px] px-3 py-2 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

export function LeadDetailPanel({
  lead,
  owners,
  policy,
  onClose,
  onCreateAgreement,
}: LeadDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const bookingId = lead.id ?? ''
  const currentStage = inferPipelineStageFromBooking(lead)
  const currentOwner = lead.pipeline?.ownerEmail?.trim().toLowerCase() ?? ''

  const [stage, setStage] = useState<PipelineStage>(currentStage)
  const [lostReason, setLostReason] = useState<LostReason>(lead.pipeline?.lostReason ?? 'no_response')
  const [lostNote, setLostNote] = useState(lead.pipeline?.lostNote ?? '')
  const [needsSiteVisit, setNeedsSiteVisit] = useState(Boolean(lead.pipeline?.needsSiteVisit))
  const [nextFollowUpDate, setNextFollowUpDate] = useState(lead.pipeline?.nextFollowUpDate ?? '')
  const [quoteDollars, setQuoteDollars] = useState(
    typeof lead.pipeline?.quotedPriceCents === 'number'
      ? centsToDollars(lead.pipeline.quotedPriceCents).toFixed(2)
      : '',
  )

  const [notes, setNotes] = useState<LeadNote[]>([])
  const [noteKind, setNoteKind] = useState<LeadNoteKind>('call')
  const [noteBody, setNoteBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!bookingId) return
    return subscribeToLeadNotes(bookingId, setNotes)
  }, [bookingId])

  const sla = computeLeadSlaStatus({
    stage: currentStage,
    createdAt: lead.createdAt,
    firstContactAt: lead.pipeline?.firstContactAt ?? null,
    needsSiteVisit: Boolean(lead.pipeline?.needsSiteVisit),
    nextFollowUpDate: lead.pipeline?.nextFollowUpDate ?? null,
    firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
    siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
  })

  const handleOwnerChange = async (nextEmail: string) => {
    setSaving(true)
    setFeedback(null)
    try {
      const matched = owners.find((o) => o.email === nextEmail)
      await updateLeadPipeline(
        bookingId,
        {
          ownerEmail: nextEmail || null,
          ownerRole: matched?.role ?? null,
        },
        lead,
        nextEmail ? `Assigned to ${nextEmail}` : 'Unassigned lead',
      )
      setFeedback({ kind: 'ok', text: t('admin.pipeline.detail.saved') })
    } catch {
      setFeedback({ kind: 'error', text: t('admin.pipeline.detail.saveError') })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (stage === 'lost' && !lostReason) {
      setFeedback({ kind: 'error', text: t('admin.pipeline.detail.lostReasonRequired') })
      return
    }

    const trimmedQuote = quoteDollars.trim()
    let quotedPriceCents: number | null = null
    if (trimmedQuote !== '') {
      const parsed = Number(trimmedQuote)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFeedback({ kind: 'error', text: t('admin.pipeline.detail.invalidQuote') })
        return
      }
      quotedPriceCents = toCents(parsed)
    }

    setSaving(true)
    try {
      await updateLeadPipeline(
        bookingId,
        {
          stage,
          needsSiteVisit,
          nextFollowUpDate: nextFollowUpDate || null,
          quotedPriceCents,
          ...(stage === 'lost' ? { lostReason, lostNote } : {}),
        },
        lead,
      )
      setFeedback({ kind: 'ok', text: t('admin.pipeline.detail.saved') })
    } catch {
      setFeedback({ kind: 'error', text: t('admin.pipeline.detail.saveError') })
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = noteBody.trim()
    if (!trimmed) return
    setSavingNote(true)
    setFeedback(null)
    try {
      await addLeadNote(bookingId, noteKind, trimmed, lead)
      setNoteBody('')
      setFeedback({ kind: 'ok', text: t('admin.pipeline.detail.noteAdded') })
    } catch {
      setFeedback({ kind: 'error', text: t('admin.pipeline.detail.saveError') })
    } finally {
      setSavingNote(false)
    }
  }

  const formatDateTime = (d: Date) =>
    d.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="bg-white border border-sand rounded p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sand pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-3xl text-charcoal">
              {lead.firstName} {lead.lastName}
            </h3>
            <span className="px-2.5 py-0.5 rounded bg-slate-pale text-slate-dark font-body text-sm font-medium uppercase">
              {lead.language}
            </span>
            {lead.isAirbnb && (
              <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-body text-sm font-medium">
                Airbnb
              </span>
            )}
            {sla.isOverdue && (
              <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-800 font-body text-sm font-medium">
                ! {t(
                  sla.overdueReason === 'follow_up'
                    ? 'admin.pipeline.badges.overdueFollowUp'
                    : 'admin.pipeline.badges.overdueFirstContact',
                )}
              </span>
            )}
          </div>
          <p className="font-body text-base text-text-muted">
            {lead.address} · {lead.preferredDate} · {t(`admin.agreements.serviceTypes.${lead.serviceType}`, { defaultValue: lead.serviceType })}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 font-body text-base">
            <a
              href={`tel:${lead.phone.replace(/\s+/g, '')}`}
              className="text-slate-brand underline font-medium min-h-[48px] inline-flex items-center"
            >
              {lead.phone}
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="text-slate-brand underline min-h-[48px] inline-flex items-center"
            >
              {lead.email}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCreateAgreement(bookingId)}
            className="min-h-[48px] px-4 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium text-base rounded"
          >
            {t('admin.pipeline.detail.createAgreement')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-4 border border-sand text-charcoal hover:bg-cream font-body font-medium text-base rounded"
          >
            {t('admin.pipeline.detail.close')}
          </button>
        </div>
      </div>

      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'rounded p-3 border font-body text-base',
            feedback.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-pale border-slate-brand text-charcoal',
          )}
        >
          {feedback.text}
        </p>
      )}

      {/* Quick Owner Assignment */}
      <div className="bg-cream border border-sand rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="space-y-1">
          <label htmlFor="lead-owner-select" className="block font-body text-base font-medium text-charcoal">
            {t('admin.pipeline.detail.ownerLabel')}
          </label>
          <select
            id="lead-owner-select"
            value={currentOwner}
            disabled={saving}
            onChange={(e) => { void handleOwnerChange(e.target.value) }}
            className={INPUT_CLASS}
          >
            <option value="">{t('admin.pipeline.unassigned')}</option>
            {owners.map((o) => (
              <option key={o.email} value={o.email}>
                {o.displayName} ({t(`admin.pipeline.roles.${o.role}`, { defaultValue: o.role })})
              </option>
            ))}
          </select>
        </div>

        <div className="font-body text-base text-text-muted space-y-1">
          <p>
            {t('admin.pipeline.detail.slaTarget', {
              minutes: sla.targetMinutes,
              elapsed: sla.elapsedBusinessMinutes,
            })}
          </p>
          {lead.notes && (
            <p className="text-charcoal">
              <strong>{t('admin.pipeline.detail.clientNotes')}:</strong> {lead.notes}
            </p>
          )}
        </div>
      </div>

      {/* Stage, Follow-up, Quote & Lost Reason Form */}
      <form onSubmit={(e) => { void handleSaveDetails(e) }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="lead-stage-select" className="block font-body text-base font-medium text-charcoal">
              {t('admin.pipeline.detail.stageLabel')}
            </label>
            <select
              id="lead-stage-select"
              value={stage}
              onChange={(e) => setStage(e.target.value as PipelineStage)}
              className={INPUT_CLASS}
            >
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {t(`admin.pipeline.stages.${st}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-followup-date" className="block font-body text-base font-medium text-charcoal">
              {t('admin.pipeline.detail.nextFollowUpLabel')}
            </label>
            <input
              id="lead-followup-date"
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-quote-dollars" className="block font-body text-base font-medium text-charcoal">
              {t('admin.pipeline.detail.quotedPriceLabel')}
            </label>
            <input
              id="lead-quote-dollars"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={quoteDollars}
              onChange={(e) => setQuoteDollars(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
          <input
            type="checkbox"
            checked={needsSiteVisit}
            onChange={(e) => setNeedsSiteVisit(e.target.checked)}
            className="h-5 w-5 rounded border-sand-dark text-slate-brand"
          />
          <span className="font-body text-base text-charcoal">
            {t('admin.pipeline.detail.needsSiteVisitLabel')}
          </span>
        </label>

        {stage === 'lost' && (
          <div className="bg-red-50 border border-red-200 rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="lead-lost-reason" className="block font-body text-base font-medium text-charcoal">
                {t('admin.pipeline.detail.lostReasonLabel')} *
              </label>
              <select
                id="lead-lost-reason"
                required
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value as LostReason)}
                className={INPUT_CLASS}
              >
                {LOST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`admin.pipeline.lostReasons.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-lost-note" className="block font-body text-base font-medium text-charcoal">
                {t('admin.pipeline.detail.lostNoteLabel')}
              </label>
              <input
                id="lead-lost-note"
                type="text"
                maxLength={500}
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] px-6 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white font-body font-medium text-base rounded"
          >
            {saving ? t('admin.pipeline.detail.saving') : t('admin.pipeline.detail.saveButton')}
          </button>
        </div>
      </form>

      {/* Contact Log (append-only leadNotes) */}
      <div className="border-t border-sand pt-5 space-y-4">
        <h4 className="font-sub text-xl text-charcoal">{t('admin.pipeline.notes.heading')}</h4>

        <form onSubmit={(e) => { void handleAddNote(e) }} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-start">
          <div>
            <label htmlFor="lead-note-kind" className="sr-only">
              {t('admin.pipeline.notes.kindLabel')}
            </label>
            <select
              id="lead-note-kind"
              value={noteKind}
              onChange={(e) => setNoteKind(e.target.value as LeadNoteKind)}
              className={INPUT_CLASS}
            >
              {LEAD_NOTE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`admin.pipeline.notes.kinds.${k}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lead-note-body" className="sr-only">
              {t('admin.pipeline.notes.bodyLabel')}
            </label>
            <input
              id="lead-note-body"
              type="text"
              maxLength={2000}
              placeholder={t('admin.pipeline.notes.placeholder')}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={savingNote || !noteBody.trim()}
            className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark disabled:opacity-50 text-white font-body font-medium text-base rounded"
          >
            {t('admin.pipeline.notes.addButton')}
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="font-body text-base text-text-muted">{t('admin.pipeline.notes.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand border border-sand rounded bg-cream">
            {notes.map((n) => (
              <li key={n.id} className="p-3.5 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted font-body">
                  <span className="font-medium text-charcoal">
                    {t(`admin.pipeline.notes.kinds.${n.kind}`)} · {n.by}
                  </span>
                  <span>{formatDateTime(n.at)}</span>
                </div>
                <p className="font-body text-base text-charcoal whitespace-pre-line">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* P3-E37 Audit History */}
      {bookingId && (
        <div className="border-t border-sand pt-4">
          <RecordHistory records={[{ collection: 'bookings', id: bookingId }]} />
        </div>
      )}
    </div>
  )
}
