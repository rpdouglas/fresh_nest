import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { bookingsCollection } from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import {
  attachJobChecklist,
  setBookingChecklistTemplate,
  CHECKLIST_LOCKED,
  type JobChecklist,
} from '@/lib/firebase/firestore'
import { useChecklistTemplates } from '@/components/admin/hooks/useChecklistTemplates'
import { AdminDialog } from '@/components/admin/ui/AdminDialog'
import { PHONE_STICKY_ACTIONS } from '@/components/admin/ui/dialogClasses'
import { ChecklistTaskEditor } from './ChecklistTaskEditor'
import { canChangeChecklist, hasMissingLabels, orderedTasks } from '@/lib/utils/checklistTasks'
import { cn } from '@/lib/utils/utils'
import type { Booking, ChecklistTask, ChecklistTemplate, Job } from '@/types'

// P3-E34 (P12 Lauren): attach a saved list or a custom list to a job, and optionally keep a
// saved list for this client's future visits. Without a job yet (pending booking), the choice
// is stored on the booking and the job gets it when it is created.

type ChecklistBooking = Pick<Booking, 'id' | 'frequency' | 'serviceType' | 'checklistTemplateId'>

interface ChecklistDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  job: Job | null
  booking: ChecklistBooking | null
}

const AUTOMATIC = ''

const labelClass = 'font-body text-base text-charcoal font-medium'
const selectClass =
  'w-full min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand'
const checkboxRowClass = 'flex items-center gap-3 cursor-pointer font-body text-base text-charcoal min-h-[48px]'

