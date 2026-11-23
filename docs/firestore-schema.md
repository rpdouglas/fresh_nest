# Firestore Database Schema Reference
**Version:** 2.4 | **Updated:** 2026-11-23 (P3-E41 §17 Ops collections from FNC Landing, ADR-022)

---

## 1. Collection: `bookings`
Stores residential, commercial, and Airbnb cleaning reservations.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `firstName` | `string` | ✅ | Client first name |
| `lastName` | `string` | ✅ | Client last name |
| `email` | `string` | ✅ | Client email address (captures CASL compliance). Stored trimmed and lowercased — the customer portal and the bookings read rule match it against the Firebase Auth email. |
| `phone` | `string` | ✅ | Client phone number (for SMS notifications) |
| `language` | `string` | ✅ | `'en' \| 'fr'` (drives language of confirmation communications) |
| `propertyType` | `string` | ✅ | `'apartment' \| '1-2bed' \| '3-4bed' \| '5+bed' \| 'commercial'` |
| `bedrooms` | `number` | ✅ | Count of bedrooms |
| `bathrooms` | `number` | ✅ | Count of bathrooms |
| `squareFootage` | `number` | ❌ | Approximate square footage (optional) |
| `estimatedPriceCents` | `int` | ❌ | P3-E38: internal estimate in integer cents (office-created bookings); never shown on the public site (P3-E29). Rules: must be `int` |
| `frequency` | `string` | ✅ | `'one-time' \| 'weekly' \| 'biweekly' \| 'monthly'` |
| `pets` | `boolean` | ✅ | `true` if pets are present (triggers pet-safe products notification) |
| `address` | `string` | ✅ | Full street address |
| `serviceType` | `string` | ✅ | `'standard' \| 'deep' \| 'moveout' \| 'postconstruction' \| 'airbnb' \| 'commercial'` |
| `addOns` | `string[]` | ❌ | List of extras: `['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement']` |
| `preferredDate` | `string` | ✅ | Calendar date `YYYY-MM-DD` in Toronto time (ADR-020) |
| `preferredCleaner` | `string \| null` | ❌ | Name of requested staff cleaner (loyalty feature) |
| `notes` | `string` | ❌ | Island access instructions, gate entry codes, special directives |
| `leadSource` | `string` | ✅ | `'organic' \| 'google' \| 'referral' \| 'facebook' \| 'direct' \| 'phone' \| 'walk-in'` |
| `status` | `string` | ✅ | `'pending' \| 'confirmed' \| 'completed' \| 'cancelled'` |
| `assignedTo` | `string \| null` | ✅ | Name of assigned cleaner when scheduled |
| `isAirbnb` | `boolean` | ✅ | `true` if Airbnb turnover specific workflows are required |
| `photoConfirmation` | `boolean` | ✅ | `true` if photos are required upon completion |
| `fsmAppointmentId` | `string \| null` | ❌ | Sync identifier for field service management software (Phase 6) |
| `createdAt` | `Timestamp` | ✅ | Firestore Server Timestamp |
| `marketingConsent` | `boolean` | ❌ | CASL: `true` if client opted in to marketing emails. Omitted entirely (not `null`) when false. |
| `consentTimestamp` | `Timestamp` | ❌ | CASL: Server timestamp of marketing consent. Present only when `marketingConsent === true`. |
| `consentMethod` | `string` | ❌ | CASL: `'booking-form-v2'`. Present only when `marketingConsent === true`. |
| `referralCode` | `string \| null` | ❌ | The deterministic referral code generated for this client (e.g., `FIRSTNAME-1234`). Copied onto recurring renewals. |
| `referredBy` | `string \| null` | ❌ | The referral code applied during booking creation to receive the discount. |
| `stripePaymentIntentId` | `string \| null` | ❌ | Stripe PaymentIntent identifier for holding/releasing funds |
| `stripeChargeId` | `string \| null` | ❌ | Stripe Charge identifier (populated on capture) |
| `stripeChargeStatus` | `string \| null` | ❌ | Stripe payment status hold/captured/released |
| `jobId` | `string \| null` | ❌ | Associated job document ID backlink once booking is confirmed |
| `createdBy` | `string` | ❌ | Admin email that created the booking (phone/walk-in bookings), or `'system:recurring-renewal'` for bookings created by the recurring-renewal cron. Absent on public quote requests. |
| `checklistTemplateId` | `string \| null` | ❌ | P3-E34: saved checklist (`checklistTemplates` ID) chosen by an admin for this client's visits. The job created from this booking gets that list instead of the service-type match, and the recurring-renewal cron copies the field onto each renewal. `null`/absent = chosen by service type. Admin-only (no public-form field). |
| `pipeline` | `map` | ❌ | P3-E40: sales pipeline metadata (omitted on `system:recurring-renewal` bookings): `{ stage: 'new' \| 'contacted' \| 'site_visit' \| 'quoted' \| 'won' \| 'lost', ownerEmail: string \| null, ownerRole: 'owner' \| 'manager' \| 'cleaner' \| 'lead' \| 'supervisor' \| 'contractor' \| null, ownerAssignedAt: Timestamp \| null, ownerAssignedBy: string \| null, needsSiteVisit: boolean, nextFollowUpDate: string \| null (YYYY-MM-DD Toronto), firstContactAt: Timestamp \| null, quotedPriceCents: int \| null (internal only, P3-E29), quoteSentAt: Timestamp \| null, closedAt: Timestamp \| null, lostReason: 'no_response' \| 'price' \| 'chose_competitor' \| 'date_unavailable' \| 'outside_area' \| 'duplicate_or_spam' \| 'other' \| null, lostNote: string \| null (≤ 500 chars) }`. Watched by `auditBookings`. |

