export interface Person {
  id: string
  name: string | null
  phoneNumber?: string | null
}

export interface Client {
  id: string
  name: string | null
  clientNumber: string | null
  phoneNumber: string | null
  email: string | null
}

export interface Shift {
  id: string
  title: string | null
  state: string | null
  startTime: string
  endTime: string
  timezone: string | null
  breakDuration: number | null
  note: string | null
  systemNote: string | null
  client: Client | null
  assignee: Person | null
  jobSite: { name: string | null; address: string | null; note: string | null } | null
  schedule: { id: string; name: string | null } | null
  group: { name: string | null } | null
  shiftPartners: { id: string; assignee: Person | null }[] | null
  checklistAssignments: { completionPercentage: number | null; checklist: { name: string | null } | null }[] | null
}

export interface WeekResponse {
  weekStart: string
  from: string
  to: string
  shifts: Shift[]
}

/** One clock-in/out. */
export interface Timesheet {
  id: string
  /** APPROVED, SUBMITTED, and possibly DRAFT, REJECTED, ... */
  state: string
  from: string
  to: string | null
  /** Whole minutes, as Camelo reports them. */
  totalDuration: number | null
  timezone: string | null
  approvedAt: string | null
  employee: Person | null
  group: { id?: string; name: string | null } | null
  client: { id: string; name: string | null } | null
  jobSite: { id?: string; name: string | null; address?: string | null } | null
}

/** A scheduled shift, as much as the unapproved-timesheets review needs. */
export interface ReviewShift {
  id: string
  state: string | null
  startTime: string
  endTime: string
  timezone: string | null
  /** Unpaid break in minutes. */
  breakDuration: number | null
  client: { id: string; name: string | null } | null
  assignee: Person | null
  jobSite: { id?: string; name: string | null; address?: string | null } | null
  group: { id?: string; name: string | null } | null
  checklistAssignments?: { completionPercentage: number | null; checklist: { name: string | null } | null }[] | null
  shiftPartners?: { id: string; assignee: Person | null }[] | null
}

/** A timesheet with the shift it was clocked against, when Camelo knows it. */
export interface ReviewSheet extends Timesheet {
  /** How many comments it has in Camelo, including Camelo's automatic ones. */
  comments?: number
  /** A TimeCard for a clock-in; a LeaveRequest for time off; nothing for an entry added by hand. */
  referenceObject?: { __typename?: string; shiftId?: string | null; note?: string | null } | null
}

export interface ReviewResponse {
  periodStart: string
  from: string
  to: string
  /** Every timesheet in the pay period, approved or not. */
  timesheets: ReviewSheet[]
  shifts: ReviewShift[]
  /** Shifts outside the period that an unapproved timesheet points to. */
  otherShifts: ReviewShift[]
}

export interface PeriodResponse {
  periodStart: string
  from: string
  to: string
  timesheets: Timesheet[]
}

/** Today's shifts and timesheets for the live board. */
export interface LiveResponse {
  today: string
  now: number
  shifts: ReviewShift[]
  timesheets: ReviewSheet[]
}

/** One piece of client feedback about a job, or about a client in general. */
export interface Feedback {
  id: string
  type: 'kudos' | 'complaint'
  /** YYYY-MM-DD: the visit's local day, or the day chosen when there is no visit. */
  date: string
  visitStart: string | null
  visitEnd: string | null
  timesheetIds: string[]
  clientKey: string | null
  clientName: string
  siteName: string | null
  cleaners: { id: string; name: string }[]
  text: string
  source: string
  category: string
  /** Complaints only. */
  status: 'open' | 'resolved' | null
  resolution: string | null
  createdAt: number
  createdBy: string
  updatedAt: number | null
  updatedBy: string | null
  /** Kudos only: when, and by whom, it was passed on to the cleaners. */
  passedOnAt?: number | null
  passedOnBy?: string | null
}

export type View =
  | 'dashboard'
  | 'live'
  | 'client'
  | 'staff'
  | 'teams'
  | 'payroll'
  | 'clienthours'
  | 'feedback'
  | 'review'
  | 'schedvsactual'
  | 'punctuality'
  | 'invoicing'
  | 'pricing'
  | 'patterns'
  /** What a cleaner sees, for the office to look at: the cleaner's own page is not a report in this list. */
  | 'myweek'

/** One finished pay period's figures, saved for the dashboard's trends (see web/src/lib/trends.ts). */
export interface PeriodSnapshot {
  v: number
  periodStart: string
  totals: Record<string, number>
  cleaners: {
    id: string
    name: string
    visits: number
    measured: number
    onTime: number
    late: number
    noShows: number
    scheduledMinutes: number
    actualMinutes: number
    kudos: number
    complaints: number
  }[]
  clients: { key: string; name: string; billed: number; approvedMinutes: number }[]
  savedAt: number
  savedBy: string
}

/** What one client is billed from a day onwards, and the client's list of them (see functions/src/core.ts). */
export interface RateRule {
  from: string
  kind: 'hourly' | 'flat'
  dollars: number
  setAt: number
  setBy: string
}
export interface ClientRate {
  clientKey: string
  clientName: string
  rules: RateRule[]
}

/** Whether one client's billable time on one day has been invoiced (see functions/src/core.ts). */
export interface Invoiced {
  id: string
  date: string
  clientKey: string
  clientName: string
  invoiced: boolean
  minutes: number
  amount: number
  timesheetIds: string[]
  updatedAt: number
  updatedBy: string
}

/** System grace setting for punctuality and live board (5-30m, default 15m). */
export interface GraceSetting {
  minutes: number
  updatedAt: number | null
  updatedBy: string | null
}

/** A red visit on the live board marked handled (see functions/src/core.ts). */
export interface LiveHandled {
  shiftId: string
  date: string
  handled: boolean
  updatedAt: number
  updatedBy: string
}

/** A photo of a client's home on a visit (decision 0044); the picture is fetched on its own. */
export interface VisitPhoto {
  id: string
  shiftId: string
  kind: 'before' | 'after'
  takenAt: number
  takenBy: string
  /** The office any; a cleaner their own, the same day. */
  canDelete: boolean
}
