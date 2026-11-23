import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isSignInError } from './api'
import ErrorBoundary from './components/ErrorBoundary'
import FilterBar from './components/FilterBar'
import AppHeader from './components/AppHeader'
import AccountMenu from './components/AccountMenu'
import HubTabs from './components/HubTabs'
import TabBar from './components/TabBar'
import Spinner from './components/Spinner'
import WeekBar from './components/WeekBar'
import SignInGate from './components/SignInGate'
import type { useEditor } from './components/useEditor'
import { NO_FILTERS, filterShifts } from './lib/schedule'
import { fridayOf, lastCompletedPeriod } from './lib/payroll'
import { applyConfirmed, forgetLoaded, periodQuery, reviewQuery, settingsQuery, weekQuery } from './lib/queries'
import { setErrorReporter } from './lib/clientError'
import { ExportError, createDoc, googleClientId, preloadGoogle } from './lib/googleDoc'
import { historyStep } from './lib/history'
import { HUBS, hubOf } from './lib/hubs'
import { TZ, addDays, isValidDate, mondayOf, todayIn } from './lib/week'
import {
  ClientHoursView,
  DashboardView,
  FeedbackView,
  LiveView,
  MyWeekView,
  PricingView,
  ClientPatternsView,
  InvoicingView,
  PayrollView,
  PunctualityView,
  ReviewView,
  SchedVsActualView,
  WeekReports,
  prefetchReports,
} from './lazyReports'
import { reportTitle } from './reports'
import type { ReviewResponse, Shift, Timesheet, View } from './types'

const VIEWS: View[] = [
  'dashboard',
  'live',
  'client',
  'staff',
  'teams',
  'payroll',
  'clienthours',
  'feedback',
  'review',
  'schedvsactual',
  'punctuality',
  'invoicing',
  'pricing',
  'patterns',
  'myweek',
]
const DEFAULT_VIEW: View = 'dashboard'

/** A week of shifts or a pay period of timesheets, whichever the report on screen needs. */
interface Loaded {
  shifts: Shift[]
  timesheets: Timesheet[]
  /** Only for the unapproved-timesheets review. */
  review: ReviewResponse | null
  at: Date
}

function readUrl(
  thisWeek: string,
  lastPeriod: string,
  last7: string,
): { weekStart: string; periodStart: string; hoursStart: string; view: View } {
  const q = new URLSearchParams(window.location.search)
  const week = q.get('week')
  const period = q.get('period')
  const from = q.get('from')
  return {
    weekStart: isValidDate(week) ? mondayOf(week) : thisWeek,
    periodStart: isValidDate(period) ? fridayOf(period) : lastPeriod,
    hoursStart: isValidDate(from) ? from : last7,
    view: VIEWS.find((v) => v === q.get('view')) ?? DEFAULT_VIEW,
  }
}

