// Domain trigger re-exports
export { onBookingCreated, onBookingStatusConfirmed, onBookingCancelled } from './triggers/booking'
export { onJobCreatedTrigger } from './triggers/job.created'
export { onJobUpdatedTrigger, onJobStatusCompleted } from './triggers/job.updated'
export { onStaffUpdatedTrigger } from './triggers/staff'
export {
  auditBookings,
  auditJobs,
  auditStaff,
  auditChecklistTemplates,
  auditPayRates,
  auditGalleryPairs,
  auditReviews,
} from './triggers/audit'
export { onUserCreated } from './triggers/auth'

// Domain callable re-exports
export { setUserRole, resolveOfficeEntries, syncMyRole } from './callable/auth'
export { createPaymentIntent, stripeWebhookHandler } from './callable/payments'
export { claimJob } from './callable/job'
export { listOpenShifts } from './callable/shifts'
export { getAnalyticsKPIs } from './callable/analytics'
export { onStaffRegistered, migrateComplianceRecords, resendWelcomeEmail } from './callable/staff'
export { updatePolicySettings } from './callable/settings'

// Domain scheduled cron re-exports
export { onDailyReminderCheck } from './scheduled/reminders'
export { onDailyRecurringRenewal } from './scheduled/renewals'
export { onMonthlyEarningsRollover } from './scheduled/earnings'
export { onReviewEmailScheduler } from './scheduled/reviews'
