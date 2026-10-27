# Admin Panel — Mobile Review (2026-10-27)

**Scope:** every tab, form and modal of `/admin`, at phone width.
**Persona:** P12 Lauren Arsenault (admin operations), and the office person who shares quote follow-up.
**Constraint (human, 2026-10-27):** keep the desktop views exactly as they are.

## How this was reviewed
- **Data and screens:** the real admin panel ran locally against the Firebase emulators, with seeded sample data:
  - 7 bookings across every status;
  - 4 staff;
  - 4 jobs today (2 unassigned);
  - pay rates, checklist templates, audit entries, pending reviews and gallery pairs.
- **Sign-in:** an emulator admin account (role `admin`).
- **Screenshots:** every tab plus its main form or modal, at **390×844** (iPhone 14/15, touch), **768×1024** (tablet) and **1280×900** (desktop).
- **Measurements on each screen:**
  - page and container overflow;
  - tap targets under 44px;
  - text under 14px.
- **Not covered:**
  - The Marketing analytics sub-tab, which needs the Functions emulator. Its chart layout was reviewed from code.
  - A physical phone. iOS Safari zoom and keyboard behaviour should be checked on a real device during implementation.

---

## Summary

The admin panel has **no phone layout at all**. Across all 20 admin components there is not a single `md:hidden`, `hidden md:block` or card-list alternative. Everything is the desktop layout squeezed into 390px, and the screen falls into three groups.

| Works on a phone | Usable but painful | Broken on a phone |
|---|---|---|
| Checklist Templates, Gallery, Login | Analytics, every form and modal, header and tabs | Bookings table and booking details, **Dispatch Board**, Staff, Pay Rates, Audit Logs, Reviews |

**The three worst problems:**
1. **Wide tables are cut off inside their cards.** The bookings table needs 818px and shows 356px. **Status, Assigned and Job are off-screen**, and so are Reviews' **Approve/Reject** buttons and Staff's **Actions**. Nothing shows that the card scrolls sideways.
2. **The Dispatch Board doesn't work.**
   - The date controls don't wrap, so the whole page becomes 489px wide.
   - The unassigned sidebar takes 280 of 343px, leaving the cleaner columns 54px.
   - **Drag-and-drop can't work by touch**: the cards have no `touch-action: none` and no touch sensor.
3. **The admin page is wrapped in the public marketing site.**
   - The site navbar sits at the top.
   - The full footer adds about 1,000px below.
   - The cookie banner covers the bottom 170px of every screen until dismissed.
   - On the Bookings tab, the first booking row starts **about 1,860px down the page**, after the header, the 9-tab bar, the New Booking button, 3 stat cards stacked vertically, and 8 filter fields stacked vertically.

**Good news:**
- Every control is already at least 48px tall, and body text is at least 16px; the existing P3 Margaret rules have been followed.
- Templates and Gallery are already card-based and nearly fine.

The fixes are mostly **layout**: card lists, a compact header, collapsible filters, full-screen sheets and sticky action bars. They can all be scoped to phones with Tailwind's `max-md:` variant, or `md:hidden` / `hidden md:block`, so that **nothing at 768px and up changes**.

Contact sheet of the 12 key phone screens: generated in the review session (not committed). Each finding below quotes the measurement.

---

## Cross-cutting problems (all tabs)

### X1. Page shell: the admin panel lives inside the public site layout
`/admin` is a child of the public `Layout` (`App.tsx`), so it gets the marketing Navbar, the full Footer (services, areas, company, contact), `CookieBanner` and `InstallPrompt`.
- **On a phone:**
  - The footer adds about 1,000px of marketing links to every admin screen.
  - The cookie banner stays fixed over the bottom 170px, including over modals (see the New Booking screenshot).
  - The navbar's hamburger menu leads to public pages, not admin tabs.
