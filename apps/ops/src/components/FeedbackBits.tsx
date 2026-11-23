// The form for recording client feedback and the card that shows one entry.
// Used on Client hours (against a visit) and on the Feedback report.
import { type FormEvent, useState } from 'react'
import type { FormValues, Who } from '../lib/feedback'
import { CATEGORIES, SOURCES, entryFields } from '../lib/feedback'
import { dayLabel } from '../lib/payroll'
import type { Feedback } from '../types'
import Spinner from './Spinner'

const muted = 'text-ink-muted'
const line = 'border-hairline'
const small = `rounded-lg border bg-surface-raised px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`
const field = `rounded-lg border bg-surface-raised px-2 py-1 ${line}`

interface FormProps {
  type: Feedback['type']
  title: string
  /** People who can be ticked, and which start ticked. */
  cleaners: Who[]
  ticked: string[]
  initial?: Partial<FormValues>
  /** Given when the entry is not tied to a visit, so the client and day are typed in. */
  pick?: { clients: string[]; date: string }
  saveLabel?: string
  onSave: (values: FormValues) => Promise<void>
  onCancel: () => void
}

export function FeedbackForm(p: FormProps) {
  const [text, setText] = useState(p.initial?.text ?? '')
  const [source, setSource] = useState(p.initial?.source ?? SOURCES[0])
  const [category, setCategory] = useState(p.initial?.category ?? CATEGORIES[0])
  const [status, setStatus] = useState<'open' | 'resolved'>(p.initial?.status ?? 'open')
  const [resolution, setResolution] = useState(p.initial?.resolution ?? '')
  const [ticked, setTicked] = useState(() => new Set(p.ticked))
  const [clientName, setClientName] = useState(p.initial?.clientName ?? '')
  const [date, setDate] = useState(p.pick?.date ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const complaint = p.type === 'complaint'
  const ready = text.trim().length > 0 && (!p.pick || (clientName.trim().length > 0 && !!date))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    setError(null)
    p.onSave({ text, source, category, status, resolution, cleaners: p.cleaners.filter((c) => ticked.has(c.id)), clientName, date }).catch(
      (err: unknown) => {
        setError(err instanceof Error ? err.message : 'It could not be saved.')
        setBusy(false)
      },
    )
  }

  return (
    <form
      aria-label={p.title}
      onSubmit={submit}
      className={`flex flex-col gap-3 border-b px-4 py-3 text-sm ${complaint ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'} ${line}`}
    >
      <span className="font-semibold">{p.title}</span>
      {p.pick && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <label className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
            Client
            <input
              className={field}
              list="feedback-clients"
              required
              maxLength={200}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <datalist id="feedback-clients">
              {p.pick.clients.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-0.5">
            Date
            <input className={field} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
      )}
      <fieldset>
        <legend className="mb-1">{complaint ? 'Who is it about?' : 'Who earned it?'}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {p.cleaners.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={ticked.has(c.id)}
                onChange={(e) => {
                  const next = new Set(ticked)
                  if (e.target.checked) next.add(c.id)
                  else next.delete(c.id)
                  setTicked(next)
                }}
              />
              {c.name}
            </label>
          ))}
          {p.cleaners.length === 0 && <span className={muted}>No cleaners to choose from.</span>}
        </div>
      </fieldset>
      <label className="flex flex-col gap-0.5">
        What the client said
        <textarea className={`${field} min-h-16`} required maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex flex-col gap-0.5">
          How it came in
          <select className={field} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          Category
          <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {complaint && (
          <label className="flex flex-col gap-0.5">
            Follow-up
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value as 'open' | 'resolved')}>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        )}
      </div>
      {complaint && (
        <label className="flex flex-col gap-0.5">
          What was done about it <span className={muted}>(optional)</span>
          <textarea className={field} maxLength={2000} value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </label>
      )}
      {error && (
        <p role="alert" className="text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" className={`font-semibold ${small}`} disabled={busy || !ready}>
          {busy ? 'Saving…' : (p.saveLabel ?? `Save ${p.type}`)}
        </button>
        <button type="button" className={small} disabled={busy} onClick={p.onCancel}>
          Cancel
        </button>
        {busy && <Spinner className="size-4" />}
      </div>
    </form>
  )
}

