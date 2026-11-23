import { addDays, weekLabel } from '../lib/week'

interface Props {
  /** First of the seven days on screen. */
  start: string
  /** What one step is called: "week" or "period". */
  unit: string
  /** A short label before the range, e.g. "Pay period". */
  prefix?: string
  onStep: (start: string) => void
}

const btn =
  'flex min-h-11 flex-none items-center gap-1.5 rounded-lg border border-outline bg-surface-raised px-3 text-sm font-semibold hover:border-accent'

/** Worded previous/next buttons either side of the dates on screen, right above the report. */
export default function WeekBar({ start, unit, prefix, onStep }: Props) {
  return (
    <nav
      aria-label={`Change ${unit}`}
      className="mb-4 flex items-center gap-2 rounded-xl border border-hairline bg-surface-raised p-1.5 print:hidden"
    >
      <button className={btn} onClick={() => onStep(addDays(start, -7))}>
        <span aria-hidden="true">←</span>
        Previous<span className="hidden sm:inline"> {unit}</span>
      </button>
      <p className="min-w-0 flex-1 text-center leading-tight">
        {prefix && <span className="block text-xs tracking-[0.08em] text-ink-muted uppercase">{prefix}</span>}
        <span className="font-display text-base font-bold sm:text-lg">{weekLabel(start)}</span>
      </p>
      <button className={btn} onClick={() => onStep(addDays(start, 7))}>
        Next<span className="hidden sm:inline"> {unit}</span>
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  )
}
