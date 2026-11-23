// Changing timesheets from the Payroll hours report: the confirm step and the change log.
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ActionResult, ChangeEntry } from '../api'
import { isSignInError, timesheetAction } from '../api'
import type { Entry } from '../lib/payroll'
import { dayLabel, exact, zonedIso } from '../lib/payroll'
import { workPlacesQuery } from '../lib/queries'
import { formatTime } from '../lib/schedule'
import { TZ, addDays } from '../lib/week'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

/** A change waiting for its "are you sure?" step. */
export type Pending =
  | { action: 'approve' | 'reject'; entries: Entry[] }
  | { action: 'update'; entry: Entry; from: string; to: string }
  | {
      action: 'create'
      employeeId: string
      employeeName: string
      from: string
      to: string
      groupId: string | null
      groupName: string | null
      /** Where the entry was worked; billing places it by these. Both optional. */
      client: Position | null
      site: Position | null
    }

const muted = 'text-ink-muted'
const line = 'border-hairline'
const small = `rounded-lg border px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`
const local = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))

const span = (from: string, to: string | null, tz = TZ) => `${formatTime(from, tz)} – ${to ? formatTime(to, tz) : 'no clock-out'}`
const minutesBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 60_000)

/** How a pending change reads in the confirm step, and what is sent for it. */
function describe(p: Pending) {
  if (p.action === 'update') {
    const s = p.entry.sheet
    return {
      title: 'Change the times on this entry in Camelo?',
      yes: 'Yes, change',
      done: 'changed',
      lines: [
        `${dayLabel(local(s.from))} · ${s.employee?.name ?? 'No employee'} · ${s.state.toLowerCase()}`,
        `Now: ${span(s.from, s.to, s.timezone || TZ)} (${exact(p.entry.minutes)})`,
        `New: ${span(p.from, p.to)} (${exact(minutesBetween(p.from, p.to))})`,
      ],
      note: p.entry.approved ? 'This entry is approved, so the new times count toward pay as soon as you confirm.' : null,
      payload: { action: 'update', timesheetId: s.id, from: p.from, to: p.to },
    }
  }
  if (p.action === 'create') {
    const at = [p.client?.name, p.site?.name].filter(Boolean).join(', ')
    return {
      title: `Add this entry for ${p.employeeName} in Camelo?`,
      yes: 'Yes, add',
      done: 'added',
      lines: [
        `${dayLabel(local(p.from))} · ${span(p.from, p.to)} (${exact(minutesBetween(p.from, p.to))})${p.groupName ? ` · ${p.groupName}` : ''}`,
        at ? `At ${at}` : 'No client or job site, so it is not billed to anyone',
      ],
      note: 'It is added as a draft. It shows in red and does not count toward pay until it is approved.',
      payload: {
        action: 'create',
        employeeId: p.employeeId,
        from: p.from,
        to: p.to,
        groupId: p.groupId,
        clientId: p.client?.id ?? null,
        jobSiteId: p.site?.id ?? null,
      },
    }
  }
  const verb = p.action === 'approve' ? 'Approve' : 'Reject'
  const to = p.action === 'approve' ? 'approved' : 'rejected'
  const minutes = p.entries.reduce((n, e) => n + e.minutes, 0)
  return {
    key: `${p.action}-${p.entries.map((e) => e.sheet.id).join()}`,
    title: `${verb} ${p.entries.length === 1 ? 'this entry' : `these ${p.entries.length} entries`} in Camelo? (${exact(minutes)} in total)`,
    yes: `Yes, ${verb.toLowerCase()}`,
    done: to,
    lines: p.entries.map(
      (e) =>
        `${dayLabel(local(e.sheet.from))} · ${span(e.sheet.from, e.sheet.to, e.sheet.timezone || TZ)} · ${e.sheet.employee?.name ?? 'No employee'} · ${exact(e.minutes)} · ${e.sheet.state.toLowerCase()} → ${to}`,
    ),
    note: p.action === 'approve' ? 'Approved time counts toward pay. Camelo has no way to un-approve an entry afterwards.' : null,
    payload: { action: p.action, timesheetIds: p.entries.map((e) => e.sheet.id) },
  }
}

