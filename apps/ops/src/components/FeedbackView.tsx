import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { isSignInError } from '../api'
import { download } from '../lib/download'
import type { FeedbackFilters } from '../lib/feedback'
import { employeesQuery, periodQuery, queryClient } from '../lib/queries'
import {
  CATEGORIES,
  NO_FEEDBACK_FILTERS,
  RANGES,
  RATE_MAX_DAYS,
  cleanerOptions,
  cleanerTotals,
  countVisits,
  entryFields,
  feedbackCsv,
  filterFeedback,
  overall,
  per100,
  rangeFrom,
} from '../lib/feedback'
import { dayLabel } from '../lib/payroll'
import type { Feedback, Timesheet } from '../types'
import { addDays } from '../lib/week'
import { FeedbackForm, FeedbackItem } from './FeedbackBits'
import Spinner from './Spinner'
import type { Editor } from './useEditor'
import { useFeedback } from './useFeedback'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const control = `rounded-lg border bg-surface-raised px-3 py-1.5 text-sm ${line}`
const good = 'text-emerald-700 dark:text-emerald-400'
const bad = 'text-red-700 dark:text-red-400'

/**
 * Every timesheet from..to, a week per request and a few requests at a time, for
 * complaint rates. Null while loading or when the range is too long to fetch.
 */
function useVisits(token: string | undefined, from: string, to: string, days: number, onExpired: (message: string) => void) {
  const [got, setGot] = useState<{ key: string; visits: ReturnType<typeof countVisits> } | null>(null)
  const key = `${from}|${to}`
  useEffect(() => {
    if (!token || days > RATE_MAX_DAYS) return
    const ctrl = new AbortController()
    const starts: string[] = []
    for (let d = from; d <= to; d = addDays(d, 7)) starts.push(d)
    ;(async () => {
      const sheets: Timesheet[] = []
      for (let i = 0; i < starts.length; i += 4) {
        if (ctrl.signal.aborted) return
        // through the site's cache: a week already loaded is not asked for again
        const batch = await Promise.all(starts.slice(i, i + 4).map((d) => queryClient.fetchQuery(periodQuery(d, token))))
        for (const b of batch) sheets.push(...b.timesheets.filter((t) => t.from.slice(0, 10) <= to))
      }
      if (!ctrl.signal.aborted) setGot({ key: `${from}|${to}`, visits: countVisits(sheets) })
    })().catch((e: unknown) => {
      if (ctrl.signal.aborted) return
      if (isSignInError(e)) onExpired('Your Google sign-in has expired. Sign in again to continue.')
      // otherwise the rates are left out; the feedback itself still shows
    })
    return () => ctrl.abort()
  }, [token, from, to, days, onExpired])
  return got?.key === key ? got.visits : null
}

interface Props {
  editor: Editor | null
  today: string
  onExpired: (message: string) => void
}

