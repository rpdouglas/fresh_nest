import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { clientRatesAction, isSignInError } from '../api'
import type { Price } from '../lib/billing'
import { DEFAULT_PRICE, priceText } from '../lib/billing'
import { clientHoursOptions } from '../lib/clientHours'
import { dayLabel, fridayOf } from '../lib/payroll'
import { type PricingRow as Row, pricingRows } from '../lib/pricing'
import { clientRatesQuery, queryClient, reviewQuery } from '../lib/queries'
import { addDays } from '../lib/week'
import type { ClientRate } from '../types'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

const muted = 'text-ink-muted'
const line = 'border-hairline print:border-slate-400'
const bad = 'text-red-700 dark:text-red-400'
const amber = 'text-amber-700 dark:text-amber-400'
const small = `rounded-lg border bg-surface-raised px-2.5 py-1 text-sm hover:border-accent disabled:opacity-50 ${line}`
const field = `rounded-lg border bg-surface-raised px-2 py-1 ${line}`
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

const when = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** The form for one client's next price. A start date in the past is asked about before it is saved. */
function PriceForm(p: {
  row: Row
  today: string
  token: string
  onSaved: (rate: ClientRate) => void
  onClose: () => void
  onExpired: (m: string) => void
}) {
  const [kind, setKind] = useState<Price['kind']>(p.row.now.kind)
  const [dollars, setDollars] = useState(String(p.row.now.dollars))
  const [from, setFrom] = useState(p.today)
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amount = Number(dollars)
  const valid = dollars.trim() !== '' && Number.isFinite(amount) && amount > 0 && amount < 10_000 && /^\d{4}-\d{2}-\d{2}$/.test(from)
  const past = from < p.today

  const save = () => {
    if (past && !sure) return setSure(true)
    setBusy(true)
    setError(null)
    clientRatesAction<{ rate: ClientRate }>(
      { action: 'set', clientKey: p.row.key, clientName: p.row.name, from, kind, dollars: amount },
      p.token,
    )
      .then((r) => p.onSaved(r.rate))
      .catch((e: unknown) => {
        if (isSignInError(e)) return p.onExpired(EXPIRED)
        setError(e instanceof Error ? e.message : 'The price could not be saved.')
      })
      .finally(() => setBusy(false))
  }

  return (
    <form
      aria-label={`Price for ${p.row.name}`}
      className="mt-2 flex flex-wrap items-end gap-3 rounded-lg bg-surface-sunken/40 px-3 py-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && !busy) save()
      }}
    >
      <label className="flex flex-col text-sm">
        <span className={muted}>Billed</span>
        <select
          className={field}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as Price['kind'])
            setSure(false)
          }}
        >
          <option value="hourly">By the hour</option>
          <option value="flat">A flat price for each visit</option>
        </select>
      </label>
      <label className="flex flex-col text-sm">
        <span className={muted}>{kind === 'flat' ? 'Dollars a visit' : 'Dollars an hour'}</span>
        <input
          className={`w-28 tabular-nums ${field}`}
          inputMode="decimal"
          value={dollars}
          onChange={(e) => {
            setDollars(e.target.value)
            setSure(false)
          }}
        />
      </label>
      <label className="flex flex-col text-sm">
        <span className={muted}>Starting</span>
        <input
          type="date"
          className={field}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setSure(false)
          }}
        />
      </label>
      <button type="submit" className={small} disabled={!valid || busy}>
        {sure ? 'Yes, change those visits' : 'Save price'}
      </button>
      <button type="button" className={small} onClick={p.onClose} disabled={busy}>
        Cancel
      </button>
      {busy && <Spinner className="size-4 self-center" />}
      {sure && (
        <p role="alert" className={`basis-full text-sm font-semibold ${amber}`}>
          {dayLabel(from)} is in the past. This changes what {p.row.name}'s visits since then bill, on Client hours, Invoicing and the
          dashboard. Rows already ticked as invoiced keep what was invoiced and are flagged as changed.
        </p>
      )}
      {error && (
        <p role="alert" className={`basis-full text-sm ${bad}`}>
          {error}
        </p>
      )}
    </form>
  )
}

interface Props {
  editor: Editor
  today: string
  onExpired: (message: string) => void
}

