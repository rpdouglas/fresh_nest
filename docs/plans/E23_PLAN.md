# E23: JSON-LD Schema — Planning Document

**Epic:** E23 (JSON-LD Schema)
**Phase:** Phase 4 — SEO & Accessibility
**Primary Persona(s):** All (SEO), specifically P1 Diane & P5 Sophie (Bilingual SEO), P6 Gallagher (Commercial Services)
**Status:** Phase A (Planning)

---

## Persona Impact & Requirements
- **P1 Diane & P5 Sophie:** Expect search results in French. Schema must output dynamically in French when `fr` is active to match the page content and rank correctly in French Google searches.
- **P6 Gallagher:** Needs the Airbnb turnover service to be explicitly understood by search engines. `Service` schema must be accurately mapped to the `/services/airbnb-turnover` route.
- **All (SEO):** Needs standard `LocalBusiness` validation to trigger rich search results.

---

## Strategy 1: Custom `<JsonLd>` Component with Centralized Data (Recommended)
This aligns with the choices made during the `/grill-me` session.

**Approach:** 
Create a reusable `<JsonLd>` React component that safely injects a `<script type="application/ld+json">` tag. The schema data definitions (types and base objects) will be stored centrally in `src/lib/seo.ts`. The component will use `react-i18next` (`useTranslation`) to dynamically localize the schema output (e.g., descriptions, titles) based on the user's selected language. We will implement `LocalBusiness`, `Service`, and `FAQPage` schemas.

**Files Changed:**
- `src/components/seo/JsonLd.tsx` (New)
- `src/lib/seo.ts` (New)
- `src/App.tsx` or layout components (to inject `LocalBusiness`)
- `src/pages/ServicePage.tsx` (to inject `Service` schema)
- `src/pages/FaqPage.tsx` (to inject `FAQPage` schema)

**Persona Impact:** 
High positive impact. Search engines will index the exact language the user is viewing, solving P1 and P5's needs perfectly. The schema is cleanly organized for P6's service pages.

**Risks:**
- Dynamic injection by React means crawlers must execute JavaScript to see the schema (Google does this well, but some secondary search engines may lag).

**Schema Audit:** No Firestore schema changes required.

---

## Strategy 2: `react-helmet-async` with Inline Component Definitions
**Approach:** 
Install `react-helmet-async` and wrap the app in its provider. Define the schema objects inline within each individual page component (e.g., `HomePage.tsx`, `ServicePage.tsx`) and inject them via the `<Helmet>` component. 

**Files Changed:**
- `package.json` (Add `react-helmet-async`)
- `src/main.tsx` (Add HelmetProvider)
- `src/pages/HomePage.tsx`
- `src/pages/ServicePage.tsx`
- `src/pages/FaqPage.tsx`

**Persona Impact:** 
Similar to Strategy 1. It achieves the bilingual and service-level needs for all personas.

**Risks:**
- Requires introducing a new third-party dependency (`react-helmet-async`).
- Inline definitions in page components may clutter the UI code and make schema updates harder to maintain.

**Schema Audit:** No Firestore schema changes required.

---

## Strategy 3: Firebase Edge / SSR Injection
**Approach:** 
Offload the JSON-LD generation to Firebase Hosting edge functions or Cloud Functions. When a request hits `/fr/services/airbnb-turnover`, the function injects the correct localized JSON-LD directly into the static `index.html` before sending it to the client.

**Files Changed:**
- `firebase.json` (Rewrite rules)
- `functions/src/index.ts` (New SSR/Edge function)
- `index.html` (Add placeholder for injection)

**Persona Impact:** 
Maximum SEO impact. Crawlers receive the schema instantly without needing to execute JavaScript.

**Risks:**
- Highly complex to set up. Requires routing all traffic through Cloud Functions, which increases latency (TTFB) and costs.
- Overkill for current project stage (Phase 4).

**Schema Audit:** No Firestore schema changes required.

---

## Next Steps (AGY 3-Phase Gate)
HALT. Awaiting human approval on the strategy. Once approved, I will proceed to Phase B (Execution).
