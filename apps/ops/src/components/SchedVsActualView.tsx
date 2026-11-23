import { useMemo, useState } from 'react'
import { download } from '../lib/download'
import { dayLabel } from '../lib/payroll'
import { decimal, scheduledMinutes, signed } from '../lib/review'
import type { SchedVsActual, SvaCell, SvaRow } from '../lib/schedVsActual'
import { buildSchedVsActual, schedVsActualCsv } from '../lib/schedVsActual'
import type { Sort } from '../lib/sort'
import { nextSort, sortRows } from '../lib/sort'
import { formatTime } from '../lib/schedule'
import { TZ } from '../lib/week'
import type { ReviewResponse } from '../types'
import SortHeader from './SortHeader'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const amber = 'text-amber-700 dark:text-amber-400'
// Over and under schedule: a validated blue/red pair, stepped separately for dark.
// Text never takes these colours; the sign on each value carries the direction too.
const over = 'bg-over dark:bg-over-dark'
const under = 'bg-under dark:bg-under-dark'
const span = (from: string, to: string | null, tz: string | null) =>
  `${formatTime(from, tz || TZ)} – ${to ? formatTime(to, tz || TZ) : 'no clock-out'}`

/** A round number of hours at or above the largest variance, so the axis ends on a tidy value. */
function axisMax(minutes: number): number {
  const hours = minutes / 60
  const step = hours <= 2 ? 0.5 : hours <= 5 ? 1 : hours <= 10 ? 2 : hours <= 25 ? 5 : 10
  return Math.max(step, Math.ceil(hours / step) * step)
}

