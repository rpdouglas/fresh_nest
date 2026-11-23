import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { isSignInError } from '../api'
import { WEEKDAYS, type Weekday, buildClientPatterns, clockText, hoursMinutes } from '../lib/clientPatterns'
import { lastCompletedPeriod } from '../lib/payroll'
import { placesDone, placesQuery, queryClient, reviewQuery } from '../lib/queries'
import { MOVED_NOTICE_MINUTES, TEAM_COLOURS, planClients, planRoutes, routeMinutes } from '../lib/routePlan'
import { addressKey } from '../lib/scheduleCheck'
import { FALLBACK_ADDRESS, OFFICE_ADDRESS } from '../lib/targets'
import { addDays } from '../lib/week'
import RouteMap from './RouteMap'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const bad = 'text-red-700 dark:text-red-400'
const amber = 'text-amber-700 dark:text-amber-400'
const field = 'rounded-lg border border-outline bg-surface-raised px-2 py-1'
const tab = (on: boolean) =>
  `rounded-lg border px-2.5 py-1 text-sm ${on ? 'border-accent bg-accent text-on-nest-teal' : 'border-outline bg-surface-raised hover:border-accent'}`
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'
const WEEK_CHOICES = [4, 8, 12]
// Camelo refuses a burst (429) and slows under load, so the periods are asked for a pause apart, and a period it
// refuses is asked for again after a wait, twice, before the page gives up
// (the browser tests shorten every wait with VITE_WAIT_SCALE)
const PERIOD_PAUSE_MS = 2_000
const RETRY_WAITS_MS = [20_000, 60_000]
const scaled = (ms: number) => ms * (Number(import.meta.env.VITE_WAIT_SCALE) || 1)
const th = `border-b px-3 py-2 text-left font-semibold ${line}`
const td = `border-b px-3 py-2 ${line}`

interface Props {
  editor: Editor
  today: string
  onExpired: (message: string) => void
}

/**
 * Each client's usual start time and weekday and how long visits take, over the last few pay
 * periods; then a four-week plan of routes from the office for the clients kept in.
 */
