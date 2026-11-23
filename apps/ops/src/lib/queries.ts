// Loading from the server, and keeping what was loaded (TanStack Query). One cache for the
// whole site: a week of shifts, seven days of timesheets or a pay period for review is asked
// for once and is fresh for five minutes, whichever screen wants it.
//
// Camelo allows only so many requests, so nothing is asked again by itself: not when the
// window gets the focus back, not when the connection returns, and a failed request is not
// retried here (the server already retries reads).
import { QueryClient, queryOptions } from '@tanstack/react-query'
import {
  type ActionResult,
  clientRatesAction,
  feedbackAction,
  fetchLiveHandled,
  fetchMyWeek,
  fetchPeriod,
  fetchReview,
  fetchSettings,
  fetchWeek,
  invoiceAction,
  scheduleCheckAction,
  snapshotAction,
  timesheetAction,
  visitPhotosAction,
} from '../api'
import type { ClientRate, Feedback, Invoiced, PeriodSnapshot, Timesheet, VisitPhoto } from '../types'
import type { Point } from './scheduleCheck'
import { type Overrides, applyOverrides, overridesFrom } from './changes'

/** How long something loaded is shown without asking again. */
export const FRESH_MS = 5 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: FRESH_MS, gcTime: 30 * 60 * 1000, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false },
  },
})

// States Camelo confirmed for changes made here, until its list of timesheets agrees (see changes.ts).
let confirmed: Overrides = {}

/** What was just read, with the confirmed states applied: Camelo's list can be a moment behind a change it has confirmed. */
function withConfirmed<T extends { timesheets: Timesheet[] }>(data: T): T {
  const r = applyOverrides(data.timesheets, confirmed, Date.now())
  confirmed = r.overrides
  return r.timesheets === data.timesheets ? data : { ...data, timesheets: r.timesheets }
}

/** A week of shifts, Monday to Sunday. */
export const weekQuery = (start: string, token: string) =>
  queryOptions({ queryKey: ['camelo', 'week', start], queryFn: ({ signal }) => fetchWeek(start, token, signal) })

/** Seven days of timesheets from `start`. */
export const periodQuery = (start: string, token: string) =>
  queryOptions({ queryKey: ['camelo', 'period', start], queryFn: ({ signal }) => fetchPeriod(start, token, signal).then(withConfirmed) })

/** A pay period's timesheets and shifts. */
export const reviewQuery = (start: string, token: string) =>
  queryOptions({ queryKey: ['camelo', 'review', start], queryFn: ({ signal }) => fetchReview(start, token, signal).then(withConfirmed) })

/** One person's own visits and hours: the signed-in cleaner's, or the person the office names. */
export const myWeekQuery = (token: string, employeeId?: string) =>
  queryOptions({ queryKey: ['camelo', 'my-week', employeeId ?? 'me'], queryFn: ({ signal }) => fetchMyWeek(token, employeeId, signal) })

export const myWeekChanged = () => void queryClient.invalidateQueries({ queryKey: ['camelo', 'my-week'] })

/** Client kudos and complaints dated from `from` to `to`. Kept by this site, not Camelo. */
export const feedbackQuery = (from: string, to: string, token: string) =>
  queryOptions({
    queryKey: ['feedback', from, to],
    queryFn: () => feedbackAction<{ entries: Feedback[] }>({ action: 'list', from, to }, token).then((r) => r.entries),
  })

/** After a change to the feedback: every range that is loaded is read again, the ones on screen at once. */
export const feedbackChanged = () => void queryClient.invalidateQueries({ queryKey: ['feedback'] })

/** The active employees, for the forms that choose one. They change rarely: kept for half an hour. */
export const employeesQuery = (token: string) =>
  queryOptions({
    queryKey: ['employees'],
    queryFn: () => timesheetAction<{ employees: { id: string; name: string }[] }>({ action: 'employees' }, token).then((r) => r.employees),
    staleTime: 30 * 60 * 1000,
  })

/** The clients and job sites an added entry can be put at; each site names its client, if it has one. */
export interface WorkPlaces {
  clients: { id: string; name: string }[]
  sites: { id: string; name: string; clientId: string | null }[]
}
export const workPlacesQuery = (token: string) =>
  queryOptions({
    queryKey: ['work-places'],
    queryFn: () => timesheetAction<WorkPlaces>({ action: 'places' }, token),
    staleTime: 30 * 60 * 1000,
  })

/** Which client-days from `from` to `to` have been invoiced. */
export const invoicedQuery = (from: string, to: string, token: string) =>
  queryOptions({
    queryKey: ['invoiced', from, to],
    queryFn: () => invoiceAction<{ entries: Invoiced[] }>({ action: 'list', from, to }, token).then((r) => r.entries),
  })

/** Every client's prices. Kept by this site, not Camelo; nothing is billed until they have loaded. */
export const clientRatesQuery = (token: string) =>
  queryOptions({
    queryKey: ['client-rates'],
    queryFn: () => clientRatesAction<{ rates: ClientRate[] }>({ action: 'list' }, token).then((r) => r.rates),
  })

