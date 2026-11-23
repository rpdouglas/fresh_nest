import { useQuery } from '@tanstack/react-query'
import { type FormEvent, Fragment, useEffect, useMemo, useState } from 'react'
import { isSignInError, timesheetAction } from '../api'
import type { ActionResult } from '../api'
import type { Entry } from '../lib/payroll'
import { dayLabel, localParts } from '../lib/payroll'
import { groupVisitPhotos } from '../lib/photos'
import { visitPhotosQuery } from '../lib/queries'
import type { ReviewRow } from '../lib/review'
import { buildReview, decimal, localDay, scheduledMinutes, signed } from '../lib/review'
import { formatTime, notOnCall } from '../lib/schedule'
import { TZ, addDays } from '../lib/week'
import type { ReviewResponse, ReviewShift } from '../types'
import AnyEmployeeForm from './AnyEmployeeForm'
import ApprovalPanel from './ApprovalPanel'
import type { Pending, Position } from './PayrollEditor'
import { Confirm, TimesForm } from './PayrollEditor'
import { type PhotosOnPage, PhotosContext } from './photosContext'
import Spinner from './Spinner'
import type { Editor } from './useEditor'
import VisitPhotos from './VisitPhotos'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const bad = 'text-red-700 dark:text-red-400'
const act = `rounded-lg border bg-surface-raised px-2 py-0.5 text-sm hover:border-accent disabled:opacity-50 ${line}`
/** A shift's client or job site, as the add form's pickers start on it. */
const placeOf = (x: { id?: string | null; name?: string | null } | null | undefined) =>
  x?.id ? { id: x.id, name: x.name || 'Unnamed' } : null
const span = (from: string, to: string | null, tz: string | null) =>
  `${formatTime(from, tz || TZ)} – ${to ? formatTime(to, tz || TZ) : 'no clock-out'}`

interface Note {
  id: string
  content: string
  createdAt: string
  author: string | null
}

interface Props {
  periodStart: string
  data: ReviewResponse
  /** When the data was loaded; a shift counts as missing a timesheet only once it has ended. */
  loadedAt: number
  editor: Editor | null
  expire: (message: string) => void
  /** Called after a change so the period is fetched again. */
  onChanged: () => void
  /** An approval or rejection Camelo has confirmed, to show before anything is reloaded. */
  onApplied: (results: ActionResult[]) => void
}

/** What is open below the table or under a row, before its confirm step. */
type Form = { kind: 'edit'; row: ReviewRow } | { kind: 'create'; shift: ReviewShift } | { kind: 'anyone' } | { kind: 'note'; id: string }

function NoteForm({ onSave, onCancel }: { onSave: (text: string) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    onSave(text).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'The note could not be saved.')
      setBusy(false)
    })
  }
  return (
    <form aria-label="Add a note" onSubmit={submit} className="mt-2 flex flex-col gap-2 text-sm">
      <label className="flex flex-col gap-0.5">
        Note <span className={muted}>(saved on the timesheet in Camelo, with your email address)</span>
        <textarea
          className={`rounded-lg border bg-surface-raised px-2 py-1 ${line}`}
          required
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className={bad}>
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" className={`font-semibold ${act}`} disabled={busy || !text.trim()}>
          {busy ? 'Saving…' : 'Save note'}
        </button>
        <button type="button" className={act} disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        {busy && <Spinner className="size-4" />}
      </div>
    </form>
  )
}

