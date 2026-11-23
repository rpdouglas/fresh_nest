import { useMemo } from 'react'
import { STALE_DAYS, approvalStats, lagLabel } from '../lib/approvals'
import type { ReviewSheet } from '../types'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const amber = 'text-amber-700 dark:text-amber-400'
const pct = (rate: number) => `${Math.round(rate * 100)}%`

/** How fast the period's time was approved, and how much was typed in rather than clocked. */
export default function ApprovalPanel({ timesheets, now }: { timesheets: ReviewSheet[]; now: number }) {
  const { rows, total } = useMemo(() => approvalStats(timesheets, now), [timesheets, now])
  if (!total.entries) return null
  const th = `border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const td = `border-b px-3 py-2 text-right tabular-nums ${line}`
  return (
    <details className={`mt-4 rounded-xl border bg-surface-raised ${line}`}>
      <summary className="cursor-pointer px-4 py-3">
        <span className="font-semibold">Approval speed and hand-entered time</span>
        <span className={`ml-2 text-sm ${muted}`}>
          {total.medianLagHours === null ? 'no approval times yet' : `median ${lagLabel(total.medianLagHours)} to approval`} ·{' '}
          {pct(total.byHandRate)} entered by hand
          {total.waitingLong > 0 && (
            <span className={`font-semibold ${amber}`}>
              {' '}
              · {total.waitingLong} waiting over {STALE_DAYS} days
            </span>
          )}
        </span>
      </summary>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[15px]">
          <thead>
            <tr>
              <th className={`${th} text-left`}>Employee</th>
              <th className={`${th} text-right`}>Entries</th>
              <th className={`${th} text-right`}>Entered by hand</th>
              <th className={`${th} text-right`}>Median to approval</th>
              <th className={`${th} text-right`}>Waiting over {STALE_DAYS} days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className={`border-b px-3 py-2 text-left font-semibold ${line}`}>
                  {r.name}
                </th>
                <td className={td}>{r.entries}</td>
                <td className={`${td} ${r.byHandRate >= 0.25 ? `font-semibold ${amber}` : ''}`}>
                  {r.byHand} ({pct(r.byHandRate)})
                </td>
                <td className={td}>{lagLabel(r.medianLagHours)}</td>
                <td className={`${td} ${r.waitingLong ? `font-semibold ${amber}` : ''}`}>{r.waitingLong}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`px-4 py-3 text-sm ${muted}`}>
        For every entry in the period, approved or not; leave is left out. Time to approval runs from the clock-out to Camelo's approval
        time. Entered by hand means anything but a clock-in from the Camelo app: added in Camelo or from this site. A high share can mean
        missed clock-ins. Amber marks a quarter or more.
      </p>
    </details>
  )
}
