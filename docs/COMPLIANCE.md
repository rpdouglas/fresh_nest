# Fresh Nest Co. — Compliance Reference

**Version:** 2.0 | **Updated:** 2026-06-06
**Status:** Active — Reference before writing any form, email, SMS, or Firestore operation

> [!IMPORTANT]
> This document governs all data collection, communication, accessibility, and security decisions. Read in full before implementing any feature involving user data, email, SMS, or Firestore writes.

---

## 1. CASL — Canadian Anti-Spam Legislation

### Scope
CASL applies to all Commercial Electronic Messages (CEMs) sent to clients or prospects, including marketing emails and promotional SMS messages.

### Explicit Opt-In Rules

| Rule | Detail |
|---|---|
| **Marketing emails** | Explicit opt-in required before sending any marketing or promotional content |
| **Opt-in checkbox** | Must be **unchecked by default** — pre-checked consent is non-compliant |
| **Consent wording** | Must clearly state what the user is opting into (e.g., "I agree to receive promotional emails about Fresh Nest Co. services") |
| **Unsubscribe** | Required in every marketing email — one-click mechanism |
| **Consent timestamp** | If marketing opt-in is selected, store `consentTimestamp` on the booking Firestore document |

### Transactional Exemption

> [!NOTE]
> Booking **confirmation emails and SMS** are transactional messages and are **exempt from CASL opt-in requirements**. They may always be sent after a booking is completed, regardless of marketing consent status.

| Message Type | CASL Opt-In Required? |
|---|---|
| Booking confirmation email | ❌ No — transactional |
| Booking confirmation SMS | ❌ No — transactional |
| Service reminder email | ✅ Yes — marketing |
| Promotional discount email | ✅ Yes — marketing |
| "We miss you" re-engagement email | ✅ Yes — marketing |

### Booking Form Implementation

```tsx
// Correct CASL-compliant opt-in field
<label class="flex items-center gap-3 min-h-[48px]">
  <input
    type="checkbox"
    id="marketingConsent"
    defaultChecked={false}          // ← Must be unchecked by default
    {...register('marketingConsent')}
  />
  <span class="font-body text-base text-charcoal">
    I agree to receive promotional emails from Fresh Nest Co.
    I can unsubscribe at any time.
  </span>
</label>
```

### Firestore Consent Storage

When `marketingConsent === true`, the booking document must include:

```ts
{
  marketingConsent: true,
  consentTimestamp: Timestamp.now(),   // ← Required — do not omit
  consentMethod: 'booking-form-v2',
}
```

When `marketingConsent === false` or unchecked, omit `consentTimestamp` entirely — do not store `null`.

---

## 2. Data Privacy — PIPEDA (Federal) & Quebec Law 25 (Bill 64)

### PIPEDA — Personal Information Protection and Electronic Documents Act

Applies to all personal data collected from clients across all provinces.

| Requirement | Implementation |
|---|---|
| **Minimal collection** | Collect only fields required to perform the service (name, email, phone, address, service details) |
| **Storage location** | All client PII stored only in Firestore — never in `localStorage`, `sessionStorage`, or client-side state that persists across sessions |
| **No third-party sharing** | Client PII is never passed to third-party analytics, advertising, or data broker services |
| **Data retention** | Booking records retained **7 years** for tax and business record purposes |
| **Access control** | Admin access to booking data requires Firebase Auth (enforced in Phase 5) |
| **Breach notification** | Any suspected data breach must be escalated to a human within 24 hours — AI agents must never attempt to resolve a breach autonomously |

### Quebec Law 25 (Bill 64) — Sophie Persona (Snye QC)

> [!WARNING]
> Clients in Quebec (including Sophie Tremblay-Gagnon in Snye, QC) are subject to Quebec's Law 25, which has stricter requirements than PIPEDA.

