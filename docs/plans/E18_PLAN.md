# E18 Phase A — SMS Confirmation + Reminders
**Date:** 2026-06-07
**Primary personas:** P2 Travis McLeod (immediate confirmation) · P3 Margaret Storey (day-before reminder)
**Depends on:** E16 (Firestore booking write) · E17 (Cloud Functions skeleton, `functions/` structure)

---

## Persona Context

| Persona | Need | Acceptance Gate |
| :--- | :--- | :--- |
| Travis (P2) | SMS confirmation within 60 seconds of booking, in English | `PASS` if Travis receives SMS ≤ 60 s after Firestore write |
| Margaret (P3) | SMS reminder the day before her weekly clean | `PASS` if reminder arrives on `preferredDate - 1 day` |

---

## COMPLIANCE Pre-Check

**Booking confirmation SMS** — transactional under CASL (directly related to a completed booking). No opt-in required. May always be sent.

**Day-before appointment reminder SMS** — transactional under CASL Section 6(6) ("existing business relationship"). Fires for a specific booked appointment the client created. This is NOT a generic "book your next clean" marketing message. No opt-in required.

**PIPEDA:** `phone` is PII passed to Twilio, a third-party. This is permissible — Twilio is essential to delivering the transactional service, not a data broker or analytics provider. No PII stored outside Firestore.

**Quebec Law 25:** FR clients (Sophie, Diane) receive French-language SMS — consent language is already in French via the booking form. Transactional SMS requires no additional consent.

---

## Schema Audit

All fields consumed by SMS functions exist in `docs/firestore-schema.md`:

| Field | Type | Used for |
| :--- | :--- | :--- |
| `phone` | `string` | SMS recipient |
| `language` | `string` | EN or FR message copy |
| `firstName` | `string` | Personalised greeting |
| `preferredDate` | `string` | Reminder scheduling target |
| `status` | `string` | Filter — only `pending`/`confirmed` get reminders |
| `serviceType` | `string` | Confirmation message detail |

**No new Firestore fields required.** No schema changes.

---

## Strategy 1 — Twilio + Daily Cloud Scheduler (Recommended)

### How it works
1. **Confirmation SMS** — added to the existing `onBookingCreated` Cloud Function (`functions/src/index.ts`). Fires immediately when the booking document is created. Uses `Promise.allSettled` alongside the existing email sends so one failure never blocks another.
2. **Day-before reminder** — new scheduled Cloud Function `onDailyReminderCheck` (Cloud Scheduler, runs once daily at 13:00 UTC / 9:00 AM Eastern). Queries `bookings` where `preferredDate = tomorrow (ISO)` and `status` is `pending` or `confirmed`. For each match, sends an EN or FR reminder SMS via Twilio.

### Files changed
| File | Action |
| :--- | :--- |
| `functions/src/smsTemplates.ts` | **Create** — EN/FR confirmation + reminder message strings |
| `functions/src/sendSms.ts` | **Create** — Twilio wrapper (`sendSmsConfirmation`, `sendSmsReminder`) |
| `functions/src/index.ts` | **Modify** — add `sendSmsConfirmation` to `onBookingCreated`; export new `onDailyReminderCheck` |
| `functions/package.json` | **Modify** — add `twilio` dependency |

### Secrets required (human sets via `firebase functions:secrets:set`)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Phone normalisation
Twilio requires E.164 format (`+16139353555`). The booking form stores phone as typed (e.g., `613-935-3555`, `(613) 935-3555`). A `normalizePhone(raw)` helper strips non-digits and prepends `+1` for Canadian numbers — handles all common formats. Invalid or <10-digit numbers skip the SMS (log warning, do not throw).

### SMS message design (≤ 160 chars each)

**EN confirmation:**
> Fresh Nest Co.: Hi {firstName}, your {service} is booked for {date}! We'll confirm the time soon. Questions? (613) 935-3555

**FR confirmation:**
> Fresh Nest Co. : Bonjour {firstName}, votre {service} est réservé pour le {date} ! Nous confirmerons l'heure bientôt. (613) 935-3555

**EN reminder:**
> Fresh Nest Co.: Just a reminder — your cleaning is tomorrow ({date}). We'll be in touch with your arrival time. (613) 935-3555

**FR reminder:**
> Fresh Nest Co. : Rappel — votre ménage est demain ({date}). Nous vous contacterons avec l'heure d'arrivée. (613) 935-3555

