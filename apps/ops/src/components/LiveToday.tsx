import { useMemo } from 'react'
import { type LiveLevel, type LiveVisit, pairsOf } from '../lib/live'
import { dur, fmtTime, visitWhy } from '../lib/liveText'
import Spinner from './Spinner'
import type { Editor } from './useEditor'
import { useLiveBoard } from './useLiveBoard'

/** One visit as the office thinks of it: partners are each their own shift in Camelo, so they are joined here. */
interface Visit {
  key: string
  client: string
  names: string[]
  /** Every partner's shift, so Handled marks the visit for the pair. */
  shiftIds: string[]
  phone: string | null
  first: LiveVisit
}

const clientOf = (v: LiveVisit) => v.shift.client?.name ?? v.shift.jobSite?.name ?? 'No client'

/** Joins the partners' shifts at one client at one time into one visit. */
function joined(visits: LiveVisit[]): Visit[] {
  const out = new Map<string, Visit>()
  for (const v of visits) {
    const key = `${clientOf(v)}@${v.shift.startTime}`
    const name = v.shift.assignee?.name ?? 'Someone'
    const seen = out.get(key)
    if (seen) {
      if (!seen.shiftIds.includes(v.shift.id)) seen.shiftIds.push(v.shift.id)
      if (!seen.names.includes(name)) seen.names.push(name)
      seen.phone ??= v.shift.assignee?.phoneNumber ?? null
    } else {
      out.set(key, {
        key,
        client: clientOf(v),
        names: [name],
        shiftIds: [v.shift.id],
        phone: v.shift.assignee?.phoneNumber ?? null,
        first: v,
      })
    }
  }
  return [...out.values()]
}

/** A short word for a visit's state, always written beside its colour. */
function stateWord(v: LiveVisit): string {
  switch (v.status) {
    case 'late':
      return `Late ${dur(v.lateBy)}`
    case 'no-show':
      return 'No-show'
    case 'running-over':
      return `Running over ${dur(v.overBy)}`
    case 'wrong-place':
      return 'Wrong place'
    case 'on-site':
      return 'On site'
    case 'due':
      return 'Due now'
    case 'done':
      return 'Done'
    default:
      return v.riskMinutes > 0 ? `At risk, about ${v.riskMinutes} min` : `Starts ${fmtTime(Date.parse(v.shift.startTime))}`
  }
}

/** The colour of a block on a pair's row: done, on site, act, watch, waiting. */
function blockClass(v: LiveVisit): string {
  if (v.level === 'red') return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
  if (v.level === 'yellow') return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
  if (v.status === 'done') return 'bg-accent text-on-nest-teal'
  if (v.status === 'on-site') return 'bg-sage text-sage-deep'
  return 'bg-surface-sunken text-ink-muted'
}

const stripe: Record<Exclude<LiveLevel, 'grey'>, string> = { red: 'border-l-red-600', yellow: 'border-l-amber-500' }
const card = 'rounded-xl border border-hairline border-l-4 bg-surface-raised p-4 shadow-soft'

interface Props {
  editor: Editor
  onExpired: (message: string) => void
  graceMinutes?: number
  /** Opens the full Live board. */
  onFullBoard: () => void
}

/**
 * The live day at the top of the Dashboard (decision 0043, `docs/design/dashboard-reference.jpg`): what needs a
 * person now, the next 30 minutes, and each pair's day as a row of visits. The same board as the Live board.
 */
