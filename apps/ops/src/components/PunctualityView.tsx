import { useMemo, useState } from 'react'
import { download } from '../lib/download'
import { dayLabel } from '../lib/payroll'
import type { PunctualRow, PunctualVisit } from '../lib/punctuality'
import { GRACE_MINUTES, buildPunctuality, percent, punctualityCsv } from '../lib/punctuality'
import { formatTime } from '../lib/schedule'
import type { Sort } from '../lib/sort'
import { nextSort, sortRows } from '../lib/sort'
import { TZ } from '../lib/week'
import type { ReviewResponse } from '../types'
import SortHeader from './SortHeader'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const amber = 'text-amber-700 dark:text-amber-400'
const red = 'text-red-700 dark:text-red-400'

const STATUS: Record<PunctualVisit['status'], string> = {
  'on-time': 'On time',
  late: 'Late',
  'no-show': 'No timesheet',
  unmeasured: 'Entered by hand',
}

function clockSpan(v: PunctualVisit): string {
  if (!v.sheets.length) return '–'
  const tz = v.shift.timezone || TZ
  const first = v.sheets.reduce((a, b) => (Date.parse(b.from) < Date.parse(a.from) ? b : a))
  const ends = v.sheets.map((t) => t.to)
  const last = ends.includes(null) ? null : ends.reduce((a, b) => (Date.parse(b!) > Date.parse(a!) ? b : a))
  return `${formatTime(first.from, tz)} – ${last ? formatTime(last, tz) : 'still in'}`
}