/** The shifts whose solo visit has been marked OK on the schedule check, by shift id. */
export const soloOkQuery = (from: string, to: string, token: string) =>
  queryOptions({
    queryKey: ['solo-ok', from, to],
    queryFn: ({ signal }) =>
      scheduleCheckAction<{ entries: { shiftId: string }[] }>({ action: 'oks', from, to }, token, signal).then((r) =>
        r.entries.map((e) => e.shiftId),
      ),
  })

/** The saved figures of the finished pay periods from `from` to `to`, for the dashboard's trends. */
export const snapshotsQuery = (from: string, to: string, token: string) =>
  queryOptions({
    queryKey: ['snapshots', from, to],
    queryFn: ({ signal }) =>
      snapshotAction<{ snapshots: PeriodSnapshot[] }>({ action: 'list', from, to }, token, signal).then((r) => r.snapshots),
  })

/** Shared system settings (grace period for live board and punctuality). */
export const settingsQuery = (token: string) =>
  queryOptions({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings(token, signal),
  })

/** Invalidate settings after an update. */
export const settingsChanged = () => void queryClient.invalidateQueries({ queryKey: ['settings'] })

/** Handled red visits on the live board for a day, by shift id. */
export const liveHandledQuery = (date: string, token: string) =>
  queryOptions({
    queryKey: ['live-handled', date],
    queryFn: ({ signal }) =>
      fetchLiveHandled(date, token, signal).then((entries) => new Set(entries.filter((e) => e.handled).map((e) => e.shiftId))),
  })

/** Invalidate live-handled visits after an update. */
export const liveHandledChanged = (date?: string) =>
  void queryClient.invalidateQueries({ queryKey: date ? ['live-handled', date] : ['live-handled'] })

/** The photos on these visits (decision 0044); the pictures are fetched one by one with `visitPhotoQuery`. */
export const visitPhotosQuery = (shiftIds: string[], token: string) =>
  queryOptions({
    queryKey: ['visit-photos', [...shiftIds].sort().join()],
    queryFn: ({ signal }) => visitPhotosAction<{ photos: VisitPhoto[] }>({ action: 'list', shiftIds }, token, signal).then((r) => r.photos),
  })

/** One photo's picture, as a data: address the page can show. A photo never changes, so it is kept a long while. */
export const visitPhotoQuery = (id: string, token: string) =>
  queryOptions({
    queryKey: ['visit-photo', id],
    queryFn: ({ signal }) =>
      visitPhotosAction<{ image: string; contentType: string }>({ action: 'view', id }, token, signal).then(
        (r) => `data:${r.contentType};base64,${r.image}`,
      ),
    staleTime: Infinity,
  })

export const visitPhotosChanged = () => void queryClient.invalidateQueries({ queryKey: ['visit-photos'] })

/** At most this many rounds of address lookups for one schedule check. */
const PLACE_ROUNDS = 60

/**
 * Where the job sites are, for the drive times. The server looks addresses up a few at a time
 * (one a second, the map service's limit) and says how many are still to do, so this asks
 * again until none are: the first run takes a minute or two, after that they are remembered.
 */
export const placesQuery = (addresses: string[], token: string) =>
  queryOptions({
    queryKey: ['places', addresses],
    queryFn: ({ signal }) =>
      scheduleCheckAction<{ places: Record<string, Point | null>; pending: number; failed: boolean }>(
        { action: 'places', addresses },
        token,
        signal,
      ),
    refetchInterval: (q) =>
      q.state.data && !q.state.data.failed && q.state.data.pending && q.state.dataUpdateCount < PLACE_ROUNDS ? 250 : false,
  })
/** Whether the lookups for this answer are finished, one way or the other. */
export const placesDone = (data: { pending: number; failed: boolean }, rounds: number) =>
  data.failed || !data.pending || rounds >= PLACE_ROUNDS

/**
 * An approval or rejection Camelo has confirmed shows at once, in everything loaded that holds
 * timesheets; each is then read again when next shown. The time it was loaded is kept: the
 * reports work out "now" from it.
 */
export function applyConfirmed(results: ActionResult[]) {
  const now = Date.now()
  confirmed = overridesFrom(results, now, confirmed)
  if (!Object.keys(confirmed).length) return
  for (const kind of ['period', 'review']) {
    for (const q of queryClient.getQueryCache().findAll({ queryKey: ['camelo', kind] })) {
      queryClient.setQueryData<{ timesheets: Timesheet[] }>(
        q.queryKey,
        (old) => {
          if (!old) return old
          const timesheets = applyOverrides(old.timesheets, confirmed, now).timesheets
          return timesheets === old.timesheets ? old : { ...old, timesheets }
        },
        { updatedAt: q.state.dataUpdatedAt },
      )
    }
    void queryClient.invalidateQueries({ queryKey: ['camelo', kind], refetchType: 'none' })
  }
}

/** On sign-out: nothing loaded is kept for the next person. */
export function forgetLoaded() {
  confirmed = {}
  queryClient.clear()
}
