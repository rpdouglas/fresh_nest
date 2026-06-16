# Phase A Plan: P2-E3 "On My Way" Customer Notification

This plan outlines three strategies for automatically sending an SMS notification to customers when their assigned cleaner checks in to a job.

---

## Strategy 1: Cloud Functions Firestore `onJobUpdatedTrigger` Extension (Recommended)
This strategy extends the existing `onJobUpdatedTrigger` in `functions/src/index.ts` to listen for job document updates. It triggers the SMS notification when the job status transitions to `in_progress` and `checkedInAt` changes from null to a valid timestamp.

### Files Changed
- [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts): Extend `onJobUpdatedTrigger` with the check-in listener, fetch cleaner's name from `staff/{uid}`, fetch booking details from `bookings/{bookingId}`, and dispatch SMS.
- [functions/src/sendSms.ts](file:///workspaces/fresh_nest/functions/src/sendSms.ts): Export a new helper function `sendOnMyWaySms` to handle Twilio client instantiation and phone normalization.
- [functions/src/smsTemplates.ts](file:///workspaces/fresh_nest/functions/src/smsTemplates.ts): Define the localized templates `onMyWaySms` for English and French.
- [docs/plans/P2-E3_PLAN.md](file:///workspaces/fresh_nest/docs/plans/P2-E3_PLAN.md) (This document)

### Persona Impact
- **P2 Travis McLeod & P6 Gallagher (Airbnb)**: Values speed, transparent updates, and tight turnaround windows. They receive an immediate text notification when their cleaner is on the way.
- **P1 Diane Lafleur & P5 Sophie Tremblay-Gagnon**: Receive the notification automatically translated to French matching their booking language choice.

### Risks & Mitigations
- *Risk*: Twilio configuration issues (missing keys/from number in development environment).
  - *Mitigation*: Wrap Twilio API calls in try/catch and ensure the function gracefully logs errors instead of crashing the trigger transaction. Check configuration existence prior to calling.
- *Risk*: Duplicate SMS runs if a job is updated multiple times while `in_progress`.
  - *Mitigation*: Ensure the transition filter checks `!before.checkedInAt && after.checkedInAt` along with `before.status !== 'in_progress' && after.status === 'in_progress'`. Because `checkedInAt` is only set once upon check-in, subsequent updates will not pass this check.
- *Risk*: Missing parent documents (`bookings` or `staff`).
  - *Mitigation*: Implement safe fallbacks. If the staff profile is missing, default the cleaner's name to a generic term ("your cleaner" / "votre préposé(e)"). If the booking document is missing, default the language to English.

### Schema Audit
- No schema changes. Checks existing `jobs`, `bookings`, and `staff` collections.

---

## Strategy 2: Client-Side Triggered Callable HTTPS Function
Instead of relying on a Firestore trigger, this strategy uses a client-side trigger. When the cleaner taps the "Check In" button in the FSM mobile application, the app calls an HTTPS Callable Cloud Function (e.g. `sendOnMyWaySms`) to trigger the notification.

### Files Changed
- [apps/fsm/src/pages/JobPage.tsx](file:///workspaces/fresh_nest/apps/fsm/src/pages/JobPage.tsx): Invoke the callable function when check-in succeeds.
- [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts): Export a new callable function `sendOnMyWaySms`.

### Persona Impact
- Similar to Strategy 1, notifications are delivered, but there is potential latency between database write and function trigger.

### Risks & Mitigations
- *Risk*: Network dropouts on the cleaner's mobile device could cause the check-in write to succeed but the callable function trigger to fail (or vice-versa).
  - *Mitigation*: Requires complex transactional rollback logic on the client side to prevent inconsistent state, increasing FSM frontend complexity.

---

## Strategy 3: Separate Micro-Trigger `onJobCheckInTrigger`
This strategy separates the check-in event handler from the main `onJobUpdatedTrigger` by creating a new `onDocumentUpdated` listener specifically for check-in events.

### Files Changed
- [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts): Add a new Firestore trigger `onJobCheckInTrigger`.

### Persona Impact
- Notifications are sent exactly like Strategy 1.

### Risks & Mitigations
- *Risk*: Having multiple triggers listening to updates on the same collection (`jobs`) increases execution overhead and makes debugging order-of-execution issues more difficult.
  - *Mitigation*: Consolidating all job-update actions (cancellations, reassignments, check-ins) into the unified `onJobUpdatedTrigger` is cleaner and easier to maintain.
