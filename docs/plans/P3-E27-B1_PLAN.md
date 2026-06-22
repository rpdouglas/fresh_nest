# P3-E27-B1 — 3-Strategy Plan
**Epic:** Automated Welcome Email with Magic Link  
**Date:** 2026-06-22  
**Author:** Antigravity (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Architecture | Dedicated secure backend callable `resendWelcomeEmail` | Client-generated link + general mailer CF | Use default Firebase Auth verification email |
| Security | ✅ High (Admin token validated; link generated server-side) | ❌ Low (Generates sign-in links via client SDK, insecure) | ✅ High |
| Branding & UX | ✅ High (Bilingual custom HTML email templates) | ✅ High | ❌ Low (Plain text generic Firebase system email) |
| Onboarding Integration | ✅ High (Passes `onboarding=true` to redirect FSM app) | ✅ High | ❌ Low (Only redirects to home page; bypasses onboarding flow) |
| Sentry Visibility | ✅ High (Logs API issues to Sentry) | Medium | Low |

---

## Strategy 1 (Recommended) — Dedicated Backend Callable + Centralized Templates

### Summary
1. **Shared Types**: Add `welcomeEmailSentAt: Date | null` to the `Staff` interface and update the shared `staffConverter` to parse it from a Timestamp.
2. **Secrets Configuration**: Add `FSM_APP_URL = defineSecret('FSM_APP_URL')` in `functions/src/lib/shared.ts`.
3. **Dedicated Callable Function**: Create `resendWelcomeEmail` in `functions/src/callable/staff.ts`.
4. **Email Integration**: Define HTML templates `staffWelcomeEn` and `staffWelcomeFr` in `functions/src/emailTemplates.ts`. Add `sendWelcomeEmail` helper in `functions/src/sendEmail.ts` utilizing the `Resend` SDK.
5. **Admin Table Updates**: Render `welcomeEmailSentAt` status in the "Contact" column and add a "Resend Invite" button inside the "Actions" cell in `StaffTable.tsx`.

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/staff.ts` | Add `welcomeEmailSentAt?: Date \| null` to `Staff` type. |
| `packages/shared/src/firebase/converters.ts` | Update `staffConverter` to parse `welcomeEmailSentAt` timestamp into a Date. |
| `functions/src/lib/shared.ts` | Export `FSM_APP_URL` secret definition. |
| `functions/src/emailTemplates.ts` | Add `staffWelcomeEn` and `staffWelcomeFr` HTML templates. |
| `functions/src/sendEmail.ts` | Add `sendWelcomeEmail` function calling Resend API. |
| `functions/src/callable/staff.ts` | Generate magic link, call `sendWelcomeEmail`, write `welcomeEmailSentAt` in `onStaffRegistered` and new `resendWelcomeEmail`. |
| `functions/src/index.ts` | Export `resendWelcomeEmail`. |
| `apps/customer/src/components/admin/hooks/useStaff.ts` | Add `resendWelcomeEmail` callable method. |
| `apps/customer/src/components/admin/StaffTable.tsx` | Update UI columns to display status and provide a resend action. |

### Persona Impact
- **Lauren (Admin)**: Simple UI status and single-click invite resends; zero manual texts/emails needed.
- **Jasmine (Staff) / Brenda (Lead Cleaner)**: Clear, branded, first-contact instructions in preferred language. Magic link signs them in instantly.

### Risks
- Emulator email sandbox: Resend emails do not send in local emulator without a real API key.
- Magic link redirects: Redirect URL must match the client-side routes configuration.

### Mitigation
- In the emulator, log the magic link to the console for easy developer testing.
- Verify redirect routing mapping (`/login?onboarding=true` -> FSM app).

---

## Strategy 2 — Client-Generated Link + General Mailer CF

### Summary
Generate the magic link inside the customer app using the client SDK, then pass the generated URL to a general `sendEmail` Cloud Function.

### Assessment
This bypasses backend security checks and relies on the client app to construct and manage administrative sign-in actions. It is a security vulnerability, as anyone who accesses the client API could abuse it to generate arbitrary sign-in links.

---

## Strategy 3 — Firebase Auth Default Verification Email

### Summary
Rely on Firebase Auth's default automatic email verification link sent upon user creation.

### Assessment
This sends a generic, unbranded plain-text email with standard Firebase copy. It does not allow us to guide the new employee through the required background check consent (P3-E27-B2) or Terms acceptance, which is a compliance risk under PIPEDA.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. Update `packages/shared` types and converters.
2. Define email templates and `sendWelcomeEmail` logic in Cloud Functions.
3. Update `onStaffRegistered` and write `resendWelcomeEmail` in Cloud Functions.
4. Update `useStaff` hook and `StaffTable.tsx` UI in the customer application.
5. Verify build, run tests, and perform brand/data audits.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution.
