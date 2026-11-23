import { type ReactNode, useMemo, useState } from 'react'
import type { ActionResult } from '../api'
import type { Cell, Entry, Payroll, Row } from '../lib/payroll'
import { FLAG_TEXT, buildPayroll, dayLabel, exact, hours, localParts, payrollCsv } from '../lib/payroll'
import { download } from '../lib/download'
import type { Sort } from '../lib/sort'
import { nextSort, sortRows } from '../lib/sort'
import type { OvertimeRow } from '../lib/overtime'
import { overtime } from '../lib/overtime'
import { formatTime } from '../lib/schedule'
import { TZ } from '../lib/week'
import type { ReviewSheet, ReviewShift } from '../types'
import AnyEmployeeForm from './AnyEmployeeForm'
import type { Pending, Position } from './PayrollEditor'
import { ChangeLog, Confirm, TimesForm } from './PayrollEditor'
import { Flag, Hours } from './HoursBits'
import SortHeader from './SortHeader'
import type { Editor } from './useEditor'

const good = 'text-emerald-700 dark:text-emerald-400'
const bad = 'text-red-700 dark:text-red-400'
const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'

/** Asks for a change to some entries; undefined when the viewer may not make changes. */
type Ask = ((pending: Pending) => void) | undefined
/** Opens the form to edit an entry's times or add an entry on a day; undefined for viewers. */
type Tools = { edit: (entry: Entry) => void; add: (date: string) => void } | undefined

// Camelo can approve or reject an entry only while it is still waiting.
const canApprove = (e: Entry) => !e.approved && e.sheet.state !== 'PROCESSED'
const canReject = (e: Entry) => canApprove(e) && e.sheet.state !== 'REJECTED'
const act = `rounded-lg border px-2 py-0.5 text-sm hover:border-accent ${line}`

function EntryRow({ entry: e, ask, tools }: { entry: Entry; ask: Ask; tools: Tools }) {
  const editable = !!tools && e.sheet.state !== 'PROCESSED'
  const s = e.sheet
  const tz = s.timezone || TZ
  const where = [s.client?.name, s.jobSite?.name && s.jobSite.name !== s.client?.name ? s.jobSite.name : null].filter(Boolean).join(' · ')
  return (
    <li className={`grid gap-x-4 gap-y-0.5 border-b px-4 py-2 last:border-b-0 sm:grid-cols-[11rem_1fr_auto] ${line}`}>
      <span className="font-semibold tabular-nums">
        {formatTime(s.from, tz)} – {s.to ? formatTime(s.to, tz) : 'no clock-out'}
      </span>
      <span className="min-w-0">
        {where || <span className={muted}>No client</span>}
        {s.group?.name && <span className={`ml-2 text-sm ${muted}`}>{s.group.name}</span>}
        {e.flags.map((f) => (
          <span key={f} className="block text-sm text-amber-700 dark:text-amber-400">
            {FLAG_TEXT[f]}
          </span>
        ))}
      </span>
      <span className="flex items-baseline gap-3 sm:justify-end">
        <span className="tabular-nums">
          {exact(e.minutes)} <span className={`text-sm ${muted}`}>({e.minutes} min)</span>
        </span>
        <span className={`w-20 text-sm font-semibold ${e.approved ? good : bad}`}>{s.state.replace(/_/g, ' ').toLowerCase()}</span>
      </span>
      {(editable || (ask && canApprove(e))) && (
        <span className="flex gap-2 sm:col-span-3 sm:justify-end">
          {ask && canApprove(e) && (
            <button className={act} onClick={() => ask({ action: 'approve', entries: [e] })}>
              Approve
            </button>
          )}
          {ask && canReject(e) && (
            <button className={act} onClick={() => ask({ action: 'reject', entries: [e] })}>
              Reject
            </button>
          )}
          {editable && (
            <button className={act} onClick={() => tools.edit(e)}>
              Edit times
            </button>
          )}
        </span>
      )}
    </li>
  )
}

