// Each report's code is its own download, fetched when the report is first opened. Once the
// first screen is up the rest are fetched in the background, so switching stays instant and a
// tab left open across a deploy already has them. Add a new report here, not as a plain import.
import { lazy } from 'react'

const loaders = {
  dashboard: () => import('./components/DashboardView'),
  live: () => import('./components/LiveView'),
  week: () => import('./components/WeekReports'),
  payroll: () => import('./components/PayrollView'),
  review: () => import('./components/ReviewView'),
  schedVsActual: () => import('./components/SchedVsActualView'),
  punctuality: () => import('./components/PunctualityView'),
  clientHours: () => import('./components/ClientHoursView'),
  invoicing: () => import('./components/InvoicingView'),
  feedback: () => import('./components/FeedbackView'),
  pricing: () => import('./components/PricingView'),
  patterns: () => import('./components/ClientPatternsView'),
}
// Not in the list above: a cleaner's page is not one of the office's reports, and must not bring them with it.
const myWeek = () => import('./components/MyWeekView')

export const DashboardView = lazy(loaders.dashboard)
export const LiveView = lazy(loaders.live)
export const WeekReports = lazy(loaders.week)
export const PayrollView = lazy(loaders.payroll)
export const ReviewView = lazy(loaders.review)
export const SchedVsActualView = lazy(loaders.schedVsActual)
export const PunctualityView = lazy(loaders.punctuality)
export const ClientHoursView = lazy(loaders.clientHours)
export const InvoicingView = lazy(loaders.invoicing)
export const FeedbackView = lazy(loaders.feedback)
export const PricingView = lazy(loaders.pricing)
export const ClientPatternsView = lazy(loaders.patterns)
export const MyWeekView = lazy(myWeek)

/** Fetches every report's code ahead of need. A failure is left for when the report is opened. */
export function prefetchReports() {
  for (const load of Object.values(loaders)) void load().catch(() => {})
}
