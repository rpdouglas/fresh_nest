import { type UseQueryResult, useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { feedbackAction, isSignInError, scheduleCheckAction } from '../api'
import { money } from '../lib/billing'
import type { Level, Scorecard } from '../lib/dashboard'
import { judge, kudosCard, overtimeRisks, paperwork, samePointLastPeriod, scorecard, upTo, yesterdayProblems } from '../lib/dashboard'
import { earlierToInvoiceQuery } from '../lib/dashboardQueries'
import { dayLabel, exact, fridayOf, hours } from '../lib/payroll'
import { percent } from '../lib/punctuality'
import {
  clientRatesQuery,
  feedbackQuery,
  invoicedQuery,
  placesDone,
  placesQuery,
  queryClient,
  reviewQuery,
  soloOkQuery,
  weekQuery,
} from '../lib/queries'
import { formatTime } from '../lib/schedule'
import type { CheckKind, Problem } from '../lib/scheduleCheck'
import { CHECK_DAYS, addressesToPlace, checkSchedule, weeksFor } from '../lib/scheduleCheck'
import { INVOICE_LOOK_BACK, RECORD_START, TARGETS } from '../lib/targets'
import { TZ, addDays } from '../lib/week'
import type { Feedback, View, WeekResponse } from '../types'
import Spinner from './Spinner'
import Sparkle from './Sparkle'
import LiveToday from './LiveToday'
import TrendsPanel from './TrendsPanel'
import type { Editor } from './useEditor'

const muted = 'text-ink-muted'
const line = 'border-hairline'
const panel = `overflow-hidden rounded-xl border bg-surface-raised ${line}`
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

// Status chips carry an icon and a word, never colour alone.
const CHIP: Record<Level | 'fyi', string> = {
  good: 'text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950 before:content-["✓"]',
  warn: 'text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950 before:content-["▲"]',
  bad: 'text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-950 before:content-["●"]',
  fyi: 'text-ink bg-ink/10 before:content-["○"]',
}
/** The stripe down an item's left edge: red to act, amber to watch, none for the rest (decision 0043). */
const STRIPE: Record<Level | 'fyi', string> = {
  bad: 'border-l-red-600',
  warn: 'border-l-amber-500',
  good: 'border-l-transparent',
  fyi: 'border-l-transparent',
}

function Chip({ level, children }: { level: Level | 'fyi'; children: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 text-xs leading-6 font-bold whitespace-nowrap before:text-[10px] ${CHIP[level]}`}
    >
      {children}
    </span>
  )
}

/** The weeks the schedule check reads, as one list of shifts once all have loaded. */
function weeksAhead(results: UseQueryResult<WeekResponse>[]) {
  return {
    shifts: results.every((r) => r.data) ? results.flatMap((r) => r.data!.shifts) : null,
    error: results.find((r) => r.error)?.error ?? null,
  }
}

/** How each kind of schedule problem is shown, and the report that helps fix it. */
const CHECK: Record<CheckKind, { level: Level; chip: string; few: string; view: View; label: string }> = {
  unassigned: { level: 'bad', chip: 'Unassigned', few: 'unassigned', view: 'client', label: 'By client' },
  double: { level: 'bad', chip: 'Booked twice', few: 'booked twice', view: 'staff', label: 'By staff' },
  solo: { level: 'warn', chip: 'Solo', few: 'solo', view: 'teams', label: 'Daily teams' },
  gap: { level: 'warn', chip: 'Tight gap', few: 'tight gap', view: 'teams', label: 'Daily teams' },
  long: { level: 'warn', chip: 'Long day', few: 'long day', view: 'staff', label: 'By staff' },
  overtime: { level: 'warn', chip: 'Over 44 h', few: 'over 44 h', view: 'staff', label: 'By staff' },
}
/** At most this many schedule problems in Needs attention; the panel below lists them all. */
const COMING_UP_MAX = 6
/** "1 unassigned", "2 solo", ... for the kinds present, worst first. */
const tally = (problems: Problem[]): [Level, string][] =>
  (Object.keys(CHECK) as CheckKind[])
    .map((k): [Level, string, number] => [
      CHECK[k].level,
      `${problems.filter((p) => p.kind === k).length} ${CHECK[k].few}`,
      problems.filter((p) => p.kind === k).length,
    ])
    .filter(([, , n]) => n > 0)
    .map(([level, text]) => [level, text])

interface Props {
  editor: Editor
  onExpired: (message: string) => void
  /** Opens a report, optionally at a pay period or a 7-day range. */
  onOpen: (view: View, start?: string) => void
  graceMinutes?: number
}

interface Item {
  key: string
  level: Level | 'fyi'
  chip: string
  what: string
  detail?: string
  open?: [View, string?]
  openLabel?: string
  action?: { label: string; run: () => void; busy?: boolean }
}

function Group({
  title,
  summary,
  items,
  onOpen,
}: {
  title: string
  summary: [Level | 'fyi', string][]
  items: Item[]
  onOpen: Props['onOpen']
}) {
  // Collapsed to a one-line summary on a phone, open on a computer.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-width: 640px)').matches)
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} className={`border-t ${line}`}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2.5 gap-y-1.5 bg-surface-sunken/40 px-4 py-2.5 dark:bg-surface-sunken/50 [&::-webkit-details-marker]:hidden">
        <span className={`text-xs font-bold tracking-[0.08em] uppercase ${muted}`}>{title}</span>
        {!open &&
          summary.map(([level, text]) => (
            <Chip key={text} level={level}>
              {text}
            </Chip>
          ))}
        <span aria-hidden="true" className={`ml-auto ${muted} transition-transform ${open ? '' : '-rotate-90'}`}>
          ▾
        </span>
      </summary>
      <ul>
        {items.map((it) => (
          <li
            key={it.key}
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-t border-l-4 px-4 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] ${line} ${STRIPE[it.level]}`}
          >
            <span className="justify-self-start">
              <Chip level={it.level}>{it.chip}</Chip>
            </span>
            <span className="col-span-2 font-semibold sm:col-span-1 sm:col-start-2 sm:row-start-1">
              {it.what}
              {it.detail && <span className={`block text-sm font-normal ${muted}`}>{it.detail}</span>}
            </span>
            <span className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
              {it.action ? (
                <button
                  className={`rounded-lg border px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`}
                  disabled={it.action.busy}
                  onClick={it.action.run}
                >
                  {it.action.label}
                </button>
              ) : (
                it.open && (
                  <button
                    className="text-sm font-semibold whitespace-nowrap text-accent hover:underline dark:text-accent-dark"
                    onClick={() => onOpen(...it.open!)}
                  >
                    {it.openLabel} →
                  </button>
                )
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Tile({
  label,
  level,
  levelText,
  value,
  sub,
  target,
  vs,
  wide,
}: {
  label: string
  level: Level | null
  levelText?: string
  value: string
  sub?: string
  target?: string
  vs?: string
  wide?: boolean
}) {
  return (
    <div className={`grid content-start gap-1 bg-surface-raised px-4 py-3.5 ${wide ? 'col-span-full' : ''}`}>
      <span className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
        {label}
        {level && <Chip level={level}>{levelText ?? (level === 'good' ? 'On target' : level === 'warn' ? 'Off target' : 'Over')}</Chip>}
      </span>
      <span className="font-display text-3xl leading-tight font-bold tabular-nums">
        {value} {sub && <small className="font-sans text-sm font-semibold text-ink-muted">{sub}</small>}
      </span>
      {target && <span className={`text-xs ${muted}`}>{target}</span>}
      {vs && <span className={`text-[13px] ${muted}`}>{vs}</span>}
    </div>
  )
}

const pct = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x * 100).toFixed(1)}%`
const per100 = (n: number, visits: number) => (visits ? (n * 100) / visits : null)

function Scorecards({ now, prev, start, today }: { now: Scorecard; prev: Scorecard | null; start: string; today: string }) {
  const j = judge(now)
  const day = Math.min(7, Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000) + 1)
  const change = prev && prev.billed ? (now.billed - prev.billed) / prev.billed : null
  const vs = (text: string) => (prev ? `vs ${text} at this point last period` : undefined)
  const comp = per100(now.complaints, now.feedbackVisits)
  const kud = per100(now.kudos, now.feedbackVisits)
  return (
    <div className={`grid grid-cols-1 gap-px border-t bg-hairline min-[420px]:grid-cols-2 ${line}`}>
      <Tile
        wide
        label="Billed (approved visits)"
        level={change === null ? null : change >= 0 ? 'good' : 'warn'}
        levelText={change === null ? undefined : change >= 0 ? 'Up on last period' : 'Down on last period'}
        value={money(now.billed)}
        sub={now.pending ? `+ ${money(now.pending)} waiting approval` : undefined}
        target={`Day ${day} of 7`}
        vs={prev ? `${change === null ? '' : `${pct(change)} `}vs ${money(prev.billed)} at this point last period` : undefined}
      />
      <Tile
        label="On time"
        level={j.onTime}
        value={percent(now.onTimeRate)}
        target={`Target ${Math.round(TARGETS.onTimeRate * 100)}% or better`}
        vs={prev ? vs(percent(prev.onTimeRate)) : undefined}
      />
      <Tile
        label="No-shows"
        level={j.noShows}
        value={String(now.noShows)}
        sub={`of ${now.visits} visits`}
        target={`Target ${TARGETS.noShows}`}
        vs={prev ? vs(String(prev.noShows)) : undefined}
      />
      <Tile
        wide
        label="Hours vs schedule"
        level={j.hours}
        value={now.hoursVsSchedule === null ? '–' : pct(now.hoursVsSchedule)}
        target={`Target within ±${Math.round(TARGETS.hoursBand * 100)}%`}
        vs={prev && prev.hoursVsSchedule !== null ? vs(pct(prev.hoursVsSchedule)) : undefined}
      />
      <div className="col-span-full grid gap-2 bg-surface-raised px-4 py-3.5">
        <span className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
          Client feedback
          {j.complaints && <Chip level={j.complaints}>{j.complaints === 'good' ? 'Complaints on target' : 'Complaints above target'}</Chip>}
        </span>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <div className="grid content-start gap-0.5">
            <span className="font-display text-3xl leading-tight font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
              {now.kudos} <small className="font-sans text-sm font-semibold text-ink-muted">kudos</small>
            </span>
            <span className={`text-[13px] ${muted}`}>
              {kud === null ? 'No visits yet' : `${kud.toFixed(1)} per 100 visits`}
              {prev && ` · ${prev.kudos} at this point last period`}
            </span>
          </div>
          <div className="grid content-start gap-0.5">
            <span className="font-display text-3xl leading-tight font-bold tabular-nums">
              {now.complaints}{' '}
              <small className="font-sans text-sm font-semibold text-ink-muted">{now.complaints === 1 ? 'complaint' : 'complaints'}</small>
            </span>
            <span className={`text-[13px] ${muted}`}>
              {comp === null ? 'No visits yet' : `${comp.toFixed(1)} per 100 visits`} · target under {TARGETS.complaintsPer100}
              {prev && ` · ${prev.complaints} last period`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardView({ editor, onExpired, onOpen, graceMinutes }: Props) {
  const [now] = useState(() => Date.now())
  const today = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(now)), [now])
  const yesterday = addDays(today, -1)
  const start = fridayOf(today)
  const prevStart = addDays(start, -7)
  const token = editor.token
  // What could not be saved (Mark OK, Pass it on); what could not be loaded is read from the loads below.
  const [unsaved, setUnsaved] = useState<string[]>([])
  const [passing, setPassing] = useState<Set<string>>(new Set())
  const [marking, setMarking] = useState<Set<string>>(new Set())
  const [marked, setMarked] = useState<Problem[]>([])

  // Loaded through the site's one cache (lib/queries.ts): a pay period or week already loaded
  // by a report is not asked for again, and coming back here within five minutes asks for nothing.
  const curQ = useQuery(reviewQuery(start, token))
  const prevQ = useQuery(reviewQuery(prevStart, token))
  const feedbackQ = useQuery(feedbackQuery(addDays(today, -89), today, token))
  // ticks for as far back as "approved, not yet invoiced" can look, and never from before the record starts
  const ticksFrom = [addDays(start, -7 * (INVOICE_LOOK_BACK - 1)), RECORD_START].sort()[1]
  const invoicedQ = useQuery(invoicedQuery(ticksFrom, addDays(start, 6), token))
  // the clients' prices: no dollar figure is shown until they have loaded
  const ratesQ = useQuery(clientRatesQuery(token))
  // the schedule check: today (what has not started yet) and the seven days after
  const from = today
  const okQ = useQuery(soloOkQuery(from, addDays(from, CHECK_DAYS - 1), token))
  const ahead = useQueries({ queries: weeksFor(from).map((w) => weekQuery(w, token)), combine: weeksAhead })
  const coming = ahead.shifts
  const addresses = useMemo(() => (coming ? addressesToPlace(coming, from) : []), [coming, from])
  const placesQ = useQuery({ ...placesQuery(addresses, token), enabled: addresses.length > 0 })

  const cur = curQ.data ?? null
  const prev = prevQ.data ?? null
  const feedback = feedbackQ.data ?? null
  const invoiced = invoicedQ.data ?? null
  const rates = ratesQ.data ?? null
  // Approved time not yet invoiced looks further back than last period: one earlier pay period at a time, for
  // as long as the one just read still has something to invoice (lookBack in lib/dashboard.ts). It waits for
  // what it is worked out from, and is worked out again when any of the three is read again.
  const backQ = useQuery({
    ...earlierToInvoiceQuery(prev, rates, invoiced, [prevQ.dataUpdatedAt, ratesQ.dataUpdatedAt, invoicedQ.dataUpdatedAt], token),
    enabled: !!(prev && rates && invoiced),
  })
  const back = backQ.data ?? null
  const okSolo = useMemo(() => new Set(okQ.data ?? []), [okQ.data])
  const placesData = placesQ.data
  // how many times the lookups have answered: they are asked again a limited number of times (lib/queries.ts)
  const placesRounds = placesQ.dataUpdatedAt ? (queryClient.getQueryState(placesQuery(addresses, token).queryKey)?.dataUpdateCount ?? 0) : 0
  const places = useMemo(
    () => ({
      found: new Map(Object.entries(placesData?.places ?? {})),
      // once the schedule itself has loaded, a failure here means only the drive times are missing
      state: placesQ.isError
        ? ('failed' as const)
        : placesData
          ? placesData.failed
            ? ('failed' as const)
            : placesDone(placesData, placesRounds)
              ? ('done' as const)
              : ('looking' as const)
          : coming && !addresses.length
            ? ('done' as const)
            : ('looking' as const),
    }),
    [placesData, placesRounds, placesQ.isError, coming, addresses.length],
  )

  const loads: [what: string, error: unknown][] = [
    ['This pay period', curQ.error],
    ['Last pay period', prevQ.error],
    ['Client feedback', feedbackQ.error],
    ['Invoicing', invoicedQ.error],
    ['Earlier weeks still to invoice', backQ.error],
    ['Client prices', ratesQ.error],
    ['Solo visits marked OK', okQ.error],
    ['The schedule for the days ahead', ahead.error],
  ]
  const expired = [...loads.map(([, e]) => e), placesQ.error].some(isSignInError)
  useEffect(() => {
    if (expired) onExpired(EXPIRED)
  }, [expired, onExpired])
  const errors = [
    ...loads
      .filter(([, e]) => e && !isSignInError(e))
      .map(([what, e]) => `${what} could not be loaded${e instanceof Error ? `: ${e.message}` : '.'}`),
    ...unsaved,
  ]

  const markOk = (problem: Problem, ok: boolean) => {
    const id = problem.shiftId!
    setMarking((s) => new Set(s).add(id))
    scheduleCheckAction({ action: 'ok', shiftId: id, date: problem.date, ok }, token)
      .then(() => {
        queryClient.setQueryData(soloOkQuery(from, addDays(from, CHECK_DAYS - 1), token).queryKey, (ids) =>
          ok ? [...(ids ?? []).filter((x) => x !== id), id] : (ids ?? []).filter((x) => x !== id),
        )
        setMarked((m) => (ok ? [...m.filter((p) => p.shiftId !== id), problem] : m.filter((p) => p.shiftId !== id)))
      })
      .catch((e: unknown) => (isSignInError(e) ? onExpired(EXPIRED) : setUnsaved((x) => [...x, 'Mark OK could not be saved.'])))
      .finally(() => setMarking((s) => new Set([...s].filter((x) => x !== id))))
  }

  const passOn = (id: string, passedOn: boolean) => {
    setPassing((s) => new Set(s).add(id))
    feedbackAction<{ entry: Feedback }>({ action: 'passon', id, passedOn }, token)
      .then(({ entry }) =>
        queryClient.setQueryData(feedbackQuery(addDays(today, -89), today, token).queryKey, (list) =>
          list?.map((f) => (f.id === id ? entry : f)),
        ),
      )
      // other ranges that hold this entry (Client feedback's) are read again when next shown
      .then(() => queryClient.invalidateQueries({ queryKey: ['feedback'], refetchType: 'none' }))
      .catch((e: unknown) => (isSignInError(e) ? onExpired(EXPIRED) : setUnsaved((x) => [...x, 'Pass it on could not be saved.'])))
      .finally(() => setPassing((s) => new Set([...s].filter((x) => x !== id))))
  }

  const ready = cur && prev
  // only what had started by now, so both sides of the comparison are cut the same way
  const card = useMemo(
    () => cur && rates && feedback && scorecard(upTo(cur, now), rates, feedback, start, today, now, graceMinutes),
    [cur, rates, feedback, start, today, now, graceMinutes],
  )
  const lastCard = useMemo(() => {
    if (!prev || !rates || !feedback) return null
    const then = samePointLastPeriod(now)
    return scorecard(upTo(prev, then), rates, feedback, prevStart, addDays(today, -7), then, graceMinutes)
  }, [prev, rates, feedback, prevStart, today, now, graceMinutes])
  const y = useMemo(
    () => (ready ? yesterdayProblems(cur, prev, yesterday, now, graceMinutes) : null),
    [ready, cur, prev, yesterday, now, graceMinutes],
  )
  const paper = useMemo(
    // until the look further back is in, the figure covers this period and last
    () => (ready && rates && invoiced && feedback ? paperwork(cur, prev, rates, invoiced, feedback, now, RECORD_START, back?.read) : null),
    [ready, cur, prev, rates, invoiced, feedback, now, back],
  )
  const risks = useMemo(() => (cur ? overtimeRisks(cur, now) : []), [cur, now])
  const kudos = useMemo(() => (feedback ? kudosCard(feedback, today, start) : null), [feedback, today, start])
  const check = useMemo(
    () => (coming ? checkSchedule(coming, from, now, okSolo, places.found) : null),
    [coming, from, now, okSolo, places.found],
  )
  const when = (date: string) => (date === today ? 'Today' : date === addDays(today, 1) ? 'Tomorrow' : dayLabel(date))
  const checkItem = (p: Problem): Item => ({
    key: p.key,
    level: CHECK[p.kind].level,
    chip: CHECK[p.kind].chip,
    what: p.kind === 'overtime' ? p.what : `${when(p.date)}: ${p.what}`,
    detail: p.detail,
    open: [CHECK[p.kind].view, p.date],
    openLabel: CHECK[p.kind].label,
    action: p.kind === 'solo' ? { label: 'Mark OK', run: () => markOk(p, true), busy: marking.has(p.shiftId!) } : undefined,
  })
  const comingItems: Item[] = (check?.problems ?? []).slice(0, COMING_UP_MAX).map(checkItem)
  const comingMore = (check?.problems.length ?? 0) - comingItems.length

  const yItems: Item[] = (y?.problems ?? []).map((v) => {
    const who = v.shift.assignee?.name ?? 'Someone'
    const when = `${formatTime(v.shift.startTime, v.shift.timezone || TZ)} – ${formatTime(v.shift.endTime, v.shift.timezone || TZ)}`
    if (v.status === 'no-show')
      return {
        key: v.shift.id,
        level: 'bad',
        chip: 'No timesheet',
        what: `${who} at ${v.clientName}, ${when}`,
        detail: 'Nothing was logged for this visit. A missed clock-in, or a no-show?',
        open: ['review', prevStart <= yesterday && yesterday < start ? prevStart : start],
        openLabel: 'Unapproved timesheets',
      }
    if (v.status === 'late')
      return {
        key: v.shift.id,
        level: 'warn',
        chip: 'Late',
        what: `${who} ${v.lateBy} min late at ${v.clientName}`,
        detail: `Scheduled ${when}${v.leftEarlyBy ? `; also left ${v.leftEarlyBy} min early` : ''}.`,
        open: ['punctuality', yesterday < start ? prevStart : start],
        openLabel: 'Punctuality',
      }
    return {
      key: v.shift.id,
      level: 'warn',
      chip: 'Left early',
      what: `${who} left ${v.clientName} ${v.leftEarlyBy} min early`,
      detail: `Scheduled ${when}.`,
      open: ['punctuality', yesterday < start ? prevStart : start],
      openLabel: 'Punctuality',
    }
  })
  const periodItems: Item[] = risks.map((r) => ({
    key: r.key,
    level: r.level === 'over' ? 'bad' : 'warn',
    chip: 'Overtime',
    what: r.level === 'over' ? `${r.name} is over 44 h this period` : `${r.name} is on course for ${exact(r.projected)} this period`,
    detail: `${exact(r.worked)} worked${r.toCome ? ` + ${exact(r.toCome)} still scheduled` : ''}. Overtime starts after 44 h.`,
    open: ['payroll', start],
    openLabel: 'Payroll hours',
  }))
  const daysOld = paper?.oldestToInvoice ? Math.round((Date.parse(today) - Date.parse(paper.oldestToInvoice)) / 86_400_000) : 0
  const paperItems: Item[] = paper
    ? [
        ...(paper.waiting
          ? [
              {
                key: 'approve',
                level: paper.waitingLong > TARGETS.waitingLong ? 'warn' : 'fyi',
                chip: 'Approvals',
                what: `${paper.waiting} timesheet${paper.waiting === 1 ? '' : 's'} waiting for approval`,
                detail: `${paper.waitingLong ? `${paper.waitingLong} have waited more than 3 days. ` : ''}${hours(paper.waitingMinutes)} h in all, this period and last.`,
                open: ['review', start],
                openLabel: 'Unapproved timesheets',
              } as Item,
            ]
          : []),
        ...(paper.toInvoiceDays
          ? [
              {
                key: 'invoice',
                level: daysOld > TARGETS.invoiceDays ? 'warn' : 'fyi',
                chip: 'Invoicing',
                what: `${money(paper.toInvoice)} approved, not yet invoiced`,
                detail: `${paper.toInvoiceDays} client-day${paper.toInvoiceDays === 1 ? '' : 's'}${back ? `, looking back to ${dayLabel(back.from)}` : ''}; the oldest is ${dayLabel(paper.oldestToInvoice!)} (${daysOld} day${daysOld === 1 ? '' : 's'}).${
                  backQ.error
                    ? ' Earlier weeks could not be read, so there may be more.'
                    : !back
                      ? ' Still checking earlier weeks.'
                      : back.more
                        ? ' There may be more before that: open Invoicing on an earlier week.'
                        : ''
                }`,
                open: ['invoicing', paper.oldestToInvoice!],
                openLabel: 'Invoicing',
              } as Item,
            ]
          : []),
        ...paper.openComplaints.slice(0, 3).map((f): Item => ({
          key: f.id,
          level: 'warn',
          chip: 'Complaint',
          what: `Open complaint: ${f.clientName}, ${dayLabel(f.date)}`,
          detail: `${f.category}: “${f.text}”`,
          open: ['feedback'],
          openLabel: 'Client feedback',
        })),
      ]
    : []
  const count = (xs: Item[], chip: string) => xs.filter((x) => x.chip === chip).length
  const plural = (n: number, word: string) => `${n} ${word}`
  const attention = yItems.length + periodItems.length + (check?.problems.length ?? 0) + paperItems.length

  // the office to-do in one row of chips, as in the reference (decision 0043); the list itself is below
  const todo: [Level | 'fyi', string][] = ready
    ? [
        ...(yItems.length ? [['bad', plural(yItems.length, 'from yesterday')] as [Level, string]] : []),
        ...(periodItems.length ? [['warn', plural(periodItems.length, 'overtime')] as [Level, string]] : []),
        ...(paper?.waiting ? [['warn', `${paper.waiting} to approve`] as [Level, string]] : []),
        ...(paper?.toInvoiceDays ? [['fyi', `${money(paper.toInvoice)} to invoice`] as ['fyi', string]] : []),
        ...(check?.problems.length ? [['warn', plural(check.problems.length, 'schedule check')] as [Level, string]] : []),
      ]
    : []
  return (
    <div className="grid gap-5">
      <LiveToday editor={editor} onExpired={onExpired} graceMinutes={graceMinutes} onFullBoard={() => onOpen('live')} />
      {todo.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Office to-do">
          {todo.map(([level, text]) => (
            <a key={text} href="#att-h" className="rounded-full">
              <Chip level={level}>{text}</Chip>
            </a>
          ))}
        </div>
      )}
      {errors.map((e) => (
        <p
          key={e}
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {e}
        </p>
      ))}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section aria-labelledby="att-h" className={panel}>
          <header className="flex items-baseline gap-2.5 px-4 pt-3.5 pb-2.5">
            <h2 id="att-h" className="font-display text-lg font-bold">
              Needs attention
            </h2>
            <span className={`ml-auto text-sm ${muted}`}>{ready ? `${attention} item${attention === 1 ? '' : 's'}` : ''}</span>
          </header>
          {!ready ? (
            <p className={`flex items-center gap-2 border-t px-4 py-6 ${line} ${muted}`}>
              <Spinner className="size-5" /> Loading from Camelo…
            </p>
          ) : attention === 0 ? (
            <p className={`border-t px-4 py-6 font-semibold text-emerald-700 dark:text-emerald-400 ${line}`}>✓ Nothing needs attention.</p>
          ) : (
            <>
              {yItems.length > 0 && (
                <Group
                  title={`Yesterday · ${dayLabel(yesterday)}`}
                  onOpen={onOpen}
                  items={yItems}
                  summary={(
                    [
                      ['bad', plural(count(yItems, 'No timesheet'), 'no timesheet')],
                      ['warn', plural(count(yItems, 'Late'), 'late')],
                      ['warn', plural(count(yItems, 'Left early'), 'left early')],
                    ] as [Level, string][]
                  ).filter(([, t]) => !t.startsWith('0 '))}
                />
              )}
              {periodItems.length > 0 && (
                <Group
                  title="This pay period"
                  onOpen={onOpen}
                  items={periodItems}
                  summary={[['warn', plural(periodItems.length, 'overtime')]]}
                />
              )}
              {comingItems.length > 0 && (
                <Group
                  title="Coming up · today and the next 7 days"
                  onOpen={onOpen}
                  items={
                    comingMore > 0
                      ? [
                          ...comingItems,
                          { key: 'more', level: 'fyi', chip: `${comingMore} more`, what: `${comingMore} more in the schedule check below` },
                        ]
                      : comingItems
                  }
                  summary={tally(check!.problems)}
                />
              )}
              {paperItems.length > 0 && (
                <Group
                  title="Paperwork"
                  onOpen={onOpen}
                  items={paperItems}
                  summary={[
                    ...(paper!.waiting ? [['warn', `${paper!.waiting} to approve`] as [Level, string]] : []),
                    ...(paper!.toInvoiceDays ? [['fyi', `${money(paper!.toInvoice)} to invoice`] as ['fyi', string]] : []),
                    ...(paper!.openComplaints.length
                      ? [
                          [
                            'warn',
                            plural(paper!.openComplaints.length, paper!.openComplaints.length === 1 ? 'complaint' : 'complaints'),
                          ] as [Level, string],
                        ]
                      : []),
                  ]}
                />
              )}
            </>
          )}
          {y && y.total > 0 && (
            <p className={`border-t px-4 py-2.5 text-sm ${line} ${muted}`}>
              Yesterday: {y.total - y.problems.length} of {y.total} visits on time and to the end.
            </p>
          )}
        </section>

        <div className="grid min-w-0 gap-4">
          <section aria-labelledby="per-h" className={panel}>
            <header className="flex flex-wrap items-baseline gap-x-2.5 px-4 pt-3.5 pb-2.5">
              <h2 id="per-h" className="font-display text-lg font-bold">
                This pay period so far
              </h2>
              <span className={`text-sm ${muted}`}>
                {dayLabel(start)} – {dayLabel(addDays(start, 6))}
              </span>
            </header>
            {card ? (
              <Scorecards now={card} prev={lastCard} start={start} today={today} />
            ) : (
              <p className={`flex items-center gap-2 border-t px-4 py-6 ${line} ${muted}`}>
                <Spinner className="size-5" /> Loading…
              </p>
            )}
          </section>

          <section aria-labelledby="k-h" className={panel}>
            <header className="flex flex-wrap items-baseline gap-x-2.5 px-4 pt-3.5 pb-2.5">
              <h2 id="k-h" className="flex items-center gap-1.5 font-display text-lg font-bold">
                Recent kudos
                <Sparkle size={14} className="text-clay" />
              </h2>
              <span className={`text-sm ${muted}`}>Last 14 days{kudos ? ` · ${kudos.recent.length}` : ''}</span>
              <button
                className="ml-auto text-sm font-semibold text-accent hover:underline dark:text-accent-dark"
                onClick={() => onOpen('feedback')}
              >
                Client feedback →
              </button>
            </header>
            {!kudos ? (
              <p className={`flex items-center gap-2 border-t px-4 py-6 ${line} ${muted}`}>
                <Spinner className="size-5" /> Loading…
              </p>
            ) : kudos.recent.length === 0 ? (
              <p className={`border-t px-4 py-5 text-sm ${line} ${muted}`}>
                No kudos recorded in the last 14 days. Record them from Client hours or Client feedback.
              </p>
            ) : (
              <ul className={`border-t ${line}`}>
                {kudos.recent.slice(0, 5).map((f) => (
                  <li key={f.id} className={`grid gap-1 border-t px-4 py-3 first:border-t-0 ${line}`}>
                    <q className="text-[15px]">{f.text}</q>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-sm ${muted}`}>
                        {f.clientName} · {f.cleaners.map((c) => c.name).join(' & ') || 'no cleaner named'} · {dayLabel(f.date)} ·{' '}
                        {f.source.toLowerCase()}
                      </span>
                      {f.passedOnAt ? (
                        <button
                          className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                          title="Select to undo"
                          disabled={passing.has(f.id)}
                          onClick={() => passOn(f.id, false)}
                        >
                          ✓ Passed on{f.passedOnBy ? ` by ${f.passedOnBy === editor.email ? 'you' : f.passedOnBy}` : ''},{' '}
                          {new Date(f.passedOnAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </button>
                      ) : (
                        <button
                          className={`rounded-lg border px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`}
                          disabled={passing.has(f.id)}
                          onClick={() => passOn(f.id, true)}
                        >
                          Pass it on
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {kudos && kudos.leaders.length > 0 && (
              <p className={`border-t px-4 py-2.5 text-sm ${line} ${muted}`}>
                Most kudos this period: {kudos.leaders.map((l) => `${l.name} (${l.kudos})`).join(' · ')}
              </p>
            )}
          </section>
        </div>
      </div>
      {/* folded to one line until tapped (decision 0043): the live day and the to-do stay on the first screen */}
      <details role="region" aria-labelledby="sch-h" className={`group/fold ${panel}`}>
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
          <h2 id="sch-h" className="font-display text-lg font-bold">
            Schedule check · today and the next 7 days
          </h2>
          {check &&
            (check.problems.length ? (
              tally(check.problems).map(([level, text]) => (
                <Chip key={text} level={level}>
                  {text}
                </Chip>
              ))
            ) : (
              <Chip level="good">No problems</Chip>
            ))}
          <span aria-hidden="true" className={`ml-auto ${muted} -rotate-90 transition-transform group-open/fold:rotate-0`}>
            ▾
          </span>
        </summary>
        <p className={`border-t px-4 py-2 text-sm ${line} ${muted}`}>Teams of two for Cleaning, AirBnB and Deep Clean</p>
        {!check ? (
          <p className={`flex items-center gap-2 border-t px-4 py-6 ${line} ${muted}`}>
            <Spinner className="size-5" /> Loading the schedule from Camelo…
          </p>
        ) : (
          <>
            <ul className={`border-t ${line}`}>
              {check.days.map((d) => (
                <li key={d.date} className={`border-t first:border-t-0 ${line}`}>
                  <details className="group">
                    <summary
                      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 [&::-webkit-details-marker]:hidden ${d.problems.length ? 'cursor-pointer list-none' : 'pointer-events-none list-none'}`}
                    >
                      <b className="w-28">{when(d.date)}</b>
                      <span className={`text-sm tabular-nums ${muted}`}>
                        {d.visits
                          ? `${d.visits} visit${d.visits === 1 ? '' : 's'}${d.date === today ? ' still to start' : ''} · ${d.cleaners} cleaner${d.cleaners === 1 ? '' : 's'}`
                          : d.date === today
                            ? 'Nothing left to start'
                            : 'Nothing scheduled'}
                      </span>
                      <span className="ml-auto flex flex-wrap items-center gap-1.5">
                        {d.problems.length
                          ? tally(d.problems).map(([level, text]) => (
                              <Chip key={text} level={level}>
                                {text}
                              </Chip>
                            ))
                          : d.visits > 0 && (
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">✓ No problems</span>
                            )}
                        {d.problems.length > 0 && (
                          <span aria-hidden="true" className={`${muted} -rotate-90 transition-transform group-open:rotate-0`}>
                            ▾
                          </span>
                        )}
                      </span>
                    </summary>
                    <ul className="bg-surface-sunken/40 dark:bg-surface-sunken/50">
                      {d.problems.map((p) => (
                        <li key={p.key} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 ${line}`}>
                          <Chip level={CHECK[p.kind].level}>{CHECK[p.kind].chip}</Chip>
                          <span className="min-w-0 flex-1 basis-64 font-semibold">
                            {p.what}
                            <span className={`block text-sm font-normal ${muted}`}>{p.detail}</span>
                          </span>
                          {p.kind === 'solo' ? (
                            <button
                              className={`rounded-lg border px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`}
                              disabled={marking.has(p.shiftId!)}
                              onClick={() => markOk(p, true)}
                            >
                              Mark OK
                            </button>
                          ) : (
                            <button
                              className="text-sm font-semibold whitespace-nowrap text-accent hover:underline dark:text-accent-dark"
                              onClick={() => onOpen(CHECK[p.kind].view, p.date)}
                            >
                              {CHECK[p.kind].label} →
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
            {check.problems
              .filter((p) => p.kind === 'overtime')
              .map((p) => (
                <p key={p.key} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 ${line}`}>
                  <Chip level="warn">{CHECK.overtime.chip}</Chip>
                  <span className="font-semibold">{p.what}</span>
                  <span className={`text-sm ${muted}`}>{p.detail}</span>
                </p>
              ))}
            {marked.map((p) => (
              <p key={p.key} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 text-sm ${line} ${muted}`}>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">✓ Marked OK</span>
                {when(p.date)}: {p.what}
                <button
                  className="ml-auto font-semibold text-accent hover:underline disabled:opacity-50 dark:text-accent-dark"
                  disabled={marking.has(p.shiftId!)}
                  onClick={() => markOk(p, false)}
                >
                  Undo
                </button>
              </p>
            ))}
            <p className={`border-t px-4 py-2.5 text-sm ${line} ${muted}`}>
              {check.okSolo > 0 && `${check.okSolo} solo visit${check.okSolo === 1 ? '' : 's'} already marked OK. `}
              {places.state === 'looking'
                ? 'Working out drive times between visits: addresses are looked up one a second the first time, then remembered.'
                : places.state === 'failed'
                  ? `Drive times could not be worked out just now${check.gapsNotChecked ? ` for ${check.gapsNotChecked} pair${check.gapsNotChecked === 1 ? '' : 's'} of visits` : ''}; they will be tried again next time.`
                  : check.gapsNotChecked
                    ? `Drive time could not be estimated for ${check.gapsNotChecked} pair${check.gapsNotChecked === 1 ? '' : 's'} of visits (an address is missing or was not found on the map).`
                    : 'Drive times are estimates from the straight-line distance between addresses.'}{' '}
              On Call is left out.
            </p>
          </>
        )}
      </details>
      <details className={`group/fold ${panel}`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-lg font-bold">Trends · the last 13 pay periods</span>
          <span aria-hidden="true" className={`ml-auto ${muted} -rotate-90 transition-transform group-open/fold:rotate-0`}>
            ▾
          </span>
        </summary>
        <TrendsPanel
          token={token}
          today={today}
          now={now}
          idle={(!!cur && !!prev && !!coming) || errors.length > 0}
          onExpired={onExpired}
          graceMinutes={graceMinutes}
        />
      </details>
      <p className={`text-sm ${muted}`}>This period is live up to now and compared with the same point last period.</p>
    </div>
  )
}