### Subcollection: `bookings/{bookingId}/leadNotes/{noteId}` (P3-E40, append-only)
Contact log and internal notes on a lead. Office users (`isOffice()`) may read and create append-only notes; non-office lead owners write/read via server callables (`getMyLead`, `addMyLeadNote`). Updates and deletes are denied (`false`).

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `kind` | `string` | ✅ | `'call' \| 'sms' \| 'email' \| 'note'` |
| `body` | `string` | ✅ | Note text (`1` to `2000` characters) |
| `by` | `string` | ✅ | Lowercased email of author |
| `at` | `Timestamp` | ✅ | Creation timestamp (`serverTimestamp()` / `request.time`) |

---

## 2. Collection: `reviews`
Stores client feedback and ratings, moderated by admin before display.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `name` | `string` | ✅ | Reviewer display name |
| `location` | `string` | ✅ | Location label (e.g., `'Residential Client' \| 'Airbnb Host' \| 'Cornwall'`) |
| `language` | `string` | ✅ | `'en' \| 'fr'` (enables language-appropriate presentation) |
| `rating` | `number` | ✅ | Integers `1` to `5` |
| `text` | `string` | ✅ | Review body copy |
| `approved` | `boolean` | ✅ | `true` if approved for public rendering on site |
| `rejected` | `boolean` | ✅ | `true` if rejected by admin to preserve audit trail |
| `jobId` | `string` | ✅ | Associated job document ID backlink |
| `createdAt` | `Timestamp` | ✅ | Timestamp of review creation |

---

## 3. Collection: `referrals`
Stores the active referral codes and their ownership details to enable sharing loops.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `ownerName` | `string` | ✅ | The formatted name of the referral owner (e.g., `"Diane L."`) |
| `bookingId` | `string` | ✅ | The Firestore booking ID that generated this code |
| `active` | `boolean` | ✅ | `true` if the referral code is active and valid for discounts |
| `createdAt` | `Timestamp` | ✅ | Timestamp of referral code generation |

---

## 4. Collection: `staff`
Stores employee profiles, schedule constraints, financial limits, and compliance settings.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `firstName` | `string` | ✅ | Employee first name |
| `lastName` | `string` | ✅ | Employee last name |
| `email` | `string` | ✅ | Employee email address |
| `phone` | `string` | ✅ | Employee phone number |
| `role` | `string` | ✅ | `'cleaner' \| 'lead' \| 'supervisor' \| 'contractor'` (`contractor` added in P3-E40: signs in to FSM for My Leads & Profile only; excluded from shifts, Dispatch, and payroll rollover) |
| `status` | `string` | ✅ | `'onboarding' \| 'active' \| 'inactive'` |
| `preferences` | `map` | ✅ | Preferences: `{ language: 'en' \| 'fr' }` |
| `constraints` | `map` | ✅ | Constraints: `{ transportMode: 'personal_vehicle' \| 'transit' \| 'rideshare' \| 'walk', transitBufferMinutes: number, blockedWindows: BlockedWindow[] }` |
| `financials` | `map` | ✅ | Earnings in integer cents (P3-E38, ADR-020): `{ monthlyEarningsLimitCents: int \| null, currentMonthEarningsCents: int, earningsHistory: Array<{ month: string, totalCents: int }> }`. `null` limit = no cap; `month` is the Toronto month `YYYY-MM`. Staff can't change `currentMonthEarningsCents` or `earningsHistory` (rules). |
| `compliance` | `map` | ✅ | Terms consent details: `{ acceptedTermsVersion: string \| null, termsHistory: TermsAcceptance[] }`. `null` = employee has not yet accepted any version (P3-E27-A1 fix). Real consent is collected client-side by `TermsConsentOverlay` — never written by admin at registration. |
| `welcomeEmailSentAt` | `Timestamp \| null` | ❌ | Timestamp representing when the onboarding welcome/invitation email was sent. |
| `onboardingChecklist` | `map` | ✅ | Key-value mapping of checkpoints, e.g., `{"backgroundCheck": true}` |
| `fsmStaffId` | `string \| null` | ❌ | Field service management identifier (optional) |
| `createdAt` | `Timestamp` | ✅ | Firestore Server Timestamp |

---

## 5. Collection: `admins`
Stores the office allowlist: exactly the people with Owner or Manager access (P3-E35). Doc ID is the lowercased email. Written only by the `setUserRole` Cloud Function; apps can't write it. An entry may exist before the person has an account (pre-approval); `onUserCreated` gives them the role on first sign-in. Some old entries were added by hand under an account ID instead of an email: nothing reads them for access. The Team & roles tab shows their email (via the `resolveOfficeEntries` function), and `setUserRole` deletes them when it updates that account. Office users can read the whole list (Team & roles); anyone else can read only their own entry. Under **P3-E41 / ADR-022**, `admins/{email}` is also checked live by `functions-ops` (`scheduleApi`) to gate office access to `ops.freshnestco.ca` with immediate revocation.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `role` | `string` | ✅ | `'owner' \| 'manager'`. Legacy entries with `'admin'` or no role are treated as `'owner'` until the P3-E35 migration has run |
| `grantedBy` | `string` | ❌ | Email (or uid) of the Owner who granted the role |
| `grantedAt` | `Timestamp` | ❌ | When the role was granted |
| `addedAt` | `Timestamp` | ❌ | Legacy: when administrative access was first granted |
| `phone` | `string` | ❌ | P3-E40: mobile phone number for lead assignment SMS alerts (updated via `updateOfficeContact` / `setUserRole`) |
| `language` | `string` | ❌ | P3-E40: `'en' \| 'fr'` preferred language for lead alerts and daily digest (default `'en'`) |