export default function LiveToday({ editor, onExpired, graceMinutes = 15, onFullBoard }: Props) {
  const { board, liveData, loading, error, now, toggleHandled, handledShiftIds } = useLiveBoard({ editor, onExpired, graceMinutes })
  const all = useMemo(() => (board ? board.cleaners.flatMap((c) => c.visits) : []), [board])
  const actNow = useMemo(() => joined(all.filter((v) => v.level === 'red' || v.handled)), [all])
  const soon = useMemo(() => joined(board?.next30Minutes ?? []), [board])
  const pairs = useMemo(() => (board ? pairsOf(board.cleaners) : []), [board])
  const visits = useMemo(() => joined(all).length, [all])

  const head = (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 id="live-h" className="font-display text-xl font-bold">
        Today
      </h2>
      {board && (
        <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-semibold text-sage-deep tabular-nums">
          {visits} visit{visits === 1 ? '' : 's'} · updated {fmtTime(liveData?.now ?? now)}
        </span>
      )}
      <button type="button" onClick={onFullBoard} className="ml-auto min-h-11 text-sm font-semibold text-accent hover:underline">
        Full live board →
      </button>
    </header>
  )

  if (loading)
    return (
      <section aria-labelledby="live-h" className="grid gap-3">
        {head}
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner className="size-5" /> Loading today from Camelo…
        </p>
      </section>
    )
  if (!board)
    return (
      <section aria-labelledby="live-h" className="grid gap-3">
        {head}
        <p role="alert" className="text-sm text-ink-muted">
          Today's visits could not be loaded{error instanceof Error && error.message ? `: ${error.message}` : ''}. The rest of the Dashboard
          is below.
        </p>
      </section>
    )

  return (
    <section aria-labelledby="live-h" className="grid gap-4">
      {head}
      {visits === 0 ? (
        <p className="text-sm text-ink-muted">No visits today.</p>
      ) : (
        <>
          {actNow.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2" aria-label="Act now">
              {actNow.map((v) => {
                const handled = v.shiftIds.every((id) => handledShiftIds.has(id))
                return (
                  <article key={v.key} className={`${card} ${handled ? 'border-l-amber-500' : stripe.red}`}>
                    <p
                      className={`text-xs font-bold tracking-[0.08em] uppercase ${handled ? 'text-ink-muted' : 'text-red-700 dark:text-red-300'}`}
                    >
                      {handled ? 'Handled' : 'Act now'}
                    </p>
                    <h3 className="font-display text-xl leading-tight font-bold">
                      {v.client} · {stateWord(v.first)}
                    </h3>
                    <p className="text-sm">
                      {v.names.join(' & ')} · {fmtTime(Date.parse(v.first.shift.startTime))}
                    </p>
                    <p className="text-sm text-ink-muted">{visitWhy(v.first, graceMinutes)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => v.shiftIds.forEach((id) => (handledShiftIds.has(id) === handled ? toggleHandled(id) : undefined))}
                        className={`min-h-11 rounded-full px-5 text-sm font-semibold ${
                          handled
                            ? 'border border-outline text-ink hover:border-accent'
                            : 'bg-accent text-on-nest-teal hover:bg-accent-dark'
                        }`}
                      >
                        {handled ? 'Undo handled' : 'Handled'}
                      </button>
                      {v.phone && (
                        <a
                          href={`tel:${v.phone}`}
                          aria-label={`Call ${v.names[0]}`}
                          className="flex size-11 items-center justify-center rounded-full border border-outline text-ink hover:border-accent"
                        >
                          <svg
                            aria-hidden="true"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {soon.length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-xs font-bold tracking-[0.08em] text-ink-muted uppercase">Next 30 minutes</h3>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {soon.map((v) => (
                  <article key={v.key} className={`${card} ${stripe.yellow} p-3`}>
                    <h4 className="font-display text-base leading-tight font-bold">{v.client}</h4>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{stateWord(v.first)}</p>
                    <p className="text-sm text-ink-muted">
                      {v.names.join(' & ')} · {fmtTime(Date.parse(v.first.shift.startTime))}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {actNow.length === 0 && soon.length === 0 && (
            <p className="rounded-xl border border-hairline bg-surface-raised px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ Nothing needs you right now.
            </p>
          )}

          <details open className="rounded-xl border border-hairline bg-surface-raised">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
              Today's pairs ({pairs.length})
              <span aria-hidden="true" className="text-ink-muted">
                ▾
              </span>
            </summary>
            <ul className="border-t border-hairline">
              {pairs.map((p) => (
                <li
                  key={p.names.join()}
                  className="grid gap-2 border-t border-hairline px-4 py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center"
                >
                  <span className="font-semibold">{p.names.join(' & ')}</span>
                  <ol className="flex flex-wrap gap-1.5">
                    {p.visits.map((v) => (
                      <li
                        key={v.shift.id}
                        className={`min-w-0 flex-1 basis-24 rounded-lg px-2.5 py-1.5 text-xs leading-tight ${blockClass(v)}`}
                      >
                        <span className="block font-semibold">{stateWord(v)}</span>
                        <span className="block truncate">{clientOf(v)}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  )
}
