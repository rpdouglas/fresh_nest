// Small pieces shared by the hours grids (Payroll hours and Client hours).
import { hours } from '../lib/payroll'

const good = 'text-emerald-700 dark:text-emerald-400'
const bad = 'text-red-700 dark:text-red-400'
const muted = 'text-ink-muted'

export function Flag() {
  return (
    <span
      title="Needs checking"
      className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-500 align-middle text-[11px] leading-none font-bold text-white print:border print:border-black print:bg-white print:text-black"
    >
      !<span className="sr-only"> needs checking</span>
    </span>
  )
}

/** Approved in green; unapproved in red with a plus sign, so it also reads without colour. */
export function Hours({ approved, unapproved, total }: { approved: number; unapproved: number; total?: boolean }) {
  if (!approved && !unapproved) return <span className={muted}>–</span>
  return (
    <span className="flex flex-col items-end tabular-nums">
      {(approved > 0 || total) && <span className={`${good} ${total ? 'font-bold' : ''}`}>{hours(approved)}</span>}
      {unapproved > 0 && (
        <span className={`${bad} ${total ? 'font-bold' : ''}`}>
          +{hours(unapproved)}
          <span className="sr-only"> unapproved</span>
        </span>
      )}
    </span>
  )
}
