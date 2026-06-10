# Epic 26: Analytics Stack
**Goal:** Implement a compliant, privacy-first analytics stack to track core business metrics without violating CASL or Quebec Law 25.

**Primary Persona(s):** All (Business metrics impact Travis, Margaret, Diane via feature priority)

---

## Strategy 1: Firebase Analytics with Strict Opt-In (Chosen Path)
**Description:** Implement Firebase Analytics (since the project is already deeply integrated with Firebase). To comply with Quebec Law 25, Analytics will *not* initialize until the user explicitly accepts a cookie banner. We will track custom business events via a centralized `analytics.ts` service.

**Files Changed:**
1. `src/lib/firebase.ts`: Export `analytics` conditionally or initialize on demand.
2. `src/lib/analytics.ts` (New): Wrapper functions for `logEvent` (`quote_calculated`, `booking_completed`, `phone_clicked`, `booking_started`, `language_toggled`).
3. `src/components/layout/CookieBanner.tsx` (New): Tailwind component strictly asking for opt-in. Will set a `freshnest_consent` flag in `localStorage`.
4. `src/App.tsx`: Include the `CookieBanner`. Route changes will trigger page views if consent is granted.
5. Component files (`Navbar.tsx`, `Footer.tsx`, `QuoteCalculator.tsx`, `BookingPage.tsx`, `ThankYouPage.tsx`): Import and trigger `logEvent` appropriately.

**Persona Impact:**
- Protects all personas' privacy. The banner must meet Margaret's accessibility standards (48px targets, 16px text).

**Risks:**
- Strict opt-in means we will lose visibility on users who ignore the banner. This is an accepted trade-off for compliance.
- Analytics requires async initialization.

**Schema Audit:**
- No Firestore schema changes required.

---

## Strategy 2: GA4 via Google Tag Manager (GTM)
**Description:** Use GTM to inject GA4. This allows marketing teams to add tags later without a developer.
**Files Changed:** `index.html` (GTM script), `CookieBanner.tsx` (pushes consent state to `dataLayer`).
**Risks:** GTM can slow down site performance significantly. Overkill for a local cleaning company.

---

## Strategy 3: Privacy-Focused (Plausible / Fathom)
**Description:** Use a cookie-less tracking solution. This completely eliminates the need for a cookie banner, improving UX.
**Files Changed:** `index.html` (Plausible script), `analytics.ts` (custom event triggers via `window.plausible`).
**Risks:** Requires paying for a third-party service (Plausible/Fathom are paid) and steps outside the Firebase ecosystem.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as determined by our interview:
- Native Firebase integration (free).
- Fully compliant with Quebec Law 25 via a strict opt-in `CookieBanner`.
- Tracks the 5 most valuable business events: `booking_completed`, `quote_calculated`, `phone_clicked`, `booking_started`, `language_toggled`.

**Awaiting your explicit human approval to execute Strategy 1!**