/** What each client is billed, and from when (decisions 0024 and 0033). */
export default function PricingView({ editor, today, onExpired }: Props) {
  const token = editor.token
  const [open, setOpen] = useState<string | null>(null)
  const period = fridayOf(today)
  const ratesQ = useQuery(clientRatesQuery(token))
  // the clients to offer: those with time logged in this pay period or the last, which the dashboard has usually loaded
  const curQ = useQuery(reviewQuery(period, token))
  const prevQ = useQuery(reviewQuery(addDays(period, -7), token))
  const expired = [ratesQ.error, curQ.error, prevQ.error].some(isSignInError)
  useEffect(() => {
    if (expired) onExpired(EXPIRED)
  }, [expired, onExpired])

  const rates = ratesQ.data
  const seen = useMemo(
    () => clientHoursOptions([...(curQ.data?.timesheets ?? []), ...(prevQ.data?.timesheets ?? [])]).clients,
    [curQ.data, prevQ.data],
  )
  const rows = useMemo(() => (rates ? pricingRows(rates, seen, today) : []), [rates, seen, today])

  if (!rates) {
    return ratesQ.error && !expired ? (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        Client prices could not be loaded. Reload the page to try again.
      </p>
    ) : (
      <div role="status" className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
        <Spinner className="size-6 text-accent dark:text-accent-dark" /> Loading client prices…
      </div>
    )
  }

  const saved = (rate: ClientRate) => {
    queryClient.setQueryData(clientRatesQuery(token).queryKey, (list) => [
      ...(list ?? []).filter((r) => r.clientKey !== rate.clientKey),
      rate,
    ])
    setOpen(null)
  }
  const listFailed = (curQ.error || prevQ.error) && !expired
  const own = rows.filter((r) => r.rules.length > 0).length

  return (
    <>
      <p className={`mb-3 text-sm ${muted}`}>
        {own} client{own === 1 ? ' has' : 's have'} a price of their own. Everyone else is billed {priceText(DEFAULT_PRICE)}.
      </p>
      {listFailed && (
        <p role="alert" className={`mb-3 text-sm ${bad}`}>
          The recent clients could not be loaded from Camelo, so only clients who already have a price are listed.
        </p>
      )}
      {(curQ.isPending || prevQ.isPending) && !listFailed && (
        <div role="status" className={`mb-3 flex items-center gap-2 text-sm ${muted}`}>
          <Spinner className="size-4" /> Loading recent clients…
        </div>
      )}
      <ul className={`overflow-hidden rounded-xl border bg-surface-raised ${line}`}>
        {rows.map((r) => (
          <li key={r.key} className={`border-b px-4 py-3 last:border-b-0 ${line}`}>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="min-w-0 flex-1 font-semibold">{r.name}</span>
              <span className={`tabular-nums ${r.now === DEFAULT_PRICE ? muted : 'font-semibold'}`}>
                {priceText(r.now)}
                {r.now === DEFAULT_PRICE && ' (default)'}
              </span>
              {open !== r.key && (
                <button className={`print:hidden ${small}`} aria-label={`Change price for ${r.name}`} onClick={() => setOpen(r.key)}>
                  Change
                </button>
              )}
            </div>
            {r.coming.map((c) => (
              <p key={c.from} className={`text-sm ${amber}`}>
                {priceText(c)} from {dayLabel(c.from)}
              </p>
            ))}
            {r.rules.length > 0 && (
              <details className={`mt-1 text-sm ${muted}`}>
                <summary className="cursor-pointer">
                  {r.rules.length} price{r.rules.length === 1 ? '' : 's'} set
                </summary>
                <ul className="mt-1">
                  {r.rules
                    .slice()
                    .reverse()
                    .map((rule) => (
                      <li key={rule.from}>
                        {priceText(rule)} from {dayLabel(rule.from)}, set {when(rule.setAt)} by {rule.setBy}
                      </li>
                    ))}
                </ul>
              </details>
            )}
            {open === r.key && (
              <PriceForm row={r} today={today} token={token} onSaved={saved} onClose={() => setOpen(null)} onExpired={onExpired} />
            )}
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className={`py-8 text-center ${muted}`}>No clients have had time logged in the last two pay periods.</p>}
      <p className={`mt-3 text-sm ${muted}`}>
        A price applies to visits from its start date on; visits before it keep the price they had. A flat price is for each visit, whatever
        its length and however many cleaners attend. An hourly price bills each visit's time rounded to the nearest quarter hour. To go back
        to the default, set {priceText(DEFAULT_PRICE)} from a date. Prices are never deleted: the list under each client is the record.
      </p>
    </>
  )
}