export default function FeedbackView({ editor, today, onExpired }: Props) {
  const [days, setDays] = useState(90)
  const from = rangeFrom(today, days)
  const { entries, loading, error, send } = useFeedback(editor, from, today, onExpired)
  const [f, setF] = useState<FeedbackFilters>(NO_FEEDBACK_FILTERS)
  const [adding, setAdding] = useState<Feedback['type'] | null>(null)
  const token = editor?.token
  const visits = useVisits(token, from, today, days, onExpired)
  const rated = days <= RATE_MAX_DAYS

  // The employee list, for choosing who a no-visit entry is about and for editing.
  const staffQ = useQuery({ ...employeesQuery(token ?? ''), enabled: !!token })
  const staff = staffQ.data ?? null
  const staffExpired = isSignInError(staffQ.error)
  useEffect(() => {
    if (staffExpired) onExpired('Your Google sign-in has expired. Sign in again to continue.')
  }, [staffExpired, onExpired])

  const shown = useMemo(() => filterFeedback(entries, f), [entries, f])
  const totals = useMemo(() => cleanerTotals(shown), [shown])
  const all = useMemo(() => overall(shown), [shown])
  const cleaners = useMemo(() => cleanerOptions(entries), [entries])
  const clients = useMemo(() => [...new Set(entries.map((e) => e.clientName))].sort((a, b) => a.localeCompare(b)), [entries])
  const filtered = JSON.stringify(f) !== JSON.stringify(NO_FEEDBACK_FILTERS)

  if (!editor) {
    return (
      <p className={`py-10 text-center ${muted}`}>
        Client feedback is private. Sign in with Google above to see and record kudos and complaints.
      </p>
    )
  }

  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  const th = `border-b px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase ${line} ${muted}`
  const td = `border-b px-3 py-2 text-right tabular-nums ${line}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <select aria-label="Period" className={control} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {RANGES.map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Search feedback"
          placeholder="Search client, cleaner, what was said"
          className={`${control} min-w-0 flex-1 basis-56`}
          value={f.query}
          onChange={(e) => setF({ ...f, query: e.target.value })}
        />
        <select
          aria-label="Type"
          className={control}
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value as FeedbackFilters['type'] })}
        >
          <option value="">Kudos and complaints</option>
          <option value="kudos">Kudos only</option>
          <option value="complaint">Complaints only</option>
        </select>
        <select aria-label="Cleaner" className={control} value={f.cleanerId} onChange={(e) => setF({ ...f, cleanerId: e.target.value })}>
          <option value="">All cleaners</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Category" className={control} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Follow-up"
          className={control}
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value as FeedbackFilters['status'] })}
        >
          <option value="">Any follow-up</option>
          <option value="open">Open complaints</option>
          <option value="resolved">Resolved complaints</option>
        </select>
        {filtered && (
          <button className="text-sm text-accent underline dark:text-accent-dark" onClick={() => setF(NO_FEEDBACK_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
        <div className={box}>
          <b className={`block text-xl tabular-nums ${good}`}>{all.kudos}</b>
          <span className={`text-xs ${muted}`}>kudos</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${all.complaints ? bad : ''}`}>{all.complaints}</b>
          <span className={`text-xs ${muted}`}>complaints</span>
        </div>
        <div className={box}>
          <b className={`block text-xl tabular-nums ${all.open ? bad : ''}`}>{all.open}</b>
          <span className={`text-xs ${muted}`}>still open</span>
        </div>
        {rated && (
          <div className={box}>
            <b className="block text-xl tabular-nums">{visits ? per100(all.complaints, visits.total) : <Spinner className="size-5" />}</b>
            <span className={`text-xs ${muted}`}>complaints per 100 visits{visits ? ` (${visits.total} visits)` : ''}</span>
          </div>
        )}
        <span className={`self-center text-sm ${muted}`}>
          {dayLabel(from)} – {dayLabel(today)}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2 self-center print:hidden">
          <button className={`${control} hover:border-accent`} onClick={() => setAdding('kudos')}>
            + Kudos
          </button>
          <button className={`${control} hover:border-accent`} onClick={() => setAdding('complaint')}>
            + Complaint
          </button>
          <button
            className={`${control} hover:border-accent`}
            disabled={!shown.length}
            onClick={() => download(`client-feedback-${from}-to-${today}.csv`, feedbackCsv(shown))}
          >
            Download CSV
          </button>
        </div>
      </div>

      {adding && (
        <section aria-label="Add feedback" className={`mb-4 overflow-hidden rounded-xl border bg-surface-raised print:hidden ${line}`}>
          <FeedbackForm
            key={adding}
            type={adding}
            title={`New ${adding} that isn't about one particular visit`}
            cleaners={staff ?? []}
            ticked={[]}
            pick={{ clients, date: today }}
            onCancel={() => setAdding(null)}
            onSave={(v) =>
              send({ action: 'create', type: adding, date: v.date, clientName: v.clientName, ...entryFields(adding, v) }).then(() =>
                setAdding(null),
              )
            }
          />
          <p className={`px-4 py-2 text-xs ${muted}`}>
            To record feedback about a specific job, open Client hours, select the visit, and use the buttons there.
          </p>
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {loading && (
        <div role="status" className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
          <Spinner className="size-6 text-accent dark:text-accent-dark" /> Loading feedback…
        </div>
      )}

      {!loading && totals.length > 0 && (
        <div className={`relative mb-4 overflow-x-auto rounded-xl border bg-surface-raised ${line}`}>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr>
                <th className={`${th} text-left`}>Cleaner</th>
                <th className={th}>Kudos</th>
                <th className={th}>Complaints</th>
                <th className={th}>Still open</th>
                {rated && <th className={th}>Visits</th>}
                {rated && <th className={th}>Per 100 visits</th>}
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className={`border-b px-3 py-2 text-left font-semibold ${line}`}>
                    <button
                      className="rounded text-left underline-offset-2 hover:underline"
                      onClick={() => setF({ ...f, cleanerId: f.cleanerId === t.id ? '' : t.id })}
                    >
                      {t.name}
                    </button>
                  </th>
                  <td className={`${td} ${t.kudos ? good : muted}`}>{t.kudos}</td>
                  <td className={`${td} ${t.complaints ? bad : muted}`}>{t.complaints}</td>
                  <td className={`${td} ${t.open ? `font-bold ${bad}` : muted}`}>{t.open}</td>
                  {rated && <td className={td}>{visits ? (visits.byCleaner.get(t.id) ?? 0) : '…'}</td>}
                  {rated && <td className={td}>{visits ? per100(t.complaints, visits.byCleaner.get(t.id)) : '…'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && totals.length > 0 && (
        <p className={`mb-4 text-sm ${muted}`}>
          An entry counts once for each cleaner named on it, so these can add up to more than the totals above.
          {rated
            ? ' Per 100 visits is complaints per 100 of that cleaner’s visits (one client on one day, from timesheets) in the period.'
            : ` Complaint rates are shown for ${RATE_MAX_DAYS} days or fewer.`}
        </p>
      )}

      {!loading && !error && shown.length === 0 && (
        <p className={`py-8 text-center ${muted}`}>
          {entries.length ? 'No feedback matches these filters.' : `No feedback recorded in the last ${days} days.`}
        </p>
      )}
      {shown.length > 0 && (
        <section aria-label="Feedback entries" className={`overflow-hidden rounded-xl border bg-surface-raised ${line}`}>
          <ul>
            {shown.map((e) => (
              <FeedbackItem key={e.id} entry={e} people={staff ?? []} send={send} />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
