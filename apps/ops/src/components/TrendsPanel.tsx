import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { isSignInError, snapshotAction } from '../api'
import { clientRatesQuery, feedbackQuery, queryClient, reviewQuery, snapshotsQuery } from '../lib/queries'
import type { Metric, TrendPoint } from '../lib/trends'
import { METRICS, TREND_PERIODS, needsSnapshot, scale, series, snapshotOf, trendPeriods } from '../lib/trends'
import { addDays } from '../lib/week'
import type { PeriodSnapshot } from '../types'
import Spinner from './Spinner'

const muted = 'text-ink-muted'
const line = 'border-hairline'
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'
// Filling in the history is paced: Camelo refuses requests (429) for a while once it
// has had too many, so wait between periods, and wait longer and try again when refused.
const PACE_MS = 1500
const BACK_OFF_MS = 20_000
const TRIES = 4
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true })
  })

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
const weekOf = (periodStart: string) => `${shortDate(periodStart)} – ${shortDate(addDays(periodStart, 6))}`

// The plot, in SVG units; the SVG stretches to the tile's width.
const W = 320
const H = 96
const PAD = { left: 6, right: 8, top: 10, bottom: 8 }

/** One figure over the periods: the latest value, how it moved, and a line. One series, so no legend. */
function TrendTile({ metric, points }: { metric: Metric; points: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const known = points.map((p, i) => ({ ...p, i })).filter((p): p is { periodStart: string; value: number; i: number } => p.value !== null)
  const last = known.at(-1)
  const before = known.at(-2)
  const { min, max } = scale(points, metric.target?.value)
  const x = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * (W - PAD.left - PAD.right) : 0)
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min || 1)) * (H - PAD.top - PAD.bottom)
  // a line through each run of periods that have a figure; a period on its own gets a dot
  const runs: { i: number; value: number }[][] = []
  for (const p of known) {
    if (runs.length && runs.at(-1)!.at(-1)!.i === p.i - 1) runs.at(-1)!.push(p)
    else runs.push([p])
  }
  const shown = active !== null && points[active].value !== null ? active : null
  const move = (by: number) => {
    if (!known.length) return
    const at = known.findIndex((p) => p.i === (shown ?? last!.i))
    setActive(known[Math.min(known.length - 1, Math.max(0, at + by))].i)
  }
  const change = last && before ? last.value - before.value : null
  const moved = change === null || Math.abs(change) < 1e-9 ? null : change > 0 ? 'up' : 'down'
  const news = moved && metric.up !== 'neutral' ? ((moved === 'up') === (metric.up === 'good') ? 'better' : 'worse') : null

  return (
    <div className="grid content-start gap-1.5 bg-surface-raised px-4 py-3.5">
      <span className="text-sm text-ink-muted">{metric.label}</span>
      <span className="font-display text-2xl leading-tight font-bold">{last ? metric.format(last.value) : '–'}</span>
      <span className={`text-[13px] ${muted}`}>
        {!last
          ? 'Nothing to show yet'
          : !before
            ? `Week of ${weekOf(last.periodStart)}`
            : `${moved === 'up' ? '▲ Up' : moved === 'down' ? '▼ Down' : 'Level'}${news ? ` (${news})` : ''} from ${metric.format(before.value)} the week before`}
      </span>
      <div
        className="relative mt-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        tabIndex={known.length ? 0 : -1}
        role="group"
        aria-label={`${metric.label} by pay period. Use the left and right arrow keys to read each week.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            move(e.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
            {/* recessive, solid hairlines: the floor, and the target where there is one */}
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-hairline" strokeWidth="1" />
            {metric.target && (
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(metric.target.value)}
                y2={y(metric.target.value)}
                className="stroke-outline"
                strokeWidth="1"
              />
            )}
            {shown !== null && (
              <line x1={x(shown)} x2={x(shown)} y1={PAD.top - 4} y2={H - PAD.bottom} className="stroke-ink-muted" strokeWidth="1" />
            )}
            {runs.map((run) =>
              run.length > 1 ? (
                <polyline
                  key={run[0].i}
                  points={run.map((p) => `${x(p.i)},${y(p.value)}`).join(' ')}
                  fill="none"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="stroke-over dark:stroke-over-dark"
                />
              ) : (
                run[0].i !== last?.i && (
                  <circle key={run[0].i} cx={x(run[0].i)} cy={y(run[0].value)} r="2.5" className="fill-over dark:fill-over-dark" />
                )
              ),
            )}
            {/* the latest week, and the week being read: a dot with a ring of the surface colour */}
            {[last?.i, shown]
              .filter((i, n, all): i is number => i !== null && i !== undefined && all.indexOf(i) === n)
              .map((i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(points[i].value!)}
                  r="4"
                  strokeWidth="2"
                  className="fill-over stroke-surface-raised dark:fill-over-dark"
                />
              ))}
            {/* a full-height strip per week, so the pointer only has to be nearest */}
            {points.map((p, i) => (
              <rect
                key={p.periodStart}
                x={x(i) - (W - PAD.left - PAD.right) / (2 * Math.max(1, points.length - 1))}
                y="0"
                width={(W - PAD.left - PAD.right) / Math.max(1, points.length - 1)}
                height={H}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              />
            ))}
          </svg>
          {/* the target's label is text at a fixed size, placed on its line (above it, or below when the line is at the top) */}
          {metric.target && (
            <span
              className={`pointer-events-none absolute right-0 px-1 text-[10px] leading-none ${muted}`}
              style={{
                top: `${(y(metric.target.value) / H) * 100}%`,
                transform: `translateY(${y(metric.target.value) < H / 3 ? '4px' : 'calc(-100% - 3px)'})`,
              }}
            >
              {metric.target.label}
            </span>
          )}
        </div>
        {shown !== null && (
          <div
            role="status"
            className={`pointer-events-none absolute top-0 z-10 rounded-md border bg-surface-raised px-2 py-1 text-xs whitespace-nowrap shadow-sm dark:bg-surface-sunken ${line}`}
            style={{
              left: `${(x(shown) / W) * 100}%`,
              transform: `translate(${shown < points.length / 3 ? '0' : shown > (points.length * 2) / 3 ? '-100%' : '-50%'}, -70%)`,
            }}
          >
            <b className="text-sm">{metric.format(points[shown].value!)}</b>{' '}
            <span className={muted}>{weekOf(points[shown].periodStart)}</span>
          </div>
        )}
        <div className={`flex justify-between gap-2 text-[11px] tabular-nums ${muted}`}>
          <span>{shortDate(points[0].periodStart)}</span>
          {known.length > 1 && (
            <span>
              low {metric.format(Math.min(...known.map((p) => p.value)))} · high {metric.format(Math.max(...known.map((p) => p.value)))}
            </span>
          )}
          <span>{shortDate(points.at(-1)!.periodStart)}</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  token: string
  today: string
  now: number
  /** False while the rest of the dashboard is still loading from Camelo. */
  idle: boolean
  onExpired: (message: string) => void
  graceMinutes?: number
}

/** Several finished pay periods at a glance. It also keeps the history up to date: see lib/trends.ts. */
export default function TrendsPanel({ token, today, now, idle, onExpired, graceMinutes }: Props) {
  const periods = useMemo(() => trendPeriods(today), [today])
  // What is saved, through the site's one cache (lib/queries.ts), so coming back to the dashboard does not ask again.
  const listed = useQuery(snapshotsQuery(periods[0], periods.at(-1)!, token))
  /** Figures worked out on this visit, by period; written to the cache when the work stops (see below). */
  const [fresh, setFresh] = useState<Map<string, PeriodSnapshot>>(new Map())
  const [failed, setFailed] = useState(0)
  const [stopped, setStopped] = useState<string | null>(null)

  const listedData = listed.data
  const saved = useMemo(() => {
    if (!listedData) return null
    const m = new Map(listedData.map((s) => [s.periodStart, s]))
    for (const [p, s] of fresh) m.set(p, s)
    return m
  }, [listedData, fresh])
  /** Periods whose figures need working out, newest first; null until what is saved has been read. */
  const todo = useMemo(() => {
    if (!listedData) return null
    const have = new Map(listedData.map((s) => [s.periodStart, s]))
    return periods.filter((p) => needsSnapshot(have.get(p), p, now, graceMinutes)).reverse()
  }, [listedData, periods, now, graceMinutes])
  const left = failed ? 0 : (todo?.filter((p) => !fresh.has(p)).length ?? 0)

  const listError = listed.error
  useEffect(() => {
    if (isSignInError(listError)) onExpired(EXPIRED)
  }, [listError, onExpired])
  const error =
    stopped ??
    (listError && !isSignInError(listError)
      ? `Trends could not be loaded${listError instanceof Error ? `: ${listError.message}` : '.'}`
      : null)

  // Bring the history up to date one period at a time, and only once the rest of the
  // dashboard has loaded: Camelo refuses requests (429) when too many arrive at once.
  // A period already loaded (this one and the last, by the dashboard) is not asked for again.
  useEffect(() => {
    if (!todo?.length || !idle) return
    const ctrl = new AbortController()
    const done: PeriodSnapshot[] = []
    const listKey = snapshotsQuery(periods[0], periods.at(-1)!, token).queryKey
    // When the work stops, finished or not, the cache gets what was worked out. Not before: that
    // would change the list this effect works from and start it again, losing the pace.
    const keep = () =>
      done.length &&
      queryClient.setQueryData(listKey, (list) => [
        ...(list ?? []).filter((s) => !done.some((d) => d.periodStart === s.periodStart)),
        ...done,
      ])
    ;(async () => {
      let feedback, rates
      try {
        feedback = await queryClient.fetchQuery(feedbackQuery(todo.at(-1)!, addDays(todo[0], 6), token))
        // the clients' prices, which the billed figure needs; already loaded by the dashboard
        rates = await queryClient.fetchQuery(clientRatesQuery(token))
      } catch (e) {
        if (ctrl.signal.aborted) return
        if (isSignInError(e)) return onExpired(EXPIRED)
        setStopped('Client feedback or client prices could not be loaded, so the trends were not brought up to date.')
        return
      }
      for (const [n, p] of todo.entries()) {
        let asked: boolean
        for (let attempt = 1; ; attempt++) {
          if (ctrl.signal.aborted) return
          try {
            const period = reviewQuery(p, token)
            const before = queryClient.getQueryState(period.queryKey)?.dataUpdatedAt
            const data = await queryClient.fetchQuery(period)
            asked = queryClient.getQueryState(period.queryKey)?.dataUpdatedAt !== before
            if (ctrl.signal.aborted) return
            const r = await snapshotAction<{ snapshot: PeriodSnapshot }>(
              { action: 'set', ...snapshotOf(data, rates, feedback, now, graceMinutes) },
              token,
              ctrl.signal,
            )
            done.push(r.snapshot)
            if (ctrl.signal.aborted) return
            setFresh((m) => new Map(m).set(p, r.snapshot))
            break
          } catch (e) {
            if (ctrl.signal.aborted) return
            if (isSignInError(e)) return onExpired(EXPIRED)
            if (attempt >= TRIES) {
              // still refused: leave the rest for the next visit rather than keep asking
              setFailed(todo.length - n)
              return
            }
            await sleep(BACK_OFF_MS, ctrl.signal)
          }
        }
        // the pace is for Camelo: a period that was already loaded cost it nothing
        if (asked) await sleep(PACE_MS, ctrl.signal)
      }
      keep()
    })()
    return () => {
      ctrl.abort()
      keep()
    }
  }, [todo, idle, now, token, periods, onExpired])

  const rows = useMemo(() => (saved ? METRICS.map((m) => ({ metric: m, points: series(m, periods, saved) })) : null), [saved, periods])
  const have = saved ? periods.filter((p) => saved.has(p)).length : 0

  return (
    <section aria-labelledby="trend-h" className={`overflow-hidden rounded-xl border bg-surface-raised ${line}`}>
      <header className="flex flex-wrap items-baseline gap-x-2.5 px-4 pt-3.5 pb-2.5">
        <h2 id="trend-h" className="font-display text-lg font-bold">
          Trends · last {TREND_PERIODS} pay periods
        </h2>
        <span className={`text-sm ${muted}`}>Finished weeks, Friday to Thursday</span>
      </header>
      {error ? (
        <p role="alert" className={`border-t px-4 py-4 text-sm text-red-800 dark:text-red-200 ${line}`}>
          {error}
        </p>
      ) : !rows ? (
        <p className={`flex items-center gap-2 border-t px-4 py-6 ${line} ${muted}`}>
          <Spinner className="size-5" /> Loading…
        </p>
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-px border-t bg-hairline sm:grid-cols-2 lg:grid-cols-3 ${line}`}>
            {rows.map((r) => (
              <TrendTile key={r.metric.key} metric={r.metric} points={r.points} />
            ))}
          </div>
          <details className={`border-t ${line}`}>
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-accent dark:text-accent-dark">
              Show the figures as a table
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm tabular-nums">
                <thead>
                  <tr className={`border-t text-left ${line} ${muted}`}>
                    <th scope="col" className="px-4 py-2 font-semibold">
                      Pay period
                    </th>
                    {rows.map((r) => (
                      <th key={r.metric.key} scope="col" className="px-3 py-2 text-right font-semibold">
                        {r.metric.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...periods].reverse().map((p, n) => (
                    <tr key={p} className={`border-t ${line}`}>
                      <th scope="row" className="px-4 py-1.5 text-left font-semibold whitespace-nowrap">
                        {weekOf(p)}
                      </th>
                      {rows.map((r) => {
                        const v = r.points[periods.length - 1 - n].value
                        return (
                          <td key={r.metric.key} className="px-3 py-1.5 text-right">
                            {v === null ? '–' : r.metric.format(v)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className={`flex flex-wrap items-center gap-2 border-t px-4 py-2.5 text-sm ${line} ${muted}`}>
            {left > 0 && <Spinner className="size-4" />}
            {left > 0
              ? `Working out ${left} earlier week${left === 1 ? '' : 's'} from Camelo, a few seconds each; this is only needed once.`
              : have < periods.length
                ? `${have} of ${periods.length} weeks have figures.${failed ? ` ${failed} could not be worked out just now and will be tried again next time.` : ''}`
                : 'Each point is one finished pay period.'}{' '}
            The last two weeks can still change as timesheets are approved. On Call is left out.
          </p>
        </>
      )}
    </section>
  )
}