export default function ClientPatternsView({ editor, today, onExpired }: Props) {
  const token = editor.token
  const [weeks, setWeeks] = useState(12)
  const [minVisits, setMinVisits] = useState(3)
  const [maxHours, setMaxHours] = useState(6)
  const [left, setLeft] = useState<ReadonlySet<string>>(new Set())
  const [planning, setPlanning] = useState(false)
  const [teams, setTeams] = useState(3)
  const [week, setWeek] = useState(1)
  const [day, setDay] = useState<Weekday>('Monday')

  // the finished pay periods, newest first, read one at a time with a pause between: Camelo refuses a burst
  const periods = useMemo(() => Array.from({ length: weeks }, (_, i) => addDays(lastCompletedPeriod(today), -7 * i)), [weeks, today])
  const [allowed, setAllowed] = useState(1)
  const results = useQueries({ queries: periods.map((p, i) => ({ ...reviewQuery(p, token), enabled: i < allowed })) })
  const firstMissing = results.findIndex((r) => !r.isSuccess)
  const loaded = firstMissing === -1 ? periods.length : firstMissing
  useEffect(() => {
    if (loaded < allowed || allowed >= periods.length) return
    // a period already loaded in this visit costs Camelo nothing, so it needs no pause
    const kept = queryClient.getQueryData(reviewQuery(periods[loaded], token).queryKey) !== undefined
    const t = setTimeout(() => setAllowed(loaded + 1), kept ? 0 : scaled(PERIOD_PAUSE_MS))
    return () => clearTimeout(t)
  }, [loaded, allowed, periods, token])
  const failed = results.find((r) => r.isError)?.error
  const expired = isSignInError(failed)
  useEffect(() => {
    if (expired) onExpired(EXPIRED)
  }, [expired, onExpired])
  // a refused period is asked for again after a wait; only when both tries fail does the page say so
  const [tries, setTries] = useState(0)
  const askingAgain = results.some((r) => r.isError && r.isFetching)
  const waiting = !!failed && !expired && (tries < RETRY_WAITS_MS.length || askingAgain)
  const askAgain = () => results.filter((r) => r.isError).forEach((r) => void r.refetch())
  useEffect(() => {
    if (!failed && tries > 0) setTries(0)
    if (!failed || expired || askingAgain || tries >= RETRY_WAITS_MS.length) return
    const t = setTimeout(() => {
      setTries(tries + 1)
      askAgain()
    }, scaled(RETRY_WAITS_MS[tries]))
    return () => clearTimeout(t)
    // askAgain changes with results on every render; failed and askingAgain say when it matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, expired, askingAgain, tries])
  const ready = loaded === periods.length
  const dataKey = results.map((r) => r.dataUpdatedAt).join()

  const patterns = useMemo(() => {
    if (!ready) return null
    const data = results.map((r) => r.data!)
    return buildClientPatterns(
      data.flatMap((d) => d.shifts),
      data.flatMap((d) => d.timesheets),
      { minVisits, maxSheetMinutes: maxHours * 60 },
    )
    // results changes identity every render; dataKey says when what it holds has changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, dataKey, minVisits, maxHours])

  const kept = useMemo(() => patterns?.rows.filter((r) => !left.has(r.key)) ?? [], [patterns, left])
  const addresses = useMemo(
    () =>
      [
        ...new Map(
          [OFFICE_ADDRESS, FALLBACK_ADDRESS, ...kept.flatMap((r) => (r.address ? [r.address] : []))].map((a) => [addressKey(a), a]),
        ).values(),
      ].sort(),
    [kept],
  )
  const placesQ = useQuery({ ...placesQuery(addresses, token), enabled: planning && kept.length > 0 })
  const placesRounds = placesQ.dataUpdatedAt ? (queryClient.getQueryState(placesQuery(addresses, token).queryKey)?.dataUpdateCount ?? 0) : 0
  const placed = placesQ.data && placesDone(placesQ.data, placesRounds)

  const plan = useMemo(() => {
    if (!planning || !placed || !placesQ.data) return null
    const found = new Map(Object.entries(placesQ.data.places))
    const pointOf = (a: string | null) => (a ? (found.get(addressKey(a)) ?? null) : null)
    const { clients, leftOut } = planClients(kept, weeks, pointOf, pointOf(FALLBACK_ADDRESS))
    const office = pointOf(OFFICE_ADDRESS)
    return { clients, leftOut, office, routes: planRoutes(clients, office, teams), lookupFailed: placesQ.data.failed }
  }, [planning, placed, placesQ.data, kept, weeks, teams])

  // a new plan opens on its first day with visits, unless the day shown already has some
  useEffect(() => {
    if (!plan || plan.routes.some((r) => r.week === week && r.day === day && r.stops.length > 0)) return
    const first = plan.routes.find((r) => r.stops.length > 0)
    if (first) {
      setWeek(first.week)
      setDay(first.day)
    }
    // only a new plan moves the day; a person choosing an empty day stays on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])

  if (failed && !expired && !waiting) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        A pay period could not be loaded from Camelo.{' '}
        <button
          className="underline"
          onClick={() => {
            setTries(0)
            askAgain()
          }}
        >
          Try again
        </button>
      </p>
    )
  }

  const toggle = (key: string) =>
    setLeft((was) => {
      const next = new Set(was)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const today_ = plan?.routes.filter((r) => r.week === week && r.day === day) ?? []
  const moved = plan?.routes.flatMap((r) => r.stops).filter((s) => s.moved > MOVED_NOTICE_MINUTES).length ?? 0

  return (
    <>
      <p className={`mb-3 text-sm ${muted}`}>
        From the scheduled shifts and the timesheets of the last {weeks} finished pay periods. A visit is a client&rsquo;s overlapping
        shifts on one day, so a pair counts once. Time cleaning is each visit&rsquo;s average across its cleaners, breaks off. On Call is
        left out.
      </p>
      <div className="mb-4 flex flex-wrap items-end gap-4 print:hidden">
        <label className="text-sm">
          <span className={`block ${muted}`}>Weeks to look back</span>
          <select className={field} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            {WEEK_CHOICES.map((w) => (
              <option key={w} value={w}>
                {w} weeks
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className={`block ${muted}`}>Fewest visits</span>
          <input
            className={`${field} w-20`}
            type="number"
            min={1}
            max={200}
            value={minVisits}
            onChange={(e) => setMinVisits(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label className="text-sm">
          <span className={`block ${muted}`}>Longest timesheet counted (hours)</span>
          <input
            className={`${field} w-20`}
            type="number"
            min={1}
            max={24}
            value={maxHours}
            onChange={(e) => setMaxHours(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>

      {!patterns ? (
        <div role="status" className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
          <Spinner className="size-6 text-accent dark:text-accent-dark" />
          {waiting ? (
            <>
              Camelo is busy; asking for pay period {loaded + 1} of {periods.length} again
              {askingAgain ? '…' : ` in ${RETRY_WAITS_MS[tries] / 1000} s.`}
            </>
          ) : (
            <>
              Loading pay period {Math.min(loaded + 1, periods.length)} of {periods.length}…
            </>
          )}
        </div>
      ) : (
        <>
          <p className={`mb-2 text-sm ${muted}`}>
            {patterns.rows.length} client{patterns.rows.length === 1 ? '' : 's'} with at least {minVisits} visit{minVisits === 1 ? '' : 's'}
            {patterns.belowMinimum ? `; ${patterns.belowMinimum} with fewer left out` : ''}
            {patterns.longSheets
              ? `; ${patterns.longSheets} timesheet${patterns.longSheets === 1 ? '' : 's'} over ${maxHours} h not counted`
              : ''}
            .{left.size ? ` ${left.size} left out of the routes.` : ''}
          </p>
          <div className={`frozen-grid overflow-auto rounded-xl border bg-surface-raised ${line}`}>
            <table className="stack-on-phone w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr className={muted}>
                  <th className={th}>Routes</th>
                  <th className={th} scope="col">
                    Client
                  </th>
                  <th className={th}>Visits</th>
                  <th className={th}>Usual start</th>
                  <th className={th}>Usual day</th>
                  <th className={th}>Visits with timesheets</th>
                  <th className={th}>Avg cleaning (per cleaner)</th>
                  <th className={th}>Avg first in to last out</th>
                  <th className={th}>Avg scheduled</th>
                </tr>
              </thead>
              <tbody>
                {patterns.rows.map((r) => (
                  <tr key={r.key} className={left.has(r.key) ? 'opacity-60' : undefined}>
                    <td className={td} data-label="In routes">
                      <input
                        type="checkbox"
                        aria-label={`Include ${r.name} in the routes`}
                        checked={!left.has(r.key)}
                        onChange={() => toggle(r.key)}
                      />
                    </td>
                    <th scope="row" className={`${td} text-left font-medium`}>
                      {r.name}
                    </th>
                    <td className={td} data-label="Visits">
                      {r.visits}
                    </td>
                    <td className={td} data-label="Usual start">
                      {clockText(r.usualStart)}{' '}
                      <span className={muted}>
                        ({r.usualStartCount} of {r.visits})
                      </span>
                    </td>
                    <td className={td} data-label="Usual day">
                      {r.usualDay ?? '–'}{' '}
                      <span className={muted}>
                        ({r.usualDayCount} of {r.visits})
                      </span>
                    </td>
                    <td className={td} data-label="Visits with timesheets">
                      {r.sheetVisits}
                    </td>
                    <td className={td} data-label="Avg cleaning">
                      {hoursMinutes(r.avgWorked)}
                    </td>
                    <td className={td} data-label="Avg first in to last out">
                      {hoursMinutes(r.avgSpan)}
                    </td>
                    <td className={td} data-label="Avg scheduled">
                      {hoursMinutes(r.avgScheduled)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section aria-label="Route plan" className="mt-6">
            <h2 className="mb-2 font-display text-xl">Four-week route plan</h2>
            <p className={`mb-3 text-sm ${muted}`}>
              The {kept.length} clients ticked above, each on its usual day near its usual start, shared among teams of two that leave from
              and come back to the office. How often each is planned comes from how often it was visited. Drive times are estimates from the
              straight-line distance, not road routes.
            </p>
            <div className="mb-3 flex flex-wrap items-end gap-4 print:hidden">
              <label className="text-sm">
                <span className={`block ${muted}`}>Teams a day</span>
                <select className={field} value={teams} onChange={(e) => setTeams(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {!planning && (
                <button className={tab(true)} disabled={!kept.length} onClick={() => setPlanning(true)}>
                  Plan routes
                </button>
              )}
            </div>
            {planning && !plan && !placesQ.isError && (
              <div role="status" className={`flex items-center gap-2 py-4 text-sm ${muted}`}>
                <Spinner className="size-4" /> Finding where the sites are
                {placesQ.data?.pending ? ` (${placesQ.data.pending} still to look up)` : ''}…
              </div>
            )}
            {placesQ.isError && (
              <p role="alert" className={`text-sm ${bad}`}>
                The sites could not be placed on the map. Reload the page to try again.
              </p>
            )}
            {plan && (
              <>
                {(plan.lookupFailed || !plan.office || plan.leftOut.length > 0 || plan.clients.some((c) => c.assumed)) && (
                  <ul className={`mb-3 list-disc pl-5 text-sm ${amber}`}>
                    {plan.lookupFailed && <li>The map service did not answer for every address, so some are missing.</li>}
                    {!plan.office && <li>The office could not be placed, so drives to and from it are not counted.</li>}
                    {plan.clients.some((c) => c.assumed) && (
                      <li>
                        Placed at {FALLBACK_ADDRESS}, as their own address could not be found:{' '}
                        {plan.clients
                          .filter((c) => c.assumed)
                          .map((c) => c.name)
                          .join(', ')}
                        .
                      </li>
                    )}
                    {plan.leftOut.map((l) => (
                      <li key={l.name}>
                        {l.name} is not planned: {l.why}.
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mb-3 flex flex-wrap gap-2 print:hidden" role="group" aria-label="Week">
                  {[1, 2, 3, 4].map((w) => (
                    <button key={w} className={tab(w === week)} aria-pressed={w === week} onClick={() => setWeek(w)}>
                      Week {w}
                    </button>
                  ))}
                </div>
                <div className="mb-4 flex flex-wrap gap-2 print:hidden" role="group" aria-label="Day">
                  {WEEKDAYS.map((d) => (
                    <button key={d} className={tab(d === day)} aria-pressed={d === day} onClick={() => setDay(d)}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <p className={`mb-3 text-sm ${muted}`}>
                  {moved
                    ? `${moved} planned visit${moved === 1 ? ' starts' : 's start'} more than ${MOVED_NOTICE_MINUTES} minutes after the usual time over the four weeks; they are marked.`
                    : 'Every planned visit starts within half an hour of its usual time.'}
                </p>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div>
                    {!today_.length && <p className={muted}>No visits planned on this day.</p>}
                    {today_.map((r) => (
                      <div key={r.team} className={`mb-3 rounded-xl border bg-surface-raised p-3 ${line}`}>
                        <h3 className="mb-1 flex items-center gap-2 font-semibold">
                          <span
                            aria-hidden
                            className="inline-block size-3 rounded-full"
                            style={{ background: TEAM_COLOURS[(r.team - 1) % TEAM_COLOURS.length] }}
                          />
                          Team {r.team}
                          <span className={`text-sm font-normal ${muted}`}>
                            leave {clockText(r.leave)}, back {clockText(r.back)}, {hoursMinutes(routeMinutes(r))} working and driving
                          </span>
                        </h3>
                        <ol className="text-sm">
                          {r.stops.map((s) => (
                            <li key={s.client.key} className={`border-t py-1.5 ${line}`}>
                              <span className="tabular-nums">
                                {clockText(s.start)}–{clockText(s.end)}
                              </span>{' '}
                              <span className="font-medium">{s.client.name}</span>{' '}
                              <span className={muted}>
                                {s.drive ? `${s.drive} min drive, ` : ''}
                                {s.client.often.toLowerCase()}
                                {s.client.assumed ? ', address assumed' : ''}
                              </span>
                              {s.moved > MOVED_NOTICE_MINUTES && (
                                <span className={`block ${amber}`}>
                                  {s.moved} min after its usual {clockText(s.client.usualStart)} start
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                  <RouteMap office={plan.office} clients={plan.clients} routes={today_} />
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  )
}
