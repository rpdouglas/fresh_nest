import { type ReactNode, useCallback, useState } from 'react'
import { isSignInError, saveGraceSetting } from '../api'
import { type LiveCleanerCard, type LiveLevel, type LiveVisit } from '../lib/live'
import { settingsChanged } from '../lib/queries'
import { TZ } from '../lib/week'
import { dur, fmtTime, visitWhy } from '../lib/liveText'
import Spinner from './Spinner'
import type { Editor } from './useEditor'
import { useLiveBoard } from './useLiveBoard'

const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

const GRACES = [5, 10, 15, 20, 30]
const DAY0 = 390 // 6:30 am in minutes from midnight
const DAY1 = 1080 // 6:00 pm in minutes from midnight

const pct = (m: number) => {
  const clamped = Math.min(Math.max(m, DAY0), DAY1)
  return ((clamped - DAY0) / (DAY1 - DAY0)) * 100
}

function minutesAfterMidnight(ms: number): number {
  const d = new Date(ms)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(d)
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)
  return h * 60 + m
}

function partnersOf(visit: LiveVisit): string {
  const partners = visit.shift.shiftPartners?.map((p) => p.assignee?.name).filter(Boolean) as string[] | undefined
  if (!partners || partners.length === 0) return 'Solo'
  return `With ${partners.join(', ')}`
}

function VisitChip({ visit }: { visit: LiveVisit }) {
  switch (visit.status) {
    case 'late':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
          ● Late {dur(visit.lateBy)}
        </span>
      )
    case 'no-show':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
          ● No-show
        </span>
      )
    case 'running-over':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ▲ Over {dur(visit.overBy)}
        </span>
      )
    case 'wrong-place':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ▲ Wrong place
        </span>
      )
    case 'on-site':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          ✓ On site
        </span>
      )
    case 'due':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted">
          ○ Due now
        </span>
      )
    case 'done':
      return visit.lateBy > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted">
          ○ Done · {visit.lateBy} min late
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          ✓ Done
        </span>
      )
    default:
      return visit.riskMinutes > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ▲ At risk ~{visit.riskMinutes} min
        </span>
      ) : null
  }
}

function HeadChips({ card }: { card: LiveCleanerCard }) {
  const chips: ReactNode[] = []
  const c = card.currentVisit
  if (c) {
    if (c.status === 'late') {
      chips.push(
        <span
          key="late"
          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          ● Late {dur(c.lateBy)}
        </span>,
      )
    } else if (c.status === 'due') {
      chips.push(
        <span
          key="due"
          className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted"
        >
          ○ Due now
        </span>,
      )
    } else if (c.status === 'on-site' || c.status === 'wrong-place') {
      chips.push(
        <span
          key="onsite"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          ✓ On site {c.inAt ? `since ${fmtTime(c.inAt)}` : ''}
        </span>,
      )
    }
    if (c.status === 'running-over') {
      chips.push(
        <span
          key="over"
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          ▲ Running over {dur(c.overBy)}
        </span>,
      )
    }
    if (c.wrongPlace) {
      chips.push(
        <span
          key="wrong"
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          ▲ Wrong place
        </span>,
      )
    }
    if (c.partnerLate) {
      chips.push(
        <span
          key="partner"
          className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted"
        >
          ○ Partner late
        </span>,
      )
    }
  }

  if (card.riskyVisit) {
    chips.push(
      <span
        key="risk"
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      >
        ▲ At risk: next ~{card.riskyVisit.riskMinutes} min late
      </span>,
    )
  }

  if (!c && card.nextVisit && !card.riskyVisit) {
    chips.push(
      <span
        key="next"
        className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted"
      >
        ○ Next at {fmtTime(Date.parse(card.nextVisit.shift.startTime))}
      </span>,
    )
  }

  if (card.finished) {
    chips.push(
      <span
        key="finished"
        className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold text-ink-muted"
      >
        ✓ Finished for today
      </span>,
    )
  }

  if (card.noShows > 0) {
    chips.push(
      <span
        key="noshow"
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300"
      >
        ● {card.noShows} no-show{card.noShows === 1 ? '' : 's'}
      </span>,
    )
  }

  return <div className="flex flex-wrap gap-1.5">{chips}</div>
}

