---
epic: P3-E20
title: Firebase App Check — Plan
strategy: 1
approved: 2026-06-18
---

# P3-E20 PLAN — Firebase App Check

## Strategy 1 (Approved): ReCaptchaV3Provider, env-var gated, both apps

**Files changed:**
- `apps/customer/src/vite-env.d.ts`
- `apps/customer/src/lib/firebase/firebase.ts`
- `apps/fsm/src/vite-env.d.ts`
- `apps/fsm/src/lib/firebase/firebase.ts`

**Changes:**
- Add `VITE_RECAPTCHA_SITE_KEY?: string` to both vite-env.d.ts
- Add `initializeAppCheck` with `ReCaptchaV3Provider` to both firebase.ts files
- Guard on env var so local dev without key works unimpeded

**Persona impact:** P3 Margaret, P4 Kahnawà:ke — data protection.

**Risks:** Manual Firebase Console step required to enable enforcement; without it App Check is installed but not enforced. Documented in close report.

**Schema audit:** No Firestore schema change.
