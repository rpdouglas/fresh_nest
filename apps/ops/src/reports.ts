import type { View } from './types'

export const REPORTS: { view: View; title: string; blurb: string }[] = [
  { view: 'dashboard', title: 'Dashboard', blurb: 'What needs attention, this pay period against targets, and recent kudos.' },
  { view: 'live', title: 'Live board', blurb: 'Who is late, who is on site, and who is at risk for their next visit.' },
  { view: 'teams', title: 'Daily teams', blurb: 'Each day, each pair of cleaners, and the visits they do together.' },
  { view: 'client', title: 'By client', blurb: "Each client's week: who is coming and when." },
  { view: 'staff', title: 'By staff', blurb: "Each cleaner's own week, day by day." },
  { view: 'clienthours', title: 'Client hours', blurb: 'Hours at each client and site per day, averaged across the cleaners there.' },
  { view: 'invoicing', title: 'Invoicing', blurb: 'Each day, each client’s billable time, with a box to tick once it has been invoiced.' },
  {
    view: 'pricing',
    title: 'Client prices',
    blurb: 'What each client is billed, and from when: the default, another hourly rate, or a flat price a visit.',
  },
  {
    view: 'myweek',
    title: 'My week (as a cleaner sees it)',
    blurb: 'One person’s own visits and hours: the only page a cleaner is shown. Choose whose to look at.',
  },
  { view: 'feedback', title: 'Client feedback', blurb: 'Kudos and complaints by cleaner and client. Private to signed-in editors.' },
  {
    view: 'schedvsactual',
    title: 'Scheduled vs actual',
    blurb: 'Scheduled against actual hours per employee per day, with a variance chart. On Call left out.',
  },
  {
    view: 'punctuality',
    title: 'Punctuality',
    blurb: 'On-time arrivals, late starts, early finishes and missed visits, by cleaner and by client.',
  },
  {
    view: 'review',
    title: 'Unapproved timesheets',
    blurb: 'What is waiting for approval, scheduled against actual, and shifts with no timesheet.',
  },
  { view: 'payroll', title: 'Payroll hours', blurb: 'Approved and unapproved hours per employee, Friday to Thursday.' },
  {
    view: 'patterns',
    title: 'Client patterns and routes',
    blurb: 'Each client’s usual day, start time and visit length, and a four-week plan of routes from the office.',
  },
]

export const reportTitle = (view: View) => REPORTS.find((r) => r.view === view)!.title
