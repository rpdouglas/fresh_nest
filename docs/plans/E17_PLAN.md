# E17 — Cloud Functions: Bilingual Email Notification · Phase A Plan
**Date:** 2026-06-07
**Primary Personas:** Diane P1 + Sophie P5 (FR confirmation within 60s) · Travis P2 (fast confirmation) · All (owner notified of every booking)
**Approved Strategy:** _awaiting human selection_

---

## Context

E16 wired the Firestore write. Every booking now lands in the `bookings` collection with a `language: 'en' | 'fr'` field. E17 adds a Cloud Function that fires on `onDocumentCreated('bookings/{docId}')` and sends two emails:

1. **Owner notification** (always EN) — full booking summary so Ryan knows a new booking arrived
2. **Client confirmation** (EN or FR, driven by `booking.language`) — "Your booking is confirmed" with service details

This is the foundational step for Diane's acceptance test (French confirmation within 60 seconds) and the last mile before Travis's SMS chain (E18) is unblocked.

---

## Infrastructure State

| Item | Status |
| :--- | :--- |
| `functions/` directory | ❌ Does not exist — must bootstrap |
| `firebase.json` functions block | ❌ Missing — must add |
| Email service | ❌ None installed |
| Firebase CLI | ✅ v15.19.1 |
| Firebase project | ✅ `freshnest-aa51e` |
| Firestore trigger data | ✅ All required fields written by E16 |

---

## Pre-Deployment Human Step (all strategies)

Before any email sends in production, the owner must:

1. Sign up for the chosen email provider (Resend: free, or Gmail app password)
2. Configure a sending domain or use the provider's sandbox address for testing
3. Set the API key / credentials as a Firebase Functions environment variable (see each strategy)
4. Add the owner's notification email to Functions config

This step cannot be automated — it requires a human to create accounts and set DNS records. The function code will be complete but emails will not send until credentials are set.

---

## Email Content Specification

### Owner Notification (always EN)

**Subject:** `New booking — {firstName} {lastName} ({serviceType}) · {preferredDate}`

**Body:**
```
New booking received on Fresh Nest Co.

Name:       {firstName} {lastName}
Email:      {email}
Phone:      {phone}
Language:   {language}
Service:    {serviceType}
Property:   {propertyType} — {bedrooms}br / {bathrooms}ba
Frequency:  {frequency}
Date:       {preferredDate}
Address:    {address}
Add-ons:    {addOns}
Notes:      {notes}
Preferred cleaner: {preferredCleaner}
Airbnb:     {isAirbnb}
Photo confirmation: {photoConfirmation}
Marketing consent: {marketingConsent}
Lead source: {leadSource}
Booking ID: {docId}
```

Plain text is sufficient for the owner notification — no HTML required.

### Client Confirmation (EN)

**Subject:** `Your cleaning is booked — Fresh Nest Co.`

**Body (HTML):**
```html
<h2>Your booking is confirmed!</h2>
<p>Thank you, {firstName}. Here's what we have scheduled:</p>
<ul>
  <li><strong>Service:</strong> {serviceType}</li>
  <li><strong>Date:</strong> {preferredDate}</li>
  <li><strong>Address:</strong> {address}</li>
  <li><strong>Frequency:</strong> {frequency}</li>
</ul>
<p>We'll confirm the exact time within 24 hours. Questions? Call us at (613) 935-3555.</p>
<p>— The Fresh Nest Co. Team</p>
```

### Client Confirmation (FR)

**Subject:** `Votre nettoyage est réservé — Fresh Nest Co.`

**Body (HTML):**
```html
<h2>Votre réservation est confirmée !</h2>
<p>Merci, {firstName}. Voici les détails de votre réservation :</p>
<ul>
  <li><strong>Service :</strong> {serviceType}</li>
  <li><strong>Date :</strong> {preferredDate}</li>
  <li><strong>Adresse :</strong> {address}</li>
  <li><strong>Fréquence :</strong> {frequency}</li>
</ul>
<p>Nous confirmerons l'heure exacte dans les 24 heures. Des questions ? Appelez-nous au (613) 935-3555.</p>
<p>— L'équipe Fresh Nest Co.</p>
```

---

## Functions Directory Structure (all strategies)

```
functions/
├── src/
│   ├── index.ts            — exports onBookingCreated trigger
│   ├── emailTemplates.ts   — ownerTemplate() + clientTemplate(lang)
│   └── sendEmail.ts        — provider adapter (strategy-specific)
├── package.json
└── tsconfig.json
```

The trigger is scoped to the `(default)` production database only, so test bookings written to `freshnest-dev` never send emails.