- **Recommendation (phones only):**
  - Hide the public Footer and InstallPrompt on `/admin` below `md`, using a route check in `Layout`.
  - Hide the cookie banner on `/admin`. Admins aren't site visitors, and analytics consent there is moot.
  - Keep the public navbar or replace it with an admin bar (X3).
  - At `md`+, leave everything as it is.

### X2. Header takes the first screen
On a phone, the `Admin Dashboard` H1 (48px, `text-5xl`), the welcome line and a full-width profile card with Sign Out take about 290px before the tabs.
- **Recommendation (phones):**
  - Shrink the H1 to `text-3xl`.
  - Fold the profile card into a single row: avatar initial, then Sign Out.
  - Drop the welcome line.
  - `max-md:` classes only.

### X3. Tab navigation: 9 tabs in a 1,540px strip
- **Current:** the tab bar is 1,540px wide and shows 358px, with no indication that more tabs exist. Even at **1280px desktop**, Reviews Moderation and Gallery are off the right edge.
- **Recommendation (phones):** replace the strip with either:
  - **(a)** a sticky **"Section" select** under the header, showing the current tab name with a chevron, which opens a native list of all 9 sections. It's one control and one tap; or
  - **(b)** a **bottom tab bar** with the 4 daily tabs (Bookings, Dispatch, Staff, Reviews) plus "More" for Analytics, Templates, Pay Rates, Audit and Gallery.

  **(b)** suits an admin who mostly handles bookings and dispatch. **(a)** is simpler to build.
- **Also recommended, at all sizes:** keep the active tab in the URL (`/admin?tab=dispatch`). Today a refresh or the browser back button always lands on Bookings, which is most noticeable on phones. Desktop looks no different.

### X4. Tables: the core pattern
Six screens are `<table>`s inside `overflow-x-auto` cards:

| Screen | Table width | Shown on a phone |
|---|---|---|
| Bookings | 818px | 356px |
| Reviews | 878px | 356px |
| Audit | 855px | 356px |
| Staff | 825px | 356px |
| Pay Rates | 607px | 356px |
| Staff utilization (Ops) | 446px | 356px |

**Recommendation:**
- For each, render a **card list on phones** (`md:hidden`) and keep the existing table at `md`+ (`hidden md:block`). Both read from the same data.
- Each card shows:
  - a title line (name);
  - a meta line (date · service);
  - status chips;
  - the row's primary action as a full-width 48px button.
- Detail opens in a full-screen sheet (X5), not an inline expanded row.

### X5. Modals and forms
New Booking, Register Staff, Export Record, Override and Gallery's Add pair are all centred dialogs with `p-4` margins.
- **On a phone:**
  - The whole dialog scrolls inside the overlay, so the **Save button is only reachable after scrolling to the end**. New Booking has 3 sections and about 20 fields.
  - The page behind keeps scrolling because there's no scroll lock.
  - **None of the dialogs closes on Escape or traps focus.** On desktop that's also an accessibility gap (WCAG 2.1.2 / 2.4.3).
  - `OverrideModal` has no `overflow-y-auto`, so on a short phone or in landscape its reason box and Confirm button can fall off-screen with no way to scroll.
- **Recommendation:**
  - On phones, make each modal a **full-screen sheet** with a sticky header (title and ✕) and a **sticky footer** (Cancel / Save) using `max-md:` classes.
  - Add a scroll lock while open.
  - Close on Escape and trap focus at all sizes; this is behaviour, not layout.
  - Make `OverrideModal` scrollable.

### X6. Filters
Bookings has 7 filters plus search, which stack into a column about **820px tall** on a phone. Staff and Audit have smaller versions of the same thing.
- **Recommendation (phones):**
  - Show **search plus one "Filters (n)" button**, where *n* counts the active non-default filters.
  - The button opens a bottom sheet holding the date range, status, service, language and sort fields, with "Apply" and "Reset".
  - Add **quick chips** for the commonest view: "Pending", "Today", "This week".
  - Desktop keeps the inline filter grid.

### X7. Cookie banner and fixed overlays
The public cookie banner (X1) is the only fixed element over the admin panel today. It also sits on top of modals; the New Booking screenshot shows it covering the form. Hiding it on `/admin` (X1) fixes this.

