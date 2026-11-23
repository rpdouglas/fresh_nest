import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LEAD_NOTE_KINDS,
  LOST_REASONS,
  NON_OFFICE_ALLOWED_STAGES,
  centsToDollars,
  toCents,
  type LeadNoteKind,
  type LostReason,
  type PipelineStage,
  type StaffLeadDetail,
} from '@freshnest/shared'
import { addMyLeadNote, getMyLead, updateMyLead } from '../lib/firebase/leads'

const INPUT_CLASS =
  'w-full min-h-[48px] px-3 py-2 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

export const LeadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()

  const [lead, setLead] = useState<StaffLeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stage, setStage] = useState<Exclude<PipelineStage, 'won'>>('new')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [quoteDollars, setQuoteDollars] = useState('')
  const [lostReason, setLostReason] = useState<LostReason>('no_response')
  const [lostNote, setLostNote] = useState('')

  const [noteKind, setNoteKind] = useState<LeadNoteKind>('call')
  const [noteBody, setNoteBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    void getMyLead(id)
      .then((detail) => {
        if (!active) return
        setLead(detail)
        const st = detail.pipeline.stage === 'won' ? 'quoted' : detail.pipeline.stage
        setStage(st)
        setNextFollowUpDate(detail.pipeline.nextFollowUpDate ?? '')
        setQuoteDollars(
          typeof detail.pipeline.quotedPriceCents === 'number'
            ? centsToDollars(detail.pipeline.quotedPriceCents).toFixed(2)
            : '',
        )
        setLostReason(detail.pipeline.lostReason ?? 'no_response')
        setLostNote(detail.pipeline.lostNote ?? '')
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('load_error')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setFeedback(null)

    let quotedPriceCents: number | null = null
    if (quoteDollars.trim() !== '') {
      const parsed = Number(quoteDollars)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFeedback({ kind: 'error', text: t('fsm.myLeads.invalidQuote') })
        return
      }
      quotedPriceCents = toCents(parsed)
    }

    setSaving(true)
    try {
      const updated = await updateMyLead({
        bookingId: id,
        stage,
        nextFollowUpDate: nextFollowUpDate || null,
        quotedPriceCents,
        ...(stage === 'lost' ? { lostReason, lostNote } : {}),
      })
      setLead((prev) => (prev ? { ...prev, ...updated } : prev))
      setFeedback({ kind: 'ok', text: t('fsm.myLeads.saved') })
    } catch {
      setFeedback({ kind: 'error', text: t('fsm.myLeads.saveError') })
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteBody.trim()) return
    setSavingNote(true)
    setFeedback(null)
    try {
      const created = await addMyLeadNote(id, noteKind, noteBody.trim())
      setLead((prev) => (prev ? { ...prev, leadNotes: [created, ...prev.leadNotes] } : prev))
      setNoteBody('')
      setFeedback({ kind: 'ok', text: t('fsm.myLeads.noteAdded') })
    } catch {
      setFeedback({ kind: 'error', text: t('fsm.myLeads.saveError') })
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center font-body text-base text-text-muted">
        {t('fsm.myLeads.loading')}
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div role="alert" className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-800">
          {t('fsm.myLeads.notFound')}
        </div>
        <Link
          to="/leads"
          className="min-h-[48px] inline-flex items-center px-4 border border-sand rounded font-body text-base text-charcoal hover:bg-cream"
        >
          {t('fsm.myLeads.backToLeads')}
        </Link>
      </div>
    )
  }

  const isWon = lead.pipeline.stage === 'won'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/leads"
        className="min-h-[48px] inline-flex items-center px-3 -ml-3 text-slate-brand hover:underline font-body text-base font-medium"
      >
        ← {t('fsm.myLeads.backToLeads')}
      </Link>

      <div className="bg-white border border-sand rounded p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl text-charcoal font-bold">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="font-body text-base text-text-muted">
              {t(`fsm.shifts.serviceTypes.${lead.serviceType}`, { defaultValue: lead.serviceType })} · {lead.preferredDate}
            </p>
          </div>
          <span className="px-3 py-1 rounded bg-slate-pale text-slate-dark font-body text-sm font-medium uppercase">
            {lead.language}
          </span>
        </div>

        <div className="space-y-2 font-body text-base text-charcoal">
          <p>
            <strong>{t('fsm.myLeads.locationLabel')}:</strong> {lead.locationDisplay}
          </p>
          {!lead.hasFullAddress && (
            <p className="text-text-muted">{t('fsm.myLeads.addressMinimizedHint')}</p>
          )}
          {lead.notes && (
            <p>
              <strong>{t('fsm.myLeads.clientNotes')}:</strong> {lead.notes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={`tel:${lead.phone.replace(/\s+/g, '')}`}
            className="min-h-[48px] px-4 inline-flex items-center gap-2 bg-slate-brand hover:bg-slate-dark text-white rounded font-body text-base font-medium"
          >
            {lead.phone}
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="min-h-[48px] px-4 inline-flex items-center border border-sand hover:bg-cream text-charcoal rounded font-body text-base"
          >
            {lead.email}
          </a>
        </div>
      </div>

      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`rounded p-3 border font-body text-base ${
            feedback.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-pale border-slate-brand text-charcoal'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {/* Stage & Follow-up Form (Won is office-only) */}
      <form onSubmit={(e) => { void handleSave(e) }} className="bg-white border border-sand rounded p-5 space-y-4 shadow-sm">
        <h2 className="font-sub text-xl text-charcoal">{t('fsm.myLeads.updateHeading')}</h2>

        {isWon ? (
          <p className="font-body text-base text-green-800 bg-green-50 border border-green-200 rounded p-3">
            {t('fsm.myLeads.alreadyWon')}
          </p>
        ) : (
          <>
            <p className="font-body text-base text-text-muted">{t('fsm.myLeads.wonOfficeOnlyHint')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="fsm-lead-stage" className="block font-body text-base font-medium text-charcoal">
                  {t('fsm.myLeads.stageLabel')}
                </label>
                <select
                  id="fsm-lead-stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as Exclude<PipelineStage, 'won'>)}
                  className={INPUT_CLASS}
                >
                  {NON_OFFICE_ALLOWED_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {t(`fsm.myLeads.stages.${st}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="fsm-lead-followup" className="block font-body text-base font-medium text-charcoal">
                  {t('fsm.myLeads.nextFollowUpLabel')}
                </label>
                <input
                  id="fsm-lead-followup"
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="fsm-lead-quote" className="block font-body text-base font-medium text-charcoal">
                  {t('fsm.myLeads.quotedPriceLabel')}
                </label>
                <input
                  id="fsm-lead-quote"
                  type="number"
                  step="0.01"
                  min="0"
                  value={quoteDollars}
                  onChange={(e) => setQuoteDollars(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {stage === 'lost' && (
              <div className="bg-red-50 border border-red-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="fsm-lost-reason" className="block font-body text-base font-medium text-charcoal">
                    {t('fsm.myLeads.lostReasonLabel')} *
                  </label>
                  <select
                    id="fsm-lost-reason"
                    required
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value as LostReason)}
                    className={INPUT_CLASS}
                  >
                    {LOST_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {t(`fsm.myLeads.lostReasons.${r}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="fsm-lost-note" className="block font-body text-base font-medium text-charcoal">
                    {t('fsm.myLeads.lostNoteLabel')}
                  </label>
                  <input
                    id="fsm-lost-note"
                    type="text"
                    maxLength={500}
                    value={lostNote}
                    onChange={(e) => setLostNote(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-6 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white rounded font-body text-base font-medium"
            >
              {saving ? t('fsm.myLeads.saving') : t('fsm.myLeads.saveButton')}
            </button>
          </>
        )}
      </form>

      {/* Contact Notes */}
      <div className="bg-white border border-sand rounded p-5 space-y-4 shadow-sm">
        <h2 className="font-sub text-xl text-charcoal">{t('fsm.myLeads.notesHeading')}</h2>

        <form onSubmit={(e) => { void handleAddNote(e) }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <div>
              <label htmlFor="fsm-note-kind" className="sr-only">{t('fsm.myLeads.noteKindLabel')}</label>
              <select
                id="fsm-note-kind"
                value={noteKind}
                onChange={(e) => setNoteKind(e.target.value as LeadNoteKind)}
                className={INPUT_CLASS}
              >
                {LEAD_NOTE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`fsm.myLeads.noteKinds.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fsm-note-body" className="sr-only">{t('fsm.myLeads.noteBodyLabel')}</label>
              <input
                id="fsm-note-body"
                type="text"
                maxLength={2000}
                placeholder={t('fsm.myLeads.notePlaceholder')}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingNote || !noteBody.trim()}
            className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark disabled:opacity-50 text-white rounded font-body text-base font-medium"
          >
            {t('fsm.myLeads.addNoteButton')}
          </button>
        </form>

        {lead.leadNotes.length === 0 ? (
          <p className="font-body text-base text-text-muted">{t('fsm.myLeads.noNotes')}</p>
        ) : (
          <ul className="divide-y divide-sand border border-sand rounded bg-cream">
            {lead.leadNotes.map((n) => (
              <li key={n.id} className="p-3.5 space-y-1">
                <div className="flex flex-wrap justify-between gap-2 text-sm text-text-muted font-body">
                  <span className="font-medium text-charcoal">
                    {t(`fsm.myLeads.noteKinds.${n.kind}`)} · {n.by}
                  </span>
                  <span>
                    {new Date(n.atIso).toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <p className="font-body text-base text-charcoal whitespace-pre-line">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default LeadPage