/** The site as the office sees it. `session` is who is signed in, held by Root, which decides who gets this at all. */
export default function App({ session }: { session: ReturnType<typeof useEditor> }) {
  const thisWeek = useMemo(() => mondayOf(todayIn(TZ)), [])
  const lastPeriod = useMemo(() => lastCompletedPeriod(todayIn(TZ)), [])
  // Client hours opens on the seven days ending yesterday.
  const last7 = useMemo(() => addDays(todayIn(TZ), -7), [])
  const [{ weekStart, periodStart, hoursStart, view }, setNav] = useState(() => readUrl(thisWeek, lastPeriod, last7))
  // Payroll works in Friday-to-Thursday pay periods, client hours in any seven days,
  // and the schedule reports in Monday-to-Sunday weeks. The first two read timesheets.
  const reviewView = view === 'review'
  const svaView = view === 'schedvsactual'
  const punctualityView = view === 'punctuality'
  // Payroll hours, the unapproved review, Scheduled vs actual and Punctuality read the same data:
  // a pay period's timesheets and shifts (Payroll uses the shifts still to come for its overtime warning).
  const needsReview = view === 'payroll' || reviewView || svaView || punctualityView
  // They work in the same pay periods as Payroll hours, and all three share one.
  const payroll = view === 'payroll' || needsReview
  // Invoicing reads the same seven days of timesheets as Client hours.
  const invoicingView = view === 'invoicing'
  const clientHours = view === 'clienthours' || invoicingView
  const timesheetView = payroll || clientHours
  // Client feedback is kept by this site, not Camelo, so it has nothing to load from there.
  const feedbackView = view === 'feedback'
  const dashboardView = view === 'dashboard'
  const liveView = view === 'live'
  // Client prices are kept by this site too.
  const pricingView = view === 'pricing'
  // It reads several pay periods itself, one at a time.
  const patternsView = view === 'patterns'
  // These load their own data rather than one week or period from Camelo.
  // What a cleaner sees, for the office to look at: it loads one person's week itself.
  const myWeekView = view === 'myweek'
  const ownData = feedbackView || dashboardView || pricingView || patternsView || myWeekView || liveView
  const start = payroll ? periodStart : clientHours ? hoursStart : weekStart
  // Someone from the office: Root shows a cleaner My week instead, and never renders this.
  const { editor, note, signIn, expire, signOut: endSignIn } = session
  const token = editor?.token ?? null
  const today = useMemo(() => todayIn(TZ), [])
  const [filters, setFilters] = useState(NO_FILTERS)
  const [exported, setExported] = useState<
    { status: 'working' } | { status: 'done'; url: string } | { status: 'error'; message: string } | null
  >(null)

  // The browser's history: a different report is a step Back can return from (see lib/history.ts).
  const shownView = useRef(view)
  useEffect(() => {
    // Back or Forward: show what the entry's address says
    const onPop = () => setNav(readUrl(thisWeek, lastPeriod, last7))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [thisWeek, lastPeriod, last7])

  useEffect(() => {
    const q = new URLSearchParams()
    if (weekStart !== thisWeek) q.set('week', weekStart)
    if (periodStart !== lastPeriod) q.set('period', periodStart)
    if (hoursStart !== last7) q.set('from', hoursStart)
    if (view !== DEFAULT_VIEW) q.set('view', view)
    const qs = q.toString()
    // the address already says this: Back or Forward brought us here, and the history has it
    const fromHistory = (qs ? `?${qs}` : '') === window.location.search
    const step = historyStep({ viewChanged: view !== shownView.current, fromHistory })
    shownView.current = view
    if (fromHistory) return
    const url = qs ? `?${qs}` : window.location.pathname
    if (step === 'push') window.history.pushState(null, '', url)
    else window.history.replaceState(null, '', url)
  }, [weekStart, periodStart, hoursStart, view, thisWeek, lastPeriod, last7])

  // faults in the site are reported as the person signed in, with the report that was open
  useEffect(() => setErrorReporter(editor?.token ?? null, view), [editor, view])

  useEffect(() => {
    if (!editor) {
      document.title = 'FNC Landing'
      return
    }
    document.title = `${reportTitle(view)} · FNC Landing`
  }, [editor, view])

  // One of the three is asked for, by the report on screen; what is loaded is kept and shared (lib/queries.ts).
  const wanted = !!token && !ownData
  const kind = needsReview ? 'review' : timesheetView ? 'period' : 'week'
  const weekQ = useQuery({ ...weekQuery(start, token ?? ''), enabled: wanted && kind === 'week' })
  const periodQ = useQuery({ ...periodQuery(start, token ?? ''), enabled: wanted && kind === 'period' })
  const reviewQ = useQuery({ ...reviewQuery(start, token ?? ''), enabled: wanted && kind === 'review' })
  const query = kind === 'review' ? reviewQ : kind === 'period' ? periodQ : weekQ
  const settingsQ = useQuery({ ...settingsQuery(token ?? ''), enabled: !!token })
  const graceMinutes = settingsQ.data?.grace.minutes ?? 15
  const { refetch } = query
  // Asks again now: after a change, from the account menu's Refresh, or to try a failed report again.
  const reloadNow = useCallback(() => void refetch(), [refetch])

  const failure = wanted ? query.error : null
  useEffect(() => {
    if (!isSignInError(failure)) return
    expire(failure.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to continue.' : failure.message)
  }, [failure, expire])

  const busy = wanted && query.isFetching
  const error = failure && !isSignInError(failure) ? failure.message || 'Something went wrong' : null

  // A report chosen from a hub on the tab bar or from a tab: a new step for Back, as any change of report is.
  const chooseView = useCallback((v: View) => setNav((n) => (n.view === v ? n : { ...n, view: v })), [])
  const signOut = useCallback(() => {
    endSignIn()
    forgetLoaded()
  }, [endSignIn])

  const weekData = weekQ.data
  const periodData = periodQ.data
  const reviewData = reviewQ.data
  const loadedAt = query.dataUpdatedAt
  const loaded = useMemo((): Loaded | null => {
    if (!wanted) return null
    const at = new Date(loadedAt)
    if (kind === 'review') return reviewData ? { shifts: [], timesheets: [], review: reviewData, at } : null
    if (kind === 'period') return periodData ? { shifts: [], timesheets: periodData.timesheets, review: null, at } : null
    return weekData ? { shifts: weekData.shifts, timesheets: [], review: null, at } : null
  }, [wanted, kind, weekData, periodData, reviewData, loadedAt])
  // Nothing is worked out from the data here: that is done inside the reports, where a fault
  // shows the report's message and leaves the header and the tab bar working.
  const loadedShifts = useMemo(() => loaded?.shifts ?? [], [loaded])
  const timesheets = useMemo(() => loaded?.timesheets ?? [], [loaded])

  const canExport = view === 'teams' && !!googleClientId
  useEffect(() => {
    // fetch Google's script ahead of the click; a failure is reported when exporting
    if (canExport && token) preloadGoogle().catch(() => {})
  }, [canExport, token])

  const exportDoc = () => {
    setExported({ status: 'working' })
    Promise.all([import('./lib/teams'), import('./lib/teamsText')])
      .then(([{ buildTeamDays }, { teamsDocTitle, teamsText }]) => {
        // what is on screen: the week's shifts, On Call included, less what the filters hide
        const visible = filterShifts(loadedShifts, filters)
        if (!visible.length) throw new ExportError('No visits match these filters.')
        return createDoc(teamsDocTitle(weekStart), teamsText(weekStart, buildTeamDays(visible)))
      })
      .then((url) => setExported({ status: 'done', url }))
      .catch((e: unknown) =>
        setExported({ status: 'error', message: e instanceof ExportError ? e.message : 'The export failed. Please try again.' }),
      )
  }

  // Once the first screen is up, fetch the other reports' code while the browser is idle.
  useEffect(() => {
    if (!token) return
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchReports)
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(prefetchReports, 2000)
    return () => clearTimeout(id)
  }, [token])

  if (!editor) return <SignInGate note={note} onSignedIn={signIn} />

  const ready = loaded !== null
  // Moves the report on screen to the seven days starting on `w`; used by the header and the bar above the report.
  const goTo = (w: string) =>
    setNav((n) => (payroll ? { ...n, periodStart: w } : clientHours ? { ...n, hoursStart: w } : { ...n, weekStart: w }))

  const hub = hubOf(view)
  return (
    // room for the tab bar: along the bottom of a phone, down the left of a laptop
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-24 print:p-0">
      <TabBar hub={hub.id} onHub={(id) => chooseView(HUBS.find((h) => h.id === id)!.pages[0].views[0])} />
      <AppHeader
        title={reportTitle(view)}
        busy={busy}
        hasData={ready}
        weekStart={start}
        thisWeek={payroll ? lastPeriod : clientHours ? last7 : thisWeek}
        homeLabel={payroll ? 'Last period' : clientHours ? 'Last 7 days' : 'This week'}
        snap={payroll ? fridayOf : clientHours ? (d) => d : mondayOf}
        onWeek={goTo}
        account={
          <AccountMenu
            email={editor.email}
            loadedAt={ready && loaded && !ownData ? loaded.at : null}
            busy={busy}
            onRefresh={reloadNow}
            onSignOut={signOut}
          />
        }
        hideDates={ownData}
        onExport={canExport && ready && loadedShifts.length > 0 ? exportDoc : undefined}
        exporting={exported?.status === 'working'}
      />
      <main
        className={`mx-auto px-4 py-5 sm:px-6 print:p-0 print:pt-3 ${view === 'teams' || timesheetView || dashboardView ? 'max-w-[1200px]' : 'max-w-5xl'}`}
      >
        <HubTabs hub={hub} view={view} onView={chooseView} />
        {!ownData && <WeekBar start={start} unit={payroll ? 'period' : 'week'} prefix={payroll ? 'Pay period' : undefined} onStep={goTo} />}
        {!payroll && !ownData && !invoicingView && (
          // its choices are worked out from the data: if that fails the bar is left out, and the report below says why
          <ErrorBoundary quiet dataKey={loaded?.at.getTime()}>
            <FilterBar
              view={view}
              clientHours={clientHours}
              shifts={loadedShifts}
              timesheets={timesheets}
              filters={filters}
              onFilters={setFilters}
            />
          </ErrorBoundary>
        )}

        {exported?.status === 'done' && (
          <p
            role="status"
            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 print:hidden"
          >
            <span>Google Doc created.</span>
            <a href={exported.url} target="_blank" rel="noreferrer" className="font-semibold underline">
              Open it
            </a>
            <button className="ml-auto text-sm underline" onClick={() => setExported(null)}>
              Dismiss
            </button>
          </p>
        )}
        {exported?.status === 'error' && (
          <p
            role="alert"
            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200 print:hidden"
          >
            <span>{exported.message}</span>
            <button className="ml-auto text-sm underline" onClick={() => setExported(null)}>
              Dismiss
            </button>
          </p>
        )}

        {error && !ownData && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <ErrorBoundary key={view} dataKey={ownData ? undefined : loaded?.at.getTime()} onRetry={reloadNow}>
          <Suspense
            fallback={
              <div role="status" className="flex flex-col items-center gap-4 py-20 text-ink-muted">
                <Spinner className="size-10 text-accent dark:text-accent-dark" />
                <p>Loading the report…</p>
              </div>
            }
          >
            {feedbackView && <FeedbackView editor={editor} today={today} onExpired={expire} />}
            {pricingView && <PricingView editor={editor} today={today} onExpired={expire} />}
            {patternsView && <ClientPatternsView editor={editor} today={today} onExpired={expire} />}
            {myWeekView && <MyWeekView editor={editor} onExpired={expire} />}
            {liveView && <LiveView editor={editor} onExpired={expire} graceMinutes={graceMinutes} />}
            {dashboardView && (
              <DashboardView
                editor={editor}
                onExpired={expire}
                onOpen={(v, at) =>
                  setNav((n) => ({
                    ...n,
                    view: v,
                    weekStart: at && (v === 'teams' || v === 'client' || v === 'staff') ? mondayOf(at) : n.weekStart,
                    periodStart:
                      at && (v === 'payroll' || v === 'review' || v === 'schedvsactual' || v === 'punctuality')
                        ? fridayOf(at)
                        : n.periodStart,
                    hoursStart: at && (v === 'invoicing' || v === 'clienthours') ? at : n.hoursStart,
                  }))
                }
                graceMinutes={graceMinutes}
              />
            )}

            {ready && svaView && loaded.review && <SchedVsActualView data={loaded.review} loadedAt={loaded.at.getTime()} />}
            {ready && punctualityView && loaded.review && (
              <PunctualityView data={loaded.review} loadedAt={loaded.at.getTime()} graceMinutes={graceMinutes} />
            )}
            {ready && reviewView && loaded.review && (
              <ReviewView
                periodStart={periodStart}
                data={loaded.review}
                loadedAt={loaded.at.getTime()}

                editor={editor}
                expire={expire}
                onChanged={reloadNow}
                onApplied={applyConfirmed}
              />
            )}
            {ready && view === 'payroll' && loaded.review && (
              <PayrollView
                periodStart={periodStart}
                timesheets={loaded.review.timesheets}
                shifts={loaded.review.shifts}
                loadedAt={loaded.at.getTime()}

                onChanged={reloadNow}
                onApplied={applyConfirmed}
                editor={editor}
                expire={expire}
              />
            )}
            {ready && invoicingView && <InvoicingView start={hoursStart} timesheets={timesheets} editor={editor} onExpired={expire} />}
            {ready && view === 'clienthours' && (
              <ClientHoursView start={hoursStart} timesheets={timesheets} filters={filters} editor={editor} onExpired={expire} />
            )}
            {ready && !timesheetView && !ownData && (
              <WeekReports view={view} weekStart={weekStart} shifts={loadedShifts} filters={filters} editor={editor} onExpired={expire} />
            )}
            {!ready && !error && !ownData && (
              <div role="status" className="flex flex-col items-center gap-4 py-20 text-ink-muted">
                <Spinner className="size-10 text-accent dark:text-accent-dark" />
                <p>Loading {needsReview ? 'timesheets and shifts' : timesheetView ? 'timesheets' : 'shifts'} from Camelo…</p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
