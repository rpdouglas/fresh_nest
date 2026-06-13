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
| `frequency` | `string` | ✅ | `'one-time' \| 'weekly' \| 'biweekly' \| 'monthly'` |
| `pets` | `boolean` | ✅ | `true` if pets are present (triggers pet-safe products notification) |
| `address` | `string` | ✅ | Full street address |
| `serviceType` | `string` | ✅ | `'standard' \| 'deep' \| 'moveout' \| 'postconstruction' \| 'airbnb' \| 'commercial'` |
| `addOns` | `string[]` | ❌ | List of extras: `['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement']` |
| `preferredDate` | `string` | ✅ | Date in ISO format `YYYY-MM-DD` |
| `preferredCleaner` | `string \| null` | ❌ | Name of requested staff cleaner (loyalty feature) |
| `notes` | `string` | ❌ | Island access instructions, gate entry codes, special directives |
| `leadSource` | `string` | ✅ | `'organic' \| 'google' \| 'referral' \| 'facebook' \| 'direct'` |
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
| `preferences` | `map` | ✅ | Preferences: `{ language: 'en' \| 'fr' }` |
| `constraints` | `map` | ✅ | Constraints: `{ transportMode: 'personal_vehicle' \| 'transit' \| 'rideshare' \| 'walk', transitBufferMinutes: number, blockedWindows: BlockedWindow[] }` |
| `financials` | `map` | ✅ | Earnings details: `{ monthlyEarningsLimit: number \| null, currentMonthEarnings: number, earningsHistory: Array<{ month: string, total: number }> }` |
| `compliance` | `map` | ✅ | Terms consent details: `{ acceptedTermsVersion: string, termsHistory: TermsAcceptance[] }` |
| `onboardingChecklist` | `map` | ✅ | Key-value mapping of checkpoints, e.g., `{"backgroundCheck": true}` |
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

## 10. Database Targeting Asymmetry (Cloud Functions)

### Scheduler Functions (`onDailyReminderCheck`)
The daily scheduler function always targets the production `(default)` database explicitly:
```typescript
const db = getFirestore('(default)')
```
*   **Dev/Preview Bookings Isolation**: Bookings written to `freshnest-dev` will never trigger SMS reminders. This is by design to prevent automated tests or manual dev bookings from triggering real SMS charges or sending messages to real customers.


