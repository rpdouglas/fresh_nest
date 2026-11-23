import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { invoiceAction, isSignInError } from '../api'
import { DEFAULT_PRICE, HOURLY_RATE, SHORT_FLAT_MINUTES, money, priceText } from '../lib/billing'
import { type QuickBooksOptions, exportable, quickBooksCsv, universalCsv } from '../lib/accountingCsv'
import { buildClientHours } from '../lib/clientHours'
import { download } from '../lib/download'
import type { InvoiceRow } from '../lib/invoicing'
import { buildInvoicing } from '../lib/invoicing'
import { dayLabel, hours } from '../lib/payroll'
import { clientRatesQuery, invoicedQuery, queryClient } from '../lib/queries'
import { addDays } from '../lib/week'
import type { Invoiced, Timesheet } from '../types'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const good = 'text-emerald-700 dark:text-emerald-400'
const bad = 'text-red-700 dark:text-red-400'
const amber = 'text-amber-700 dark:text-amber-400'
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

const small = `rounded-lg border bg-surface-raised px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`
const field = `rounded-lg border bg-surface-raised px-2 py-1 ${line}`

// What the bookkeeper typed for the last QuickBooks file, kept in this browser so it is offered again.
const QBO_KEY = 'schedule.quickbooks'
const QBO_DEFAULTS = { firstNumber: '', item: 'Cleaning', taxCode: '', dueDays: '14' }
function rememberedQbo(): typeof QBO_DEFAULTS {
  try {
    return { ...QBO_DEFAULTS, ...(JSON.parse(localStorage.getItem(QBO_KEY) ?? '{}') as Partial<typeof QBO_DEFAULTS>) }
  } catch {
    return QBO_DEFAULTS
  }
}
function rememberQbo(v: typeof QBO_DEFAULTS) {
  try {
    localStorage.setItem(QBO_KEY, JSON.stringify(v))
  } catch {
    // a browser that keeps nothing: the fields start empty next time
  }
}

