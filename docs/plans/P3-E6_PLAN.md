# P3-E6: Accessibility Pass (WCAG 2.1 AA) — Phase A Strategy Plan

**Epic:** P3-E6 · **Priority:** P2 · **Complexity:** M
**Prepared:** 2026-06-18
**Persona gate:** P3 Margaret — keyboard-only booking flow works; Lighthouse a11y ≥ 90 on `/booking` and `/`.

---

## Strategy 1 — axe-core Audit + Targeted Spec-Driven Fixes (Recommended)

**What:** Run axe-core programmatically on the three specified routes (`/`, `/booking`, `/admin`). Fix all Critical and Serious violations. Implement the specific fixes called out in the v3 plan spec. Add a Playwright keyboard-navigation test for the full booking flow.

**Files changed:**
- `apps/customer/src/components/layout/Layout.tsx` — add skip-nav: `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-brand focus:text-white focus:rounded">Skip to content</a>`; add `id="main-content"` to `<main>`
- `apps/customer/src/components/layout/Navbar.tsx` — add `aria-expanded` + `aria-controls` on hamburger button; ensure `aria-label` on icon-only controls
- `apps/customer/src/pages/BookingPage.tsx` — add focus management on step change: `useEffect(() => { firstInteractiveRef.current?.focus() }, [currentStep])`
- `apps/customer/src/components/admin/BookingsTable.tsx` + `StaffTable.tsx` — audit `text-sm` (14px) instances; uplift status badge text to `text-xs font-medium` with sufficient contrast or `text-base` where semantic
- `apps/customer/src/components/admin/BookingsTable.tsx` — add `aria-live="polite"` region for filter result count
- `apps/customer/src/pages/BookingPage.tsx` — add `aria-live="polite"` for step progress announcements
- `apps/customer/e2e/accessibility.spec.ts` — new spec: keyboard-only booking flow (Tab/Enter/Space navigation through all 4 steps); inject axe-core assertions on `/` and `/booking`
- `apps/customer/package.json` — add `axe-core` and `@axe-core/playwright` as devDependencies

**Persona impact:** P3 Margaret can complete the full booking flow using keyboard only — critical for users who rely on keyboard or screen reader navigation. Skip-nav removes the tab-key journey through the full navbar on every page. Focus management on booking step change prevents screen reader users from being disoriented after step transitions.

**Risks:**
- axe-core may surface violations beyond the spec-listed ones — triage by severity (Critical and Serious only; Moderate and Minor are stretch goals)
- Admin table `text-sm` instances may be intentionally decorative (status badges) — confirm with Brand_Auditor before uplifting sizes that could affect the design system
- `aria-live` regions must not be overly verbose — test with VoiceOver/NVDA to confirm announcements are helpful, not noisy
- `html[lang]` dynamic switching confirmed done — verify with a quick DOM inspection rather than assuming

**Schema audit:** No Firestore changes. No `docs/firestore-schema.md` update required.

---

## Strategy 2 — Full Manual WCAG Audit Across All Routes

**What:** Conduct a comprehensive manual WCAG 2.1 AA audit across every route in the app (not just the three specified), using a screen reader + keyboard combination. Fix all issues found.

**Files changed:** Superset of Strategy 1 — additional routes including all location pages, service pages, blog, customer portal, FSM app.

**Persona impact:** More thorough coverage. Better for P3 Margaret across the full site, not just the core booking flow.

**Risks:** Scope creep — auditing all routes is significantly more work than the spec requires and could delay Sprint 4. A full audit is best after the focused pass confirms the core flows are compliant. The acceptance criteria only require `/`, `/booking`, and `/admin` — stick to those for Phase 3. Full-site audit is Phase 4 scope.

**Schema audit:** None.

---

## Strategy 3 — Lighthouse a11y Score Targeting Only

**What:** Run Lighthouse on `/` and `/booking`; fix whatever violations Lighthouse surfaces until both routes score ≥ 90. No axe-core, no manual keyboard testing.

**Files changed:** Subset of Strategy 1 — only fixes needed to hit the Lighthouse threshold.

**Persona impact:** Lighthouse a11y score is a sampling heuristic — it does not test keyboard navigation or focus management, which are P3 Margaret's primary needs. A score of 90 can be achieved without fixing the booking step focus management or the skip-nav link, both of which are critical for keyboard users.

**Risks:** Lighthouse a11y is insufficient for WCAG 2.1 AA certification. The Playwright keyboard-nav acceptance criterion is not met by Lighthouse alone. This strategy satisfies the metric but fails the persona test.

**Schema audit:** None.

---

## Recommended Strategy: **Strategy 1**

axe-core + targeted spec-driven fixes hits all acceptance criteria (Lighthouse ≥ 90, keyboard booking flow Playwright test, no Critical/Serious violations) without scope creep. Strategy 2 is the right long-term approach but is out of scope for Sprint 4. Strategy 3 fails the persona test.

**Awaiting human approval to proceed to Phase B.**
