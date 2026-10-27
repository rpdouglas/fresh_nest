---
epic: P3-E33
title: Admin Mobile, Phase 1 — Shell, Navigation and Bug Fixes — Plan
strategy: pending
approved: pending
---

# P3-E33 PLAN — Admin Mobile, Phase 1

**Phase A written:** 2026-10-27 · **Status:** ⏸ Awaiting human approval
**Spec:** [`../projects/P3-E33.md`](../projects/P3-E33.md) · **Evidence:** [`../reports/admin-mobile-review-2026-10-27.md`](../reports/admin-mobile-review-2026-10-27.md)

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | She can use the admin panel from a phone: reach every section in 2 taps, stay on the same section after a refresh, never cancel a booking by accident, and dialogs she can close and finish. |
| **P3 Margaret (rules)** | Her 48px targets and 16px text apply to the new controls. The confirm step uses plain language. |
| **P1 Diane / P5 Sophie (indirect)** | French admin strings for lead source and confirmations. The admin panel was already bilingual; no raw keys remain. |
| **P7–P15 (indirect)** | The Override dialog guards the P7/P8/P9 constraints. Making it scrollable and keyboard-safe keeps that guard usable on phones. |

## What the code looks like today
- **Shell:** `App.tsx` nests `/admin` under the public `Layout`. `Layout.tsx` renders `<Navbar/> <main> <Outlet/> </main> <Footer/> <CookieBanner/> <InstallPrompt/>`, and `AdminPage` renders a **second** `<main>` inside it.
- **Tabs:** `AdminPage.tsx` has 9 hand-written tab `<button>`s (about 100 lines of repeated classes), and `activeTab` is in `useState`.
- **Dialogs:**
  - `AdminBookingModal`, `RegisterStaffModal` and `ExportRecordModal` are `fixed inset-0 … overflow-y-auto` overlays with `role="dialog" aria-modal="true"`;
  - `OverrideModal` has no `overflow-y-auto`;
  - none handles Escape, focus or scroll lock.
- **Status change:** `BookingDetailPanel.tsx`'s status `<select onChange>` calls `handleStatusChange` directly.
- **Copy and markup bugs:**
  - `admin.leads.*` keys don't exist, so the lead source shows the raw key;
  - `OperationsDashboard.tsx:59` formats the duration twice;
  - `AnalyticsDashboard.tsx:80` uses `admin.login.errorTitle` ("Access Denied");
  - `BookingsTable.tsx` wraps rows in `<tr className="contents"><tr>…`;
  - `BookingDetailPanel` uses `colSpan={5}` in a 6-column table.

## Common to all strategies
- **Breakpoint:** phone changes apply below `md` (768px) via `max-md:` or `md:hidden`. Classes used at `md`+ stay exactly as they are.
- **URL tab state:** `?tab=bookings|dispatch|analytics|staff|templates|payRates|auditLogs|reviews|gallery`. Unknown values fall back to `bookings`. It uses `useSearchParams` and works at all sizes, with no visual change.
- **Bug fixes**, all invisible on desktop:
  - add `admin.leads.{organic,google,referral,facebook,direct,phone,walk-in}` in EN and FR;
  - print the duration once;
  - add an analytics error title ("Couldn't load analytics" / « Impossible de charger les analyses »);
  - replace the row wrapper with `<Fragment key>`;
  - set `colSpan={6}`;
  - change `AdminPage`'s outer `<main>` to a `<div>`.
- **Schema audit:** no Firestore reads, writes or fields change. No `firestore.rules`, indexes or Cloud Functions change.
- **i18n:** every new string goes through `t()` in EN and FR. EN/FR only.
- **Tailwind audit:** design-system tokens only (`slate-brand`, `sand`, `cream`, `warm-white`, `charcoal`, `text-muted`). `rounded` for brand elements, 48px minimum targets.

---

