import { notOnCall } from './lib/schedule'
import type { MyWeekResponse } from './lib/myWeek'
import type { GraceSetting, LiveHandled, LiveResponse, PeriodResponse, ReviewResponse, WeekResponse } from './types'

export class ApiError extends Error {
  status: number
  /** Why a request was refused: 'not_signed_in' (401: no sign-in, or it expired) or 'not_editor' (403). */
  reason: string | null
  constructor(status: number, message: string, reason: string | null = null) {
    super(message)
    this.status = status
    this.reason = reason
  }
}

/** True when the request was refused for the sign-in: sign in again (or as someone else). */
export const isSignInError = (e: unknown): e is ApiError => e instanceof ApiError && (e.status === 401 || e.status === 403)

/** Who the server says is signed in: someone from the office, or a cleaner (decision 0037). What it answers is the control; this only chooses the page. */
export interface Signed {
  email: string
  role: 'office' | 'cleaner'
  /** A cleaner's name, from Camelo. */
  name?: string
}
export const whoami = (token: string) => post<Signed>('/api/whoami', {}, token)

/** One person's own visits and hours. A cleaner gets their own; the office names whose it wants to see. */
export const fetchMyWeek = (token: string, employeeId?: string, signal?: AbortSignal) =>
  post<MyWeekResponse>('/api/my-week', employeeId ? { employeeId } : {}, token, signal)

export const fetchWeek = (weekStart: string, token: string, signal?: AbortSignal) =>
  post<WeekResponse>('/api/shifts', { weekStart }, token, signal)

/** A pay period's timesheets and shifts, for reviewing what is not yet approved. */
export const fetchReview = (periodStart: string, token: string, signal?: AbortSignal) =>
  post<ReviewResponse>('/api/timesheet-review', { periodStart }, token, signal).then(withoutOnCall)

/** Timesheets for the seven days from periodStart (a Friday). */
export const fetchPeriod = (periodStart: string, token: string, signal?: AbortSignal) =>
  post<PeriodResponse>('/api/timesheets', { periodStart }, token, signal).then(withoutOnCall)

/** Today's shifts and timesheets for the live board. */
export const fetchLive = (token: string, refresh = false, signal?: AbortSignal) =>
  post<LiveResponse>('/api/live', refresh ? { refresh: true } : {}, token, signal).then(withoutOnCall)

/**
 * Owner's rule: On Call only says who is on call, so a timesheet logged as On Call is
 * dropped as it arrives and no report sees it. (On Call shifts stay: Daily teams lists them.)
 */
export const withoutOnCall = <T extends { timesheets: { group: { name: string | null } | null }[] }>(data: T): T => ({
  ...data,
  timesheets: data.timesheets.filter(notOnCall),
})

export interface ActionResult {
  id: string
  ok: boolean
  state: string | null
  message: string | null
}

export interface ChangeEntry {
  at: number
  email: string
  action: string
  timesheetId: string
  employee: string | null
  sheetFrom: string | null
  before: { state?: string; from?: string; to?: string | null } | null
  /** After an entry is added, also where it was put (client and job site names). */
  after: { state?: string; from?: string; to?: string | null; client?: string | null; jobSite?: string | null } | null
  ok: boolean
  message: string | null
}

/** Changes to timesheets, and the lists that go with them. */
export const timesheetAction = <T>(payload: Record<string, unknown>, token: string) => post<T>('/api/timesheet-actions', payload, token)

/** Invoiced ticks: list a date range, or set one client-day. */
export const invoiceAction = <T>(payload: Record<string, unknown>, token: string) => post<T>('/api/invoices', payload, token)

/** Client prices: list them all, or set one client's price from a day onwards. */
export const clientRatesAction = <T>(payload: Record<string, unknown>, token: string) => post<T>('/api/client-rates', payload, token)

/** The dashboard's schedule check: solo visits marked OK, and where job-site addresses are. */
export const scheduleCheckAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/schedule-check', payload, token, signal)

/** Finished pay periods' figures, for the dashboard's trends: list a range, or save one. */
export const snapshotAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/snapshots', payload, token, signal)

/** Client kudos and complaints. */
export const feedbackAction = <T>(payload: Record<string, unknown>, token: string) => post<T>('/api/feedback', payload, token)

/** System settings: grace period for live board and punctuality. */
export const settingsAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/settings', payload, token, signal)

export const fetchSettings = (token: string, signal?: AbortSignal) =>
  settingsAction<{ settings: { grace: GraceSetting } }>({ action: 'get' }, token, signal).then((r) => r.settings)

export const saveGraceSetting = (minutes: number, token: string) =>
  settingsAction<{ settings: { grace: GraceSetting } }>({ action: 'set', minutes }, token).then((r) => r.settings.grace)

/** Red visits on the live board marked handled: list for a day, or mark/undo a visit. */
/** Photos of clients' homes on visits (decision 0044): list, add, view, delete. */
export const visitPhotosAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/visit-photos', payload, token, signal)

/** Connect a cleaner's Camelo account once, and clock in or out with a door photo (decision 0044). */
export const clockAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/clock', payload, token, signal)

export const liveHandledAction = <T>(payload: Record<string, unknown>, token: string, signal?: AbortSignal) =>
  post<T>('/api/live-handled', payload, token, signal)

export const fetchLiveHandled = (date: string, token: string, signal?: AbortSignal) =>
  liveHandledAction<{ entries: LiveHandled[] }>({ action: 'list', date }, token, signal).then((r) => r.entries)

export const saveLiveHandled = (shiftId: string, date: string, handled: boolean, token: string) =>
  liveHandledAction<{ entry: LiveHandled }>({ action: 'set', shiftId, date, handled }, token).then((r) => r.entry)

/** Every route needs the Google ID token of someone on the editors list. */
async function post<T>(path: string, payload: unknown, token: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      // Not an "X-Google-..." name: Google's front end strips those before they reach the function.
      headers: { 'Content-Type': 'application/json', 'X-Editor-Token': token },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, 'Could not reach the server. Check your connection.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`, body?.reason ?? null)
  return body as T
}