**Role claims (Firebase Auth custom claim `role`, P3-E35):** `owner`, `manager` (office: same data access; only Owners grant or revoke office roles), `supervisor` and `staff` (staff app), `customer` (customer portal). The legacy `admin` claim is no longer accepted (P3-E35 cleanup); an Owner can turn a leftover `admin` account into an Owner from Team & roles. Old office-list entries with no `role` or `role: 'admin'` still read as Owner. Role changes are written to `auditLog` with `overrideType: 'role_change'`.

---

## 6. Collection: `jobs`
Stores assigned and unassigned cleaning jobs generated from confirmed bookings.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `bookingId` | `string` | ✅ | Firestore booking ID that generated this job |
| `clientName` | `string` | ✅ | Customer full name |
| `clientAddress` | `string` | ✅ | Cleaning location address |
| `clientPhone` | `string` | ✅ | Customer contact number |
| `clientNotes` | `string` | ❌ | Cleaner-visible client notes or gate instructions |
| `serviceType` | `string` | ✅ | Service tier matches booking |
| `scheduledDate` | `string` | ✅ | Calendar date `YYYY-MM-DD` in Toronto time (ADR-020); `scheduledStartTime`/`EndTime` are wall times on that date |
| `scheduledStartTime` | `string` | ✅ | Start time in `HH:MM` |
| `scheduledEndTime` | `string` | ✅ | End time in `HH:MM` |
| `status` | `string` | ✅ | `'unassigned' \| 'assigned' \| 'acknowledged' \| 'in_progress' \| 'completed' \| 'cancelled' \| 'disputed'` |
| `assignedTo` | `string \| null` | ✅ | Staff UID of the assigned cleaner, or `null` if unassigned |
| `checkedInAt` | `Timestamp \| null` | ✅ | Geotagged check-in timestamp |
| `checkedInGeo` | `map \| null` | ✅ | `{ lat: number, lng: number }` check-in geolocation coordinates |
| `completedAt` | `Timestamp \| null` | ✅ | Completed job check-out timestamp |
| `payRateSnapshot` | `map` | ✅ | `{ rateId: string, amountCents: int, currency: 'CAD', effectiveAt: string, snapshotAt: string }` — hourly rate in integer cents, frozen when the job is created (P12, ADR-020). |
| `checklistTemplate` | `string` | ✅ | ID of the saved list the checklist came from (`''` for a custom list or when no template exists). Kept for traceability. |
| `checklistTasks` | `array` | ❌ | P3-E34: the job's own copy of its checklist, written at job creation and when an admin attaches a list: `Array<{ id, labelEn, labelFr, icon, requiresPhoto, photoPhase, order? }>` (same task shape as §8). Later edits to the saved list don't change it. The FSM app reads this first; jobs created before P3-E34 lack it and read the live template. Admin-written only, and only while the job is `unassigned`/`assigned`/`acknowledged` with no `checklistCompletions`. |
| `checklistName` | `string` | ❌ | P3-E34: display name of the job's checklist (the saved list's name, or "Custom checklist") |
| `checklistSource` | `string` | ❌ | P3-E34: `'auto'` (matched by service type) \| `'template'` (saved list chosen by an admin or on the booking) \| `'custom'` (one-off list built for this job) |
| `checklistCompletions` | `array` | ✅ | Completed tasks details: `Array<{ taskId: string, completedAt: Timestamp, photos: JobPhoto[] }>` |
| `photos` | `array` | ✅ | Job completion proof photos metadata: `Array<JobPhoto>` |
| `cancelledAt` | `Timestamp \| null` | ❌ | Timestamp of job cancellation |
| `reviewRequestScheduledFor` | `Timestamp \| null` | ❌ | Target date/time for sending the review request email |
| `reviewEmailSent` | `boolean` | ❌ | Set to `true` once the email has been successfully sent |
| `reviewSubmitted` | `boolean` | ❌ | Set to `true` once the customer completes the review form |
| `createdAt` | `Timestamp` | ✅ | Job document creation timestamp |

---

## 7. Collection: `payRates`
Stores configured pay rates per employee role for payroll tracking.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `role` | `string` | ✅ | Target role: `'cleaner' \| 'lead' \| 'supervisor'` |
| `amountCents` | `int` | ✅ | P3-E38: hourly rate in integer cents (entered in dollars in the admin form) |
| `currency` | `string` | ✅ | `'CAD'` |
| `effectiveFrom` | `Timestamp` | ✅ | Timestamp of rate applicability start |
| `effectiveTo` | `Timestamp \| null` | ✅ | Timestamp of rate applicability end |
| `createdBy` | `string` | ✅ | Admin email who configured the rate |
| `createdAt` | `Timestamp` | ✅ | Rate creation timestamp |

---