/** One bar per employee from a zero line: right for over schedule, left for under. */
function VarianceChart({ v, selected, onSelect }: { v: SchedVsActual; selected: string | null; onSelect: (key: string) => void }) {
  const max = axisMax(Math.max(...v.ranked.map((r) => Math.abs(r.variance)), 1))
  // each side of zero is 50% of the plot; a bar may use up to 78% of its side, leaving room for its value
  const width = (minutes: number) => `${(Math.abs(minutes) / 60 / max) * 39}%`
  return (
    <figure className={`mb-4 rounded-xl border bg-surface-raised p-4 ${line}`}>
      <figcaption className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-base font-bold">Variance by employee</span>
        <span className={`text-sm ${muted}`}>actual minus scheduled, hours</span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-3 w-5 rounded-sm [print-color-adjust:exact] ${under}`} />
            Under schedule (−)
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-3 w-5 rounded-sm [print-color-adjust:exact] ${over}`} />
            Over schedule (+)
          </span>
        </span>
      </figcaption>
      <ul className="relative">
        {v.ranked.map((r) => {
          const positive = r.variance > 0
          return (
            <li key={r.key}>
              <button
                aria-pressed={selected === r.key}
                aria-label={`${r.name}: variance ${signed(r.variance)} hours, scheduled ${decimal(r.scheduled)}, actual ${decimal(r.actual)}. Show details.`}
                onClick={() => onSelect(r.key)}
                className={`group relative grid w-full grid-cols-[minmax(6.5rem,11rem)_1fr] items-center gap-3 rounded py-1 text-left hover:bg-ink/10 focus-visible:bg-ink/10 ${
                  selected === r.key ? 'bg-ink/10' : ''
                }`}
              >
                <span className="truncate pl-1 text-sm">{r.name}</span>
                <span className="relative block h-6">
                  <span aria-hidden="true" className={`absolute inset-y-0 left-1/2 w-px bg-outline`} />
                  {r.variance !== 0 && (
                    <span
                      aria-hidden="true"
                      style={{ width: width(r.variance), ...(positive ? { left: '50%' } : { right: '50%' }) }}
                      className={`absolute top-1 h-4 [print-color-adjust:exact] group-hover:brightness-110 ${positive ? `rounded-r ${over}` : `rounded-l ${under}`}`}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    style={positive ? { left: `calc(50% + ${width(r.variance)})` } : { right: `calc(50% + ${width(r.variance)})` }}
                    className="absolute top-0.5 px-1.5 text-sm font-semibold tabular-nums"
                  >
                    {signed(r.variance)}
                  </span>
                </span>
                <span
                  role="tooltip"
                  className={`pointer-events-none absolute top-full left-28 z-10 hidden rounded-lg border bg-surface-raised px-3 py-2 text-sm shadow-lg group-hover:block group-focus-visible:block dark:bg-surface-sunken ${line}`}
                >
                  <b className="block tabular-nums">{signed(r.variance)} h</b>
                  <span className={muted}>
                    {r.name} · scheduled {decimal(r.scheduled)} · actual {decimal(r.actual)}
                    {r.uncovered > 0 && ` · ${r.uncovered} shift${r.uncovered === 1 ? '' : 's'} with no timesheet`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div aria-hidden="true" className={`mt-1 grid grid-cols-[minmax(6.5rem,11rem)_1fr] gap-3 text-xs tabular-nums ${muted}`}>
        <span />
        <span className="relative block h-4">
          <span className="absolute left-[11%] -translate-x-1/2">−{max}</span>
          <span className="absolute left-1/2 -translate-x-1/2">0</span>
          <span className="absolute left-[89%] -translate-x-1/2">+{max}</span>
        </span>
      </div>
    </figure>
  )
}

function Cell({ c, total }: { c: { scheduled: number; actual: number; variance: number; off?: boolean }; total?: boolean }) {
  if (!c.scheduled && !c.actual) return <span className={muted}>–</span>
  return (
    <span className={`flex flex-col items-end tabular-nums ${total ? 'font-bold' : ''}`}>
      <span className="whitespace-nowrap">
        <span className={muted}>{decimal(c.scheduled)} /</span> {decimal(c.actual)}
      </span>
      <span className={`text-sm ${c.off ? `font-bold ${amber}` : muted}`}>{signed(c.variance)}</span>
    </span>
  )
}

function DayDetail({ cell }: { cell: SvaCell }) {
  const uncovered = new Set(cell.uncovered.map((s) => s.id))
  return (
    <div>
      <div
        className={`flex flex-wrap items-baseline gap-x-4 border-b bg-surface-sunken/40 px-4 py-1.5 text-sm dark:bg-surface-sunken/50 ${line}`}
      >
        <span className="font-semibold">{dayLabel(cell.date)}</span>
        <span className="tabular-nums">
          scheduled {decimal(cell.scheduled)} · actual {decimal(cell.actual)} · variance{' '}
          <b className={cell.off ? amber : ''}>{signed(cell.variance)}</b>
        </span>
      </div>
      <div className="grid gap-x-8 gap-y-2 px-4 py-2.5 text-sm sm:grid-cols-2">
        <div>
          <p className={`mb-1 text-xs font-semibold tracking-wide uppercase ${muted}`}>Scheduled</p>
          {cell.shifts.length === 0 && <p className={muted}>Nothing scheduled.</p>}
          {cell.shifts.map((s) => (
            <p key={s.id} className="tabular-nums">
              {span(s.startTime, s.endTime, s.timezone)} · {s.client?.name || s.jobSite?.name || 'No client'} ·{' '}
              {decimal(scheduledMinutes(s))}
              {uncovered.has(s.id) && <span className={`ml-2 font-semibold ${amber}`}>no timesheet</span>}
            </p>
          ))}
        </div>
        <div>
          <p className={`mb-1 text-xs font-semibold tracking-wide uppercase ${muted}`}>Actual</p>
          {cell.sheets.length === 0 && <p className={muted}>Nothing logged.</p>}
          {cell.sheets.map((t) => (
            <p key={t.id} className="tabular-nums">
              {span(t.from, t.to, t.timezone)} · {t.client?.name || t.jobSite?.name || 'No client'} · {decimal(t.totalDuration ?? 0)}
              {t.state !== 'APPROVED' && (
                <span className="ml-2 font-semibold text-red-700 dark:text-red-400">{t.state.replace(/_/g, ' ').toLowerCase()}</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function Detail({ row, date, onClose }: { row: SvaRow; date: string | null; onClose: () => void }) {
  const cells = row.cells.filter((c) => (c.shifts.length > 0 || c.sheets.length > 0) && (!date || c.date === date))
  return (
    <section aria-label="Shifts and clock-ins" className={`mt-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}>
      <header className={`flex flex-wrap items-baseline gap-x-3 border-b px-4 py-3 ${line}`}>
        <h2 className="text-[17px] font-semibold text-accent dark:text-accent-dark">{row.name}</h2>
        <span className={`text-sm ${muted}`}>{date ? dayLabel(date) : 'whole pay period'} · On Call left out</span>
        <button className="ml-auto text-sm underline" onClick={onClose}>
          Close
        </button>
      </header>
      {cells.map((c) => (
        <DayDetail key={c.date} cell={c} />
      ))}
    </section>
  )
}

interface Props {
  data: ReviewResponse
  /** When the data was loaded: a shift counts as scheduled only once it has ended. */
  loadedAt: number
}

export default function SchedVsActualView({ data, loadedAt }: Props) {
  const v = useMemo(() => buildSchedVsActual(data, loadedAt), [data, loadedAt])
  const [open, setOpen] = useState<{ key: string; date: string | null } | null>(null)
  const openRow = open && v.rows.find((r) => r.key === open.key)
  const [sort, setSort] = useState<Sort<'name' | 'scheduled' | 'actual' | 'variance'>>({ key: 'name', dir: 'asc' })
  const rows = useMemo(() => sortRows(v.rows, (r) => (sort.key === 'name' ? r.name : r[sort.key]), sort.dir), [v.rows, sort])
  const sortBy = (key: typeof sort.key) => setSort((s) => nextSort(s, key, ['name']))

  if (v.rows.length === 0) {
    return <p className={`py-8 text-center ${muted}`}>Nothing was scheduled or logged in this pay period (On Call is left out).</p>
  }

  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  const head = `border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const th = `${head} text-right`
  const cellBase = `border-b px-3 py-2 align-top ${line}`
  const td = `${cellBase} text-right`
  const cellButton = 'w-full rounded px-1 py-0.5 text-right hover:bg-ink/10'
  const offCells = v.rows.reduce((n, r) => n + r.cells.filter((c) => c.off).length, 0)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
        <div className={box}>
          <b className="block text-xl tabular-nums">{decimal(v.scheduled)}</b>
          <span className={`text-xs ${muted}`}>scheduled hours</span>
        </div>
        <div className={box}>
          <b className="block text-xl tabular-nums">{decimal(v.actual)}</b>
          <span className={`text-xs ${muted}`}>actual hours</span>
        </div>
        <div className={box}>
          <b className="block text-xl tabular-nums">{signed(v.variance)}</b>
          <span className={`text-xs ${muted}`}>variance</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${v.uncovered ? amber : ''}`}>{v.uncovered}</b>
          <span className={`text-xs ${muted}`}>shifts with no timesheet</span>
        </div>
        <button
          className={`ml-auto self-center rounded-lg border bg-surface-raised px-3 py-2 text-sm hover:border-accent print:hidden ${line}`}
          onClick={() => download(`scheduled-vs-actual-${v.periodStart}.csv`, schedVsActualCsv(v))}
        >
          Download CSV
        </button>
      </div>

      <VarianceChart
        v={v}
        selected={open?.key ?? null}
        onSelect={(key) => setOpen(open?.key === key && !open.date ? null : { key, date: null })}
      />

      {/* relative keeps anything positioned inside the scroll box, so it can't widen the page */}
      <div className={`frozen-grid stack-on-phone relative rounded-xl border bg-surface-raised print:rounded-none ${line}`}>
        <table className="w-full min-w-[1180px] border-collapse text-[15px] print:min-w-0 print:text-[10px]">
          <thead>
            <tr>
              <SortHeader className={`${head} text-left`} active={sort.key === 'name'} dir={sort.dir} onSort={() => sortBy('name')}>
                Employee
              </SortHeader>
              {v.days.map((d) => (
                <th key={d} className={th}>
                  {dayLabel(d).slice(0, 3)}
                  <span className="block font-normal normal-case">{dayLabel(d).slice(4)}</span>
                </th>
              ))}
              <SortHeader
                className={`${th} border-l`}
                right
                active={sort.key === 'scheduled'}
                dir={sort.dir}
                onSort={() => sortBy('scheduled')}
              >
                Scheduled
              </SortHeader>
              <SortHeader className={th} right active={sort.key === 'actual'} dir={sort.dir} onSort={() => sortBy('actual')}>
                Actual
              </SortHeader>
              <SortHeader className={th} right active={sort.key === 'variance'} dir={sort.dir} onSort={() => sortBy('variance')}>
                Variance
              </SortHeader>
            </tr>
            <tr>
              <td className={`border-b ${line}`} />
              <th colSpan={7} className={`border-b px-3 py-1.5 text-right text-xs font-normal ${line} ${muted}`}>
                Each day: scheduled / actual, with the variance beneath
              </th>
              <td colSpan={3} className={`border-b border-l ${line}`} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={open?.key === r.key ? 'bg-surface-sunken/40' : ''}>
                <th scope="row" className={`${cellBase} text-left font-semibold`}>
                  <button
                    className="rounded text-left underline-offset-2 hover:underline"
                    aria-label={`Show all shifts and clock-ins for ${r.name}`}
                    onClick={() => setOpen({ key: r.key, date: null })}
                  >
                    {r.name}
                  </button>
                </th>
                {r.cells.map((c) => (
                  <td
                    key={c.date}
                    data-label={dayLabel(c.date)}
                    data-empty={c.scheduled || c.actual ? undefined : true}
                    className={`${td} ${open?.key === r.key && open.date === c.date ? 'outline-2 -outline-offset-2 outline-accent' : ''}`}
                  >
                    {c.scheduled || c.actual ? (
                      <button
                        className={cellButton}
                        aria-label={`${r.name}, ${dayLabel(c.date)}: show shifts and clock-ins`}
                        onClick={() => setOpen({ key: r.key, date: c.date })}
                      >
                        <Cell c={c} />
                        {c.uncovered.length > 0 && (
                          <span className={`block text-xs font-semibold whitespace-nowrap ${amber}`}>
                            no timesheet{c.uncovered.length > 1 ? ` ×${c.uncovered.length}` : ''}
                          </span>
                        )}
                        {c.unapproved && <span className="block text-xs font-semibold text-red-700 dark:text-red-400">unapproved</span>}
                      </button>
                    ) : (
                      <span className={muted}>–</span>
                    )}
                  </td>
                ))}
                <td data-label="Scheduled" className={`${td} border-l tabular-nums`}>
                  {decimal(r.scheduled)}
                </td>
                <td data-label="Actual" className={`${td} tabular-nums`}>
                  {decimal(r.actual)}
                </td>
                <td data-label="Variance" className={`${td} font-bold tabular-nums ${Math.abs(r.variance) > 15 ? amber : ''}`}>
                  {signed(r.variance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-sunken/40 dark:bg-surface-sunken/50">
              <th scope="row" className="px-3 py-2 text-left font-bold">
                Total
              </th>
              {v.days.map((d, i) => (
                <td key={d} data-label={dayLabel(d)} className="px-3 py-2 text-right align-top">
                  <Cell c={{ scheduled: v.dayScheduled[i], actual: v.dayActual[i], variance: v.dayActual[i] - v.dayScheduled[i] }} total />
                </td>
              ))}
              <td data-label="Scheduled" className={`border-l px-3 py-2 text-right font-bold tabular-nums ${line}`}>
                {decimal(v.scheduled)}
              </td>
              <td data-label="Actual" className="px-3 py-2 text-right font-bold tabular-nums">
                {decimal(v.actual)}
              </td>
              <td data-label="Variance" className="px-3 py-2 text-right font-bold tabular-nums">
                {signed(v.variance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`mt-3 text-sm ${muted}`}>
        Variance is actual minus scheduled hours, from exact minutes. <span className={`font-semibold ${amber}`}>Bold amber</span> is more
        than 15 minutes either way ({offCells} day{offCells === 1 ? '' : 's'} here). On Call is left out. Actual time includes timesheets
        not yet approved; shifts that haven't ended yet are not counted as scheduled.
        <span className="print:hidden"> Select a name, a bar or a figure to see the shifts and clock-ins behind it.</span>
      </p>
      {openRow && open && <Detail row={openRow} date={open.date} onClose={() => setOpen(null)} />}
    </>
  )
}