interface ItemProps {
  entry: Feedback
  /** Extra people who can be ticked when editing (the entry's own cleaners always can). */
  people?: Who[]
  /** Leave out to show the entry without the client line, e.g. under its own visit. */
  showClient?: boolean
  send: (payload: Record<string, unknown>) => Promise<void>
}

export function FeedbackItem({ entry: e, people = [], showClient = true, send }: ItemProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'remove'>('view')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const complaint = e.type === 'complaint'
  const act = (payload: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    return send(payload)
      .then(() => setMode('view'))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'It could not be saved.'))
      .finally(() => setBusy(false))
  }

  if (mode === 'edit') {
    const choices = [...new Map([...e.cleaners, ...people].map((c) => [c.id, c])).values()]
    return (
      <li>
        <FeedbackForm
          type={e.type}
          title={`Edit ${e.type}: ${e.clientName}, ${dayLabel(e.date)}`}
          cleaners={choices}
          ticked={e.cleaners.map((c) => c.id)}
          initial={{ text: e.text, source: e.source, category: e.category, status: e.status ?? 'open', resolution: e.resolution ?? '' }}
          saveLabel="Save changes"
          onCancel={() => setMode('view')}
          onSave={(v) => send({ action: 'update', id: e.id, ...entryFields(e.type, v) }).then(() => setMode('view'))}
        />
      </li>
    )
  }

  return (
    // an open complaint needs action: the red stripe (decision 0043); everything else is a plain row
    <li
      className={`border-b border-l-4 px-4 py-3 last:border-b-0 ${line} ${complaint && e.status !== 'resolved' ? 'border-l-red-600' : 'border-l-transparent'}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] uppercase ${
            complaint
              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
          }`}
        >
          {complaint ? 'Complaint' : 'Kudos'}
        </span>
        <span className="font-semibold tabular-nums">{dayLabel(e.date)}</span>
        {showClient && (
          <span className="font-semibold">
            {e.clientName}
            {e.siteName && <span className={`font-normal ${muted}`}> · {e.siteName}</span>}
          </span>
        )}
        <span>{e.cleaners.length ? e.cleaners.map((c) => c.name).join(', ') : <span className={muted}>no cleaner named</span>}</span>
        {complaint && (
          <span className={`ml-auto text-sm font-semibold ${e.status === 'resolved' ? muted : 'text-red-700 dark:text-red-400'}`}>
            {e.status === 'resolved' ? 'Resolved' : 'Open'}
          </span>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap">“{e.text}”</p>
      {e.resolution && <p className={`mt-1 text-sm whitespace-pre-wrap ${muted}`}>Follow-up: {e.resolution}</p>}
      <p className={`mt-1 text-xs ${muted}`}>
        {e.source} · {e.category} · {e.visitStart ? 'recorded on a visit' : 'not tied to a visit'} · by {e.createdBy}
        {e.updatedBy && ` · edited by ${e.updatedBy}`}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 print:hidden">
        {mode === 'remove' ? (
          <>
            <span className="text-sm">Remove this entry? It will no longer be listed or counted.</span>
            <button className={`font-semibold ${small}`} disabled={busy} onClick={() => act({ action: 'remove', id: e.id })}>
              Yes, remove
            </button>
            <button className={small} disabled={busy} onClick={() => setMode('view')}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className={small} disabled={busy} onClick={() => setMode('edit')}>
              Edit
            </button>
            {complaint && (
              <button
                className={small}
                disabled={busy}
                onClick={() => act({ action: 'update', id: e.id, status: e.status === 'resolved' ? 'open' : 'resolved' })}
              >
                {e.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
              </button>
            )}
            <button className={small} disabled={busy} onClick={() => setMode('remove')}>
              Remove
            </button>
          </>
        )}
        {busy && <Spinner className="size-4" />}
      </div>
    </li>
  )
}