## 8. Collection: `checklistTemplates`
Stores default checklist tasks per cleaning service tier.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `name` | `string` | ✅ | Template name |
| `serviceType` | `string` | ✅ | Cleaning service tier mapping |
| `tasks` | `array` | ✅ | List of tasks: `Array<{ id: string, labelEn: string, labelFr: string, icon: string, requiresPhoto: boolean, photoPhase: 'before' \| 'after' \| null, order?: number }>` (corrected 2026-10-27 to match the code; it was documented as `labelKey`) |
| `active` | `boolean` | ✅ | `true` if active |

---

## 9. Collection: `auditLog`
Append-only record of changes to audited records (P3-E37 / W0-3). **Written only by server code**: the audit triggers (`auditBookings`, `auditJobs`, `auditStaff`, `auditChecklistTemplates`, `auditPayRates`, `auditGalleryPairs`, `auditReviews`) and the role/policy callables (`setUserRole`, `syncMyRole`, `updatePolicySettings`). Apps can read (Owners and Managers) but never create, edit or delete. **Retention: 7 years** (same as bookings); the automatic clean-up and erasure anonymizing are built in P3-E15.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `collection` | `string` | ✅ | Modified collection name |
| `documentId` | `string` | ✅ | Modified document ID |
| `field` | `string` | ✅ | Pre-P3-E37 rows: the changed field. P3-E37 rows: changed field names, comma-separated (`(deleted)` for deletes) |
| `oldValue` | `any` | ❌ | Pre-P3-E37 rows: value before. P3-E37 rows: set only when one field changed |
| `newValue` | `any` | ❌ | Pre-P3-E37 rows: value after. P3-E37 rows: set only when one field changed |
| `changedBy` | `string` | ✅ | Who made the change (same as `actor` on P3-E37 rows) |
| `changedAt` | `Timestamp` | ✅ | When the entry was written (server time) |
| `reason` | `string \| null` | ✅ | Reason given (e.g. a conflict override), from `lastChange.reason` |
| `overrideType` | `string \| null` | ✅ | Change category / override type (`travel_conflict_exceeded`, `role_change`, `policy_change`, …) |
| `action` | `string` | ❌ | P3-E37: `'create' \| 'update' \| 'delete'` |
| `actor` | `string` | ❌ | P3-E37: lowercased email of the person; `public` (signed-out quote/review); `system:<function>` for server code; `system:unknown` when the save carried no new stamp (console, older app version) |
| `source` | `string` | ❌ | P3-E37: `'admin' \| 'staff_app' \| 'customer' \| 'public_form' \| 'system'` |
| `changes` | `array` | ❌ | P3-E37: `[{ field, before, after }]` for every watched field that changed (text capped at 1,000 chars; oversized structures stored as `{ truncated: true }`) |
| `recordLabel` | `string \| null` | ❌ | P3-E37: readable label (e.g. client name · date) |
| `snapshot` | `map \| null` | ❌ | P3-E37: deletes only — the record as it was (photos and checklist completions omitted for jobs) |

### `lastChange` stamp (P3-E37) — on `bookings`, `jobs`, `staff`, `checklistTemplates`, `payRates`, `galleryPairs`, `reviews`
Every save stamps who made it; the audit trigger credits the change to `by` only when this save set a new stamp (its `at` changed).

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `lastChange.by` | `string` | ✅ | Signed-in user's lowercased email (rules enforce it); `public` for a signed-out quote/review; `system:<function>` from server code |
| `lastChange.at` | `Timestamp` | ✅ | Request time (`serverTimestamp()`; rules enforce `== request.time`) |
| `lastChange.source` | `string` | ✅ | `'admin'` (office only) \| `'staff_app'` \| `'customer'` \| `'public_form'` \| `'system'` (server only) |
| `lastChange.reason` | `string \| null` | ❌ | ≤ 500 chars — e.g. the override reason typed on the Dispatch Board |
| `lastChange.overrideType` | `string \| null` | ❌ | ≤ 100 chars — conflict override types |

**Tolerant period (from release, ~2 weeks):** app saves may omit the stamp or keep the existing one (cached older apps); a follow-up makes it required. **Watched fields** (what produces an audit entry) are listed in `packages/shared/src/domain/audit.ts` (`AUDIT_CONFIG`); per-tick checklist completions and photos are not audited separately.

---

## 10. Collection: `notifications` (Subcollection: `messages`)
Stores in-app messages and shift notifications dispatched to staff members.

**Path:** `/notifications/{staffId}/messages/{messageId}`

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `title` | `string` | ✅ | Localized notification title |
| `body` | `string` | ✅ | Localized notification text body |
| `type` | `string` | ✅ | `'shift_assigned' \| 'shift_unassigned' \| 'shift_cancelled' \| 'new_shift_board_posting' \| 'lead_assigned'` (`lead_assigned` added in P3-E40; `bookingId` carries the lead booking ID) |
| `jobId` | `string \| null` | ✅ | Associated job document ID backlink, or `null` |
| `bookingId` | `string \| null` | ❌ | P3-E40: associated lead booking ID when `type === 'lead_assigned'` |
| `read` | `boolean` | ✅ | Read status (`false` initially) |
| `createdAt` | `Timestamp` | ✅ | Timestamp of notification dispatch |

---

## 11. Collection: `customers`
Stores client profile information (firstName, lastName, email, phone, address).