function Detail({ row, byClient, onClose }: { row: PunctualRow; byClient: boolean; onClose: () => void }) {
  return (
    <section
      aria-label={`Visits for ${row.name}`}
      className={`mt-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}
    >
      <header className={`flex flex-wrap items-baseline gap-x-3 border-b px-4 py-3 ${line}`}>
        <h2 className="text-[17px] font-semibold text-accent dark:text-accent-dark">{row.name}</h2>
        <span className={`text-sm ${muted}`}>
          {row.scheduled} visit{row.scheduled === 1 ? '' : 's'}
        </span>
        <button className="ml-auto text-sm underline" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className={muted}>
              <th className={`border-b px-4 py-2 text-left font-semibold ${line}`}>Day</th>
              <th className={`border-b px-4 py-2 text-left font-semibold ${line}`}>{byClient ? 'Cleaner' : 'Client'}</th>
              <th className={`border-b px-4 py-2 text-left font-semibold ${line}`}>Scheduled</th>
              <th className={`border-b px-4 py-2 text-left font-semibold ${line}`}>Clocked</th>
              <th className={`border-b px-4 py-2 text-left font-semibold ${line}`}>Result</th>
            </tr>
          </thead>
          <tbody>
            {row.visits.map((v) => {
              const tz = v.shift.timezone || TZ
              return (
                <tr key={v.shift.id}>
                  <td className={`border-b px-4 py-2 whitespace-nowrap ${line}`}>{dayLabel(v.date)}</td>
                  <td className={`border-b px-4 py-2 ${line}`}>{byClient ? v.shift.assignee?.name : v.clientName}</td>
                  <td className={`border-b px-4 py-2 whitespace-nowrap ${line}`}>
                    {formatTime(v.shift.startTime, tz)} – {formatTime(v.shift.endTime, tz)}
                  </td>
                  <td className={`border-b px-4 py-2 whitespace-nowrap ${line}`}>{clockSpan(v)}</td>
                  <td className={`border-b px-4 py-2 ${line}`}>
                    <span className={v.status === 'no-show' ? `font-semibold ${red}` : v.status === 'late' ? `font-semibold ${amber}` : ''}>
                      {STATUS[v.status]}
                      {v.status === 'late' && ` by ${v.lateBy} min`}
                    </span>
                    {v.leftEarlyBy > 0 && <span className={`block font-semibold ${amber}`}>Left {v.leftEarlyBy} min early</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface Props {
  data: ReviewResponse
  /** When the data was loaded: only visits that have ended count. */
  loadedAt: number
  graceMinutes?: number
}

export default function PunctualityView({ data, loadedAt, graceMinutes = GRACE_MINUTES }: Props) {
  const p = useMemo(() => buildPunctuality(data, loadedAt, graceMinutes), [data, loadedAt, graceMinutes])
  const [byClient, setByClient] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  type Key = 'name' | 'scheduled' | 'onTimeRate' | 'late' | 'avgLate' | 'leftEarly' | 'noShows'
  // worst on-time rate first until another column is chosen
  const [sort, setSort] = useState<Sort<Key>>({ key: 'onTimeRate', dir: 'asc' })
  const rows = useMemo(() => {
    const list = byClient ? p.byClient : p.byCleaner
    return sortRows(list, (r) => (sort.key === 'name' ? r.name : sort.key === 'avgLate' && !r.late ? null : r[sort.key]), sort.dir)
  }, [p, byClient, sort])
  const sortBy = (key: Key) => setSort((s) => nextSort(s, key, ['name']))
  const openRow = open ? rows.find((r) => r.key === open) : null

  if (p.total.scheduled === 0) {
    return <p className={`py-8 text-center ${muted}`}>No visits have finished in this pay period yet (On Call is left out).</p>
  }

  const t = p.total
  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  const head = `border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const th = `${head} text-right`
  const td = `border-b px-3 py-2 text-right tabular-nums ${line}`
  const unmeasured = t.scheduled - t.measured - t.noShows
  const tab = (on: boolean) => `rounded-md px-3 py-1 text-sm ${on ? 'bg-accent text-on-nest-teal' : 'hover:bg-ink/10'}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
        <div className={box}>
          <b className="block text-xl tabular-nums">{percent(t.onTimeRate)}</b>
          <span className={`text-xs ${muted}`}>
            on time ({t.onTime} of {t.measured} clocked visits)
          </span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${t.late ? amber : ''}`}>{t.late}</b>
          <span className={`text-xs ${muted}`}>late{t.late ? `, ${t.avgLate} min on average` : ''}</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${t.leftEarly ? amber : ''}`}>{t.leftEarly}</b>
          <span className={`text-xs ${muted}`}>left early</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${t.noShows ? red : ''}`}>{t.noShows}</b>
          <span className={`text-xs ${muted}`}>
            no timesheet ({percent(t.noShowRate)} of {t.scheduled} visits)
          </span>
        </div>
        <button
          className={`ml-auto self-center rounded-lg border bg-surface-raised px-3 py-2 text-sm hover:border-accent print:hidden ${line}`}
          onClick={() =>
            download(
              `punctuality-${byClient ? 'clients' : 'cleaners'}-${data.periodStart}.csv`,
              punctualityCsv(rows, t, byClient ? 'Client' : 'Cleaner'),
            )
          }
        >
          Download CSV
        </button>
      </div>

      <div
        role="group"
        aria-label="Group by"
        className={`mb-3 inline-flex gap-1 rounded-lg border bg-surface-raised p-1 print:hidden ${line}`}
      >
        <button aria-pressed={!byClient} className={tab(!byClient)} onClick={() => (setByClient(false), setOpen(null))}>
          By cleaner
        </button>
        <button aria-pressed={byClient} className={tab(byClient)} onClick={() => (setByClient(true), setOpen(null))}>
          By client
        </button>
      </div>

      <div className={`frozen-grid relative rounded-xl border bg-surface-raised ${line}`}>
        <table className="w-full min-w-[720px] border-collapse text-[15px] print:min-w-0 print:text-[11px]">
          <thead>
            <tr>
              <SortHeader className={`${head} text-left`} active={sort.key === 'name'} dir={sort.dir} onSort={() => sortBy('name')}>
                {byClient ? 'Client' : 'Cleaner'}
              </SortHeader>
              {(
                [
                  ['scheduled', 'Visits'],
                  ['onTimeRate', 'On time'],
                  ['late', 'Late'],
                  ['avgLate', 'Avg late'],
                  ['leftEarly', 'Left early'],
                  ['noShows', 'No timesheet'],
                ] as const
              ).map(([key, label]) => (
                <SortHeader key={key} className={th} right active={sort.key === key} dir={sort.dir} onSort={() => sortBy(key)}>
                  {label}
                </SortHeader>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={open === r.key ? 'bg-surface-sunken/40' : ''}>
                <th scope="row" className={`border-b px-3 py-2 text-left font-semibold ${line}`}>
                  <button
                    className="rounded text-left underline-offset-2 hover:underline"
                    aria-label={`Show visits for ${r.name}`}
                    onClick={() => setOpen(open === r.key ? null : r.key)}
                  >
                    {r.name}
                  </button>
                </th>
                <td className={td}>{r.scheduled}</td>
                <td className={`${td} font-semibold`}>{percent(r.onTimeRate)}</td>
                <td className={`${td} ${r.late ? amber : ''}`}>{r.late}</td>
                <td className={td}>{r.late ? `${r.avgLate} min` : '–'}</td>
                <td className={`${td} ${r.leftEarly ? amber : ''}`}>{r.leftEarly}</td>
                <td className={`${td} ${r.noShows ? `font-semibold ${red}` : ''}`}>{r.noShows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`mt-3 text-sm ${muted}`}>
        On time means clocked in no more than {graceMinutes} minutes after the scheduled start; left early means clocked out more than{' '}
        {graceMinutes} minutes before the end. The on-time rate counts only visits with a real clock-in
        {unmeasured > 0 ? ` (${unmeasured} visit${unmeasured === 1 ? ' was' : 's were'} entered by hand)` : ''}. No timesheet means a
        finished shift with nothing logged against it or overlapping it. On Call is left out. Worst on-time rate first; select a heading to
        sort.
        <span className="print:hidden"> Select a name to see each visit.</span>
      </p>
      {openRow && <Detail row={openRow} byClient={byClient} onClose={() => setOpen(null)} />}
    </>
  )
}