## Strategy 1 — Classes only (smallest diff)
- **Shell:** in `Layout.tsx`, when `pathname` starts with `/admin`, wrap `Footer`, `CookieBanner` and `InstallPrompt` in `max-md:hidden`.
- **Header:** add `max-md:` classes in `AdminPage.tsx` (H1 `max-md:text-3xl`, profile card in one row).
- **Navigation:** add a native `<select>` section switcher (`md:hidden`, 48px) above the tab strip, and add `max-md:hidden` to the tab strip.
- **Dialogs:** in each of the 4 modals, add a `useEffect` for Escape and body scroll lock, and give `OverrideModal` `max-h-[90vh] overflow-y-auto`. No focus trap and no full-screen layout.
- **Confirm:** `window.confirm(t('admin.confirm.cancelBooking'))` before Cancelled or Confirmed.

**Files:** `Layout.tsx`, `AdminPage.tsx`, 4 modals, `BookingDetailPanel.tsx`, `BookingsTable.tsx`, `OperationsDashboard.tsx`, `AnalyticsDashboard.tsx`, `en.json`, `fr.json`.

**Pros:**
- Smallest diff.
- Fastest to ship.

**Cons:**
- Escape and scroll-lock logic copied 4 times.
- **No focus trap**, so the WCAG 2.4.3 gap remains.
- Phone dialogs still scroll to reach Save.
- `window.confirm` is unstyled and can't show booking context.
- **Nothing guards the "desktop unchanged" constraint** except manual checking.

**Risk:** low code risk; medium risk of an unnoticed desktop change.

---

## Strategy 2 — Shared admin primitives + desktop screenshot guard (recommended)
**New small building blocks**, used by this phase and by phases 2–5:
- **`components/admin/ui/useDialogBehavior.ts`:**
  - Escape closes;
  - Tab and Shift+Tab stay inside the dialog;
  - focus goes to the first field on open and back to the opener on close;
  - `body` scroll lock while open.
- **`components/admin/ui/AdminDialog.tsx`:** wraps the existing overlay and panel markup.
  - **At `md`+:** it renders **the same classes each modal uses today**, passed in as props so nothing visible changes.
  - **Below `md`:** it becomes a full-screen sheet with a sticky header (title and ✕, 48px) and a **sticky action bar** (`max-md:sticky max-md:bottom-0`) for Cancel and Save.
- **`components/admin/ui/ConfirmDialog.tsx`:** built on `AdminDialog`.
  - Example: "Cancel Margaret Storey's booking for Tue Oct 28? This cancels the job and texts the owner." with buttons "Keep booking" and "Cancel booking".
  - Same pattern for Confirm: "This creates the job for dispatch."
- **`components/admin/AdminSectionNav.tsx`:**
  - **At `md`+:** the existing tab strip, rendered from one `TABS` array with **byte-identical classes**. This replaces about 100 repeated lines in `AdminPage`.
  - **Below `md`:** a sticky "Section" select, 48px, with an accessible label.
  - Reads and writes `?tab=`.

**Wiring:**
- `Layout.tsx`: phones-only hiding of the footer, cookie banner and install prompt on `/admin`.
- `AdminPage.tsx`: compact phone header; uses `AdminSectionNav`; outer `<div>` instead of `<main>`.
- The 4 modals use `AdminDialog`. Their desktop classes move into props unchanged.
- `BookingDetailPanel.tsx`: the status select opens `ConfirmDialog` for Cancelled and Confirmed.
- The common bug fixes.

**Desktop guard (commit it):**
- Add the emulator harness used for the review under `apps/customer/e2e-admin/`:
  - seed script;
  - Vite config that swaps the Firebase setup for emulators;
  - its own `firebase.json` with the auth emulator;
  - a Playwright spec.