**Path:** `/customers/{uid}`

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `firstName` | `string` | ✅ | Customer first name |
| `lastName` | `string` | ✅ | Customer last name |
| `email` | `string` | ✅ | Customer email address |
| `phone` | `string` | ✅ | Customer phone number |
| `address` | `string` | ✅ | Customer primary street address |
| `createdAt` | `Timestamp` | ✅ | Account creation timestamp |
| `updatedAt` | `Timestamp` | ✅ | Profile last update timestamp |

---

## 12. Collection: `reports`
Stores cached analytics and performance reports generated server-side.

**Path:** `/reports/{rangeKey}` (e.g. `reports/all`, `reports/30days`, `reports/90days`, `reports/ytd`, `reports/month`)

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `computedAt` | `Timestamp` | ✅ | Server timestamp when reports were calculated |
| `expiresAt` | `Timestamp` | ✅ | Server timestamp when cache expires (TTL 1 hour) |
| `data` | `map` | ✅ | The serialized analytics KPIs payload |

---

## 13. Collection: `galleryPairs`
Before/after photo pairs for the public gallery, managed from the admin Gallery tab (P3-E32, approved by human 2026-10-04).
Photos live in Firebase Storage under `gallery/{pairId}/`. Only documents with `published == true` are publicly readable.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `serviceKey` | `string` | ✅ | `'standard' \| 'deep' \| 'moveout' \| 'postconstruction' \| 'airbnb' \| 'commercial'` |
| `captionEn` | `string` | ✅ | English caption (max 120 characters; no client name or address) |
| `captionFr` | `string` | ✅ | French caption (max 120 characters) |
| `beforePath` | `string` | ✅ | Storage path, `gallery/{pairId}/before-{timestamp}.jpg` |
| `afterPath` | `string` | ✅ | Storage path, `gallery/{pairId}/after-{timestamp}.jpg` |
| `beforeUrl` | `string` | ✅ | Download URL of the before photo |
| `afterUrl` | `string` | ✅ | Download URL of the after photo |
| `published` | `boolean` | ✅ | `true` if shown on the public site. New pairs start `false` |
| `featured` | `boolean` | ✅ | `true` if shown in the home page preview |
| `order` | `number` | ✅ | Display position, ascending |
| `consentConfirmed` | `boolean` | ✅ | Admin ticked "client agreed to these photos being shown on the website" |
| `createdAt` | `Timestamp` | ✅ | When the pair was created |
| `updatedAt` | `Timestamp` | ✅ | When the pair was last changed |
| `createdBy` | `string` | ✅ | Auth uid of the admin who created the pair |

---

## 14. Collection: `settings` (`settings/policy` & `settings/policy/history/{version}`)
Operational settings and policy record with append-only version history (**P3-E36 / Wave 0 W0-2**, approved 2026-10-27).
- **Read access:** Any staff member (`owner`, `manager`, `supervisor`, `staff`) can read `settings/policy`; only office roles (`owner`, `manager`) can read `settings/policy/history/{version}`.
- **Write access:** Client SDK writes are denied (`allow write: if false`). All updates go through the Owner-only `updatePolicySettings` callable Cloud Function, which atomically writes `settings/policy`, appends `settings/policy/history/{version}`, and writes an `auditLog` entry (`overrideType: 'policy_change'`).

### Document: `settings/policy`

| Field Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `defaultVehicleBufferMinutes` | `number` | `30` | Default travel buffer (minutes) between shifts in different FSAs when driving a personal vehicle |
| `defaultTransitBufferMinutes` | `number` | `60` | Default travel buffer (minutes) between shifts in different FSAs when using public transit |
| `baseDriveBufferMinutes` | `number` | `10` | Minimum baseline turnover buffer (minutes) |
| `maxHoursPerDay` | `number` | `10` | Maximum scheduled hours per cleaner per day |
| `rollingScheduleWeeks` | `number` | `8` | Rolling recurring schedule horizon (weeks) |
| `scheduleFreezeDays` | `number` | `7` | Days before a shift when recurring schedule slots freeze |
| `undoWindowMinutes` | `number` | `15` | Minutes after claiming an open shift during which a cleaner can undo |
| `swapNoticeHours` | `number` | `12` | Minimum hours notice before shift start to request a swap |
| `defaultOdspMonthlyLimitCents` | `int` | `100000` | Default monthly ODSP net earnings cap in cents ($1,000) pre-filled during staff registration |
| `earningsCautionThresholdCents` | `int` | `10000` | Remaining monthly headroom in cents ($100) at which the Safe-to-Earn bar turns amber |
| `vacationNoticeDays` | `number` | `14` | Minimum advance notice (days) for vacation requests |
| `maxConcurrentOff` | `number` | `2` | Maximum active cleaners allowed off on the same day |
| `checkInGeofenceMeters` | `number` | `250` | Allowed GPS check-in radius (meters) from the site |
| `timesheetVarianceMinutes` | `number` | `15` | Scheduled vs actual duration variance (minutes) that flags a timesheet for review |
| `standardCancelWindowHours` | `number` | `24` | Notice window (hours) for standard and Airbnb cancellations |
| `deepCancelWindowHours` | `number` | `48` | Notice window (hours) for deep, move-out, post-construction, and commercial cancellations |
| `complaintWindowHours` | `number` | `24` | Window (hours) after completion for a complimentary re-clean report |
| `lateCancellationFeeCents` | `int` | `0` | Flat fee in cents for late cancellations |
| `lockoutFeeCents` | `int` | `0` | Flat fee in cents when crew cannot gain entry on site |
| `photoRetentionDays` | `number` | `90` | Retention period (days) for internal job verification photos |
| `agreementRetentionYears` | `number` | `7` | Retention period (years) for signed agreements and tax records |
| `emergencyPrimaryPhone` | `string` | `"(613) 861-8812"` | Primary emergency dispatch phone number |
| `emergencyBackupName` | `string` | `""` | Secondary emergency contact name |
| `emergencyBackupPhone` | `string` | `""` | Secondary emergency contact phone number |
| `defaultLeadOwnerEmail` | `string` | `""` | P3-E40: lowercased email of default owner for incoming leads (Owner-editable; blank falls back to `OWNER_EMAIL`) |
| `leadFirstContactTargetMinutes` | `number` | `120` | P3-E40: first-contact target in business minutes for standard cleaning quote requests (2 hours) |
| `leadSiteVisitFirstContactTargetMinutes` | `number` | `60` | P3-E40: first-contact target in business minutes for in-person quote / site-visit requests (1 hour) |
| `version` | `number` | `1, 2, …` | Monotonically increasing integer version number |
| `updatedAt` | `Timestamp` | — | Timestamp when this version was saved |
| `updatedBy` | `string` | — | Lowercased email (or UID) of the Owner who saved this version |
| `lastChangeReason` | `string \| null` | `null` | Optional reason provided when saving |

