# E03 — Navbar + Footer (Bilingual) · 3-Strategy Plan
**Epic:** E03 | **Phase:** 1 | **Date:** 2026-06-06  
**Primary Personas:** Diane Lafleur (P1), Travis McLeod (P2), Margaret Storey (P3)  
**Prepared by:** AGY Phase A Planning Gate

---

## Persona Identification

| Persona | Need | E03 Feature |
| :--- | :--- | :--- |
| **Diane Lafleur (P1)** | French UX from first click | Language toggle (EN\|FR) in nav, all links via `t()` |
| **Travis McLeod (P2)** | "Book Now" immediately visible | CTA button in nav at all viewports, no scroll |
| **Margaret Storey (P3)** | Phone number to call before booking | `tel:` link in nav header (desktop) + hamburger (mobile) |

---

## Schema Audit

E03 (Navbar + Footer) makes **no Firestore writes**. It reads the `i18n` language state from `localStorage` only. No new Firestore fields are required. The `language: 'en' | 'fr'` field on bookings is set at booking time (E15/E16), not here.

**Data_Steward verdict:** No schema changes. No risk.

---

## Files Requiring Creation or Modification

| File | Action | Notes |
| :--- | :--- | :--- |
| `src/components/layout/Navbar.tsx` | **Create** | New bilingual nav component |
| `src/components/layout/Footer.tsx` | **Create** | New bilingual footer component |
| `src/App.tsx` | **Modify** | Replace Vite placeholder with router + layout shell |
| `src/pages/Home.tsx` | **Create** | Placeholder home page (content added in E04–E14) |
| `src/i18n/locales/en.json` | **Modify** | Expand with all nav + footer + language toggle strings |
| `src/i18n/locales/fr.json` | **Modify** | Expand with all nav + footer + language toggle strings |
| `src/hooks/useScrollReveal.ts` | **Create** | Optional scroll-shadow hook for nav |

---

## Strategy 1 — Minimal Atomic (Safe, Incremental)

### Summary
Build only what E03 requires: a `Navbar.tsx` and `Footer.tsx` component with language toggle, phone link, and Book Now CTA. Wire them into a simple layout wrapper. Ship App.tsx with a basic router and placeholder Home page.

### Approach
- `Navbar.tsx`: Fixed top bar, `bg-white`, logo (img tag with `logo-navbar-80px.png`), nav links via `t()`, phone `tel:` link, `EN|FR` toggle button, `Book Now` CTA. Mobile hamburger with `useState` toggle (no external library).
- `Footer.tsx`: `bg-charcoal` full-width, 4-col grid (desktop) / 2-col (mobile), all links via `t()`, phone and email in footer.
- `App.tsx`: Wraps router in `<Navbar> <Outlet/> <Footer>` layout. Routes: `/` → `Home.tsx` placeholder.
- No animation library used in this strategy — scroll shadow via inline `useEffect + window.addEventListener`.
- No external state management — language stored in `i18next`/`localStorage` only.

### Files Changed
```
src/components/layout/Navbar.tsx         ← Create
src/components/layout/Footer.tsx         ← Create
src/App.tsx                              ← Rewrite
src/pages/Home.tsx                       ← Create (placeholder)
src/i18n/locales/en.json                 ← Expand
src/i18n/locales/fr.json                 ← Expand
```

### Persona Impact
| Persona | Test | Result |
| :--- | :--- | :--- |
| Diane (P1) | Toggle switches all nav + footer text to French | ✅ Pass |
| Travis (P2) | Book Now visible at 375px without scroll | ✅ Pass |
| Margaret (P3) | Phone `tel:` visible at 768px in header | ✅ Pass |

### Risks
- **Low risk.** Minimal scope. No animation, no external libraries.
- Mobile hamburger relies on `useState` only — keyboard accessibility must be verified with aria attributes.
- Scroll shadow requires `useEffect` cleanup — memory leak risk if not properly disposed.

### Schema Audit
No Firestore reads or writes. ✅

---

## Strategy 2 — Full-Featured with Framer Motion (Recommended)

### Summary
Build the complete E03 navbar and footer as production-ready components with Framer Motion scroll effects, animated mobile menu, and full WCAG AA keyboard accessibility. Wire up React Router v6 with a complete multi-route shell. Expand i18n JSON with all strings needed through E06 (to avoid repeated JSON edits per epic).

### Approach
- `Navbar.tsx`:
  - Fixed top bar with `bg-white/95 backdrop-blur-sm` — glass effect on scroll
  - Framer Motion `AnimatePresence` for mobile menu slide-in/slide-out
  - `useScrolled` hook: `scrollY > 20px` → adds `shadow-md`
  - Language toggle: `<button>EN | FR</button>` using `i18n.changeLanguage()`
  - Phone number: `<a href="tel:+16135551234">` — visible in nav desktop, in mobile menu
  - Book Now CTA: `bg-slate-brand text-white rounded px-5 py-2.5 min-h-[48px]` — always visible
  - Hamburger: `aria-expanded`, `aria-controls`, `aria-label` — WCAG keyboard accessible
  - `focus:ring-2 focus:ring-slate-brand` on all interactive elements