```ts
// index.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{docId}', database: '(default)' },
  async (event) => {
    const booking = event.data?.data()
    if (!booking) return
    const docId = event.params.docId
    await Promise.all([
      sendOwnerNotification(booking, docId),
      sendClientConfirmation(booking),
    ])
  }
)
```

---

## Strategy 1 — Firebase Functions v2 + Resend (Recommended)

### Why Resend
- TypeScript-first API (`new Resend(apiKey).emails.send(...)`) — no types package needed
- 3,000 free emails/month — enough for hundreds of bookings
- Single `RESEND_API_KEY` environment variable — no SMTP config complexity
- Shared testing domain (`onboarding@resend.dev`) works immediately after signup; custom domain adds a DNS TXT record
- No rate limits on confirmation emails

### Files Changed

| File | Action |
| :--- | :--- |
| `functions/package.json` | **Create** — `firebase-admin`, `firebase-functions`, `resend` |
| `functions/tsconfig.json` | **Create** — strict TS targeting Node 20 / CommonJS |
| `functions/src/index.ts` | **Create** — `onBookingCreated` trigger |
| `functions/src/emailTemplates.ts` | **Create** — `ownerTemplate()`, `clientTemplate(lang)` |
| `functions/src/sendEmail.ts` | **Create** — Resend adapter |
| `firebase.json` | **Modify** — add `"functions"` block |

### `functions/package.json`

```json
{
  "name": "fresh-nest-functions",
  "version": "1.0.0",
  "private": true,
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^6.0.0",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "strict": true,
    "target": "ES2020"
  },
  "include": ["src"]
}
```

