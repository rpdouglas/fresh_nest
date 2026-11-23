// The five hubs and the pages in each (decision 0042). The report on screen is still one `View`, in the address as
// ?view=..., so old links and the Back button work as before; the hub and the page are worked out from it. A page
// that holds several of today's reports shows a switch between them (items 2.3.5 to 2.3.7); each keeps its own report.
import type { View } from '../types'

export type HubId = 'home' | 'schedule' | 'pay' | 'billing' | 'clients'

export interface Page {
  /** The page's tab along the top of its hub. */
  tab: string
  /** The reports on this page; the first is where the page opens. */
  views: View[]
  /** For a page with several reports: what the switch is called, and its choices, one per report in order. A
   * report past the last choice (My week, from This week) is reached by a link on the page, not the switch. */
  choose?: { label: string; choices: string[] }
}

export interface Hub {
  id: HubId
  /** On the tab bar: short, so five fit across a phone. */
  label: string
  /** The hub's pages, as tabs along the top; the first is where the hub opens. */
  pages: Page[]
}

export const HUBS: Hub[] = [
  {
    id: 'home',
    label: 'Home',
    pages: [
      { tab: 'Dashboard', views: ['dashboard'] },
      { tab: 'Live board', views: ['live'] },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    pages: [
      {
        tab: 'This week',
        views: ['teams', 'staff', 'client', 'myweek'],
        choose: { label: 'Group by', choices: ['Day & team', 'Cleaner', 'Client'] },
      },
      { tab: 'Patterns & routes', views: ['patterns'] },
    ],
  },
  {
    id: 'pay',
    label: 'Hours & pay',
    pages: [
      { tab: 'Timesheets', views: ['review', 'schedvsactual'], choose: { label: 'Show', choices: ['To approve', 'Scheduled vs actual'] } },
      { tab: 'Payroll hours', views: ['payroll'] },
      { tab: 'Punctuality', views: ['punctuality'] },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    pages: [
      { tab: 'Client time', views: ['clienthours', 'invoicing'], choose: { label: 'Show', choices: ['Hours', 'To invoice'] } },
      { tab: 'Prices', views: ['pricing'] },
    ],
  },
  { id: 'clients', label: 'Clients', pages: [{ tab: 'Feedback', views: ['feedback'] }] },
]

/** The hub a report belongs to. Every report is in exactly one (hubs.test.ts holds the list to that). */
export function hubOf(view: View): Hub {
  return HUBS.find((h) => h.pages.some((p) => p.views.includes(view)))!
}

/** The page a report is on. */
export function pageOf(view: View): Page {
  return hubOf(view).pages.find((p) => p.views.includes(view))!
}