function DayDetail({ cell, ask, tools }: { cell: Cell; ask: Ask; tools: Tools }) {
  const waiting = cell.entries.filter(canApprove)
  return (
    <div>
      <div
        className={`flex flex-wrap items-baseline gap-x-4 border-b bg-surface-sunken/40 px-4 py-1.5 text-sm dark:bg-surface-sunken/50 ${line}`}
      >
        <span className="font-semibold">{dayLabel(cell.date)}</span>
        {cell.approvedExact > 0 && (
          <span className={good}>
            approved {exact(cell.approvedExact)} → {hours(cell.approved)} h
          </span>
        )}
        {cell.unapprovedExact > 0 && (
          <span className={bad}>
            unapproved {exact(cell.unapprovedExact)} → {hours(cell.unapproved)} h
          </span>
        )}
        <span className="ml-auto flex gap-2">
          {ask && waiting.length > 1 && (
            <button className={`bg-surface-raised ${act}`} onClick={() => ask({ action: 'approve', entries: waiting })}>
              Approve all {waiting.length} for this day
            </button>
          )}
          {tools && (
            <button className={`bg-surface-raised ${act}`} onClick={() => tools.add(cell.date)}>
              Add an entry
            </button>
          )}
        </span>
      </div>
      <ul>
        {cell.entries.map((e) => (
          <EntryRow key={e.sheet.id} entry={e} ask={ask} tools={tools} />
        ))}
      </ul>
    </div>
  )
}

