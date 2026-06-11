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

## 3. Collection: `staff` (Phase 6)
Stores cleaner employee details and onboarding checkpoints.

| Field Name | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `name` | `string` | ✅ | Employee name |
| `email` | `string` | ✅ | Employee email |
| `phone` | `string` | ✅ | Employee phone number |
| `role` | `string` | ✅ | `'cleaner' \| 'lead' \| 'supervisor'` |
| `status` | `string` | ✅ | `'onboarding' \| 'active' \| 'inactive'` |
| `onboardingChecklist` | `map` | ✅ | Key-value mapping of onboarding status, e.g., `{"backgroundCheck": true}` |
| `fsmStaffId` | `string \| null` | ❌ | Field service management identifier (Phase 6) |

---

## 4. Database Targeting Asymmetry (Cloud Functions)

### Scheduler Functions (`onDailyReminderCheck`)
The daily scheduler function always targets the production `(default)` database explicitly:
```typescript
const db = getFirestore('(default)')
```
*   **Dev/Preview Bookings Isolation**: Bookings written to `freshnest-dev` will never trigger SMS reminders. This is by design to prevent automated tests or manual dev bookings from triggering real SMS charges or sending messages to real customers.