| Requirement | Detail |
|---|---|
| **Explicit consent** | Explicit consent required for collection and use of personal information — not bundled with terms of service |
| **Language** | Consent must be presented in French for Quebec clients (Sophie's booking is in French — this is satisfied by the bilingual form) |
| **Purpose limitation** | Data collected may only be used for the stated purpose (fulfilling the cleaning service) |
| **Right to access** | Quebec clients have the right to request access to their data — contact email must be visible |
| **Right to withdrawal** | Clients may withdraw consent at any time; withdrawal stops future marketing communications |
| **Privacy impact assessment** | Required before launching any new data collection feature affecting Quebec clients |

### Client PII Handling Rules

```
✅ Allowed:
  - Store name, email, phone, address in Firestore bookings collection
  - Use email and phone for transactional confirmations
  - Store language preference to drive email/SMS language

❌ Prohibited:
  - Storing PII in localStorage or sessionStorage
  - Logging PII to browser console or external logging services
  - Passing client email or phone to any third-party service not essential to the booking flow
  - Using client data for AI training without explicit consent
```

---

## 3. Operational & Accessibility Rules

These rules derive from persona requirements and Canadian accessibility law.

### Phone Number Visibility (Margaret — P3)

> [!IMPORTANT]
> The business phone number must appear in the **navbar AND footer** on every page, rendered as a tappable `tel:` link. Plain text phone numbers are non-compliant.

```html
<!-- ✅ Correct — tappable tel: link -->
<a href="tel:+16135551234" class="font-body text-base text-slate-brand">
  (613) 555-1234
</a>

<!-- ❌ Incorrect — non-tappable plain text -->
<span>(613) 555-1234</span>
```

### Form Accessibility (WCAG 2.1 AA)

| Rule | Requirement |
|---|---|
| **Visible labels** | Every form field must have a visible `<label>` element — placeholder-only labels are prohibited |
| **Label association** | Labels must be associated via `htmlFor` / `id` pairing or wrapping |
| **Error messages** | Validation errors must appear adjacent to the relevant field, in text (not colour alone) |
| **Focus indicators** | Focus rings must be visible — do not remove default outlines without replacement |
| **Required fields** | Required fields must be indicated visually and programmatically (`aria-required="true"`) |

### Text Size (Margaret — P3)

| Rule | Value |
|---|---|
| **Minimum body text** | 16px (`text-base` in Tailwind) — applies across all viewport sizes |
| **Minimum label text** | 14px (`text-sm`) — labels only, not body copy |
| **Do not** | Use `text-xs` or `text-sm` for body copy, instructions, or form help text |

### Touch Targets (Margaret — P3)

| Rule | Value |
|---|---|
| **Minimum height** | 48px on all interactive elements (buttons, links, inputs, selects, checkboxes) |
| **Minimum width** | 48px on icon-only interactive elements |
| **Tailwind class** | `min-h-[48px]` — apply to all `<button>`, `<a>`, and `<input>` elements |

### Colour Contrast (WCAG 2.1 AA)

| Rule | Value |
|---|---|
| **Normal text** | Minimum 4.5:1 contrast ratio |
| **Large text (18px+ bold or 24px+)** | Minimum 3:1 contrast ratio |
| **UI components** | Minimum 3:1 for borders and interactive states |
| **Tool** | Verify with WebAIM Contrast Checker before shipping |

---

## 4. Firestore Security Rules Policy

> [!CAUTION]
> `firestore.rules` changes require **human review and approval** before deployment. AI agents must **never modify `firestore.rules` autonomously**.

### Rule Governance

| Rule | Policy |
|---|---|
| **Autonomous modification** | AI agents are prohibited from modifying `firestore.rules` without explicit human approval |
| **Production deployment** | Only a human may run `firebase deploy --only firestore:rules` to production |
| **Human escalation** | Any required security rule change must be written as a proposal and presented for human review |

### Production Rules Policy (Post Phase 5)

```
Production firestore.rules must enforce:
  - Unauthenticated users: READ bookings → denied
  - Unauthenticated users: WRITE bookings → allowed (booking creation only)
  - Unauthenticated users: READ/WRITE all other collections → denied
  - Authenticated admin users: READ/WRITE all collections → allowed
  - No wildcard allow: read, write rules in production
```

### Development Rules Policy

`firestore.dev.rules` may use more permissive access for local development convenience. These rules must never be deployed to the production Firebase project (`freshnest-aa51e`).

### Collections and Write Access Summary

| Collection | Public Write | Admin Write | Notes |
|---|---|---|---|
| `bookings` | ✅ Yes (creation only) | ✅ Yes | Primary booking intake — unauthenticated create allowed |
| `services` | ❌ No | ✅ Yes | Service catalogue — read-only for public |
| `team` | ❌ No | ✅ Yes | Team member profiles |
| `locations` | ❌ No | ✅ Yes | Location metadata |
| `reviews` | ❌ No | ✅ Yes | Curated reviews — no user-submitted writes |

### Data Routing

- Production database ID: `(default)` — set via `VITE_FIRESTORE_DB_ID`
- Development database ID: `freshnest-dev` — set via `VITE_FIRESTORE_DB_ID` in `.env.local`
- Database IDs must never be hardcoded in component or service code — only in `src/lib/firebase.ts`

---

## 5. Compliance Checklist

Run before closing any Phase C ticket involving data collection, email, SMS, or forms:

### CASL
- [ ] Marketing email opt-in checkbox is unchecked by default
- [ ] Opt-in checkbox has clear consent language
- [ ] If `marketingConsent === true`, `consentTimestamp` is stored on booking document
- [ ] Unsubscribe link is present in all marketing email templates
- [ ] Booking confirmation emails are not gated by marketing consent

### PIPEDA / Quebec Law 25
- [ ] No client PII stored in `localStorage` or `sessionStorage`
- [ ] Quebec client data collection has explicit consent mechanism
- [ ] French-language consent presented for Quebec clients
- [ ] Data retention policy documented for new collections
- [ ] No PII passed to non-essential third-party services

### Accessibility (WCAG 2.1 AA)
- [ ] Phone number in nav and footer as `<a href="tel:...">` link
- [ ] All form inputs have visible `<label>` elements
- [ ] All body text is 16px or larger
- [ ] All interactive elements have 48px minimum height
- [ ] All text/background pairs pass 4.5:1 contrast ratio
- [ ] Focus indicators are visible on all interactive elements
- [ ] No horizontal scroll at 768px viewport

### Firestore Security
- [ ] No changes to `firestore.rules` without human approval
- [ ] Database ID not hardcoded outside `src/lib/firebase.ts`
- [ ] No wildcard allow rules deployed to production
- [ ] Admin access to sensitive collections requires Firebase Auth

---

*End of Compliance Reference — maintained by human owners. AI agents must not modify security rules or consent flows without explicit instruction.*