function Detail({
  row,
  date,
  ask,
  tools,
  confirm,
  onClose,
}: {
  row: Row
  date: string | null
  ask: Ask
  tools: Tools
  confirm: ReactNode
  onClose: () => void
}) {
  const cells = row.cells.filter((c) => c.entries.length > 0 && (!date || c.date === date))
  const waiting = cells.flatMap((c) => c.entries).filter(canApprove)
  return (
    <section aria-label="Clock-ins" className={`mt-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}>
      <header className={`flex flex-wrap items-center gap-x-3 border-b px-4 py-3 ${line}`}>
        <h2 className="text-[17px] font-semibold text-accent dark:text-accent-dark">{row.name}</h2>
        <span className={`text-sm ${muted}`}>{date ? dayLabel(date) : 'whole period'} · clock-ins as recorded in Camelo</span>
        {ask && !date && waiting.length > 1 && (
          <button className={`ml-auto ${act}`} onClick={() => ask({ action: 'approve', entries: waiting })}>
            Approve all {waiting.length} for {row.name}
          </button>
        )}
        {tools && !date && (
          <button className={`${ask && waiting.length > 1 ? '' : 'ml-auto'} ${act}`} onClick={() => tools.add(row.cells[0].date)}>
            Add an entry
          </button>
        )}
        <button className={`text-sm underline ${!date && (tools || (ask && waiting.length > 1)) ? '' : 'ml-auto'}`} onClick={onClose}>
          Close
        </button>
      </header>
      {confirm}
      {cells.map((c) => (
        <DayDetail key={c.date} cell={c} ask={ask} tools={tools} />
      ))}
    </section>
  )
}

function Summary({ p }: { p: Payroll }) {
  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
      <div className={box}>
        <b className={`block text-xl tabular-nums ${good}`}>{hours(p.approved)}</b>
        <span className={`text-xs ${muted}`}>approved hours</span>
      </div>
      <div className={box}>
        <b className={`block text-xl tabular-nums ${p.unapproved ? bad : ''}`}>{hours(p.unapproved)}</b>
        <span className={`text-xs ${muted}`}>
          unapproved hours{p.unapprovedEntries > 0 && ` · ${p.unapprovedEntries} clock-in${p.unapprovedEntries === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className={box}>
        <b className="block text-xl tabular-nums">{p.rows.length}</b>
        <span className={`text-xs ${muted}`}>employees</span>
      </div>
      {p.flaggedEntries > 0 && (
        <div className={`${box} border-amber-400 dark:border-amber-600`}>
          <b className="block text-xl text-amber-700 tabular-nums dark:text-amber-400">{p.flaggedEntries}</b>
          <span className={`text-xs ${muted}`}>to check</span>
        </div>
      )}
      <button
        className={`ml-auto self-center rounded-lg border bg-surface-raised px-3 py-2 text-sm hover:border-accent print:hidden ${line}`}
        onClick={() => download(`payroll-hours-${p.periodStart}.csv`, payrollCsv(p))}
      >
        Download CSV
      </button>
    </div>
  )
}

const LEVEL: Record<OvertimeRow['level'], string> = {
  over: 'Over 44 hours',
  'on-course': 'On course to pass 44 hours',
  near: 'Near 44 hours',
}

/** Who is over, or heading over, 44 hours this period; nothing when nobody is near. */
function OvertimeWarning({ rows }: { rows: OvertimeRow[] }) {
  if (!rows.length) return null
  const warn = rows.some((r) => r.level !== 'near')
  return (
    <section
      aria-label="Overtime"
      className={`mb-4 rounded-xl border px-4 py-3 ${warn ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100' : `bg-surface-raised ${line}`}`}
    >
      <h2 className="font-semibold">
        Overtime: {rows.length === 1 ? '1 person is' : `${rows.length} people are`} near or past 44 hours this period
      </h2>
      <ul className="mt-1.5 flex flex-col gap-1 text-sm">
        {rows.map((r) => (
          <li key={r.key}>
            <b>{r.name}</b>: {LEVEL[r.level]} · {exact(r.worked)} worked
            {r.toCome > 0 && ` + ${exact(r.toCome)} still scheduled = ${exact(r.projected)}`}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs opacity-80">
        Ontario pays overtime after 44 hours in a work week, taken here as the Friday-to-Thursday pay period. Worked time is exact minutes
        (the grid rounds each day) and counts every entry, approved or not, but not rejected entries or leave.
      </p>
    </section>
  )
}

interface Props {
  periodStart: string
  timesheets: ReviewSheet[]
  /** The period's shifts, for the hours still to come. */
  shifts: ReviewShift[]
  loadedAt: number
  /** Called after a change so the period is fetched again. */
  onChanged: () => void
  /** An approval or rejection Camelo has confirmed, to show before anything is reloaded. */
  onApplied: (results: ActionResult[]) => void
  /** Set when someone allowed to change timesheets is signed in. */
  editor: Editor | null
  /** Call when a change is refused because the sign-in has lapsed. */
  expire: (message: string) => void
}

export default function PayrollView({ periodStart, timesheets, shifts, loadedAt, onChanged, onApplied, editor, expire }: Props) {
  const p = useMemo(() => buildPayroll(periodStart, timesheets), [periodStart, timesheets])
  const overtimeRows = useMemo(() => overtime(timesheets, shifts, loadedAt), [timesheets, shifts, loadedAt])
  const [sort, setSort] = useState<Sort<'name' | 'approved' | 'unapproved'>>({ key: 'name', dir: 'asc' })
  const rows = useMemo(() => sortRows(p.rows, (r) => (sort.key === 'name' ? r.name : r[sort.key]), sort.dir), [p.rows, sort])
  const sortBy = (key: typeof sort.key) => setSort((s) => nextSort(s, key, ['name']))
  const [open, setOpen] = useState<{ key: string; date: string | null } | null>(null)
  const openRow = open && p.rows.find((r) => r.key === open.key)
  const [pending, setPending] = useState<Pending | null>(null)
  const [changes, setChanges] = useState(0)
  // The edit or add form, before its confirm step. `n` gives each opening a fresh form.
  const [form, setForm] = useState<{ n: number; entry: Entry | null; date: string } | null>(null)
  const [asked, setAsked] = useState(0)
  const ask = (next: Pending, from: 'detail' | 'anyone' = 'detail') => {
    setForm(null)
    setWhere(from)
    setAsked((n) => n + 1)
    setPending(next)
  }
  const openForm = (entry: Entry | null, date: string) => {
    setPending(null)
    setForm((f) => ({ n: (f?.n ?? 0) + 1, entry, date }))
  }
  const positions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const t of timesheets) if (t.group?.id && t.group.name) seen.set(t.group.id, t.group.name)
    return [...seen.entries()].map(([id, name]): Position => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [timesheets])

  // "Add an entry for any employee": for people with no hours yet this period.
  const [anyone, setAnyone] = useState<number | null>(null)
  // Which panel the confirm step belongs to.
  const [where, setWhere] = useState<'detail' | 'anyone'>('detail')

  const editing = form?.entry ? localParts(form.entry.sheet.from, form.entry.sheet.timezone || TZ) : null
  const formPanel = form && editor && openRow && (
    <TimesForm
      key={form.n}
      title={form.entry ? `Edit times: ${dayLabel(editing!.date)}, ${openRow.name}` : `Add an entry for ${openRow.name}`}
      date={editing?.date ?? form.date}
      days={form.entry ? undefined : p.days}
      start={editing?.time ?? ''}
      end={form.entry?.sheet.to ? localParts(form.entry.sheet.to, form.entry.sheet.timezone || TZ).time : ''}
      positions={form.entry ? undefined : positions}
      places={form.entry ? undefined : { token: editor.token }}
      onCancel={() => setForm(null)}
      onReview={({ from, to, position, client, site }) =>
        ask(
          form.entry
            ? { action: 'update', entry: form.entry, from, to }
            : {
                action: 'create',
                employeeId: openRow.key,
                employeeName: openRow.name,
                from,
                to,
                groupId: position?.id ?? null,
                groupName: position?.name ?? null,
                client,
                site,
              },
        )
      }
    />
  )
  // A new entry needs an employee to belong to.
  const tools =
    editor && openRow && openRow.key !== '__none__'
      ? { edit: (e: Entry) => openForm(e, ''), add: (date: string) => openForm(null, date) }
      : undefined

  const confirm = pending && editor && (
    <Confirm
      // a fresh confirm step for each request
      key={asked}
      pending={pending}
      editor={editor}

      onExpired={(message) => {
        setPending(null)
        expire(message)
      }}
      onResults={onApplied}
      onDone={(changed) => {
        setPending(null)
        if (changed && where === 'anyone') setAnyone(null)
        if (changed) {
          setChanges((n) => n + 1)
          onChanged()
        }
      }}
    />
  )

  const head = `border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const th = `${head} text-right`
  const cell = `border-b px-3 py-2 align-top ${line}`
  const td = `${cell} text-right`
  const cellButton = 'w-full rounded px-1 py-0.5 text-right hover:bg-ink/10'

  return (
    <>
      <OvertimeWarning rows={overtimeRows} />
      {editor && anyone === null && (
        <div className="mb-4 print:hidden">
          <button
            className={`bg-surface-raised ${act}`}
            onClick={() => {
              setPending(null)
              setForm(null)
              setAnyone((n) => (n ?? 0) + 1)
            }}
          >
            Add an entry for any employee
          </button>
        </div>
      )}
      {editor && anyone !== null && (
        <section
          aria-label="Add an entry for any employee"
          className={`mb-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}
        >
          {where === 'anyone' && confirm}
          {!(where === 'anyone' && pending) && (
            <AnyEmployeeForm
              key={anyone}

              editor={editor}
              days={p.days}
              positions={positions}
              onExpired={expire}
              onCancel={() => setAnyone(null)}
              onReview={(next) => ask(next, 'anyone')}
            />
          )}
        </section>
      )}
      {p.rows.length === 0 ? (
        <p className={`py-8 text-center ${muted}`}>No timesheets were logged in this pay period.</p>
      ) : (
        <>
          <Summary p={p} />
          {/* relative keeps the screen-reader-only labels inside the scroll box, so they can't widen the page */}
          <div className={`frozen-grid stack-on-phone relative rounded-xl border bg-surface-raised print:rounded-none ${line}`}>
            <table className="w-full min-w-[760px] border-collapse text-[15px] print:min-w-0 print:text-[12px]">
              <thead>
                <tr>
                  <SortHeader className={`${head} text-left`} active={sort.key === 'name'} dir={sort.dir} onSort={() => sortBy('name')}>
                    Employee
                  </SortHeader>
                  {p.days.map((d) => (
                    <th key={d} className={th}>
                      {dayLabel(d).slice(0, 3)}
                      <span className="block font-normal normal-case">{dayLabel(d).slice(4)}</span>
                    </th>
                  ))}
                  <SortHeader
                    className={`${th} border-l`}
                    right
                    active={sort.key === 'approved'}
                    dir={sort.dir}
                    onSort={() => sortBy('approved')}
                  >
                    Approved
                  </SortHeader>
                  <SortHeader className={th} right active={sort.key === 'unapproved'} dir={sort.dir} onSort={() => sortBy('unapproved')}>
                    Unapproved
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className={open?.key === r.key ? 'bg-surface-sunken/40' : ''}>
                    <th scope="row" className={`${cell} text-left font-semibold`}>
                      <button
                        className="rounded text-left underline-offset-2 hover:underline"
                        aria-label={`Show all clock-ins for ${r.name}`}
                        onClick={() => setOpen({ key: r.key, date: null })}
                      >
                        {r.name}
                      </button>
                      {r.flagged && <Flag />}
                    </th>
                    {r.cells.map((c) => (
                      <td
                        key={c.date}
                        data-label={dayLabel(c.date)}
                        data-empty={c.entries.length ? undefined : true}
                        className={`${td} ${open?.key === r.key && open.date === c.date ? 'outline-2 -outline-offset-2 outline-accent' : ''}`}
                      >
                        {c.entries.length ? (
                          <button
                            className={cellButton}
                            aria-label={`${r.name}, ${dayLabel(c.date)}: show clock-ins`}
                            onClick={() => setOpen({ key: r.key, date: c.date })}
                          >
                            <Hours approved={c.approved} unapproved={c.unapproved} />
                            {c.flagged && <Flag />}
                          </button>
                        ) : (
                          <span className={muted}>–</span>
                        )}
                      </td>
                    ))}
                    <td data-label="Approved" className={`${td} border-l font-bold tabular-nums ${good}`}>
                      {hours(r.approved)}
                    </td>
                    <td data-label="Unapproved" className={`${td} font-bold tabular-nums ${r.unapproved ? bad : muted}`}>
                      {r.unapproved ? `+${hours(r.unapproved)}` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-sunken/40 dark:bg-surface-sunken/50">
                  <th scope="row" className="px-3 py-2 text-left font-bold">
                    Total
                  </th>
                  {p.days.map((d, i) => (
                    <td key={d} data-label={dayLabel(d)} className="px-3 py-2 text-right align-top">
                      <Hours approved={p.dayApproved[i]} unapproved={p.dayUnapproved[i]} total />
                    </td>
                  ))}
                  <td data-label="Approved" className={`border-l px-3 py-2 text-right font-bold tabular-nums ${line} ${good}`}>
                    {hours(p.approved)}
                  </td>
                  <td data-label="Unapproved" className={`px-3 py-2 text-right font-bold tabular-nums ${p.unapproved ? bad : muted}`}>
                    {p.unapproved ? `+${hours(p.unapproved)}` : '–'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={`mt-3 text-sm ${muted}`}>
            <span className={`font-semibold ${good}`}>Green</span> is approved time.{' '}
            <span className={`font-semibold ${bad}`}>Red with a +</span> is logged but not yet approved, and is not in the approved totals.
            Each day is rounded to the nearest quarter hour; totals add up those rounded days.
            <span className="print:hidden"> Select a name or a figure to see the clock-ins behind it.</span>
          </p>
          {openRow && open && (
            <Detail
              row={openRow}
              date={open.date}
              ask={editor ? (next) => ask(next) : undefined}
              tools={tools}
              confirm={
                <>
                  {formPanel}
                  {where === 'detail' && confirm}
                </>
              }
              onClose={() => {
                setOpen(null)
                setPending(null)
                setForm(null)
              }}
            />
          )}
        </>
      )}
      {editor && <ChangeLog periodStart={periodStart} editor={editor} version={changes} onExpired={expire} />}
    </>
  )
}