function DayTimeline({ visits, now }: { visits: LiveVisit[]; now: number }) {
  const nowMin = minutesAfterMidnight(now)
  return (
    <div className="px-4 py-2" aria-hidden="true">
      <div className="relative h-3 w-full rounded bg-surface-sunken">
        {visits.map((v) => {
          const sMin = minutesAfterMidnight(Date.parse(v.shift.startTime))
          const eMin = minutesAfterMidnight(Date.parse(v.shift.endTime))
          const left = pct(sMin)
          const width = Math.max(pct(eMin) - left, 1.5)

          let bg = 'bg-ink/20 dark:bg-ink/30'
          if (v.status === 'done') bg = 'bg-ink-muted/30'
          else if (v.status === 'on-site') bg = 'bg-emerald-600'
          else if (v.status === 'late' || v.status === 'no-show') bg = 'bg-red-600'
          else if (v.status === 'running-over' || v.status === 'wrong-place' || v.riskMinutes > 0) bg = 'bg-amber-500'

          return (
            <span
              key={v.shift.id}
              className={`absolute top-0.5 bottom-0.5 rounded-sm ${bg}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          )
        })}
        {/* Now indicator line */}
        <span
          className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-accent shadow dark:bg-accent-dark"
          style={{ left: `${pct(nowMin)}%` }}
        />
      </div>
      <div className="flex justify-between pt-1 text-[10px] text-ink-muted">
        <span>6:30</span>
        <span>9</span>
        <span>12</span>
        <span>3</span>
        <span>6 pm</span>
      </div>
    </div>
  )
}

interface Props {
  editor: Editor
  onExpired: (message: string) => void
  graceMinutes?: number
}

export default function LiveView({ editor, onExpired, graceMinutes = 15 }: Props) {
  const token = editor.token
  const [filter, setFilter] = useState<LiveLevel | 'all'>('all')
  const [by, setBy] = useState<'cleaners' | 'clients'>('cleaners')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savingGrace, setSavingGrace] = useState(false)
  const {
    board,
    liveData,
    loading,
    error,
    now,
    refreshing,
    refresh: handleRefresh,
    toggleHandled,
  } = useLiveBoard({
    editor,
    onExpired,
    graceMinutes,
  })

  const handleGraceChange = useCallback(
    (mins: number) => {
      setSavingGrace(true)
      saveGraceSetting(mins, token)
        .then(() => settingsChanged())
        .catch((err) => {
          if (isSignInError(err)) onExpired(EXPIRED)
        })
        .finally(() => setSavingGrace(false))
    },
    [token, onExpired],
  )

  if (loading) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-20 text-ink-muted">
        <Spinner className="size-10 text-accent dark:text-accent-dark" />
        <p>Loading today's schedule from Camelo…</p>
      </div>
    )
  }

  if (error && !liveData) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        {error instanceof Error ? error.message : 'Could not load the live board.'}
      </p>
    )
  }

  if (!board) return null

  const filteredCleaners = board.cleaners.filter((c) => (filter === 'all' ? true : c.level === filter))
  const filteredClients = board.clients.filter((g) => (filter === 'all' ? true : g.level === filter))

  return (
    <div className="grid gap-4">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-raised px-4 py-3">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-ink-muted uppercase">Today · Toronto</div>
          <h2 className="font-display text-xl font-bold">Live board</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="tabular-nums">Updated {fmtTime(liveData?.now ?? now)}</span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-hairline bg-surface px-3 py-1.5 font-semibold text-ink hover:border-accent disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            className={`rounded-lg border border-hairline px-3 py-1.5 font-semibold transition ${
              settingsOpen ? 'bg-accent text-on-nest-teal dark:text-ink' : 'bg-surface text-ink hover:border-accent'
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {settingsOpen && (
        <section aria-label="Settings" className="grid gap-4 rounded-xl border border-hairline bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Settings</h2>
            <button type="button" onClick={() => setSettingsOpen(false)} className="text-xs text-ink-muted underline">
              Close
            </button>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold">Grace period</span>
            <div className="flex flex-wrap gap-1 rounded-lg border border-hairline bg-surface p-1" role="group">
              {GRACES.map((g) => (
                <button
                  key={g}
                  type="button"
                  disabled={savingGrace}
                  onClick={() => handleGraceChange(g)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    graceMinutes === g
                      ? 'bg-accent text-on-nest-teal shadow-sm dark:text-ink'
                      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                  }`}
                >
                  {g} min
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              How long after the start before someone shows as Late. It is also the margin for At risk and Running over. One setting for
              everyone; Punctuality uses it too.
            </p>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold">Group by</span>
            <div className="flex w-fit gap-1 rounded-lg border border-hairline bg-surface p-1" role="group">
              <button
                type="button"
                onClick={() => setBy('cleaners')}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  by === 'cleaners'
                    ? 'bg-accent text-on-nest-teal shadow-sm dark:text-ink'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                Cleaners
              </button>
              <button
                type="button"
                onClick={() => setBy('clients')}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  by === 'clients'
                    ? 'bg-accent text-on-nest-teal shadow-sm dark:text-ink'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                Clients
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Next 30 Minutes Attention Strip (ADR 0029) */}
      {board.next30Minutes.length > 0 && (
        <section
          aria-label="Next 30 minutes"
          className="rounded-xl border border-amber-500/80 bg-amber-50/50 p-4 dark:border-amber-500/50 dark:bg-amber-950/30"
        >
          <header className="flex items-center gap-2 pb-2">
            <h2 className="font-display text-sm font-bold tracking-wider text-amber-900 uppercase dark:text-amber-200">Next 30 minutes</h2>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              {board.next30Minutes.length} visit{board.next30Minutes.length === 1 ? '' : 's'}
            </span>
          </header>
          <ul className="grid gap-2">
            {board.next30Minutes.map((v) => {
              const startIso = v.shift.startTime
              const clientName = v.shift.client?.name || v.shift.jobSite?.name || 'Client'
              const cleanerName = v.shift.assignee?.name || 'Unassigned'
              return (
                <li
                  key={v.shift.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/60 bg-surface p-2.5 text-sm shadow-sm dark:border-amber-900/60"
                >
                  <div className="grid gap-0.5">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="font-bold text-ink tabular-nums">{fmtTime(Date.parse(startIso))}</span>
                      <span>{clientName}</span>
                      <span className="text-ink-muted">
                        · {cleanerName} ({partnersOf(v)})
                      </span>
                      <VisitChip visit={v} />
                    </div>
                    <div className="text-xs text-ink-muted">{visitWhy(v, graceMinutes)}</div>
                  </div>
                  {v.level === 'red' && (
                    <button
                      type="button"
                      onClick={() => toggleHandled(v.shift.id)}
                      className="rounded border border-amber-600 bg-surface px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-950"
                    >
                      {v.handled ? 'Handled ✓' : 'Mark handled'}
                    </button>
                  )}
                  {v.handled && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Handled
                      <button
                        type="button"
                        onClick={() => toggleHandled(v.shift.id)}
                        className="ml-1 text-[11px] underline hover:text-amber-950 dark:hover:text-amber-200"
                        title="Undo handled"
                      >
                        (undo)
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Filter Row: Counts for All, Red, Yellow, Grey */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
            filter === 'all'
              ? 'border-accent bg-accent text-on-nest-teal shadow-sm dark:text-ink'
              : 'border-hairline bg-surface text-ink hover:border-accent'
          }`}
        >
          <span className="font-display font-bold tabular-nums">{board.counts.total}</span>
          <span>All</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'red' ? 'all' : 'red')}
          aria-pressed={filter === 'red'}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
            board.counts.red === 0 ? 'opacity-60' : ''
          }${
            filter === 'red' ? 'border-red-600 bg-red-600 text-white shadow-sm' : 'border-hairline bg-surface text-ink hover:border-red-500'
          }`}
        >
          <span className="font-display font-bold text-red-600 tabular-nums dark:text-red-400">{board.counts.red}</span>
          <span>Act now</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'yellow' ? 'all' : 'yellow')}
          aria-pressed={filter === 'yellow'}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
            board.counts.yellow === 0 ? 'opacity-60' : ''
          }${
            filter === 'yellow'
              ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
              : 'border-hairline bg-surface text-ink hover:border-amber-500'
          }`}
        >
          <span className="font-display font-bold text-amber-600 tabular-nums dark:text-amber-400">{board.counts.yellow}</span>
          <span>Watch</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'grey' ? 'all' : 'grey')}
          aria-pressed={filter === 'grey'}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
            board.counts.grey === 0 ? 'opacity-60' : ''
          }${
            filter === 'grey'
              ? 'border-ink bg-ink text-surface shadow-sm dark:bg-surface-raised dark:text-ink'
              : 'border-hairline bg-surface text-ink hover:border-ink-muted'
          }`}
        >
          <span className="font-display font-bold text-ink-muted tabular-nums">{board.counts.grey}</span>
          <span>Routine</span>
        </button>

        <span className="ml-auto text-xs text-ink-muted">
          {filter === 'all' ? `Grace ${graceMinutes} min · most urgent first` : `Showing ${filter} only · tap again to show all`}
        </span>
      </div>

      {/* Main Board View: Cleaners Cards or Client Groups */}
      {by === 'cleaners' ? (
        filteredCleaners.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-surface-raised p-8 text-center text-ink-muted">
            {filter === 'all' ? 'No cleaners scheduled today.' : `No cleaners currently in ${filter}.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCleaners.map((c) => {
              const borderCls =
                c.level === 'red'
                  ? 'border-red-500 shadow-sm dark:border-red-600'
                  : c.level === 'yellow'
                    ? 'border-amber-500 shadow-sm dark:border-amber-600'
                    : 'border-hairline'

              return (
                <article key={c.cleaner.id} className={`overflow-hidden rounded-xl border bg-surface-raised ${borderCls}`}>
                  <header className="grid gap-1.5 p-4 pb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-base font-bold text-ink">{c.cleaner.name}</h2>
                      <span className="text-xs text-ink-muted">
                        {c.visits.length} visit{c.visits.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <HeadChips card={c} />
                  </header>

                  {/* Day Timeline Strip */}
                  <DayTimeline visits={c.visits} now={now} />

                  {/* Visits List */}
                  <ol className="divide-y divide-hairline border-t border-hairline">
                    {c.visits.map((v) => {
                      const startIso = v.shift.startTime
                      const endIso = v.shift.endTime
                      const clientName = v.shift.client?.name || v.shift.jobSite?.name || 'Client'
                      const past = v.status === 'done' || v.status === 'no-show'

                      return (
                        <li
                          key={v.shift.id}
                          className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 p-3 text-sm ${past ? 'opacity-65' : ''}`}
                        >
                          <div className="text-xs font-semibold text-ink tabular-nums">
                            <div>{fmtTime(Date.parse(startIso))}</div>
                            <div className="text-[11px] font-normal text-ink-muted">{fmtTime(Date.parse(endIso))}</div>
                          </div>
                          <div className="grid min-w-0 gap-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="truncate font-semibold text-ink">{clientName}</span>
                              <VisitChip visit={v} />
                            </div>
                            <div className="text-xs text-ink-muted">{partnersOf(v)}</div>
                            {visitWhy(v, graceMinutes) && <div className="text-xs text-ink-muted">{visitWhy(v, graceMinutes)}</div>}
                            {v.level === 'red' && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleHandled(v.shift.id)}
                                  className="rounded border border-amber-600 bg-surface px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-950"
                                >
                                  {v.handled ? 'Handled ✓' : 'Mark handled'}
                                </button>
                              </div>
                            )}
                            {v.handled && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Handled
                                  <button
                                    type="button"
                                    onClick={() => toggleHandled(v.shift.id)}
                                    className="ml-1 text-[11px] underline hover:text-amber-950 dark:hover:text-amber-200"
                                    title="Undo handled"
                                  >
                                    (undo)
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </article>
              )
            })}
          </div>
        )
      ) : /* Clients Grouped View */
      filteredClients.length === 0 ? (
        <p className="rounded-xl border border-hairline bg-surface-raised p-8 text-center text-ink-muted">
          {filter === 'all' ? 'No clients scheduled today.' : `No clients currently in ${filter}.`}
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((g) => {
            const borderCls =
              g.level === 'red'
                ? 'border-red-500 shadow-sm dark:border-red-600'
                : g.level === 'yellow'
                  ? 'border-amber-500 shadow-sm dark:border-amber-600'
                  : 'border-hairline'

            return (
              <article key={g.clientKey} className={`overflow-hidden rounded-xl border bg-surface-raised ${borderCls}`}>
                <header className="p-4 pb-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-display text-base font-bold text-ink">{g.clientName}</h2>
                    <span className="text-xs text-ink-muted">
                      {g.visits.length} cleaner visit{g.visits.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </header>

                <ol className="divide-y divide-hairline border-t border-hairline">
                  {g.visits.map((v) => {
                    const startIso = v.shift.startTime
                    const endIso = v.shift.endTime
                    const cleanerName = v.shift.assignee?.name || 'Unassigned'
                    const past = v.status === 'done' || v.status === 'no-show'

                    return (
                      <li
                        key={v.shift.id}
                        className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 p-3 text-sm ${past ? 'opacity-65' : ''}`}
                      >
                        <div className="text-xs font-semibold text-ink tabular-nums">
                          <div>{fmtTime(Date.parse(startIso))}</div>
                          <div className="text-[11px] font-normal text-ink-muted">{fmtTime(Date.parse(endIso))}</div>
                        </div>
                        <div className="grid min-w-0 gap-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="truncate font-semibold text-ink">{cleanerName}</span>
                            <VisitChip visit={v} />
                          </div>
                          <div className="text-xs text-ink-muted">{partnersOf(v)}</div>
                          {visitWhy(v, graceMinutes) && <div className="text-xs text-ink-muted">{visitWhy(v, graceMinutes)}</div>}
                          {v.level === 'red' && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleHandled(v.shift.id)}
                                className="rounded border border-amber-600 bg-surface px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-950"
                              >
                                {v.handled ? 'Handled ✓' : 'Mark handled'}
                              </button>
                            </div>
                          )}
                          {v.handled && (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Handled
                                <button
                                  type="button"
                                  onClick={() => toggleHandled(v.shift.id)}
                                  className="ml-1 text-[11px] underline hover:text-amber-950 dark:hover:text-amber-200"
                                  title="Undo handled"
                                >
                                  (undo)
                                </button>
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </article>
            )
          })}
        </div>
      )}

      {/* Rules Explanatory Footer Panel */}
      <section aria-labelledby="live-rules-h" className="rounded-xl border border-hairline bg-surface-raised p-4">
        <h2 id="live-rules-h" className="mb-2 font-display text-sm font-bold text-ink">
          How each status is worked out
        </h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs md:grid-cols-[max-content_1fr]">
          <dt className="font-semibold text-red-700 dark:text-red-400">Late (Act now)</dt>
          <dd className="text-ink-muted">
            More than {graceMinutes} minutes after start with no clock-in. Turns Red at twice grace (30 min) or if next visit is at risk.
          </dd>

          <dt className="font-semibold text-amber-700 dark:text-amber-400">At risk</dt>
          <dd className="text-ink-muted">
            Expected finish of previous visit plus drive time puts arrival more than {graceMinutes} minutes late.
          </dd>

          <dt className="font-semibold text-amber-700 dark:text-amber-400">Running over</dt>
          <dd className="text-ink-muted">Still clocked in more than {graceMinutes} minutes after scheduled end.</dd>

          <dt className="font-semibold text-amber-700 dark:text-amber-400">Wrong place</dt>
          <dd className="text-ink-muted">Clocked in at a different client or job site than booked.</dd>

          <dt className="font-semibold text-emerald-700 dark:text-emerald-400">On site</dt>
          <dd className="text-ink-muted">Clocked in, currently active on site.</dd>

          <dt className="font-semibold text-ink">Due now</dt>
          <dd className="text-ink-muted">Scheduled start was less than {graceMinutes} minutes ago, waiting for clock-in.</dd>

          <dt className="font-semibold text-red-700 dark:text-red-400">No-show</dt>
          <dd className="text-ink-muted">Visit ended with no timesheet logged.</dd>
        </dl>
      </section>
    </div>
  )
}