export function ChecklistDialog({ open, onClose, onSaved, job, booking: bookingProp }: ChecklistDialogProps) {
  const { t } = useTranslation()
  const { templates, handleCreate } = useChecklistTemplates(open)

  // The Dispatch Board only has the job; fetch its booking for the future-visits choice.
  const [fetchedBooking, setFetchedBooking] = useState<ChecklistBooking | null>(null)
  const bookingId = bookingProp?.id ?? job?.bookingId ?? null
  useEffect(() => {
    if (!open || bookingProp || !bookingId) return
    let cancelled = false
    getDoc(doc(bookingsCollection(db), bookingId))
      .then((snap) => {
        if (!cancelled && snap.exists()) setFetchedBooking(snap.data())
      })
      .catch((err) => console.error('Error fetching booking for checklist:', err))
    return () => { cancelled = true }
  }, [open, bookingProp, bookingId])
  const booking = bookingProp ?? fetchedBooking

  const locked = job !== null && !canChangeChecklist(job)
  const recurring = booking !== null && booking.frequency !== 'one-time'
  const serviceType = job?.serviceType ?? booking?.serviceType ?? 'standard'

  const activeTemplates = useMemo(
    () => templates.filter((tpl) => tpl.active || tpl.id === job?.checklistTemplate || tpl.id === booking?.checklistTemplateId),
    [templates, job?.checklistTemplate, booking?.checklistTemplateId],
  )

  const initialTemplateId = (() => {
    if (job && job.checklistSource !== 'custom' && job.checklistTemplate) return job.checklistTemplate
    if (booking?.checklistTemplateId) return booking.checklistTemplateId
    return AUTOMATIC
  })()

  const [mode, setMode] = useState<'saved' | 'custom'>(job?.checklistSource === 'custom' ? 'custom' : 'saved')
  const [templateId, setTemplateId] = useState(initialTemplateId)
  const [customTasks, setCustomTasks] = useState<ChecklistTask[]>(
    job?.checklistSource === 'custom' ? (job.checklistTasks ?? []) : [],
  )
  const [startFrom, setStartFrom] = useState(AUTOMATIC)
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [useForFuture, setUseForFuture] = useState(Boolean(booking?.checklistTemplateId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A booking fetched after opening may already have a future-visits list.
  const [syncedBookingId, setSyncedBookingId] = useState<string | null>(null)
  if (booking?.id && booking.id !== syncedBookingId) {
    setSyncedBookingId(booking.id)
    setUseForFuture(Boolean(booking.checklistTemplateId))
  }

  // Without a job, a custom list has nowhere to live except a new saved list.
  const mustSaveAsNew = mode === 'custom' && (job === null || (recurring && useForFuture))
  const savingAsNew = mode === 'custom' && (saveAsNew || mustSaveAsNew)

  const selectedTemplate: ChecklistTemplate | undefined = templates.find((tpl) => tpl.id === templateId)
  const previewTasks = mode === 'saved' ? (selectedTemplate?.tasks ?? []) : customTasks

  const handleStartFrom = (id: string) => {
    setStartFrom(id)
    const source = templates.find((tpl) => tpl.id === id)
    setCustomTasks(source ? orderedTasks(source.tasks) : [])
  }

  const handleSave = async () => {
    setError(null)
    if (mode === 'custom') {
      if (customTasks.length === 0) return setError(t('admin.checklist.errors.noTasks'))
      if (hasMissingLabels(customTasks)) return setError(t('admin.checklist.errors.missingLabels'))
      if (savingAsNew && !newName.trim()) return setError(t('admin.checklist.errors.nameRequired'))
    }
    if (mode === 'saved' && job && templateId === AUTOMATIC) {
      return setError(t('admin.checklist.errors.chooseList'))
    }

    setSaving(true)
    try {
      let checklist: JobChecklist | null = null
      if (mode === 'saved' && selectedTemplate?.id) {
        checklist = { templateId: selectedTemplate.id, name: selectedTemplate.name, source: 'template', tasks: selectedTemplate.tasks }
      } else if (mode === 'custom') {
        const tasks = orderedTasks(customTasks)
        if (savingAsNew) {
          const name = newName.trim()
          const id = await handleCreate({ name, serviceType, tasks, active: true })
          checklist = { templateId: id, name, source: 'template', tasks }
        } else {
          checklist = { templateId: '', name: t('admin.checklist.customName'), source: 'custom', tasks }
        }
      }

      if (job?.id && checklist) await attachJobChecklist(job.id, checklist)

      if (booking?.id) {
        // No job yet: the choice is what the job gets. With a job: only if kept for future visits.
        const futureId = job === null
          ? (checklist?.templateId || null)
          : (recurring && useForFuture ? (checklist?.templateId || null) : null)
        if (futureId !== (booking.checklistTemplateId ?? null) && (job === null || recurring)) {
          await setBookingChecklistTemplate(booking.id, futureId)
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error && err.message === CHECKLIST_LOCKED
          ? t('admin.checklist.locked')
          : t('admin.checklist.errors.saveError'),
      )
    } finally {
      setSaving(false)
    }
  }

  const modeButton = (value: 'saved' | 'custom') => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === value}
      onClick={() => setMode(value)}
      disabled={locked}
      className={cn(
        'flex-1 min-h-[48px] px-4 font-body text-base font-medium rounded border transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:opacity-50',
        mode === value ? 'bg-slate-brand text-white border-slate-brand' : 'bg-white text-slate-brand border-slate-brand hover:bg-slate-pale',
      )}
    >
      {t(value === 'saved' ? 'admin.checklist.modeSaved' : 'admin.checklist.modeCustom')}
    </button>
  )

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      labelledBy="checklist-dialog-title"
      overlayClassName="fixed inset-0 z-50 flex items-start justify-center bg-charcoal/50 p-4 overflow-y-auto"
      panelClassName="w-full max-w-2xl bg-white rounded border border-sand shadow-lg my-8 p-6 flex flex-col gap-6"
    >
      <div>
        <h2 id="checklist-dialog-title" className="font-sub text-2xl text-charcoal">
          {t('admin.checklist.title')}
        </h2>
        {(job?.clientName) && (
          <p className="font-body text-base text-text-muted mt-1">
            {job.clientName} · {job.scheduledDate}
          </p>
        )}
      </div>

      {job === null && (
        <p className="font-body text-base text-charcoal bg-slate-pale/50 border border-sand rounded p-3">
          {t('admin.checklist.noJobNote')}
        </p>
      )}

      {locked && (
        <p role="status" className="font-body text-base text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
          {t('admin.checklist.locked')}
        </p>
      )}

      {error && (
        <p role="alert" className="font-body text-base text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      )}

      {!locked && (
        <div role="radiogroup" aria-label={t('admin.checklist.modeLabel')} className="flex gap-2">
          {modeButton('saved')}
          {modeButton('custom')}
        </div>
      )}

      {mode === 'saved' && !locked && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="checklist-saved" className={labelClass}>{t('admin.checklist.savedLabel')}</label>
          <select id="checklist-saved" value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={selectClass}>
            {job === null
              ? <option value={AUTOMATIC}>{t('admin.checklist.automatic')}</option>
              : templateId === AUTOMATIC && <option value={AUTOMATIC} disabled>{t('admin.checklist.choose')}</option>}
            {activeTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({t('admin.templates.taskCount', { count: tpl.tasks.length })})
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'custom' && !locked && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checklist-start-from" className={labelClass}>{t('admin.checklist.startFrom')}</label>
            <select id="checklist-start-from" value={startFrom} onChange={(e) => handleStartFrom(e.target.value)} className={selectClass}>
              <option value={AUTOMATIC}>{t('admin.checklist.startBlank')}</option>
              {activeTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
          <ChecklistTaskEditor tasks={customTasks} onChange={setCustomTasks} />
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              checked={savingAsNew}
              disabled={mustSaveAsNew}
              onChange={(e) => setSaveAsNew(e.target.checked)}
              className="w-5 h-5 rounded border-sand accent-slate-brand"
            />
            {t('admin.checklist.saveAsNew')}
          </label>
          {mustSaveAsNew && (
            <p className="font-body text-base text-text-muted -mt-3">{t('admin.checklist.saveAsNewRequired')}</p>
          )}
          {savingAsNew && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="checklist-new-name" className={labelClass}>{t('admin.checklist.newName')}</label>
              <input
                id="checklist-new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
            </div>
          )}
        </div>
      )}

      {job !== null && recurring && !locked && (
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={useForFuture}
            onChange={(e) => setUseForFuture(e.target.checked)}
            className="w-5 h-5 rounded border-sand accent-slate-brand"
          />
          {t('admin.checklist.useForFuture')}
        </label>
      )}

      {(mode === 'saved' || locked) && (
        <div className="flex flex-col gap-2">
          <h3 className="font-sub text-xl text-charcoal">{t('admin.checklist.preview')}</h3>
          {(locked ? (job?.checklistTasks ?? []) : previewTasks).length === 0 ? (
            <p className="font-body text-base text-text-muted">
              {mode === 'saved' && templateId === AUTOMATIC ? t('admin.checklist.automaticHint') : t('admin.checklist.noTasks')}
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {(locked ? (job?.checklistTasks ?? []) : previewTasks).map((task) => (
                <li key={task.id} className="flex items-center gap-3 font-body text-base text-charcoal min-h-[40px]">
                  <span aria-hidden="true" className="text-xl">{task.icon}</span>
                  <span className="flex-1">{task.labelEn}<span className="text-text-muted"> / {task.labelFr}</span></span>
                  {task.requiresPhoto && <span className="text-text-muted">📸 {t('admin.checklist.photo')}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className={cn('flex justify-end gap-3 border-t border-sand pt-4', PHONE_STICKY_ACTIONS)}>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] px-6 border border-slate-brand text-slate-brand font-body font-medium rounded hover:bg-slate-pale focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {t(locked ? 'admin.dialog.close' : 'admin.checklist.cancel')}
        </button>
        {!locked && (
          <button
            type="button"
            onClick={() => { void handleSave() }}
            disabled={saving}
            className="min-h-[48px] px-6 bg-slate-brand text-white font-body font-medium rounded hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50"
          >
            {t('admin.checklist.save')}
          </button>
        )}
      </div>
    </AdminDialog>
  )
}