### X8. Confirmation for consequential actions
Changing a booking's status is a bare `<select>` that saves immediately. **Choosing "Cancelled" by mistake cancels the job and texts the owner** (`onBookingCancelled`), and on a phone a mis-tap in a native picker is easy. Gallery already confirms before deleting.
- **Recommendation, at all sizes, behaviour only:** confirm before **Cancel** and **Confirm**. Confirming creates the job.

### X9. Small text
- **Dispatch:** the service chip and status label are **10px**, and the earnings meter is **11px**.
- **Staff:** "Invite sent" is **12px**.

This breaks the 16px rule in `CLAUDE.md` (P3 Margaret). **Recommendation:** at least 14px for chips and meta on phones, and at least 16px for anything read.

---

## Page-by-page review

### 1. Bookings Management (primary daily screen)
**Current on a phone (390px):**
- **Above the list:**
  - header (290px);
  - tabs;
  - "New Booking" button, right-aligned;
  - 3 stat cards stacked (about 400px);
  - 7 filters plus search stacked (about 820px).
- **The table:**
  - the first row starts about **1,860px** down the page;
  - only "Client Details" and "Preferred Date" are visible, and the date wraps to two lines (`2026-` / `10-25`);
  - **Status, Assigned Cleaner and Job are off-screen.**
- **Expanded row:**
  - Tapping a row expands the detail panel *inside* the 818px-wide table, so the panel is 818px wide.
  - Its Status and Assign-Cleaner selects run past the right edge.
  - The panel has `colSpan={5}`, but the table has 6 columns.
  - Rows are rendered as `<tr className="contents">` wrapping a `<tr>`, which is invalid table markup. React warns about it, and screen readers may misread it.

**Recommended phone layout:**
1. **Sticky top:**
   - section switcher (X3);
   - search field;
   - "Filters (n)" button (X6);
   - quick chips: **Pending · Today · This week · All**.
2. **Stats as one compact row** of 3 tappable chips: "7 total · 2 pending · 3 confirmed". Tapping "2 pending" applies the filter, which turns the stats into shortcuts.
3. **Booking cards**, one per booking:
   - **Line 1:** client name and status chip (Pending yellow, Confirmed green, and so on).
   - **Line 2:** date written out ("Tue Oct 28") · service · FR/EN badge.
   - **Line 3:** assigned cleaner, or "Unassigned" in muted italic, plus a "Job ✓" chip.
   - The whole card is a 48px+ target and opens the booking sheet.
4. **Booking detail as a full-screen sheet** (X5), replacing the inline expansion on phones:
   - **Header:** name, status chip and ✕.
   - **Action row first:**
     - **Call** (`tel:`);
     - **Text** (`sms:`);
     - **Email** (`mailto:`; today email isn't a link and isn't in the panel at all);
     - **Map** (opens the address in Maps).

     These are what an admin needs when following up a quote within 24 hours.
   - **Sections:** Client · Property · Schedule & status · Add-ons · Notes · Meta, in that order, one column.
   - **Sticky footer:** "Update status" and "Assign cleaner". Each opens a picker, and Cancel/Confirm ask first (X8).
5. **"New Booking"** becomes a floating action button (bottom right, 56px) or a full-width button above the list, and opens the full-screen form (X5).
6. **Load more** stays as is: a full-width 48px button.

**Desktop:** unchanged. The table, inline expansion and filter grid stay at `md`+. The `colSpan` and nested-`<tr>` markup fixes are invisible on desktop.

### 2. Dispatch Board
**Current on a phone:**
- **Control bar:** Previous Day / date / Next Day / Close sit on one `flex` row that doesn't wrap. "Close" pushes the **page to 489px**, so the whole admin panel scrolls sideways.
- **Board:**
  - The unassigned sidebar is a fixed **280px** inside a `flex gap-6 overflow-hidden` row, leaving the staff columns **54px** (`54/812` measured). Each cleaner column is a fixed 260px, so you see a sliver of one cleaner.
  - The column body is a fixed `h-[500px]`. Its 8am–6pm time grid at 50px per hour stops at 6pm, so later jobs are clipped.
