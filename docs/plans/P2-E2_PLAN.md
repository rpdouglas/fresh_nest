# Phase A Plan: P2-E2 Post-Job Review Automation

This plan outlines three strategies for building the Post-Job Review Automation system to acquire feedback, moderate it via an admin dashboard, display approved reviews publicly, and prompt positive-rating customers to copy their feedback to Google Business Profile.

---

## Strategy 1: Firestore Job Transition Trigger + Hourly cron + Branded Emails + Read-Only Form (Recommended)

This strategy implements a Firestore trigger `onJobStatusCompleted` to schedule review emails precisely 24 hours after completion. An hourly scheduler function `onReviewEmailScheduler` queries jobs, fetches client preferences from the associated booking, and dispatches bilingual emails via Resend. The review form pre-populates name and location as read-only fields, minimizing friction for Travis (P2) and Margaret (P3). Rejections are marked with a database flag rather than deletion to maintain a complete compliance audit trail for Sarah (P12).

### Files Changed / Created
- **Functions Engine:**
  - `functions/src/index.ts` (Export `onJobStatusCompleted` trigger and `onReviewEmailScheduler` scheduler)
  - `functions/src/sendEmail.ts` (Add `sendReviewRequestEmail` utilizing Resend)
  - `functions/src/emailTemplates.ts` (Implement branded HTML/text review request templates in EN/FR)
- **Customer Frontend - Library & Config:**
  - `apps/customer/src/lib/config.ts` (Create global configuration file containing Google Business Profile link and client app base URL fallback)
  - `apps/customer/src/lib/firebase/firestore.ts` (Add `submitReview`, `subscribeToPendingReviews`, `subscribeToApprovedReviews`, `updateReviewStatus` helpers)
- **Customer Frontend - Pages & Routing:**
  - `apps/customer/src/App.tsx` (Add `/leave-review` route; map `/reviews` route to `ReviewsPage`)
  - `apps/customer/src/pages/LeaveReviewPage.tsx` (Create new review intake page with rating, text, and Google Business redirection modal)
  - `apps/customer/src/pages/ReviewsPage.tsx` (Create customer reviews landing page displaying combined static and approved Firestore reviews)
- **Customer Frontend - Admin Dashboard:**
  - `apps/customer/src/pages/AdminPage.tsx` (Register the new reviews moderation tab)
  - `apps/customer/src/components/admin/ReviewsModerationTab.tsx` (Create reviews table displaying pending reviews with Approve / Reject buttons)
- **Bilingual Copy:**
  - `apps/customer/src/i18n/locales/en.json` & `fr.json` (Add translations for reviews page, intake form, success modal, and admin reviews panel)

### Persona Impact
- **P2 Travis McLeod**: Receives the review request email exactly 24 hours after completion. Tapping the link opens a form with his name ("Travis M.") and location ("Long Sault, ON") already filled. Clicking a star rating and submitting takes less than 30 seconds.
- **P3 Margaret Storey**: The review form adheres to strict WCAG AA rules with 48px touch targets for stars and buttons, and text size >= 16px.
- **P1 Diane Lafleur & P5 Sophie Tremblay-Gagnon**: The review request email, form, and validation messages are presented in the exact language of their booking (EN/FR).
- **P12 Sarah (Compliance)**: Reviews rejected by the admin are updated to `rejected: true` (or `status: 'rejected'`) rather than deleted, keeping a complete audit trail.

### Risks & Mitigations
- *Risk*: A customer could submit multiple reviews if they refresh the form or reuse the link.
- *Mitigation*: The form check looks up the job in Firestore. If the job already has `reviewSubmitted: true`, the form displays a localized friendly message ("You have already submitted feedback for this cleaning. Thank you!") and hides the input fields.
- *Risk*: A review could be submitted for a non-existent job ID.
- *Mitigation*: The form queries the `/jobs` collection using the `jobId` from the URL query params. If the job document is not found, it shows an error message.

### Schema Audit

