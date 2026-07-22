# Firestore Database Schema Reference
**Version:** 2.0 | **Updated:** 2026-06-06

---

## 1. Collection: `bookings`
Stores residential, commercial, and Airbnb cleaning reservations.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `firstName` | `string` | ✅ | Client first name |
| `lastName` | `string` | ✅ | Client last name |
| `email` | `string` | ✅ | Client email address (captures CASL compliance) |
| `phone` | `string` | ✅ | Client phone number (for SMS notifications) |
| `language` | `string` | ✅ | `'en' \| 'fr'` (drives language of confirmation communications) |
| `propertyType` | `string` | ✅ | `'apartment' \| '1-2bed' \| '3-4bed' \| '5+bed' \| 'commercial'` |
| `bedrooms` | `number` | ✅ | Count of bedrooms |
| `bathrooms` | `number` | ✅ | Count of bathrooms |
| `squareFootage` | `number` | ❌ | Approximate square footage (optional) |
| `estimatedPrice` | `number` | ❌ | Estimated booking price calculated using quotePricing rules (optional) |
| `frequency` | `string` | ✅ | `'one-time' \| 'weekly' \| 'biweekly' \| 'monthly'` |
| `pets` | `boolean` | ✅ | `true` if pets are present (triggers pet-safe products notification) |
| `address` | `string` | ✅ | Full street address |
| `serviceType` | `string` | ✅ | `'standard' \| 'deep' \| 'moveout' \| 'postconstruction' \| 'airbnb' \| 'commercial'` |
| `addOns` | `string[]` | ❌ | List of extras: `['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement']` |
| `preferredDate` | `string` | ✅ | Date in ISO format `YYYY-MM-DD` |
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
| `referralCode` | `string \| null` | ❌ | The deterministic referral code generated for this client (e.g., `FIRSTNAME-1234`). |
| `referredBy` | `string \| null` | ❌ | The referral code applied during booking creation to receive the discount. |
| `stripePaymentIntentId` | `string \| null` | ❌ | Stripe PaymentIntent identifier for holding/releasing funds |
| `stripeChargeId` | `string \| null` | ❌ | Stripe Charge identifier (populated on capture) |
| `stripeChargeStatus` | `string \| null` | ❌ | Stripe payment status hold/captured/released |
| `jobId` | `string \| null` | ❌ | Associated job document ID backlink once booking is confirmed |
| `createdBy` | `string` | ❌ | Admin email that created the booking (populated for phone/walk-in bookings only) |

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
| `role` | `string` | ✅ | `'cleaner' \| 'lead' \| 'supervisor'` |
| `status` | `string` | ✅ | `'onboarding' \| 'active' \| 'inactive'` |
| `preferences` | `map` | ✅ | Preferences: `{ language: 'en' \| 'fr' \| 'ar' }`. `'ar'` supported since `LanguageSelectionOverlay` (P10 Ahmed's FSM Arabic toggle) — the `StaffLanguage` type previously omitted it; corrected in P3-E27-C2. |
| `constraints` | `map` | ✅ | Constraints: `{ transportMode: 'personal_vehicle' \| 'transit' \| 'rideshare' \| 'walk', transitBufferMinutes: number, blockedWindows: BlockedWindow[] }` |
| `financials` | `map` | ✅ | Earnings details: `{ monthlyEarningsLimit: number \| null, currentMonthEarnings: number, earningsHistory: Array<{ month: string, total: number }> }` |
| `compliance` | `map` | ✅ | Terms consent details: `{ acceptedTermsVersion: string \| null, termsHistory: TermsAcceptance[] }`. `null` = employee has not yet accepted any version (P3-E27-A1 fix). Real consent is collected client-side by `TermsConsentOverlay` — never written by admin at registration. |
| `welcomeEmailSentAt` | `Timestamp \| null` | ❌ | Timestamp representing when the onboarding welcome/invitation email was sent. |
| `onboardingChecklist` | `map` | ✅ | Key-value mapping of checkpoints. `backgroundCheck` was removed from this map in P3-E27-B2 — see the dedicated `backgroundCheck` field below. P3-E27-C3 added the 6 training-module keys (`module1Welcome`, `module2AppTraining`, `module3CleaningTechniques`, `module4Whmis`, `module5ClientStandards`, `module6EmergencyProcedures`, all `boolean`) plus `platformTrainingCompleted: boolean` (auto-set `true` once all 6 module flags are `true`) — written exclusively by the `completeTrainingModule` callable. `module4Whmis` is Ontario's legally-required WHMIS gate — `checkCleanerSchedulingConflicts` blocks dispatch assignment until it's `true`, same override+`auditLog` mechanism as `backgroundCheck`. P3-E27-D1 added 4 admin-only booleans with no employee-facing counterpart — `idVerified`, `supervisedShiftCompleted`, `uniformIssued`, `directDepositOnFile` — written directly by an admin session via `StaffDetailPanel` (no rules change needed, `isAdmin()` already grants unrestricted write access to the whole `staff` doc) and picked up by `onStaffUpdatedTrigger` for `auditLog`. The map as a whole stays closed to *client* (non-admin) writes — only the callable-owned module flags and admin's own direct writes touch it. |
| `backgroundCheck` | `map` | ✅ | `{ consentGiven: boolean, consentGivenAt: Timestamp \| null, consentIpAddress: string \| null, status: 'not_started' \| 'pending' \| 'cleared' \| 'flagged', completedAt: Timestamp \| null, provider?: string, notes?: string }`. Replaces the pre-P3-E27-B2 `onboardingChecklist.backgroundCheck: boolean` flag, which was written by the admin at registration before the employee had consented to anything. `consentGiven`/`consentGivenAt`/`consentIpAddress` are written exclusively by the `submitBackgroundCheckConsent` callable (server-observed timestamp/IP); `status`/`completedAt`/`provider`/`notes` are written exclusively by the admin-only `updateBackgroundCheckStatus` callable, which also logs to `auditLog`. `firestore.rules` closes this field to all direct client writes — both paths go through the Admin SDK. |
| `employmentAgreement` | `map \| null` | ✅ | `{ version: string, acceptedAt: Timestamp, signedByName: string, ipAddress: string \| null } \| null`. `null` until the employee completes Step 1 of the P3-E27-C1 first-login sequence. Client-writable by the employee only (same trust model as `compliance`). |
| `emergencyContact` | `map \| null` | ✅ | `{ name: string, phone: string, relationship: string } \| null`. `null` until the employee completes Step 4 of the P3-E27-C1 first-login sequence. Deliberately top-level (not nested under a `personalDetails` map, which doesn't exist elsewhere in this schema) — client-writable by the employee only. |
| `corrections` | `array` | ✅ | `Array<{ text: string, flaggedAt: Timestamp }>`. Free-text notes an employee flags for Lauren from `ProfilePage` (P3-E27-C2) — e.g. a name typo'd at registration. Client-writable by the employee only (`arrayUnion`, same pattern as `compliance.termsHistory`); no admin review UI yet (deferred to P3-E27-D1). |
| `fsmStaffId` | `string \| null` | ❌ | Field service management identifier (optional) |
| `createdAt` | `Timestamp` | ✅ | Firestore Server Timestamp |

---

## 5. Collection: `admins`
Stores the email allowlist for access control to administrative screens.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `role` | `string` | ✅ | `'admin'` |
| `addedAt` | `Timestamp` | ✅ | Timestamp when administrative access was granted |

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
| `scheduledDate` | `string` | ✅ | Date in `YYYY-MM-DD` |
| `scheduledStartTime` | `string` | ✅ | Start time in `HH:MM` |
| `scheduledEndTime` | `string` | ✅ | End time in `HH:MM` |
| `status` | `string` | ✅ | `'unassigned' \| 'assigned' \| 'acknowledged' \| 'in_progress' \| 'completed' \| 'cancelled' \| 'disputed'` |
| `assignedTo` | `string \| null` | ✅ | Staff UID of the assigned cleaner, or `null` if unassigned |
| `checkedInAt` | `Timestamp \| null` | ✅ | Geotagged check-in timestamp |
| `checkedInGeo` | `map \| null` | ✅ | `{ lat: number, lng: number }` check-in geolocation coordinates |
| `completedAt` | `Timestamp \| null` | ✅ | Completed job check-out timestamp |
| `payRateSnapshot` | `map` | ✅ | `{ rateId: string, amount: number, currency: 'CAD', effectiveAt: string, snapshotAt: string }` |
| `checklistTemplate` | `string` | ✅ | ChecklistTemplate document ID snapshotted at creation |
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
| `amount` | `number` | ✅ | Rate amount (hourly or per-job) |
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
| `tasks` | `array` | ✅ | List of tasks: `Array<{ id: string, labelKey: string, icon: string, requiresPhoto: boolean, photoPhase: 'before' \| 'after' \| null }>` |
| `active` | `boolean` | ✅ | `true` if active |

---

## 9. Collection: `auditLog`
Stores modifications and security overrides performed by administrators.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `collection` | `string` | ✅ | Modified collection name |
| `documentId` | `string` | ✅ | Modified document ID |
| `field` | `string` | ✅ | Modified field name |
| `oldValue` | `any` | ❌ | Value prior to change |
| `newValue` | `any` | ❌ | Value post-change |
| `changedBy` | `string` | ✅ | User email or UID performing the override |
| `changedAt` | `Timestamp` | ✅ | Override action timestamp |
| `reason` | `string \| null` | ✅ | Rationale for administrative override |
| `overrideType` | `string \| null` | ✅ | Type of change category |

---

## 10. Collection: `notifications` (Subcollection: `messages`)
Stores in-app messages and shift notifications dispatched to staff members.

**Path:** `/notifications/{staffId}/messages/{messageId}`

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `title` | `string` | ✅ | Localized notification title |
| `body` | `string` | ✅ | Localized notification text body |
| `type` | `string` | ✅ | `'shift_assigned' \| 'shift_unassigned' \| 'shift_cancelled' \| 'new_shift_board_posting'` |
| `jobId` | `string \| null` | ✅ | Associated job document ID backlink, or `null` |
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

## 13. Database Targeting Asymmetry (Cloud Functions)

### Scheduler Functions (`onDailyReminderCheck`)
The daily scheduler function always targets the production `(default)` database explicitly:
```typescript
const db = getFirestore('(default)')
```
*   **Dev/Preview Bookings Isolation**: Bookings written to `freshnest-dev` will never trigger SMS reminders. This is by design to prevent automated tests or manual dev bookings from triggering real SMS charges or sending messages to real customers.