### Persona impact
- Travis ✅ — confirmation within ~5s of Firestore write (Cloud Function cold start + Twilio API latency)
- Margaret ✅ — reminder fires at 9 AM on the day before her appointment; she is not surprised when the cleaner arrives

### Risks
- `preferredDate` is client-entered — if client enters a past date or non-ISO format, the reminder query may miss it. Mitigation: the Zod schema in E15 validates `preferredDate` as `YYYY-MM-DD`.
- Daily query scan: at current volume (~0–5 bookings/day) Firestore read cost is negligible. No risk at this stage.
- Phone normalisation edge cases: international numbers outside Canada. Mitigation: skip + warn; do not throw.
- Twilio free trial: "Sent from your Twilio trial account" prefix on messages. Acceptable for development; upgrade to paid before launch.

---

## Strategy 2 — Twilio + Cloud Tasks (Individual Scheduling)

### How it works
1. **Confirmation SMS** — same as Strategy 1: added to `onBookingCreated`.
2. **Day-before reminder** — `onBookingCreated` creates a Google Cloud Task targeting a new HTTP Cloud Function `sendScheduledReminder`. The task is scheduled to execute at `08:00 UTC on preferredDate - 1 day`. The Cloud Task payload contains `{ docId, phone, firstName, language, preferredDate }`.

### Additional files
- `functions/src/scheduleTask.ts` — Cloud Tasks client, task creation helper
- `functions/src/index.ts` — new `sendScheduledReminder` HTTP function export

### Risks
- Cloud Tasks requires enabling the Cloud Tasks API in GCP Console and creating a queue — two human steps not needed by Strategy 1.
- The task payload contains PII (`phone`, `firstName`). Cloud Tasks stores the payload in GCP task queue — PIPEDA technically permits this (task processor is internal GCP infrastructure), but is more exposure surface than a Firestore query.
- If the booking is cancelled before the reminder fires, the task still executes. Need to re-read the booking doc inside `sendScheduledReminder` and check `status !== 'cancelled'` before sending.
- More complex failure modes (task queue saturation, HTTP timeouts).

### When to prefer
Choose Strategy 2 if volume grows to hundreds of bookings/day and the daily Firestore scan becomes costly. Not necessary at current scale.

---

## Strategy 3 — Confirmation SMS Only (Scoped)

### How it works
Only the immediate confirmation SMS is implemented. Day-before reminder is deferred to Phase 6 when the admin dashboard can set confirmed appointment times (required for the "morning-of: cleaner arrives at [time]" message anyway).

### Persona test result
- Travis ✅ — confirmation SMS within 60 seconds
- Margaret ❌ **FAILS** — no day-before reminder; persona test gate does not pass

### Verdict
Strategy 3 is **not viable for E18 close** — it fails Margaret's acceptance criterion explicitly stated in the master plan. Only acceptable if the human explicitly narrows E18 scope.

---

## Recommended: Strategy 1

Strategy 1 satisfies both persona tests, reuses the E17 function structure, requires no new GCP infrastructure beyond Cloud Scheduler (already available in Firebase Functions), and avoids the PII-in-task-payload concern of Strategy 2.

---

## Pre-Deployment Checklist (Human)

After Phase B execution, before `firebase deploy --only functions`:

```bash
# Twilio credentials (get from twilio.com console)
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_PHONE_NUMBER   # E.164 format: +1xxxxxxxxxx

# Verify existing secrets still set (from E17)
firebase functions:secrets:access RESEND_API_KEY
firebase functions:secrets:access OWNER_EMAIL
```

Twilio free trial note: upgrade to a paid Twilio number before launch. Free trial numbers prepend "Sent from your Twilio trial account" to every message.

---

## Subagent Pre-checks

- **Brand_Auditor:** No React/Tailwind changes — N/A
- **Data_Steward:** All fields consumed (`phone`, `language`, `firstName`, `preferredDate`, `status`) exist in schema. No new fields written.
- **Linguistic_Auditor:** SMS templates are in `functions/src/smsTemplates.ts` (server-side). No React `t()` usage needed. EN/FR strings are intentional hardcoded constants in the functions layer, same pattern as E17 email templates.

---

## Phase A Gate

**HALT — awaiting human approval of strategy before proceeding to Phase B.**