/** Asks for what a QuickBooks file needs that the site does not know, then hands it over. */
function QuickBooksForm(p: { count: number; onDownload: (o: QuickBooksOptions) => number; onClose: () => void }) {
  const [v, setV] = useState(rememberedQbo)
  const set = (k: keyof typeof QBO_DEFAULTS) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }))
  const first = Number(v.firstNumber)
  const due = Number(v.dueDays)
  const valid =
    /^\d{1,9}$/.test(v.firstNumber.trim()) &&
    first > 0 &&
    v.item.trim() !== '' &&
    v.taxCode.trim() !== '' &&
    /^\d{1,3}$/.test(v.dueDays.trim())
  return (
    <form
      aria-label="QuickBooks file"
      className={`mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-surface-raised px-4 py-3 print:hidden ${line}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const last = p.onDownload({ firstNumber: first, item: v.item.trim(), taxCode: v.taxCode.trim(), dueDays: due })
        // the next file carries on from the last number used
        rememberQbo({ ...v, firstNumber: String(last + 1) })
        p.onClose()
      }}
    >
      <label className="flex flex-col text-sm">
        <span className={muted}>First invoice number</span>
        <input className={`w-32 tabular-nums ${field}`} inputMode="numeric" value={v.firstNumber} onChange={set('firstNumber')} />
      </label>
      <label className="flex flex-col text-sm">
        <span className={muted}>Product or service</span>
        <input className={`w-40 ${field}`} value={v.item} onChange={set('item')} />
      </label>
      <label className="flex flex-col text-sm">
        <span className={muted}>Tax code</span>
        <input className={`w-28 ${field}`} value={v.taxCode} onChange={set('taxCode')} />
      </label>
      <label className="flex flex-col text-sm">
        <span className={muted}>Days until due</span>
        <input className={`w-20 tabular-nums ${field}`} inputMode="numeric" value={v.dueDays} onChange={set('dueDays')} />
      </label>
      <button type="submit" className={small} disabled={!valid}>
        Download {p.count} invoice{p.count === 1 ? '' : 's'}
      </button>
      <button type="button" className={small} onClick={p.onClose}>
        Cancel
      </button>
      <p className={`basis-full text-sm ${muted}`}>
        One invoice for each client for each day, numbered up from the first. The product or service and the tax code must be named as they
        are in QuickBooks, and so must each customer: a client whose name in Camelo differs is not matched. Amounts are before tax. Dates
        are day/month/year: choose that when QuickBooks asks. It takes 100 invoices at a time, so more than that come as several files.
      </p>
    </form>
  )
}

const when = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

interface Props {
  start: string
  timesheets: Timesheet[]
  editor: Editor
  onExpired: (message: string) => void
}

export default function InvoicingView({ start, timesheets, editor, onExpired }: Props) {
  const to = addDays(start, 6)
  /** What could not be saved; what could not be loaded comes from the load. */
  const [unsaved, setUnsaved] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [hideDone, setHideDone] = useState(false)
  const [quickBooks, setQuickBooks] = useState(false)
  /** The rows in the file just downloaded, while the question of ticking them is open. */
  const [exported, setExported] = useState<InvoiceRow[] | null>(null)
  const token = editor.token

  // through the site's cache (lib/queries.ts); a tick saved here is written into it
  const ticks = useQuery(invoicedQuery(start, to, token))
  // nothing is priced until the clients' prices have loaded: never at the default by mistake
  const ratesQ = useQuery(clientRatesQuery(token))
  const rates = ratesQ.data
  const expired = isSignInError(ticks.error) || isSignInError(ratesQ.error)
  useEffect(() => {
    if (expired) onExpired(EXPIRED)
  }, [expired, onExpired])
  const current = ticks.data && rates ? ticks.data : null
  const error =
    unsaved ??
    (expired
      ? null
      : ticks.error
        ? ticks.error.message || 'Invoiced ticks could not be loaded.'
        : ratesQ.error
          ? 'Client prices could not be loaded, so nothing can be priced. Reload the page to try again.'
          : null)
  const h = useMemo(() => buildClientHours(start, timesheets, rates ?? []), [start, timesheets, rates])
  const inv = useMemo(() => buildInvoicing(h, current ?? []), [h, current])

  /** Ticks or unticks rows one after another, keeping the list in step with what was saved. */
  const set = async (rows: InvoiceRow[], invoiced: boolean) => {
    const ids = rows.map((r) => `${r.date}|${r.clientKey}`)
    setSaving((s) => new Set([...s, ...ids]))
    try {
      for (const r of rows) {
        const { entry } = await invoiceAction<{ entry: Invoiced }>(
          {
            action: 'set',
            date: r.date,
            clientKey: r.clientKey,
            clientName: r.clientName,
            invoiced,
            minutes: r.minutes,
            amount: r.amount,
            timesheetIds: r.timesheetIds,
          },
          token,
        )
        queryClient.setQueryData(
          invoicedQuery(start, to, token).queryKey,
          (list) => list && [...list.filter((x) => x.id !== entry.id), entry],
        )
      }
      setUnsaved(null)
      // other ranges that hold these days (the dashboard's) are read again when next shown
      void queryClient.invalidateQueries({ queryKey: ['invoiced'], refetchType: 'none' })
    } catch (e) {
      if (isSignInError(e)) onExpired(EXPIRED)
      else setUnsaved(e instanceof Error ? e.message : 'The change could not be saved.')
    } finally {
      setSaving((s) => new Set([...s].filter((x) => !ids.includes(x))))
    }
  }

  if (error && !current) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        {error}
      </p>
    )
  }
  if (!current) {
    return (
      <div role="status" className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
        <Spinner className="size-6 text-accent dark:text-accent-dark" /> Loading what has been invoiced…
      </div>
    )
  }
  if (!inv.days.length) return <p className={`py-8 text-center ${muted}`}>No client time was logged in these 7 days.</p>

  const box = `rounded-lg border bg-surface-raised px-3.5 py-2 ${line}`
  // what a download holds: approved and not yet ticked (lib/accountingCsv.ts)
  const toExport = exportable(inv)
  // asked only while the days that were exported are still the ones on screen
  const asking = exported?.length && exported.every((r) => r.date >= start && r.date <= to) ? exported : null
  const days = inv.days
    .map((d) => ({ ...d, shown: hideDone ? d.rows.filter((r) => !r.invoiced || r.changed) : d.rows }))
    .filter((d) => d.shown.length)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-stretch gap-2.5">
        <div className={box}>
          <b className={`block text-xl tabular-nums ${inv.toInvoice ? good : ''}`}>{money(inv.toInvoice)}</b>
          <span className={`text-xs ${muted}`}>approved, not yet invoiced</span>
        </div>
        <div className={box}>
          <b className="block text-xl tabular-nums">{money(inv.invoiced)}</b>
          <span className={`text-xs ${muted}`}>invoiced</span>
        </div>
        {inv.changed > 0 && (
          <div className={box}>
            <b className={`block text-xl tabular-nums ${amber}`}>{inv.changed}</b>
            <span className={`text-xs ${muted}`}>changed since invoiced</span>
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2.5 self-center print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
            Hide invoiced
          </label>
          <button
            className={small}
            disabled={!toExport.length}
            onClick={() => {
              download(`invoicing-${start}.csv`, universalCsv(toExport))
              setExported(toExport)
            }}
          >
            Download CSV
          </button>
          <button className={small} disabled={!toExport.length || quickBooks} onClick={() => setQuickBooks(true)}>
            Download for QuickBooks
          </button>
        </div>
      </div>
      {quickBooks && (
        <QuickBooksForm
          count={toExport.length}
          onClose={() => setQuickBooks(false)}
          onDownload={(o) => {
            const { files, lastNumber } = quickBooksCsv(toExport, o)
            setExported(toExport)
            files.forEach((f, n) => download(`quickbooks-invoices-${start}${files.length > 1 ? `-${n + 1}` : ''}.csv`, f))
            return lastNumber
          }}
        />
      )}
      {asking && (
        <div
          role="dialog"
          aria-label="Mark exported rows as invoiced?"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40 print:hidden"
        >
          <p className="min-w-0 flex-1 font-semibold">
            Mark the {asking.length} exported row{asking.length === 1 ? '' : 's'} as invoiced?
            <span className={`block text-sm font-normal ${muted}`}>
              Rows left unticked go into the next download again, under new invoice numbers.
            </span>
          </p>
          <button
            className={small}
            onClick={() => {
              // exactly the rows that were in the file, whatever has been ticked since
              const rows = asking
              setExported(null)
              void set(rows, true)
            }}
          >
            Mark {asking.length} invoiced
          </button>
          <button className={small} onClick={() => setExported(null)}>
            Not now
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={`mb-3 text-sm ${bad}`}>
          {error}
        </p>
      )}

      {days.length === 0 && <p className={`py-8 text-center ${muted}`}>Everything in these 7 days has been invoiced.</p>}
      <div className="flex flex-col gap-4">
        {days.map((d) => {
          const open = d.rows.filter((r) => !r.invoiced && r.amount > 0)
          return (
            <section key={d.date} aria-label={dayLabel(d.date)} className={`overflow-hidden rounded-xl border bg-surface-raised ${line}`}>
              <header
                className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b bg-surface-sunken/40 px-4 py-2.5 dark:bg-surface-sunken/50 ${line}`}
              >
                <h2 className="font-semibold">{dayLabel(d.date)}</h2>
                <span className={`text-sm tabular-nums ${muted}`}>
                  {hours(d.minutes)} h · {money(d.amount)}
                </span>
                {open.length > 1 && (
                  <button
                    className={`ml-auto rounded-lg border bg-surface-raised px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 print:hidden ${line}`}
                    disabled={open.some((r) => saving.has(`${r.date}|${r.clientKey}`))}
                    onClick={() => set(open, true)}
                  >
                    Mark all {open.length} invoiced
                  </button>
                )}
              </header>
              <ul>
                {d.shown.map((r) => {
                  const id = `${r.date}|${r.clientKey}`
                  const busy = saving.has(id)
                  return (
                    <li
                      key={r.clientKey}
                      // a billable day not yet invoiced needs action: the amber stripe (decision 0043)
                      className={`flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-l-4 px-4 py-3 last:border-b-0 ${line} ${
                        !r.invoiced && r.amount > 0 ? 'border-l-amber-500' : 'border-l-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-5 flex-none"
                        aria-label={`${r.clientName}, ${dayLabel(r.date)}: invoiced`}
                        checked={r.invoiced}
                        disabled={busy || (!r.invoiced && r.amount === 0)}
                        onChange={(e) => set([r], e.target.checked)}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold">{r.clientName}</span>
                        {r.sites.length > 0 && <span className={`ml-2 text-sm ${muted}`}>{r.sites.join(', ')}</span>}
                        {r.pendingMinutes > 0 && (
                          <span className={`block text-sm ${bad}`}>
                            +{hours(r.pendingMinutes)} h waiting for approval, not invoiceable yet
                          </span>
                        )}
                        {r.shortVisits > 0 && !r.invoiced && (
                          <span className={`block text-sm font-semibold ${amber}`}>
                            {r.shortVisits === 1 ? 'A visit' : `${r.shortVisits} visits`} under {SHORT_FLAT_MINUTES} minutes billed at the
                            flat price: check {r.shortVisits === 1 ? 'it is' : 'they are'} real before invoicing.
                          </span>
                        )}
                        {r.invoiced && r.record && (
                          <span className={`block text-xs ${muted}`}>
                            Invoiced {when(r.record.updatedAt)} by {r.record.updatedBy}
                          </span>
                        )}
                        {r.changed && r.record && (
                          <span className={`block text-sm font-semibold ${amber}`}>
                            Changed since invoiced: was {hours(r.record.minutes)} h, {money(r.record.amount)}. Untick and tick again once
                            re-invoiced.
                          </span>
                        )}
                      </div>
                      <div className="text-right tabular-nums">
                        <b className={r.invoiced ? muted : ''}>{money(r.amount)}</b>
                        <span className={`block text-sm ${muted}`}>{hours(r.minutes)} h</span>
                        {r.price !== DEFAULT_PRICE && <span className={`block text-xs ${muted}`}>{priceText(r.price)}</span>}
                      </div>
                      {busy && <Spinner className="size-4 self-center" />}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
      <p className={`mt-3 text-sm ${muted}`}>
        Each client's approved visits for the day at the client's price: ${HOURLY_RATE} an hour unless a row says otherwise, each visit
        rounded to the nearest quarter hour, or a flat price for each visit. A client's sites are added together. Time waiting for approval
        can be invoiced once it is approved. A tick records who invoiced it and what was billed, and a row is flagged if its time changes
        afterwards.
      </p>
    </>
  )
}