- Add `npm run test:admin-visual`. It runs locally (needs Java and the emulators) and isn't in CI yet.
- **The spec checks:**
  1. `toHaveScreenshot` for all 9 tabs at **1280×900**. The baseline is captured from `main` **before** any change.
  2. At **390×844**: no page overflow on any tab, switching sections takes 2 taps, `?tab=` survives a reload, Escape closes each dialog, and the Cancel confirm leaves the status alone when dismissed.

**Files:**
- New: 4 components and hooks, and `e2e-admin/` (about 4 files).
- Changed: `Layout.tsx`, `AdminPage.tsx`, 4 modals, `BookingDetailPanel.tsx`, `BookingsTable.tsx`, `OperationsDashboard.tsx`, `AnalyticsDashboard.tsx`, `en.json`, `fr.json`, `apps/customer/package.json` (script).

**Pros:**
- Fixes the focus and keyboard gaps properly.
- Phone dialogs get a sticky Save.
- The confirmation shows which booking.
- **The desktop constraint is enforced by screenshots,** not by eye.
- The primitives are reused by phases 2–5 (booking sheet, filter sheet, review cards).

**Cons:**
- More code than Strategy 1. Roughly +600 / −150 lines, a third of it the test harness.

**Risk:** refactoring 4 modals onto `AdminDialog` could shift desktop pixels. The screenshot guard catches that before push.

---

## Strategy 3 — Dedicated admin layout with phone bottom bar
- **Routing:** move `/admin` out of the public `Layout` into a new `AdminLayout`.
- **At `md`+:** `AdminLayout` renders the public `Navbar`, `Footer` and `CookieBanner` exactly as today, keeping desktop the same.
- **Below `md`:**
  - an admin top bar (logo, section title, Sign Out);
  - a **bottom tab bar**: Bookings · Dispatch · Staff · Reviews · More. "More" opens a sheet with Analytics, Templates, Pay Rates, Audit and Gallery.
- **Also:** everything in Strategy 2, plus `JsonLd` and `ScrollRestoration` duplicated into `AdminLayout`.

**Pros:**
- The best phone experience; daily sections are one tap.
- A clean home for later phone features.

**Cons:**
- The largest change, including routing.
- Duplicates the public layout's responsibilities.
- The bottom bar has to coordinate with sticky dialog footers (z-index and safe-area insets).
- Desktop risk is highest, because the whole page wrapper changes.
- More new strings.

**Risk:** medium–high. Could be done later, in phase 2 or after, on top of Strategy 2's primitives with little rework.

---

## Recommendation
**Strategy 2.**
- It meets every acceptance criterion in the spec.
- It closes the dialog accessibility gap.
- It's the only option that proves the desktop views didn't change.
- Its primitives are what phases 2–5 need.

Strategy 3's bottom bar can be added later on top of it.

## Decisions for the human
1. **Strategy:** 1, 2 (recommended) or 3?
2. **Confirmation on desktop too?** The confirm step before Cancelled or Confirmed is behaviour, not layout. **Recommended: all sizes**, since the cancellation SMS goes out either way. Choose "phones only" if desktop behaviour must not change at all.
3. **Cookie banner on desktop `/admin`:** keep it (as today) or hide it at all sizes? It's not needed for admins, but hiding it changes desktop. **Recommended: keep it on desktop**, per the constraint.
4. **Commit the emulator test harness** (`e2e-admin/`), run locally only for now? **Recommended: yes.** A CI job can follow later; it needs Java and the emulators, like the rules job.

## Phase B checklist (once approved)
1. Capture 1280px baselines from `main` before changing any code.
2. Implement the approved strategy.
3. Run Brand_Auditor, Data_Steward (no schema change) and Linguistic_Auditor (EN/FR keys).
4. Run `npm run build && npm run lint`, customer unit tests, the rules tests (unchanged) and `test:admin-visual`.
5. Phase C:
   - close report;
   - `ACTIVE_CYCLE.md`;
   - `user-guide/admin-guide.md`: section switcher, confirmation step, phone use.