### Subcollection: `settings/policy/history/{version}`

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `version` | `number` | ✅ | Version number matching the document ID (`1`, `2`, …) |
| `changedAt` | `Timestamp` | ✅ | Timestamp when this version was saved |
| `changedBy` | `string` | ✅ | Lowercased email (or UID) of the Owner who saved this version |
| `reason` | `string \| null` | ✅ | Optional reason for the policy update |
| `changes` | `array<map>` | ✅ | Array of `{ field: string, oldValue: number \| string, newValue: number \| string }` |
| `snapshot` | `map` | ✅ | Full `PolicySettingsValues` snapshot at this version |

---

## 15. Database Targeting Asymmetry (Cloud Functions)

### Scheduler Functions (`onDailyReminderCheck`)
The daily scheduler function always targets the production `(default)` database explicitly:
```typescript
const db = getFirestore('(default)')
```
*   **Dev/Preview Bookings Isolation**: Bookings written to `freshnest-dev` will never trigger SMS reminders. This is by design to prevent automated tests or manual dev bookings from triggering real SMS charges or sending messages to real customers.

---

## 16. Dates, Times and Money (ADR-020, P3-E38)
- **Calendar dates and wall times are local to `America/Toronto`.** This covers `preferredDate`, `scheduledDate`, `scheduledStartTime` and `scheduledEndTime`, and also `earningsHistory[].month` (`YYYY-MM`, the Toronto month). Compute them with the `packages/shared/src/domain/time.ts` helpers, never from `toISOString()`, which gives the UTC date.
- **Instants** (`createdAt`, `checkedInAt`, `completedAt`, `changedAt`, …) are Firestore Timestamps, which are UTC.
- **Scheduled Functions** run on `America/Toronto` time: reminders at 09:00, the earnings rollover at 00:00 on the 1st, renewals at 02:00.
- **Money:** integer cents in fields named `…Cents` (`bookings.estimatedPriceCents`, `payRates.amountCents`, `jobs.payRateSnapshot.amountCents`, `staff.financials.{monthlyEarningsLimitCents, currentMonthEarningsCents, earningsHistory[].totalCents}`, `agreements.terms.{rateCents, lateCancellationFeeCents, lockoutFeeCents}`, and the four `settings/policy` money keys), with tax in a separate `taxCents`; one rounding, half up (`packages/shared/src/domain/money.ts`). Forms take dollars and convert. All legacy dollar fields were migrated and stripped on 2026-10-28 (`functions/scripts/migrate-money-to-cents.cjs`).

---

## Client E-Agreements Collections (P3-E39, Strategy 2, ADR-021)

All collections below allow **office read (`isOffice()` — Owner/Manager)** and **no client writes (`write: false`)**. All reads for signed-out clients and all writes happen server-side via Cloud Functions (`functions/src/callable/agreements.ts`). Signed PDFs live in Cloud Storage at `agreements/{agreementId}/signed.pdf` (and `agreements-dev/{agreementId}/signed.pdf` for `freshnest-dev`), office read-only, server write-only.

### `agreements/{agreementId}`
- `family`: `'client'`
- `type`: `'residential' | 'commercial'`
- `language`: `'en' | 'fr'`
- `party`: `{ kind: 'booking' | 'client', bookingId: string | null, clientId: string | null, name: string, email: string, phone: string, address: string }`
- `terms` (frozen at creation from `settings/policy` + office inputs):
  - `serviceType`: `'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb' | 'commercial'`
  - `frequency`: `'one-time' | 'weekly' | 'biweekly' | 'monthly'`
  - `startDate`: `string` (`YYYY-MM-DD`, `America/Toronto`)
  - `rateType`: `'hourly' | 'flat' | 'monthly'`
  - `rateCents`: `number` (integer cents, CAD)
  - `taxExempt`: `boolean`
  - `cancelWindowHours`: `number`
  - `lateCancellationFeeCents`: `number`
  - `lockoutFeeCents`: `number`
  - `latePaymentBasisPoints`: `number` (default `200` = 2%/month)
  - `noticePeriodDays`: `number` (default `14` residential / `30` commercial)
  - `scopeNotes?`: `string`