- **Drag-and-drop:** uses `@dnd-kit`'s default `PointerSensor` with no `touch-action: none` on the cards. On a touchscreen, a finger drag scrolls the page instead of picking up the card, so **jobs can't be assigned by drag on a phone or tablet**.
- **Text:** 10px service and status labels (X9).

**Recommended phone layout:** drag-and-drop across columns isn't a good fit at 390px. Use a **"tap to assign" day agenda** instead, sharing the same assignment and conflict logic (`assignCleanerTransaction`, `checkCleanerSchedulingConflicts`, `OverrideModal`).
1. **Date bar:**
   - `‹` / date / `›` as one 48px row;
   - "Today" button;
   - swipe left or right to change day.
2. **"Unassigned (2)" section first,** as cards with time · client · address · service.
   - Each card has an **"Assign"** button that opens a sheet listing cleaners.
   - Each cleaner shows hours this week, the earnings meter (P7 Carla) and a conflict warning (P8 travel buffer, P9 blocked window) before you pick.
   - Picking someone with a conflict opens the existing Override reason step.
3. **Then one collapsible section per cleaner:**
   - Header: "Carla Martin · 2.0 h · $640/$1000"; the earnings meter is kept, at 14px+.
   - Their jobs for the day as time-ordered cards.
   - Each card has "Reassign" and "Unassign" actions.
4. **Conflict ⚠️:** shown as a text chip ("Travel buffer"), not only as an emoji with a `title` tooltip. Tooltips don't exist on touch.

**Tablet (768–1023):** keep the visual board, but:
- add `TouchSensor` (with a ~200ms press delay) and `touch-action: none` on the cards, so drag works by touch;
- let the control bar wrap.

**Desktop:** unchanged. The touch sensor and wrapping control bar have no visible effect at desktop width.