#### 1. Collection: `jobs` (Schema Updates)
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reviewRequestScheduledFor` | `Timestamp \| null` | ❌ | Target date/time for sending the review request email |
| `reviewEmailSent` | `boolean` | ❌ | Set to `true` once the email has been successfully sent |
| `reviewSubmitted` | `boolean` | ❌ | Set to `true` once the customer completes the review form |

#### 2. Collection: `reviews` (Schema Updates)
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | ✅ | Reviewer display name (pre-populated, e.g. "Travis M.") |
| `location` | `string` | ✅ | Location label (pre-populated, e.g. "Long Sault, ON") |
| `language` | `string` | ✅ | `'en' \| 'fr'` |
| `rating` | `number` | ✅ | Integer rating 1-5 |
| `text` | `string` | ✅ | Review comments |
| `approved` | `boolean` | ✅ | `true` if approved for display |
| `rejected` | `boolean` | ✅ | `true` if rejected by admin (prevents re-moderation) |
| `jobId` | `string` | ✅ | Associated job ID to prevent double submissions |
| `createdAt` | `Timestamp` | ✅ | Creation timestamp |

#### 3. Security Rules (`firestore.rules` & `firestore.dev.rules`)
```javascript
match /reviews/{reviewId} {
  // Anyone can read approved reviews
  allow read: if resource.data.approved == true || isAdmin();
  
  // Public creation of unapproved reviews associated with valid jobs
  allow create: if 
    request.resource.data.keys().hasAll(['name', 'location', 'language', 'rating', 'text', 'approved', 'rejected', 'jobId', 'createdAt'])
    && request.resource.data.rating is int && request.resource.data.rating >= 1 && request.resource.data.rating <= 5
    && request.resource.data.approved == false
    && request.resource.data.rejected == false
    && request.resource.data.createdAt == request.time;

  // Moderation changes allowed only for admins
  allow update: if isAdmin();
  
  // Prevent direct deletions
  allow delete: if false;
}
```

---

## Strategy 2: Batch Daily cron (No Real-Time Status Trigger)

Instead of a real-time Firestore trigger setting the schedule, a daily cron function runs once a day (e.g. at 6:00 PM), queries all jobs completed between 24 and 48 hours ago that do not have `reviewEmailSent: true`, and immediately sends the Resend email.

### Files Changed / Created
- Same client files as Strategy 1.
- `functions/src/index.ts`: Excludes `onJobStatusCompleted`. Includes a daily scheduled function `onDailyReviewEmailSender`.

### Persona Impact
- **P2 Travis McLeod**: Receives the email at a fixed time of day rather than exactly 24 hours after his specific clean, potentially rendering it less contextual if he was expecting it closer to job completion.

### Risks & Mitigations
- *Risk*: A batch execution sending many emails at once could hit Resend API rate limits or timeout limits if there are high numbers of completions.
- *Mitigation*: Implement batch slicing and sequential resolution rather than `Promise.all` for email dispatch.

### Schema Audit
- Same schema updates as Strategy 1.

---

## Strategy 3: Customer Portal In-App Review Prompt (No Email / Cron)

This strategy bypasses email communication and cron functions entirely. When a customer logs into the Customer Portal (developed in `P2-E1`), the application queries completed jobs for this customer that do not have reviews. It displays a prominent review request banner directly on their account home or upcoming bookings page.

### Files Changed / Created
- `apps/customer/src/pages/customer/CustomerBookingsPage.tsx` (Add in-app notification banner and prompt)
- `apps/customer/src/pages/customer/LeaveReviewModal.tsx` (Implement review form as an in-app modal instead of a separate page)
- Excludes all Cloud Functions modifications.

### Persona Impact
- Bypasses Travis (P2) who prefers fast SMS/Email links and might not log back into the portal after a clean is completed.
- High reliance on customers proactively logging in, which significantly reduces the organic review velocity on Google.

### Risks & Mitigations
- *Risk*: Very low review collection rate compared to proactive email reminders.

### Schema Audit
- Only requires adding `reviewSubmitted` to `jobs` and creating the `reviews` collection. No scheduler fields needed.
