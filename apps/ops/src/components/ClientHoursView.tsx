import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSignInError } from '../api'
import { HOURLY_RATE, money } from '../lib/billing'
import type { ClientHours, HoursCell, SiteRow, Visit } from '../lib/clientHours'
import { VISIT_FLAG_TEXT, buildClientHours, clientHoursCsv } from '../lib/clientHours'
import { download } from '../lib/download'
import { entryFields, forVisit } from '../lib/feedback'
import { dayLabel, exact, hours } from '../lib/payroll'
import { clientRatesQuery } from '../lib/queries'
import type { Filters } from '../lib/schedule'
import { formatTime } from '../lib/schedule'
import { TZ, addDays } from '../lib/week'
import type { Feedback, Timesheet } from '../types'
import { FeedbackForm, FeedbackItem } from './FeedbackBits'
import { Flag, Hours } from './HoursBits'
import Spinner from './Spinner'
import type { Editor } from './useEditor'
import { useFeedback } from './useFeedback'

const good = 'text-emerald-700 dark:text-emerald-400'
const bad = 'text-red-700 dark:text-red-400'
const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
// an average can be a fraction of a minute; show it to the nearest minute
const about = (minutes: number) => exact(Math.round(minutes))

/** Feedback for the days on screen and how to save more. Null for viewers, who may not see it. */
const FeedbackContext = createContext<{ entries: Feedback[]; send: (payload: Record<string, unknown>) => Promise<void> } | null>(null)