- `templateId`: `string` (e.g. `'client-residential'`, `'client-commercial'`)
- `versionId`: `string` (e.g. `'v1'`)
- `status`: `'draft' | 'sent' | 'signed' | 'expired' | 'cancelled' | 'active' | 'paused' | 'ending' | 'ended'`
- `tokenHash`: `string | null` (SHA-256 hex digest of active 32-byte base64url bearer token; `null` once signed/expired)
- `signedTokenHash?`: `string` (SHA-256 hex digest of token used to sign, for idempotent double-submit protection only)
- `tokenExpiresAt`: `Timestamp`
- `linkValidityDays`: `number` (`7 | 14 | 30 | 60`, default `30`)
- `sentAt`: `Timestamp`
- `viewedAt`: `Timestamp | null`
- `signedAt`: `Timestamp | null`
- `failedAttempts`: `number` (locks link at `10`)
- `currentSignatureId`: `string | null`
- `pdfPath`: `string | null`
- `documentHash`: `string | null` (SHA-256 hex digest of canonical merged text)
- `redactedAt`: `Timestamp | null`
- `redactedBy`: `string | null`
- `createdBy`: `string` (actor email)
- `createdAt`: `Timestamp`
- `lastChange`: P3-E37 audit stamp (audited by `auditAgreements`; `tokenHash` is never watched or snapshotted)

### `agreements/{agreementId}/signatures/{signatureId}` (append-only)
- `signedName`: `string`
- `consentESign`: `boolean` (`true`)
- `consentTerms`: `boolean` (`true`)
- `signedAt`: `Timestamp`
- `ip`: `string` (first hop of `x-forwarded-for`)
- `userAgent`: `string`
- `language`: `'en' | 'fr'`
- `versionId`: `string`
- `documentHash`: `string`
- `answers`: `{ phone, email, entryMethod, pets, hasAlarm, specialInstructions, valuables }`
- `answersRedactedAt?`: `Timestamp`, `answersRedactedBy?`: `string` (set only when Owner runs privacy redaction)

### `agreements/{agreementId}/private/access` (restricted access record)
- `entryMethod`: `'present' | 'key' | 'lockbox' | 'door_code' | 'smart_lock' | 'concierge' | 'other'`
- `doorCode`: `string`
- `alarmCode`: `string`
- `keyLocation`: `string`
- `accessNotes`: `string`
- `updatedAt`: `Timestamp`
- `redactedAt?`: `Timestamp`, `redactedBy?`: `string`
- **Strict rule:** Never copied into `agreements/{id}`, `signatures/{sigId}`, PDFs, emails, or any public callable response.

### `agreementTemplates/{templateId}` & `agreementTemplates/{templateId}/versions/{versionId}`
- Template doc: `family: 'client'`, `type: 'residential' | 'commercial'`, `nameEn`, `nameFr`, `currentVersionId`
- Version doc (immutable once `published`): `version`, `status: 'draft' | 'published' | 'retired'`, `bodyEn`, `bodyFr`, `bodyHashEn`, `bodyHashFr`, `publishedAt`, `publishedBy`

---

## 17. Ops Collections (from FNC Landing — P3-E41, ADR-022)

Imported verbatim from `rpdouglas/blurb` (`live` tag SHA `f881f49a5f6e41617054e48502b94f4d56c9afda`, `functions/src/firestore.ts` & `stores.ts`). All 11 collections are **strictly server-only** (`allow read, write: if false` in `firestore.rules` and `firestore.dev.rules`) — read and written exclusively by `functions-ops` (`scheduleApi`) via the Firebase Admin SDK.

> **ADR-020 scoped note (ADR-022):** During Phase 1, `scheduleInvoiced.amount` and `scheduleClientRates.rules[].dollars` keep their existing dollar number shapes so payroll and invoicing code stays untouched through the pay gate. Conversion to integer cents happens when reports are rewritten onto Fresh Nest data in Phase 3.

> **Firestore TTL policies (required in `freshnest-aa51e`):** Enable TTL on field `expireAt` for three collection groups:
> - `scheduleChangeLog` — 3 years after `at` (Ontario Employment Standards Act)
> - `scheduleVisitPhotos` — 1 year after `takenAt` (matches GCS bucket lifecycle)
> - `scheduleCleanerTokens` — Camelo token expiry

> **Visit photo storage bucket:** Private GCS bucket `freshnest-aa51e-schedule-photos` (`us-central1`, uniform bucket-level access, public-access-prevention, 1-year lifecycle rule). `scheduleVisitPhotos.path` holds bucket-relative paths (`visits/...`), never exposed to browsers.

### 17.1 `scheduleChangeLog/{autoId}`
Timesheet approval/edit audit log written by `scheduleApi`. TTL on `expireAt` (3 years).
- `at`: `number` (ms since epoch)
- `email`: `string` (actor email)
- `action`: `string`
- `timesheetId`: `string`
- `employee`: `string | null`
- `sheetFrom`: `string | null` (ISO timestamp of timesheet start)
- `sheetFromMs`: `number | null` (storage-only query index field; stripped on read)
- `before`: `map | null`
- `after`: `map | null`
- `ok`: `boolean`
- `message`: `string | null`
- `expireAt`: `Timestamp` (storage-only TTL field: `at + 3 years`)

