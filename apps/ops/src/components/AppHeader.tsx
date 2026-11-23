import type { ReactNode } from 'react'
import { addDays, weekLabel } from '../lib/week'
import Sparkle from './Sparkle'
import Spinner from './Spinner'

interface Props {
  title: string
  busy: boolean
  /** False while the first load of a week is still in progress. */
  hasData: boolean
  /** First day of the week or pay period on screen. */
  weekStart: string
  /** Where the "home" button goes, and what it is called. */
  thisWeek: string
  homeLabel: string
  /** Snaps a picked date to the start of its week or pay period. */
  snap: (date: string) => string
  onWeek: (weekStart: string) => void
  /** The account button (who is signed in, Refresh, Sign out), at the header's end. */
  account: ReactNode
  /** For a report that has its own date range instead of a week to step through. */
  hideDates?: boolean
  /** Set when this report can be sent to a Google Doc. */
  onExport?: () => void
  exporting?: boolean
}

// round, quiet buttons on the parchment header (decision 0043)
const btn =
  'flex h-11 min-w-11 items-center justify-center rounded-full border border-hairline bg-surface-raised px-3 text-sm font-semibold text-ink hover:border-accent disabled:opacity-50'

export default function AppHeader(p: Props) {
  return (
    <>
      {/* light, like the reference Dashboard (decision 0043, docs/design/dashboard-reference.jpg) */}
      <header className="border-b border-hairline bg-surface pt-[env(safe-area-inset-top)] text-ink print:hidden">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <img src="/pwa-icon-192.png" alt="" width="40" height="40" className="size-10 flex-none" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-accent">
              FNC Landing
              <Sparkle size={10} className="text-clay" />
            </span>
            <div className="flex items-center gap-2.5">
              <h1 className="truncate font-display text-[22px] leading-tight font-bold">{p.title}</h1>
              {p.busy && (
                <span role="status" className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Spinner className="size-4" />
                  {p.hasData ? 'Updating…' : 'Loading…'}
                </span>
              )}
            </div>
          </div>
          {/* right after the title on a phone, at the far right on a laptop */}
          <div className="sm:order-last">{p.account}</div>
          {!p.hideDates && (
            <div className="flex w-full items-center gap-1.5 sm:w-auto">
              <button className={btn} onClick={() => p.onWeek(addDays(p.weekStart, -7))} aria-label="Previous week" title="Back 7 days">
                ‹
              </button>
              <input
                type="date"
                aria-label="Jump to the week or pay period containing this date"
                value={p.weekStart}
                onChange={(e) => e.target.value && p.onWeek(p.snap(e.target.value))}
                className={`${btn} min-w-0 flex-1 sm:flex-none`}
              />
              <button className={btn} onClick={() => p.onWeek(addDays(p.weekStart, 7))} aria-label="Next week">
                ›
              </button>
              <button className={btn} disabled={p.weekStart === p.thisWeek} onClick={() => p.onWeek(p.thisWeek)}>
                {p.homeLabel}
              </button>
            </div>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button className={btn} onClick={() => window.print()}>
              Print
            </button>
            {p.onExport && (
              <button className={`${btn} gap-2`} disabled={p.exporting} onClick={p.onExport} aria-label="Export to Google Doc">
                {p.exporting && <Spinner className="size-4" />}
                Google Doc
              </button>
            )}
          </div>
          {p.onExport && (
            <button className={`${btn} gap-2 sm:hidden`} disabled={p.exporting} onClick={p.onExport} aria-label="Export to Google Doc">
              {p.exporting && <Spinner className="size-4" />}
              Google Doc
            </button>
          )}
        </div>
      </header>
      <div className="hidden border-b-2 border-black pb-2 print:block">
        <div className="font-display text-2xl font-bold">{p.title}</div>
        {!p.hideDates && <div className="text-sm">{weekLabel(p.weekStart)}</div>}
      </div>
    </>
  )
}