### 3. Analytics & Metrics
**Marketing & Sales** (from code; the callable wasn't emulated):
- KPI cards stack in one column.
- The Recharts charts use `ResponsiveContainer`, so they scale. Check that pie labels and legends don't collide at 340px; prefer legends below the chart on phones.
- **Bug:** every error is titled "Access Denied" (`admin.login.errorTitle`), even a network error. It should say "Couldn't load analytics" with a Retry button.

**Operations & Fulfillment:**
- 6 KPI cards stack into about 1,000px.
- The donut is fine.
- The **staff utilization table** is 446px wide and cuts off "Completion rate".
- **Bug:** "Avg Job Duration" shows **`0.0 0 hrs`**. The number is formatted, then `admin.operations.hours` (`{{val}} hrs`) adds it again.

**Recommended phone layout:**
- KPI cards in a **2-column grid** of compact tiles (label 14px, value `text-2xl`), so 6 KPIs fit in about 3 rows.
- Charts full width, with the legend below.
- Utilization as cards: "Carla Martin — 1 assigned · 0 completed · 0%".
- The sub-tabs (Marketing / Operations) already fit; make them a 2-segment control at full width.

**Desktop:** unchanged.

### 4. Staff Registry
**Current on a phone:**
- The table is 825px wide. **Role, Status, Transport and Actions (Resend invite, Edit) are off-screen.**
- "Invite sent" is 12px.
- 4 stat tiles stack.
- "Register New Staff" opens a long centred modal (X5): about 12 fields including transport mode and blocked windows, with Save at the end.

**Recommended phone layout:**
- Search, plus a "Filters" button (role and status) (X6).
- **Staff cards:**
  - name and role chip ("Lead Cleaner");
  - status chip ("Onboarding" amber / "Active" green);
  - email and phone as tap-to-call or tap-to-email;
  - transport icon;
  - one primary action, which depends on status: **"Resend invite"** for onboarding, **"Edit"** for active.
- Register / Edit as a **full-screen form** with a sticky Save (X5). Group the fields into collapsible sections: Identity · Role & status · Scheduling constraints.

**Desktop:** unchanged.

### 5. Checklist Templates (works today)
- Cards stack cleanly.
- Edit / Deactivate are 48px.
- The new-template form fits in one column with Cancel / Create at the end.

**Small improvements:**
- In the task editor, the drag handle is **40×40** (`min-h-[40px] min-w-[40px]`), under the 44–48px target. Make it 48×48 on phones, or add ↑/↓ buttons as a touch alternative.
- Make Cancel / Create a sticky footer when the task list is long.
- Ask before "Deactivate".

**Desktop:** unchanged.

### 6. Pay Rates
**Current on a phone:**
- The 3 active-rate tiles stack.
- The history table is 607px wide and cuts off **Status** and **Created by**.
- The date/time wraps over 4 lines ("2026-" / "08-04," / "6:22:32" / "p.m.").
- "Configure New Rate" opens an inline form that fits.

**Recommended phone layout:**
- Active rates as 3 compact tiles: role · **$22.00/hr** · since Aug 4, 2026.
- History as a timeline list: "Cleaner $20.00 → $22.00 · Aug 4, 2026 · lauren@…", with a "Historical" chip.
- Short date format: date only, with the time on demand.
- This screen is mainly read on phones; keep the form as is.

**Desktop:** unchanged.

### 7. Audit Logs
**Current on a phone:**
- The table is 855px wide. Only Date/Time and Administrator are visible.
- **Action / Details / Reason**, the point of the log, are off-screen.
- Rows are about 220px tall because the hidden columns wrap.
- The filter bar stacks; the Export button works.

**Recommended phone layout:**
- **Entry cards:**
  - **Line 1:** override type chip ("Travel buffer" / "Earnings cap") and relative date ("2 h ago").
  - **Line 2:** what changed ("jobs/job3 · assignedTo: — → Carla Martin").
  - **Line 3:** the **reason** in full. It's the field an owner reviews.
  - **Line 4:** admin email, muted.
- Filters in a sheet (X6).
- Export as a full-width button. The Export modal becomes a full-screen sheet (X5).

**Desktop:** unchanged.

### 8. Reviews Moderation
**Current on a phone:**
- The table is 878px wide. You see name, location and language.
- **Rating, review text, date and the Approve / Reject buttons are off-screen.**
- Approve / Reject are **42px** tall, the only admin buttons under 44px.

**Recommended phone layout:** this is the best candidate for a quick phone task. Use **review cards**:
- name · location · FR/EN badge · ★ rating;
- the **full review text**;
- date;
- two **full-width 48px buttons side by side: Reject (outline) / Approve (filled)**;
- after acting, the card collapses with an "Undo" option for a few seconds.

**Desktop:** unchanged, apart from the 42px → 48px button height. That changes the row height by 6px; the screen looks the same otherwise. Skip it if desktop must be pixel-identical.

### 9. Gallery (works today)
- The cards (before/after thumbnails, captions, chips) fit well.
- The Add-pair form is one column and phone-first. It was designed for this.

**Small improvements:**
- **Action wrapping:** 6 actions wrap across 4 rows (Unpublish · Remove from home page · Move up · Move down · Edit · Delete). Show **Edit** and **Publish/Unpublish** as primary buttons and the rest under a "⋯ More" menu, so Delete isn't next to Move down.
- **Delete confirmation:** already confirms.
- **Sticky Save:** make Save pair / Cancel a sticky footer, since the form is about 900px tall with photo previews.

**Desktop:** unchanged.

### 10. Login, Access Denied, loading
- Already a centred `max-w-md` card, and fine on phones.
- **Signing in uses a Google popup** (`signInWithPopup`). In iOS home-screen web-app mode, and some in-app browsers, popups are blocked. Consider `signInWithRedirect` on mobile. That's behaviour, not layout; desktop keeps the popup.

---

## Bugs found during the review (not layout)
| # | Bug | Where |
|---|---|---|
| B1 | Lead source shows the raw key **`Admin.Leads.Organic`**. `admin.leads.*` doesn't exist in `en.json` or `fr.json`. | `BookingDetailPanel.tsx` |
| B2 | "Avg Job Duration" renders `0.0 0 hrs`. The value is formatted twice. | `OperationsDashboard.tsx:59` |
| B3 | Every analytics error is titled "Access Denied". | `AnalyticsDashboard.tsx:80` |
| B4 | The booking detail row uses `colSpan={5}` in a 6-column table, and the row markup is a nested `<tr className="contents"><tr>`. | `BookingsTable.tsx`, `BookingDetailPanel.tsx` |
| B5 | Dialogs don't close on Escape or trap focus. `OverrideModal` can't scroll. | all admin modals |
| B6 | Dispatch drag-and-drop doesn't work by touch (no touch sensor, no `touch-action: none`). | `DispatchBoard.tsx` |
| B7 | A booking status change, including Cancel, saves on select with no confirmation. | `BookingDetailPanel.tsx` |
| B8 | The active tab isn't in the URL. Refresh and back always return to Bookings. | `AdminPage.tsx` |

---

## How to keep desktop exactly as it is
- **Breakpoint:** phone rules apply below Tailwind's `md` (768px). Tablet and desktop keep today's layout, apart from the Dispatch touch-drag fix.
- **Classes:**
  - Phone-only adjustments use the `max-md:` variant (Tailwind v3.4 supports it). Example: `max-md:text-3xl` on the H1 leaves `text-5xl` untouched at `md`+.
  - Alternative views use `md:hidden` (cards) and `hidden md:block` (tables), side by side and fed by the same data. No table markup changes.
- **Components:**
  - New phone-only pieces are separate small components: `BookingCard`, `BookingSheet`, `FilterSheet`, `MobileSectionNav`, `DispatchAgenda`, `ReviewCard`, `StaffCard`, `AuditCard`, `RateHistoryList`.
  - Existing desktop components are left as they are, apart from the bug fixes (B1–B8), which have no visible effect on desktop.
  - **All new strings go through `t()` in EN and FR.**
- **Regression guard:**
  - Add Playwright visual snapshots of each tab at 1280px **before** changing anything, and fail on diff.
  - Add 390px snapshots for the new phone views.
  - This setup can rerun the emulator harness used for this review.

## Suggested phasing (for a Phase A plan)
1. **Shell and quick wins (S):**
   - X1 (hide footer, cookie banner and install prompt on `/admin` for phones);
   - X2 (compact header);
   - X3 (section switcher and `?tab=` in the URL);
   - B1–B5 and B7.

   These give the biggest improvement for the least code.
2. **Bookings on phones (M):** cards, quick chips, filter sheet, full-screen booking sheet with Call / Text / Email / Map, and a full-screen New Booking form with sticky Save.
3. **Dispatch on phones (M):**
   - Tap-to-assign day agenda with conflict and override reuse.
   - Touch sensor for tablet (B6).
4. **Reviews, Staff, Audit, Pay Rates cards (M):** the same card pattern, done four times.
5. **Analytics and polish (S):**
   - 2-column KPI tiles;
   - utilization cards;
   - sticky footers on Templates and Gallery;
   - Gallery "More" menu;
   - Template drag handle at 48px.

**Persona tests to write into the epic (Rule 2):**
- **P12 Lauren on a 390px phone:**
  - from the admin landing screen, find a pending quote request, call the client and confirm the booking in **≤ 4 taps** without horizontal scrolling;
  - assign an unassigned job to a cleaner on today's Dispatch, including an override reason, with **no drag**.
- **Margaret's rules for the admin UI:**
  - every phone control at least 48px;
  - no text under 14px (16px for body);
  - no horizontal page scroll on any tab at 360px.
- **Desktop:** the 1280px snapshots are identical before and after.