export default function ReviewView({ periodStart, data, loadedAt, editor, expire, onChanged, onApplied }: Props) {
  const review = useMemo(() => buildReview(data, loadedAt), [data, loadedAt])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Pending | null>(null)
  const [asked, setAsked] = useState(0)
  const [form, setForm] = useState<Form | null>(null)
  const [notes, setNotes] = useState<Record<string, Note[]>>({})
  const [notesVersion, setNotesVersion] = useState(0)
  const token = editor?.token
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(periodStart, i)), [periodStart])
  const positions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const x of [...data.timesheets, ...data.shifts]) if (x.group?.id && x.group.name) seen.set(x.group.id, x.group.name)
    return [...seen.entries()].map(([id, name]): Position => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // Notes are fetched only for timesheets Camelo says have comments, and only for editors.
  const withComments = useMemo(() => review.rows.filter((r) => (r.sheet.comments ?? 0) > 0).map((r) => r.sheet.id), [review])
  useEffect(() => {
    if (!token || withComments.length === 0) return
    let live = true
    timesheetAction<{ comments: Record<string, Note[]> }>({ action: 'comments', timesheetIds: withComments.slice(0, 100) }, token)
      .then((r) => live && setNotes(r.comments))
      .catch((e: unknown) => {
        if (live && isSignInError(e)) expire('Your Google sign-in has expired. Sign in again to make changes.')
      })
    return () => {
      live = false
    }
  }, [token, withComments, notesVersion, expire])

  // The confirm step and the forms open above the table, so bring them into view.
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const ask = (next: Pending) => {
    toTop()
    setForm(null)
    setAsked((n) => n + 1)
    setPending(next)
  }
  const entryOf = (r: ReviewRow): Entry => ({ sheet: r.sheet, minutes: r.actualMinutes, approved: false, flags: [] })
  const chosen = review.rows.filter((r) => selected.has(r.sheet.id) && r.sheet.state !== 'PROCESSED')
  const columns = editor ? 9 : 8

  const saveNote = async (id: string, text: string) => {
    if (!token) return
    try {
      const r = await timesheetAction<{ results: ActionResult[] }>({ action: 'comment', timesheetId: id, content: text }, token)
      if (!r.results[0]?.ok) throw new Error(r.results[0]?.message ?? 'The note could not be saved.')
      setForm(null)
      setNotesVersion((n) => n + 1)
      onChanged()
    } catch (e) {
      if (isSignInError(e)) expire('Your Google sign-in has expired. Sign in again to make changes.')
      throw e
    }
  }

  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  const th = `border-b px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const td = `px-3 py-2 align-top`
  const num = `${td} text-right tabular-nums`

  const allShifts = useMemo(() => [...data.shifts, ...data.otherShifts].filter(notOnCall), [data.shifts, data.otherShifts])
  const shiftIds = useMemo(
    () => [...new Set(allShifts.flatMap((s) => [s.id, ...(s.shiftPartners ?? []).map((p) => p.id)]))].slice(0, 300),
    [allShifts],
  )
  const photosQ = useQuery({ ...visitPhotosQuery(shiftIds, token ?? ''), enabled: !!token && shiftIds.length > 0 })
  const photos = useMemo(
    (): PhotosOnPage => ({
      token: token ?? '',
      byVisit: groupVisitPhotos(allShifts, photosQ.data ?? []),
      loading: photosQ.isLoading,
      onExpired: expire,
      canAdd: false,
    }),
    [token, allShifts, photosQ.data, photosQ.isLoading, expire],
  )

  return (
    <PhotosContext.Provider value={photos}>
      <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
        <div className={box}>
          <b className={`block text-xl tabular-nums ${review.rows.length ? bad : ''}`}>{review.rows.length}</b>
          <span className={`text-xs ${muted}`}>waiting for approval</span>
        </div>
        <div className={box}>
          <b className="block text-xl tabular-nums">{decimal(review.waitingMinutes)}</b>
          <span className={`text-xs ${muted}`}>hours waiting</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${review.offCount ? 'text-amber-700 dark:text-amber-400' : ''}`}>{review.offCount}</b>
          <span className={`text-xs ${muted}`}>more than 15 min off schedule</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${review.missing.length ? 'text-amber-700 dark:text-amber-400' : ''}`}>
            {review.missing.length}
          </b>
          <span className={`text-xs ${muted}`}>scheduled, no timesheet</span>
        </div>
        {review.incompleteCount > 0 && (
          <div className={box}>
            <b className="block text-xl text-amber-700 tabular-nums dark:text-amber-400">{review.incompleteCount}</b>
            <span className={`text-xs ${muted}`}>incomplete {review.incompleteCount === 1 ? 'checklist' : 'checklists'}</span>
          </div>
        )}
        {editor && (
          <div className="ml-auto flex flex-wrap items-center gap-2 self-center print:hidden">
            <button
              className={`px-3 py-2 ${act}`}
              disabled={chosen.length === 0}
              onClick={() => ask({ action: 'approve', entries: chosen.map(entryOf) })}
            >
              Approve {chosen.length || ''} selected
            </button>
            <button className={`px-3 py-2 ${act}`} onClick={() => (setPending(null), setForm({ kind: 'anyone' }))}>
              Add a timesheet for any employee
            </button>
          </div>
        )}
      </div>

      {editor && (pending || form?.kind === 'anyone' || form?.kind === 'create' || form?.kind === 'edit') && (
        <section aria-label="Change" className={`mb-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}>
          {pending && (
            <Confirm
              key={asked}
              pending={pending}
              editor={editor}

              onExpired={(message) => {
                setPending(null)
                expire(message)
              }}
              onResults={(results) => {
                // the approved rows leave the page now; their ticks go with them
                const done = new Set(results.filter((r) => r.ok).map((r) => r.id))
                setSelected((s) => new Set([...s].filter((id) => !done.has(id))))
                onApplied(results)
              }}
              onDone={(changed) => {
                setPending(null)
                if (changed) {
                  setSelected(new Set())
                  onChanged()
                }
              }}
            />
          )}
          {form?.kind === 'anyone' && (
            <AnyEmployeeForm
              editor={editor}
              days={days}
              positions={positions}
              title="Add a timesheet for any employee (no scheduled shift needed)"
              onExpired={expire}
              onCancel={() => setForm(null)}
              onReview={ask}
            />
          )}
          {form?.kind === 'create' && (
            <TimesForm
              key={form.shift.id}
              title={`Create a timesheet for ${form.shift.assignee?.name ?? 'this shift'}: ${form.shift.client?.name || form.shift.jobSite?.name || 'shift'}, ${dayLabel(localDay(form.shift.startTime, form.shift.timezone))}`}
              date={localParts(form.shift.startTime, form.shift.timezone || TZ).date}
              start={localParts(form.shift.startTime, form.shift.timezone || TZ).time}
              end={localParts(form.shift.endTime, form.shift.timezone || TZ).time}
              positions={positions}
              positionId={form.shift.group?.id}
              places={{ token: editor.token, client: placeOf(form.shift.client), site: placeOf(form.shift.jobSite) }}
              onCancel={() => setForm(null)}
              onReview={({ from, to, position, client, site }) =>
                ask({
                  action: 'create',
                  employeeId: form.shift.assignee!.id,
                  employeeName: form.shift.assignee!.name || 'this employee',
                  from,
                  to,
                  groupId: position?.id ?? null,
                  groupName: position?.name ?? null,
                  client,
                  site,
                })
              }
            />
          )}
          {form?.kind === 'edit' && (
            <TimesForm
              key={form.row.sheet.id}
              title={`Edit times: ${form.row.sheet.employee?.name ?? 'timesheet'}, ${form.row.clientName}, ${dayLabel(localDay(form.row.sheet.from, form.row.sheet.timezone))}`}
              date={localParts(form.row.sheet.from, form.row.sheet.timezone || TZ).date}
              start={localParts(form.row.sheet.from, form.row.sheet.timezone || TZ).time}
              end={form.row.sheet.to ? localParts(form.row.sheet.to, form.row.sheet.timezone || TZ).time : ''}
              onCancel={() => setForm(null)}
              onReview={({ from, to }) => ask({ action: 'update', entry: entryOf(form.row), from, to })}
            />
          )}
        </section>
      )}

      {review.rows.length === 0 ? (
        <p className={`py-8 text-center ${muted}`}>Nothing is waiting for approval in this pay period.</p>
      ) : (
        // relative keeps anything positioned inside the scroll box, so it can't widen the page
        <div
          className={`stack-on-phone relative overflow-x-auto rounded-xl border bg-surface-raised print:overflow-visible print:rounded-none ${line}`}
        >
          <table className="w-full min-w-[980px] border-collapse text-[15px] print:min-w-0 print:text-[11px]">
            <thead>
              <tr>
                {editor && (
                  <th className={`${th} w-8 print:hidden`}>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={selected.size > 0 && selected.size === review.rows.length}
                      onChange={(e) => setSelected(e.target.checked ? new Set(review.rows.map((r) => r.sheet.id)) : new Set())}
                    />
                  </th>
                )}
                <th className={th}>Client / site</th>
                <th className={th}>Cleaner</th>
                <th className={th}>Scheduled</th>
                <th className={`${th} text-right`}>Sched hrs</th>
                <th className={th}>Actual</th>
                <th className={`${th} text-right`}>Actual hrs</th>
                <th className={`${th} text-right`}>Variance</th>
                <th className={th}>State</th>
              </tr>
            </thead>
            <tbody>
              {review.days.map((day) => (
                <Fragment key={day.date}>
                  <tr>
                    <th
                      colSpan={columns}
                      scope="rowgroup"
                      className={`border-b bg-surface-sunken/40 px-3 py-1.5 text-left text-sm font-semibold dark:bg-surface-sunken/50 ${line}`}
                    >
                      {dayLabel(day.date)}
                    </th>
                  </tr>
                  {day.rows.map((r) => {
                    const s = r.sheet
                    const mine = notes[s.id] ?? []
                    const locked = s.state === 'PROCESSED'
                    return (
                      <Fragment key={s.id}>
                        <tr className={selected.has(s.id) ? 'bg-surface-sunken/40' : ''}>
                          {editor && (
                            <td data-label="Select" className={`${td} print:hidden`}>
                              <input
                                type="checkbox"
                                aria-label={`Select ${s.employee?.name ?? 'timesheet'}, ${r.clientName}`}
                                disabled={locked}
                                checked={selected.has(s.id)}
                                onChange={(e) => {
                                  const next = new Set(selected)
                                  if (e.target.checked) next.add(s.id)
                                  else next.delete(s.id)
                                  setSelected(next)
                                }}
                              />
                            </td>
                          )}
                          <td data-label="Client" className={td}>
                            {/* one block, so it stays together as one value in the phone layout */}
                            <div>
                              <span className="font-semibold">{r.clientName}</span>
                              {r.siteName && <span className={`block text-sm ${muted}`}>{r.siteName}</span>}
                              {r.incompleteChecklists.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1.5" aria-label="Incomplete checklists">
                                  {r.incompleteChecklists.map((c) => (
                                    <span
                                      key={c.name}
                                      data-testid="checklist-warning"
                                      className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-[#fdf0e3] px-2 py-0.5 text-xs font-semibold text-[#8a4208] dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                    >
                                      <span aria-hidden="true">⚠️</span>
                                      <span>{c.name}</span>
                                      <span className="tabular-nums">
                                        ({c.completionPercentage != null ? `${c.completionPercentage}%` : 'incomplete'})
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td data-label="Cleaner" className={td}>
                            {s.employee?.name ?? <span className={muted}>No employee</span>}
                          </td>
                          <td data-label="Scheduled" className={`${td} tabular-nums`}>
                            <div>
                              {r.shift ? (
                                span(r.shift.startTime, r.shift.endTime, r.shift.timezone)
                              ) : (
                                <span className={muted}>No shift found</span>
                              )}
                              {r.match === 'overlap' && <span className={`block text-xs ${muted}`}>matched by time</span>}
                            </div>
                          </td>
                          <td data-label="Sched hrs" className={num}>
                            {r.scheduledMinutes === null ? <span className={muted}>–</span> : decimal(r.scheduledMinutes)}
                          </td>
                          <td data-label="Actual" className={`${td} tabular-nums`}>
                            {span(s.from, s.to, s.timezone)}
                          </td>
                          <td data-label="Actual hrs" className={num}>
                            {decimal(r.actualMinutes)}
                          </td>
                          <td data-label="Variance" className={`${num} ${r.off ? 'font-bold text-amber-700 dark:text-amber-400' : ''}`}>
                            {r.variance === null ? <span className={muted}>–</span> : signed(r.variance)}
                            {r.off && <span className="sr-only"> more than 15 minutes off</span>}
                          </td>
                          <td data-label="State" className={`${td} text-sm font-semibold ${bad}`}>
                            {s.state.replace(/_/g, ' ').toLowerCase()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={columns} className={`border-b px-3 pb-2.5 ${line}`}>
                            {mine.map((n) => (
                              <p key={n.id} className="mb-1 text-sm whitespace-pre-wrap">
                                <span className={`font-semibold ${muted}`}>Note</span> {n.content}
                                <span className={`block text-xs ${muted}`}>
                                  {new Date(n.createdAt).toLocaleString('en-US', {
                                    timeZone: TZ,
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                  {n.author && ` · posted in Camelo as ${n.author}`}
                                </span>
                              </p>
                            ))}
                            {r.shift && <VisitPhotos visitId={r.shift.id} />}
                            {editor && !locked && (
                              <div className="flex flex-wrap justify-end gap-2 print:hidden">
                                <button className={act} onClick={() => ask({ action: 'approve', entries: [entryOf(r)] })}>
                                  Approve
                                </button>
                                {s.state !== 'REJECTED' && (
                                  <button className={act} onClick={() => ask({ action: 'reject', entries: [entryOf(r)] })}>
                                    Deny
                                  </button>
                                )}
                                <button className={act} onClick={() => (setPending(null), setForm({ kind: 'edit', row: r }), toTop())}>
                                  Edit times
                                </button>
                                <button className={act} onClick={() => (setPending(null), setForm({ kind: 'note', id: s.id }))}>
                                  Note
                                </button>
                              </div>
                            )}
                            {editor && form?.kind === 'note' && form.id === s.id && (
                              <NoteForm onCancel={() => setForm(null)} onSave={(text) => saveNote(s.id, text)} />
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={`mt-3 text-sm ${muted}`}>
        Variance is actual hours minus scheduled hours, from exact minutes.{' '}
        <span className="font-semibold text-amber-700 dark:text-amber-400">Bold amber</span> is more than 15 minutes either way. Approved
        timesheets are not listed here; see Payroll hours for those.
      </p>

      <h2 className="mt-8 mb-2 font-display text-lg font-bold">Scheduled but no timesheet</h2>
      {review.missing.length === 0 ? (
        <p className={`text-sm ${muted}`}>Every finished shift in this pay period has a timesheet.</p>
      ) : (
        <div className={`relative overflow-x-auto rounded-xl border bg-surface-raised print:overflow-visible ${line}`}>
          <table className="w-full min-w-[720px] border-collapse text-[15px] print:min-w-0 print:text-[11px]">
            <thead>
              <tr>
                <th className={th}>Day</th>
                <th className={th}>Client / site</th>
                <th className={th}>Cleaner</th>
                <th className={th}>Scheduled</th>
                <th className={`${th} text-right`}>Sched hrs</th>
                {editor && (
                  <th className={`${th} print:hidden`}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {review.missing.map((s) => {
                const name = s.client?.name || s.jobSite?.name || 'No client'
                return (
                  <tr key={s.id}>
                    <td className={`${td} border-b ${line}`}>{dayLabel(localDay(s.startTime, s.timezone))}</td>
                    <td className={`${td} border-b ${line}`}>
                      <span className="font-semibold">{name}</span>
                      {s.jobSite?.name && s.jobSite.name.trim().toLowerCase() !== name.trim().toLowerCase() && (
                        <span className={`block text-sm ${muted}`}>{s.jobSite.name}</span>
                      )}
                      <VisitPhotos visitId={s.id} />
                    </td>
                    <td className={`${td} border-b ${line}`}>{s.assignee?.name}</td>
                    <td className={`${td} border-b tabular-nums ${line}`}>
                      {span(s.startTime, s.endTime, s.timezone)}
                      {s.state && <span className={`block text-xs ${muted}`}>shift marked {s.state.replace(/_/g, ' ').toLowerCase()}</span>}
                    </td>
                    <td className={`${num} border-b ${line}`}>{decimal(scheduledMinutes(s))}</td>
                    {editor && (
                      <td className={`${td} border-b text-right print:hidden ${line}`}>
                        <button className={act} onClick={() => (setPending(null), setForm({ kind: 'create', shift: s }), toTop())}>
                          Create timesheet
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <ApprovalPanel timesheets={data.timesheets} now={loadedAt} />
    </PhotosContext.Provider>
  )
}