function VisitBlock({ visit: v, row }: { visit: Visit; row: SiteRow }) {
  const tz = v.cleaners[0]?.entries[0]?.timezone || TZ
  const feedback = useContext(FeedbackContext)
  const [adding, setAdding] = useState<Feedback['type'] | null>(null)
  const sheetIds = v.cleaners.flatMap((c) => c.entries.map((t) => t.id))
  const recorded = feedback ? forVisit(feedback.entries, sheetIds) : []
  const people = v.cleaners.filter((c) => c.person).map((c) => ({ id: c.person!.id, name: c.name }))
  const small = `rounded-lg border bg-surface-raised px-2 py-0.5 text-sm hover:border-accent ${line}`
  return (
    <li className={`border-b px-4 py-2.5 last:border-b-0 ${line}`}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-semibold tabular-nums">
          {formatTime(v.start, tz)} – {formatTime(v.end, tz)}
        </span>
        <span className={`font-semibold ${v.approved ? good : bad}`}>
          {v.cleaners.length > 1 ? `average ${about(v.minutes)}` : about(v.minutes)} · {v.approved ? 'approved' : 'not all approved yet'}
        </span>
      </div>
      <ul className="mt-1 text-sm">
        {v.cleaners.flatMap((c) =>
          c.entries.map((t) => (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[14rem_11rem_auto_1fr]">
              <span className="truncate">{c.name}</span>
              <span className={`tabular-nums ${muted}`}>
                {formatTime(t.from, tz)} – {t.to ? formatTime(t.to, tz) : 'no clock-out'}
              </span>
              <span className="tabular-nums">
                {exact(t.totalDuration ?? 0)} <span className={muted}>({t.totalDuration ?? 0} min)</span>
              </span>
              <span className={`font-semibold sm:text-right ${t.state === 'APPROVED' ? good : bad}`}>
                {t.state.replace(/_/g, ' ').toLowerCase()}
              </span>
            </li>
          )),
        )}
      </ul>
      {v.flags.map((f) => (
        <p key={f} className="mt-1 text-sm text-amber-700 dark:text-amber-400">
          {VISIT_FLAG_TEXT[f]}
        </p>
      ))}
      {feedback && (
        <div className="mt-2 print:hidden">
          {!adding && (
            <div className="flex gap-2">
              <button className={small} onClick={() => setAdding('kudos')}>
                + Kudos
              </button>
              <button className={small} onClick={() => setAdding('complaint')}>
                + Complaint
              </button>
            </div>
          )}
          {(adding || recorded.length > 0) && (
            <div className={`mt-2 overflow-hidden rounded-lg border ${line}`}>
              {adding && (
                <FeedbackForm
                  key={adding}
                  type={adding}
                  title={`${adding === 'kudos' ? 'Kudos' : 'Complaint'} for this visit: ${row.clientName}, ${formatTime(v.start, tz)} – ${formatTime(v.end, tz)}`}
                  cleaners={people}
                  ticked={people.map((c) => c.id)}
                  onCancel={() => setAdding(null)}
                  onSave={(values) =>
                    feedback
                      .send({
                        action: 'create',
                        type: adding,
                        date: new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(v.start)),
                        visitStart: v.start,
                        visitEnd: v.end,
                        timesheetIds: sheetIds,
                        clientKey: row.clientKey,
                        clientName: row.clientName,
                        siteName: row.siteName,
                        ...entryFields(adding, values),
                      })
                      .then(() => setAdding(null))
                  }
                />
              )}
              <ul>
                {recorded.map((e) => (
                  <FeedbackItem key={e.id} entry={e} people={people} showClient={false} send={feedback.send} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function DayDetail({ cell, row }: { cell: HoursCell; row: SiteRow }) {
  return (
    <div>
      <div
        className={`flex flex-wrap items-baseline gap-x-4 border-b bg-surface-sunken/40 px-4 py-1.5 text-sm dark:bg-surface-sunken/50 ${line}`}
      >
        <span className="font-semibold">{dayLabel(cell.date)}</span>
        {cell.approvedExact > 0 && (
          <span className={good}>
            approved {about(cell.approvedExact)} → {hours(cell.approved)} h
          </span>
        )}
        {cell.unapprovedExact > 0 && (
          <span className={bad}>
            unapproved {about(cell.unapprovedExact)} → {hours(cell.unapproved)} h
          </span>
        )}
      </div>
      <ul>
        {cell.visits.map((v) => (
          <VisitBlock key={v.key} visit={v} row={row} />
        ))}
      </ul>
    </div>
  )
}

function Detail({ row, date, onClose }: { row: SiteRow; date: string | null; onClose: () => void }) {
  const cells = row.cells.filter((c) => c.visits.length > 0 && (!date || c.date === date))
  return (
    <section aria-label="Visits" className={`mt-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}>
      <header className={`flex flex-wrap items-baseline gap-x-3 border-b px-4 py-3 ${line}`}>
        <h2 className="text-[17px] font-semibold text-accent dark:text-accent-dark">
          {row.clientName}
          {row.siteName && ` · ${row.siteName}`}
        </h2>
        <span className={`text-sm ${muted}`}>{[row.address, date ? dayLabel(date) : 'all 7 days'].filter(Boolean).join(' · ')}</span>
        <button className="ml-auto text-sm underline" onClick={onClose}>
          Close
        </button>
      </header>
      {cells.map((c) => (
        <DayDetail key={c.date} cell={c} row={row} />
      ))}
    </section>
  )
}

function Summary({ h }: { h: ClientHours }) {
  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  const tile = (value: string | number, label: string, tone = '') => (
    <div className={box}>
      <b className={`block text-xl tabular-nums ${tone}`}>{value}</b>
      <span className={`text-xs ${muted}`}>{label}</span>
    </div>
  )
  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
      {tile(money(h.billed), 'to bill', good)}
      {h.pending > 0 && tile(`+${money(h.pending)}`, 'waiting for approval', bad)}
      {tile(hours(h.approved), 'approved hours', good)}
      {tile(
        hours(h.unapproved),
        `unapproved hours${h.unapprovedVisits ? ` · ${h.unapprovedVisits} visit${h.unapprovedVisits === 1 ? '' : 's'}` : ''}`,
        h.unapproved ? bad : '',
      )}
      {tile(h.groups.length, h.groups.length === 1 ? 'client' : 'clients')}
      {tile(h.visits, h.visits === 1 ? 'visit' : 'visits')}
      {h.flaggedVisits > 0 && tile(h.flaggedVisits, 'to check', 'text-amber-700 dark:text-amber-400')}
      <button
        className={`ml-auto self-center rounded-lg border bg-surface-raised px-3 py-2 text-sm hover:border-accent print:hidden ${line}`}
        onClick={() => download(`client-hours-${h.start}.csv`, clientHoursCsv(h))}
      >
        Download CSV
      </button>
    </div>
  )
}

interface Props {
  start: string
  timesheets: Timesheet[]
  filters: Filters
  /** Set when someone allowed to record client feedback is signed in. */
  editor: Editor | null
  onExpired: (message: string) => void
}

export default function ClientHoursView({ start, timesheets, filters, editor, onExpired }: Props) {
  // nothing is priced until the clients' prices have loaded: never at the default by mistake
  const ratesQ = useQuery({ ...clientRatesQuery(editor?.token ?? ''), enabled: !!editor })
  const rates = ratesQ.data
  const expired = isSignInError(ratesQ.error)
  useEffect(() => {
    if (expired) onExpired('Your Google sign-in has expired. Sign in again to continue.')
  }, [expired, onExpired])
  const h = useMemo(() => buildClientHours(start, timesheets, rates ?? [], filters), [start, timesheets, rates, filters])
  const { entries, send, error: feedbackError } = useFeedback(editor, start, addDays(start, 6), onExpired)
  const feedback = useMemo(() => (editor ? { entries, send } : null), [editor, entries, send])
  const [open, setOpen] = useState<{ key: string; date: string | null } | null>(null)
  const rows = h.groups.flatMap((g) => g.sites)
  const openRow = open && rows.find((r) => r.key === open.key)

  const leftOut = h.leftOut > 0 && (
    <p className={`mt-2 text-sm ${muted}`}>
      {h.leftOut} clock-in{h.leftOut === 1 ? ' has' : 's have'} no client or job site in Camelo and {h.leftOut === 1 ? 'is' : 'are'} not
      shown here. See Payroll hours for all logged time.
    </p>
  )
  if (!rates) {
    return ratesQ.error && !expired ? (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        Client prices could not be loaded, so nothing can be priced. Reload the page to try again.
      </p>
    ) : (
      <div role="status" className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
        <Spinner className="size-6 text-accent dark:text-accent-dark" /> Loading client prices…
      </div>
    )
  }
  if (rows.length === 0) {
    return (
      <>
        <p className={`py-8 text-center ${muted}`}>
          {timesheets.length ? 'No client hours match these filters.' : 'No time was logged in these 7 days.'}
        </p>
        {leftOut}
      </>
    )
  }

  const head = `border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const th = `${head} text-right`
  const cellBase = `border-b px-3 py-2 align-top ${line}`
  const td = `${cellBase} text-right`
  const cellButton = 'w-full rounded px-1 py-0.5 text-right hover:bg-ink/10'

  const siteRow = (r: SiteRow, nested: boolean) => (
    <tr key={r.key} className={open?.key === r.key ? 'bg-surface-sunken/40' : ''}>
      <th scope="row" className={`${cellBase} text-left font-semibold ${nested ? 'pl-8 font-normal' : ''}`}>
        <button
          className="rounded text-left underline-offset-2 hover:underline"
          aria-label={`Show all visits for ${r.clientName}${r.siteName ? `, ${r.siteName}` : ''}`}
          onClick={() => setOpen({ key: r.key, date: null })}
        >
          {nested ? r.siteName || 'No site named' : r.clientName}
        </button>
        {r.flagged && <Flag />}
        {!nested && r.siteName && <span className={`block text-sm font-normal ${muted}`}>{r.siteName}</span>}
        {!r.linked && <span className={`block text-xs font-normal ${muted}`}>job site, no client linked</span>}
      </th>
      {r.cells.map((c) => (
        <td
          key={c.date}
          data-label={dayLabel(c.date)}
          data-empty={c.visits.length ? undefined : true}
          className={`${td} ${open?.key === r.key && open.date === c.date ? 'outline-2 -outline-offset-2 outline-accent' : ''}`}
        >
          {c.visits.length ? (
            <button
              className={cellButton}
              aria-label={`${r.clientName}, ${dayLabel(c.date)}: show visits`}
              onClick={() => setOpen({ key: r.key, date: c.date })}
            >
              <Hours approved={c.approved} unapproved={c.unapproved} />
              {c.flagged && <Flag />}
            </button>
          ) : (
            <span className={muted}>–</span>
          )}
        </td>
      ))}
      <td data-label="Approved" className={`${td} border-l font-bold tabular-nums ${good}`}>
        {hours(r.approved)}
      </td>
      <td data-label="Unapproved" className={`${td} font-bold tabular-nums ${r.unapproved ? bad : muted}`}>
        {r.unapproved ? `+${hours(r.unapproved)}` : '–'}
      </td>
      <td data-label="To bill" className={`${td} border-l tabular-nums`}>
        {r.billed ? money(r.billed) : <span className={muted}>–</span>}
        {r.pending > 0 && <span className={`block text-sm ${bad}`}>+{money(r.pending)}</span>}
      </td>
    </tr>
  )

  return (
    <>
      <Summary h={h} />
      {/* relative keeps the screen-reader-only labels inside the scroll box, so they can't widen the page */}
      <div className={`frozen-grid stack-on-phone relative rounded-xl border bg-surface-raised print:rounded-none ${line}`}>
        <table className="w-full min-w-[820px] border-collapse text-[15px] print:min-w-0 print:text-[12px]">
          <thead>
            <tr>
              <th className={`${head} text-left`}>Client / site</th>
              {h.days.map((d) => (
                <th key={d} className={th}>
                  {dayLabel(d).slice(0, 3)}
                  <span className="block font-normal normal-case">{dayLabel(d).slice(4)}</span>
                </th>
              ))}
              <th className={`${th} border-l`}>Approved</th>
              <th className={th}>Unapproved</th>
              <th className={`${th} border-l`}>To bill</th>
            </tr>
          </thead>
          <tbody>
            {h.groups.flatMap((g) =>
              g.sites.length === 1
                ? [siteRow(g.sites[0], false)]
                : [
                    <tr key={g.key}>
                      <th scope="rowgroup" colSpan={11} className={`${cellBase} text-left font-semibold`}>
                        {g.name}
                      </th>
                    </tr>,
                    ...g.sites.map((s) => siteRow(s, true)),
                  ],
            )}
          </tbody>
          <tfoot>
            <tr className="bg-surface-sunken/40 dark:bg-surface-sunken/50">
              <th scope="row" className="px-3 py-2 text-left font-bold">
                Total
              </th>
              {h.days.map((d, i) => (
                <td key={d} data-label={dayLabel(d)} className="px-3 py-2 text-right align-top">
                  <Hours approved={h.dayApproved[i]} unapproved={h.dayUnapproved[i]} total />
                </td>
              ))}
              <td data-label="Approved" className={`border-l px-3 py-2 text-right font-bold tabular-nums ${line} ${good}`}>
                {hours(h.approved)}
              </td>
              <td data-label="Unapproved" className={`px-3 py-2 text-right font-bold tabular-nums ${h.unapproved ? bad : muted}`}>
                {h.unapproved ? `+${hours(h.unapproved)}` : '–'}
              </td>
              <td data-label="To bill" className={`border-l px-3 py-2 text-right font-bold tabular-nums ${line}`}>
                {money(h.billed)}
                {h.pending > 0 && <span className={`block text-sm ${bad}`}>+{money(h.pending)}</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`mt-3 text-sm ${muted}`}>
        When more than one cleaner is at a client, the hours are the average of their times, not the total.{' '}
        <span className={`font-semibold ${good}`}>Green</span> visits have every cleaner's timesheet approved.{' '}
        <span className={`font-semibold ${bad}`}>Red with a +</span> visits are still waiting on at least one, and are not in the approved
        totals. Each day is rounded to the nearest quarter hour. To bill is each approved visit at the client's price that day: a flat price
        for the visit, or an hourly price (${HOURLY_RATE} unless the client has their own) for its time rounded to the nearest quarter hour
        on its own, so it can differ slightly from the approved hours; red + amounts are waiting for approval.
        <span className="print:hidden"> Select a client or a figure to see the visits behind it.</span>
      </p>
      {leftOut}
      {feedbackError && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400 print:hidden">
          Client feedback could not be loaded: {feedbackError}
        </p>
      )}
      <FeedbackContext.Provider value={feedback}>
        {openRow && open && <Detail row={openRow} date={open.date} onClose={() => setOpen(null)} />}
      </FeedbackContext.Provider>
    </>
  )
}