### `functions/src/sendEmail.ts`

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    to:   payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}
```

### Environment variables (set once by human)

```bash
# In Firebase Console → Functions → Environment variables, or via CLI:
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set FROM_EMAIL
firebase functions:secrets:set OWNER_EMAIL
```

### `firebase.json` addition

```json
"functions": [
  {
    "source": "functions",
    "codebase": "default",
    "runtime": "nodejs20",
    "ignore": ["node_modules", ".git", "firebase-debug.log"]
  }
]
```

### Persona Impact

| Persona | Gate | How |
| :--- | :--- | :--- |
| Diane P1 | French confirmation within 60s | `booking.language === 'fr'` → FR template |
| Sophie P5 | Same as Diane | Same |
| Travis P2 | Confirmation email fast | `Promise.all` — owner + client in parallel |
| All | Owner notified instantly | Owner notification always fires |

### Risks
- **Resend account required** — human setup step before any email sends in production. Code ships complete; emails need credentials.
- **Custom domain for "from" address** — without DNS setup, production emails show `onboarding@resend.dev` as sender. Owner needs to add a TXT record to their domain.
- **Cold start latency** — v2 Functions have low cold start. First email after a long quiet period may take 2–5s extra. Still well within the 60-second persona gate.
- **Functions v2 billing** — 2M free invocations/month, 400K GB-seconds free. A small cleaning service never approaches this.

---

## Strategy 2 — Firebase Functions v2 + Nodemailer (Gmail SMTP)

### Summary
Same trigger and template structure as Strategy 1. Replaces Resend with `nodemailer` using Gmail SMTP. The owner's Gmail account sends the emails directly.

### Files Changed (vs Strategy 1)

Same set of files. `sendEmail.ts` changes:

```ts
import * as nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,    // Gmail App Password (not the account password)
  },
})

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await transporter.sendMail({
    from: `Fresh Nest Co. <${process.env.SMTP_USER}>`,
    to:   payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}
```

Environment variables:
```bash
firebase functions:secrets:set SMTP_USER    # owner's Gmail address
firebase functions:secrets:set SMTP_PASS    # Gmail App Password (2FA required)
firebase functions:secrets:set OWNER_EMAIL
```

### Trade-offs vs Strategy 1

| | Strategy 1 (Resend) | Strategy 2 (Nodemailer) |
| :--- | :--- | :--- |
| Setup complexity | 1 API key | Gmail 2FA + App Password |
| Sender address | Custom domain possible | Always owner's Gmail |
| Sending limit | 3,000/month free | ~500/day Gmail limit |
| Professionalism | `noreply@freshnestco.ca` | `ryan@gmail.com` in From header |
| Dependencies | `resend` (1 pkg) | `nodemailer` + `@types/nodemailer` |
| TypeScript support | Native | Needs `@types/nodemailer` |

**Main concern:** Gmail as the "from" address in client-facing confirmation emails is unprofessional for a business. At 50 bookings/month the limit is fine, but the sender address undermines the brand. Strategy 1 is cleaner long-term.

---

## Strategy 3 — Firebase Extension "Trigger Email from Firestore"

### Summary
Install the official Firebase "Trigger Email from Firestore" extension from the Firebase Console. No custom Cloud Functions code. Instead, E16's `submitBooking()` is extended to write two documents to a `mail` collection — one for the owner and one for the client — with the email content already rendered.

### Mechanism

The extension monitors a `mail` collection. When a new document appears, it sends the email using SMTP credentials stored in the extension config. The `submitBooking()` function (already in `src/lib/firestore.ts`) would add:

```ts
// At the end of submitBooking(), after the main addDoc:
const lang = language  // 'en' | 'fr'
await Promise.all([
  addDoc(collection(db, 'mail'), {
    to: process.env.OWNER_EMAIL,
    message: { subject: ownerSubject(data, docId), text: ownerBody(data, docId) },
  }),
  addDoc(collection(db, 'mail'), {
    to: data.email,
    message: { subject: clientSubject(lang), html: clientBody(data, lang) },
  }),
])
```

Template functions would live in `src/lib/emailTemplates.ts` (client-side code, called at booking time).

### Files Changed

| File | Action |
| :--- | :--- |
| `src/lib/emailTemplates.ts` | **Create** — template functions (client-side) |
| `src/lib/firestore.ts` | **Modify** — write to `mail` collection after booking write |
| `docs/firestore-schema.md` | **Modify** — add `mail` collection schema |
| Firebase Console | **Human action** — install "Trigger Email" extension + SMTP config |

### Trade-offs vs Strategies 1 & 2

| | Strategy 1/2 (Functions) | Strategy 3 (Extension) |
| :--- | :--- | :--- |
| Custom Functions code | Yes — full `functions/` directory | No — extension handles sending |
| Email template location | Server-side (functions/) | Client-side (src/lib/) — runs in browser |
| Security | Secrets in Functions env | SMTP in extension config |
| Testability | Firebase Emulator | Must write to live Firestore `mail` collection |
| Version control | Full code in repo | Extension config in Console only |
| Bilingual | Template function called server-side | Template called at write time (client) |
| COMPLIANCE: email content | Never exposed to browser | Email HTML built in browser, then stored in Firestore |

**Critical concern:** With Strategy 3, the email HTML — including the client's name, address, and booking details — is constructed in the browser and written to the `mail` collection in Firestore. That collection is readable by any authenticated user (and currently by anyone, since `firestore.rules` has no restrictions yet). This means booking confirmation email bodies containing client PII are exposed in a queryable Firestore collection until Phase 5 tightens the rules. PIPEDA says PII must be protected — this is a compliance risk that makes Strategy 3 unsuitable without Phase 5 auth rules in place.

---

## Schema Impact (Strategies 1 & 2 only)

No new `bookings` fields needed. The function reads the fields E16 already writes.

**For Strategy 3 only:** The `mail` collection would need to be added to `firestore-schema.md` and `firestore.rules` would need a rule restricting reads to admin only (human approval required per COMPLIANCE.md).

---

## Subagent Pre-checks

- **Brand_Auditor:** Email templates contain brand name and phone number — no Tailwind classes (HTML email, not a React component). HTML email inline styles are acceptable.
- **Data_Steward:** Function reads only the fields written by E16; no new Firestore fields created. `mail` collection not used in Strategy 1/2.
- **Linguistic_Auditor:** Email templates are pure TypeScript string templates — no `t()` hooks (the function runs server-side, outside React). Bilingual is handled via separate template strings for EN and FR, selected by `booking.language`. This is the correct pattern for server-side bilingual content.

---

## Persona Tests

| Persona | Test | Pass Condition |
| :--- | :--- | :--- |
| **Diane P1** | Submit booking with language FR | Client receives email with French subject and body within 60 seconds |
| **Sophie P5** | Same as Diane | Same condition |
| **Travis P2** | Submit booking with language EN | Client receives English confirmation email |
| **All** | Any booking submitted | Owner receives summary email (EN) with all booking fields |
| **Error resilience** | Firestore write succeeds but email fails | Booking is NOT rolled back — email failure is logged, not surfaced to client |

---

## Recommended Sequence (after strategy approval)

1. Bootstrap `functions/` directory
2. Write `emailTemplates.ts`, `sendEmail.ts`, `index.ts`
3. Update `firebase.json`
4. Run `cd functions && npm install && npm run build` — zero TS errors
5. Human sets `RESEND_API_KEY`, `FROM_EMAIL`, `OWNER_EMAIL` as Functions secrets
6. `firebase deploy --only functions`
7. Submit a test booking on the dev site → verify both emails arrive
8. Verify Diane's test: switch to FR, submit → confirm French subject/body

---

## Out of Scope

- E18: SMS via Twilio/Firebase Extension (depends on E17 completing)
- E22: Thank You page
- Unsubscribe link in marketing emails (transactional confirmations are CASL-exempt — no unsubscribe required for these)
- Booking reminder emails (E33 / recurring feature)