### 17.2 `scheduleFeedback/{autoId}`
Client kudos and complaints recorded by the office.
- `type`: `'kudos' | 'complaint'`
- `date`: `string` (`YYYY-MM-DD`, local day)
- `visitStart`: `string | null`
- `visitEnd`: `string | null`
- `timesheetIds`: `string[]`
- `clientKey`: `string | null`
- `clientName`: `string`
- `siteName`: `string | null`
- `cleaners`: `Array<{ id: string, name: string }>`
- `text`: `string`
- `source`: `string`
- `category`: `string`
- `status`: `'open' | 'resolved' | null` (complaints only)
- `resolution`: `string | null`
- `createdAt`: `number` (ms since epoch)
- `createdBy`: `string`
- `updatedAt`: `number | null`
- `updatedBy`: `string | null`
- `removedAt`: `number | null` (soft delete; stays stored, excluded from active lists)
- `removedBy`: `string | null`
- `passedOnAt?`: `number | null` (kudos only)
- `passedOnBy?`: `string | null` (kudos only)

### 17.3 `scheduleInvoiced/{date}|{encodeURIComponent(clientKey)}`
One document per client per day tracking whether billable time has been invoiced.
- `id`: `string` (`${date}|${encodeURIComponent(clientKey)}`)
- `date`: `string` (`YYYY-MM-DD`)
- `clientKey`: `string`
- `clientName`: `string`
- `invoiced`: `boolean`
- `minutes`: `number` (billable minutes when ticked)
- `amount`: `number` (dollars when ticked — Phase 1 scoped exception under ADR-022)
- `timesheetIds`: `string[]`
- `updatedAt`: `number` (ms since epoch)
- `updatedBy`: `string`

### 17.4 `scheduleClientRates/{encodeURIComponent(clientKey)}`
Per-client pricing history, updated transactionally (`runTransaction`). Rules are append/replace-by-start-date, oldest first.
- `clientKey`: `string`
- `clientName`: `string`
- `rules`: `Array<{ from: string /* YYYY-MM-DD */, kind: 'hourly' | 'flat', dollars: number, setAt: number, setBy: string }>`

### 17.5 `scheduleSoloOk/{shiftId}`
Solo visits explicitly marked OK on the schedule check; one document per Camelo shift.
- `shiftId`: `string`
- `date`: `string` (`YYYY-MM-DD`)
- `ok`: `boolean`
- `updatedAt`: `number` (ms since epoch)
- `updatedBy`: `string`

### 17.6 `scheduleLiveHandled/{shiftId}`
Red visits on the live board marked handled; one document per Camelo shift.
- `shiftId`: `string`
- `date`: `string` (`YYYY-MM-DD`)
- `handled`: `boolean`
- `updatedAt`: `number` (ms since epoch)
- `updatedBy`: `string`

### 17.7 `scheduleVisitPhotos/{photoId}`
Before/after home visit photo metadata; image bytes live in `freshnest-aa51e-schedule-photos` at `path`. TTL on `expireAt` (1 year).
- `id`: `string`
- `shiftId`: `string`
- `kind`: `'before' | 'after'`
- `takenAt`: `number` (ms since epoch)
- `takenBy`: `string` (actor email)
- `path`: `string` (bucket-relative object path, e.g. `visits/...`; never sent to browsers)
- `expireAt`: `Timestamp` (stored as Firestore Timestamp / JS `Date` for TTL; 1 year after `takenAt`)

### 17.8 `scheduleCleanerTokens/{employeeId}`
Encrypted Camelo tokens for cleaners who connected their account to clock in/out (AES-GCM key derived via HKDF from `CAMELO_TOKEN`). TTL on `expireAt`.
- `employeeId`: `string`
- `email`: `string`
- `ciphertext`: `string`
- `iv`: `string`
- `tag`: `string`
- `connectedAt`: `number` (ms since epoch)
- `expireAt`: `Timestamp` (stored as Firestore Timestamp / JS `Date` for TTL)

### 17.9 `scheduleSnapshots/{periodStart}`
Finished pay-period summary figures for dashboard trends; doc ID is the period's Friday (`YYYY-MM-DD`).
- `v`: `number` (calculation schema version)
- `periodStart`: `string` (`YYYY-MM-DD`)
- `totals`: `Record<string, number>` (e.g. `billed`, `onTime`, `noShows`, …)
- `cleaners`: `Array<{ id: string, name: string } & Record<string, string | number>>`
- `clients`: `Array<{ key: string, name: string } & Record<string, string | number>>`
- `savedAt`: `number` (ms since epoch)
- `savedBy`: `string`

### 17.10 `schedulePlaces/{sha256(placeKey(address))}`
Geocoded job-site address cache (OpenStreetMap). Doc ID is SHA-256 hex digest of trimmed, single-spaced, lowercased address.
- `key`: `string` (normalized address)
- `lat`: `number | null`
- `lon`: `number | null`
- `at`: `number` (ms since epoch)

### 17.11 `scheduleSettings/{settingId}`
Ops hub system settings. Currently holds one document: `scheduleSettings/grace` (shared punctuality & live-board grace window, default 15 minutes).
- `minutes`: `number`
- `updatedAt`: `number | null` (ms since epoch)
- `updatedBy`: `string | null`
