// Domain trigger re-exports
export { onBookingCreated, onBookingStatusConfirmed, onBookingCancelled } from './triggers/booking'
export { onJobCreatedTrigger } from './triggers/job.created'
export { onJobUpdatedTrigger, onJobStatusCompleted } from './triggers/job.updated'
export { onStaffUpdatedTrigger, onStaffStatusActivated, onStaffDeactivated } from './triggers/staff'
export { onUserCreated } from './triggers/auth'

// Domain callable re-exports
export { setUserRole } from './callable/auth'
export { createPaymentIntent, applyReferralDiscount, stripeWebhookHandler } from './callable/payments'
export { claimJob } from './callable/job'
export { getAnalyticsKPIs } from './callable/analytics'
export { onStaffRegistered, migrateComplianceRecords, resendWelcomeEmail, submitBackgroundCheckConsent, updateBackgroundCheckStatus, completeTrainingModule, reactivateStaff } from './callable/staff'
export { adjustCredit } from './callable/referrals'

// Domain scheduled cron re-exports
export { onDailyReminderCheck } from './scheduled/reminders'
export { onProbationCheckInDue } from './scheduled/probation'
export { onDailyRecurringRenewal } from './scheduled/renewals'
export { onMonthlyEarningsRollover } from './scheduled/earnings'
export { onReviewEmailScheduler } from './scheduled/reviews'