/** Shows exactly what will change, then does it and reports back entry by entry. */
/** `onResults` hears Camelo's answer as soon as it arrives, before Done is chosen. */
export function Confirm(p: {
  pending: Pending
  editor: Editor
  onDone: (changed: boolean) => void
  onResults?: (results: ActionResult[]) => void
  onExpired: (message: string) => void
}) {
  const d = describe(p.pending)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<ActionResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const go = () => {
    setBusy(true)
    setError(null)
    timesheetAction<{ results: ActionResult[] }>(d.payload, p.editor.token)
      .then((r) => {
        setResults(r.results)
        p.onResults?.(r.results)
      })
      .catch((e: unknown) => {
        if (isSignInError(e))
          return p.onExpired(e.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to make changes.' : e.message)
        setError(e instanceof Error ? e.message : 'The change could not be made.')
      })
      .finally(() => setBusy(false))
  }

  const failed = results?.filter((r) => !r.ok) ?? []
  return (
    <div
      role="dialog"
      aria-label="Confirm change"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40"
    >
      {results ? (
        <>
          <p className="font-semibold">
            {results.length - failed.length} of {results.length} {d.done} in Camelo.
          </p>
          {failed.map((r) => (
            <p key={r.id} className="text-sm text-red-700 dark:text-red-400">
              Not changed: {r.message}
            </p>
          ))}
          <button className={`mt-2 bg-surface-raised ${small}`} onClick={() => p.onDone(failed.length < results.length)}>
            Done
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold">{d.title}</p>
          <ul className="my-2 text-sm">
            {d.lines.map((l) => (
              <li key={l} className="tabular-nums">
                {l}
              </li>
            ))}
          </ul>
          {d.note && <p className={`text-sm ${muted}`}>{d.note}</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button className={`bg-surface-raised font-semibold ${small}`} disabled={busy} onClick={go}>
              {busy ? 'Working…' : d.yes}
            </button>
            <button className={`bg-surface-raised ${small}`} disabled={busy} onClick={() => p.onDone(false)}>
              Cancel
            </button>
            {busy && <Spinner className="size-4" />}
          </div>
        </>
      )}
    </div>
  )
}

export interface Position {
  id: string
  name: string
}

interface TimesFormProps {
  title: string
  /** The day the entry starts on; with `days`, the person can pick another. */
  date: string
  days?: string[]
  start: string
  end: string
  /** Offered when adding an entry. */
  positions?: Position[]
  /** The position to start on, e.g. the scheduled shift's. */
  positionId?: string
  /** When given, the person must also choose who the entry is for. */
  employees?: Position[]
  /** When given, a client and job site can be chosen (both optional), starting on these. */
  places?: { token: string; client?: Position | null; site?: Position | null }
  onReview: (times: {
    from: string
    to: string
    position: Position | null
    employee: Position | null
    client: Position | null
    site: Position | null
  }) => void
  onCancel: () => void
}

/** Start and end times for an entry. An end at or before the start means the next day. */
export function TimesForm(p: TimesFormProps) {
  const [date, setDate] = useState(p.date)
  const [start, setStart] = useState(p.start)
  const [end, setEnd] = useState(p.end)
  const [positionId, setPositionId] = useState(p.positionId ?? '')
  const [employeeId, setEmployeeId] = useState('')
  const employee = p.employees?.find((x) => x.id === employeeId) ?? null
  const [clientId, setClientId] = useState(p.places?.client?.id ?? '')
  const [siteId, setSiteId] = useState(p.places?.site?.id ?? '')
  const places = useQuery({ ...workPlacesQuery(p.places?.token ?? ''), enabled: !!p.places })
  // A chosen client narrows the sites to its own; a site chosen first brings its client with it.
  // The chosen site stays listed even when Camelo files it under no client, or another one.
  const sites = (places.data?.sites ?? []).filter((s) => !clientId || s.clientId === clientId || s.id === siteId)
  const pickClient = (id: string) => {
    setClientId(id)
    if (id && places.data?.sites.find((s) => s.id === siteId)?.clientId !== id) setSiteId('')
  }
  const pickSite = (id: string) => {
    setSiteId(id)
    const owner = places.data?.sites.find((s) => s.id === id)?.clientId
    if (id && owner && !clientId) setClientId(owner)
  }
  // Names from the list, else the ones it started on (the list may still be loading).
  const named = (id: string, list: Position[] | undefined, start: Position | null | undefined) =>
    id ? (list?.find((x) => x.id === id) ?? (start?.id === id ? start : { id, name: 'Unnamed' })) : null
  const overnight = !!start && !!end && end <= start
  const from = start ? zonedIso(date, start) : null
  const to = end ? zonedIso(overnight ? addDays(date, 1) : date, end) : null
  const minutes = from && to ? minutesBetween(from, to) : 0
  const ready = !!from && !!to && (!p.employees || !!employee)
  const field = `rounded-lg border bg-surface-raised px-2 py-1 ${line}`
  return (
    <form
      aria-label={p.title}
      className={`flex flex-wrap items-end gap-x-4 gap-y-2 border-b bg-surface-sunken/40 px-4 py-3 text-sm dark:bg-surface-sunken/50 ${line}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (from && to && minutes >= 1 && ready)
          p.onReview({
            from,
            to,
            position: p.positions?.find((x) => x.id === positionId) ?? null,
            employee,
            client: named(clientId, places.data?.clients, p.places?.client),
            site: named(siteId, places.data?.sites, p.places?.site),
          })
      }}
    >
      <span className="basis-full font-semibold">{p.title}</span>
      {p.employees && (
        <label className="flex flex-col gap-0.5">
          Employee
          <select className={field} required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Choose…</option>
            {p.employees.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {p.days && (
        <label className="flex flex-col gap-0.5">
          Day
          <select className={field} value={date} onChange={(e) => setDate(e.target.value)}>
            {p.days.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-0.5">
        Start
        <input className={field} type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label className="flex flex-col gap-0.5">
        End
        <input className={field} type="time" required value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      {p.positions && p.positions.length > 0 && (
        <label className="flex flex-col gap-0.5">
          Position
          <select className={field} value={positionId} onChange={(e) => setPositionId(e.target.value)}>
            <option value="">None</option>
            {p.positions.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {p.places && (
        <>
          <label className="flex flex-col gap-0.5">
            Client
            <select className={`max-w-56 ${field}`} value={clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">None</option>
              {p.places.client && !places.data?.clients.some((x) => x.id === p.places?.client?.id) && (
                <option value={p.places.client.id}>{p.places.client.name}</option>
              )}
              {places.data?.clients.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            Job site
            <select className={`max-w-56 ${field}`} value={siteId} onChange={(e) => pickSite(e.target.value)}>
              <option value="">None</option>
              {p.places.site && !places.data?.sites.some((x) => x.id === p.places?.site?.id) && (
                <option value={p.places.site.id}>{p.places.site.name}</option>
              )}
              {sites.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          {places.isPending && <span className={`pb-1.5 ${muted}`}>Loading clients…</span>}
          {places.isError && <span className={`pb-1.5 ${muted}`}>The client list could not be loaded.</span>}
        </>
      )}
      <span className={`pb-1.5 tabular-nums ${muted}`}>
        {from && to ? exact(minutes) : 'Enter both times'}
        {overnight && ' · ends the next day'}
      </span>
      <span className="ml-auto flex gap-2">
        <button type="submit" className={`bg-surface-raised font-semibold ${small}`} disabled={!ready}>
          Review
        </button>
        <button type="button" className={`bg-surface-raised ${small}`} onClick={p.onCancel}>
          Cancel
        </button>
      </span>
    </form>
  )
}

/** What a successful change did, in words. */
function outcome(e: ChangeEntry): string {
  const times = (x: ChangeEntry['after']) => (x?.from ? span(x.from, x.to ?? null) : '?')
  if (e.action === 'update') return `${times(e.before)} → ${times(e.after)}`
  if (e.action === 'create') {
    const at = [e.after?.client, e.after?.jobSite].filter(Boolean).join(', ')
    return `added ${times(e.after)} as ${e.after?.state?.toLowerCase() ?? 'draft'}${at ? ` at ${at}` : ''}`
  }
  return `${e.before?.state?.toLowerCase()} → ${e.after?.state?.toLowerCase()}`
}

/** The changes made from this site to entries in the pay period on screen. */
export function ChangeLog(p: { periodStart: string; editor: Editor; version: number; onExpired: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChangeEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { periodStart, editor, version, onExpired } = p

  useEffect(() => {
    if (!open) return
    let live = true
    timesheetAction<{ entries: ChangeEntry[] }>({ action: 'log', periodStart }, editor.token)
      .then((r) => live && (setEntries(r.entries), setError(null)))
      .catch((e: unknown) => {
        if (!live) return
        if (isSignInError(e)) return onExpired('Your Google sign-in has expired. Sign in again to make changes.')
        setError(e instanceof Error ? e.message : 'The change log could not be loaded.')
      })
    return () => {
      live = false
    }
  }, [open, periodStart, editor.token, version, onExpired])

  return (
    <section className={`mt-4 rounded-xl border bg-surface-raised print:hidden ${line}`}>
      <button
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span> Changes made from this site in this pay period
      </button>
      {open && (
        <div className={`border-t px-4 py-2 text-sm ${line}`}>
          {error && <p className="text-red-700 dark:text-red-400">{error}</p>}
          {!entries && !error && <Spinner className="size-4" />}
          {entries?.length === 0 && <p className={muted}>No changes yet.</p>}
          <ul>
            {entries?.map((e, i) => (
              <li key={i} className={`border-b py-1.5 last:border-b-0 ${line}`}>
                <span className="tabular-nums">
                  {new Date(e.at).toLocaleString('en-US', {
                    timeZone: TZ,
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>{' '}
                · <b>{e.email}</b> · {e.action} · {e.employee ?? 'unknown employee'}
                {e.sheetFrom && ` · ${dayLabel(local(e.sheetFrom))} ${formatTime(e.sheetFrom, TZ)}`} ·{' '}
                {e.ok ? <span>{outcome(e)}</span> : <span className="text-red-700 dark:text-red-400">not changed: {e.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
