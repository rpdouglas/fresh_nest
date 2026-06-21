# P3-E6: Accessibility Pass (WCAG 2.1 AA) — Phase A Strategy Plan

**Epic:** P3-E6 · **Priority:** P2 · **Complexity:** M
**Prepared:** 2026-06-18 · **Updated / Approved:** 2026-06-21
**Persona gate:** P3 Margaret — keyboard-only booking flow works; Lighthouse a11y ≥ 90 on `/booking` and `/`.

---

## Pre-flight Audit: Already Done (No Action Needed)

A code audit before execution found these spec items already implemented:

| Task | Status | Evidence |
|---|---|---|
| Skip-to-content link | ✅ Done | `Navbar.tsx` lines 47–52 + `t('nav.skipToContent')` |
| `aria-expanded` + `aria-controls` on hamburger | ✅ Done | `Navbar.tsx` lines 177–179 |
| `<main id="main-content" tabIndex={-1}>` | ✅ Done | `Layout.tsx` lines 35–41 |
| Dynamic `html[lang]` | ✅ Done | `Layout.tsx` `document.documentElement.lang = i18n.language` |
| Focus management on step change | ✅ Done | `BookingPage.tsx` `focusHeading` callback + `tabIndex={-1}` on step `<h2>` |
| `aria-label` on nav, logo, phone links | ✅ Done | `Navbar.tsx` throughout |
| `role="alert"` on booking form errors | ✅ Done | `BookingStep2.tsx`, `BookingStep4.tsx` |

**Remaining scope for Phase B:** `aria-live` regions, admin `text-sm` uplift, `@axe-core/playwright` E2E tests.

---

## Strategy 1 — axe/playwright E2E + Full Admin text-sm Audit (Approved)

**What:** Install `@axe-core/playwright`; create `e2e/a11y.spec.ts` with axe audits on `/`, `/booking`, and `/admin`; add keyboard-only booking flow test; add `aria-live` to `StepIndicator` and admin filter counts; uplift meaningful `text-sm` → `text-base` across all 12 admin components.

**Files changed:**
- `apps/customer/package.json` — add `@axe-core/playwright` devDependency
- `apps/customer/e2e/a11y.spec.ts` — new: axe Critical/Serious audit on `/`, `/booking`, `/admin`; keyboard-nav test through all 4 booking steps
- `apps/customer/src/components/booking/StepIndicator.tsx` — add `aria-live="polite" aria-atomic="true"` so screen readers announce step changes
- `apps/customer/src/components/admin/BookingsTable.tsx` — add `aria-live="polite"` to filter result count; uplift `text-sm` data cells
- `apps/customer/src/components/admin/BookingDetailPanel.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/StaffTable.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/AnalyticsDashboard.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/DispatchBoard.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/PayRatesManager.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/AuditLogsTable.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/OverrideModal.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/ChecklistTemplateManager.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/RegisterStaffModal.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/ReviewsModerationTab.tsx` — uplift `text-sm`
- `apps/customer/src/components/admin/OperationsDashboard.tsx` — uplift `text-sm`
- `apps/customer/src/i18n/locales/en.json` / `fr.json` — add `a11y.stepProgress` key if needed

**text-sm classification rule:**
- **Uplift to `text-base`:** table cell data (email, phone, date, amount), form labels, error messages, status badge text, modal body prose, any text a user must read to understand state
- **Retain `text-sm` only if:** element has `aria-hidden="true"` AND meaning is conveyed by an adjacent accessible element, OR element is purely decorative with no text content (icon wrapper with sr-only label)

**axe audit config — exclude third-party iframes:**
```typescript
await checkA11y(page, undefined, {
  axeOptions: { exclude: [['iframe']] },
  includedImpacts: ['critical', 'serious'],
})
```

**Persona impact:** P3 Margaret completes full booking flow keyboard-only; step progress announced; all page text ≥ 16px; admin portal meets AODA requirements for staff.

**Risks:**
- Admin table row density may loosen after text-base uplift — visual only, no functional regression
- Axe on `/admin` requires bypassing Firebase Auth gate — intercept via `page.route()` + mock admin `customClaims`
- `<PaymentElement>` Stripe iframe on Step 4 may trigger third-party axe violations — exclude iframes from axe scope

**Schema audit:** No Firestore changes.

---

## Strategy 2 — Full Manual WCAG Audit Across All Routes

**What:** Conduct a comprehensive manual WCAG 2.1 AA audit across every route in the app. Fix all issues found, not just the three specified routes.

**Trade-off:** Scope creep — acceptance criteria only require `/`, `/booking`, and `/admin`. Full-site audit is Phase 4 scope.

**Schema audit:** None.

---

## Strategy 3 — Lighthouse a11y Score Targeting Only

**What:** Run Lighthouse on `/` and `/booking`; fix violations until both score ≥ 90. No axe-core, no keyboard testing.

**Trade-off:** Lighthouse a11y is a sampling heuristic — does not test keyboard navigation or focus management, which are Margaret's primary needs. Persona test fails.

**Schema audit:** None.

---

## Approved Strategy: **Strategy 1** ✅

**Approved:** 2026-06-21

### Decisions Locked in Approval

| # | Question | Decision |
|---|---|---|
| 1 | Axe-core tooling | Option A — `@axe-core/playwright` in existing `e2e/` suite |
| 2 | Admin `text-sm` scope | Option A — Audit all 81 instances; uplift meaningful text to `text-base` |

**Proceeding to Phase B.**