- `Footer.tsx`:
  - `bg-charcoal text-warm-white`
  - 4-col grid (desktop) → 2-col (mobile) → 1-col (< 400px)
  - Columns: Brand + tagline | Services links | Locations links | Contact (phone, email, hours)
  - All links use `t()` — zero hardcoded strings
  - Bottom bar: copyright, privacy policy link, language toggle (secondary)
- `App.tsx`:
  - `createBrowserRouter` with routes: `/`, `/services/*`, `/locations/*`, `/booking`, `/thank-you`, `/faq`, `/pricing`, `/gallery`, `/admin`
  - Layout component wrapping `<Navbar>`, `<Outlet />`, `<Footer>`
- i18n JSON expanded with all nav, footer, and common UI strings upfront

### Files Changed
```
src/components/layout/Navbar.tsx         ← Create
src/components/layout/Footer.tsx         ← Create
src/components/layout/Layout.tsx         ← Create (layout wrapper)
src/App.tsx                              ← Rewrite with createBrowserRouter
src/pages/Home.tsx                       ← Create (placeholder)
src/hooks/useScrolled.ts                 ← Create (scroll shadow hook)
src/i18n/locales/en.json                 ← Expand (nav + footer + common)
src/i18n/locales/fr.json                 ← Expand (nav + footer + common)
```

### Persona Impact
| Persona | Test | Result |
| :--- | :--- | :--- |
| Diane (P1) | Toggle switches nav + footer to French with smooth re-render | ✅ Pass |
| Travis (P2) | Book Now visible at 375px, 768px, 1280px without scroll | ✅ Pass |
| Margaret (P3) | Phone `tel:` visible at 768px, 48px touch target, WCAG AA contrast | ✅ Pass |

### Risks
- **Medium scope.** Framer Motion adds ~50KB gzipped — acceptable for production.
- Route shell must cover all planned routes now to avoid refactoring in E04–E14.
- `backdrop-blur-sm` has limited Safari iOS support — fallback `bg-white` needed.

### Schema Audit
No Firestore reads or writes. ✅

---

## Strategy 3 — Context-Driven Language State (Advanced)

### Summary
Everything in Strategy 2, plus extracts language state into a React Context (`LanguageContext`) to allow components deep in the tree to read/set language without prop drilling. Also adds a `useLanguage()` hook and creates the `src/hooks/useLanguage.ts` file referenced in the repository structure spec.

### Approach
All of Strategy 2 plus:
- `src/context/LanguageContext.tsx`: Wraps `i18n.changeLanguage()` in a React context with `language` state and `setLanguage` dispatcher.
- `src/hooks/useLanguage.ts`: Custom hook exposing `{ language, setLanguage, isEnglish, isFrench }`.
- Language toggle in Navbar consumes `useLanguage()` instead of calling `i18n` directly.
- Firestore booking writes will consume `useLanguage()` to populate the `language` field (used in E15/E16).
- Slightly over-engineered for E03 alone, but future-proofs the bilingual architecture for the booking form.

### Files Changed
```
src/components/layout/Navbar.tsx         ← Create
src/components/layout/Footer.tsx         ← Create
src/components/layout/Layout.tsx         ← Create
src/context/LanguageContext.tsx          ← Create
src/hooks/useLanguage.ts                 ← Create
src/hooks/useScrolled.ts                 ← Create
src/App.tsx                              ← Rewrite
src/pages/Home.tsx                       ← Create
src/i18n/locales/en.json                 ← Expand
src/i18n/locales/fr.json                 ← Expand
```

### Persona Impact
Same as Strategy 2 — all persona tests pass.

### Risks
- **Highest scope of the three.** Adds context layer that may be premature for E03.
- `i18next` already manages language state internally — `LanguageContext` may duplicate it.
- Recommended only if E15 (booking form) will definitely consume `useLanguage()` for Firestore writes.

### Schema Audit
No Firestore reads or writes. ✅

---

## Recommendation

**Strategy 2 — Full-Featured with Framer Motion** is the recommended approach.

**Rationale:**
- Strategy 1 is safe but produces a navbar that will need to be refactored immediately when E04 and E05 need animations.
- Strategy 2 builds the production-ready component in one pass: Framer Motion is already a project dependency, accessibility is fully baked in, and the React Router shell covers all planned routes.
- Strategy 3's `LanguageContext` is premature — `i18next` already handles language state globally. This can be added in E15 if prop drilling becomes a problem.
- Strategy 2 also expands `en.json`/`fr.json` upfront with common strings, avoiding repeated JSON editing across E04–E06.

---

## Acceptance Criteria (Pass/Fail Gate for Phase C)

- [ ] Language toggle switches all nav and footer text to French and back
- [ ] Phone number visible at 375px, 768px, 1280px — as a tappable `tel:` link
- [ ] "Book Now" CTA visible without scrolling at all three viewports
- [ ] Mobile hamburger opens and closes correctly
- [ ] Hamburger is keyboard accessible (`Tab`, `Enter`, `Escape`)
- [ ] All strings use `t()` — Brand_Auditor confirms zero hardcoded EN/FR
- [ ] All interactive elements have `min-h-[48px]` (Margaret)
- [ ] All text is `text-base` minimum (16px)
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] Linguistic_Auditor confirms `en.json` and `fr.json` are complete and consistent

---

## Pending Human Decision

**HALT — Awaiting approval of one of the three strategies before any code is written.**

Select Strategy 1, 2, or 3 to proceed to Phase B.
