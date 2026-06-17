# Phase A Plan: P2-E9 FSM Dispatch Board & Scheduling Intelligence

This plan outlines three strategies for replacing the text-based dropdown cleaner assignment model with a visual drag-and-drop dispatch board that checks cleaner availability, flags conflicts, and tracks monthly earnings limits.

---

## Strategy 1: Shared Scheduling Utility Refactoring & Dedicated Drag-and-Drop Tab (Recommended)

This strategy refactors the existing scheduling constraint checks from [BookingDetailPanel.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingDetailPanel.tsx) into a shared utility, builds a dedicated "Dispatch" tab in [AdminPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AdminPage.tsx) using `@dnd-kit` with a daily hourly grid, and intercepts drop events to trigger the existing `OverrideModal`.

### Visual Layout Design
- **Date Navigation Header**: A date picker with "Previous Day" and "Next Day" buttons.
- **Unassigned Jobs Panel**: A docked, collapsible sidebar on the left.
- **Staff Grid**: Columns for each active staff member (role: `'cleaner'` or `'lead'`). Rows represent hourly time slots (8:00 AM to 6:00 PM).
- **Safe to Earn Indicator**: Mini progress bars in column headers showing weekly hours and color-coded monthly earnings (green/amber/red).
- **Job Cards**: Drag-and-drop cards positioned in the staff columns spanning the matching hours of their scheduled time. Conflict warnings are displayed on cards.

### Files Changed

1. **New File: `apps/customer/src/lib/utils/scheduling.ts`**:
   - Extract scheduling utility functions: `timeToMinutes`, `extractPostalPrefix`, `hasTravelConflict`, and a new `checkCleanerSchedulingConflicts` helper that performs earnings cap checks, travel buffer checks, and blocked window checks.

2. **[apps/customer/src/components/admin/BookingDetailPanel.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingDetailPanel.tsx)**:
   - Import and use the shared scheduling utilities from `scheduling.ts` instead of local duplicates.

3. **New File: `apps/customer/src/components/admin/DispatchBoard.tsx`**:
   - Build the visual dispatch board.
   - Use `@dnd-kit/core` with `DndContext`, `useDraggable` for job cards, and `useDroppable` for staff columns.
   - Calculate job grid positioning based on `scheduledStartTime` and `scheduledEndTime`.
   - Render unassigned jobs sidebar and active staff columns.
   - Display cleaner monthly earnings cap indicator and weekly hours in column headers.
   - Implement drop handler: run `checkCleanerSchedulingConflicts`. If conflicts exist, trigger `OverrideModal`. If accepted, execute `assignCleanerTransaction`. If cancelled, reset card position.

4. **[apps/customer/src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AdminPage.tsx)**:
   - Register the new `'dispatch'` tab in the tab bar and load the `<DispatchBoard />` component.

5. **`apps/customer/src/i18n/en.json` & `fr.json`**:
   - Add localized labels for the dispatch board tab, hourly slots, column headers, and warnings.

### Persona Impact
- **P7 Carla (Earnings Cap)**: High impact. A clear "Safe to Earn" visual meter in her column header and pre-assignment checks prevent clawback hazards.
- **P8 Jasmine (Transit Commuter)**: High impact. Geographic buffer conflicts are flagged before assignments are saved.
- **P9 Mike (Recovery Commitment)**: High impact. Silently prevents assignments that overlap with blocked windows.
- **P12 Sarah (Owner / Compliance)**: High impact. Reuses the audit-logged override transaction to ensure every rule violation has a documented reason.

### Risks & Mitigations
- *Risk*: `@dnd-kit` rendering issues on narrow viewports or horizontal scrolling.
  - *Mitigation*: Ensure the staff grid uses a standard overflow-x container while keeping the left unassigned sidebar docked, allowing horizontal scrolling without breaking drag coordinates.

### Schema Audit
- **Schema changes:** None. We reuse existing `bookings`, `jobs`, and `staff` fields.
- **firestore.rules changes:** None required (access control already secured in P2-E8).
- **firestore.indexes.json changes:** None.

---

## Strategy 2: List-Based Visual Dispatch Board (No Drag-and-Drop)

This strategy implements the same daily column layout and hourly grid, but uses standard dropdown menus on the job cards instead of drag-and-drop interactions to minimize implementation complexity and CSS layout risks.

### Files Changed

1. **New File: `apps/customer/src/lib/utils/scheduling.ts`**:
   - Extract scheduling constraints as in Strategy 1.
2. **[apps/customer/src/components/admin/DispatchBoard.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/DispatchBoard.tsx)**:
   - Render the daily schedule grid.
   - Job cards display a standard `<select>` element to choose a cleaner. Changing the cleaner triggers the conflict check and override flow.
3. **[apps/customer/src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AdminPage.tsx)**:
   - Add the dispatch board tab.

### Persona Impact
- Reuses the same rules and audit logs for Sarah and cleaners.
- Admins lose the convenience of physical drag-and-drop, causing slightly more clicks.

### Risks & Mitigations
- *Risk*: Admin operations feel less modern and slower compared to full drag-and-drop dispatch boards.
  - *Mitigation*: None. This is a fallback strategy if drag-and-drop performance is unacceptable.

### Schema Audit
- **Schema changes:** None.

---

## Strategy 3: Inline Timelines inside Bookings Table (No Hourly Grid Rows)

This strategy bypasses the hourly row grid entirely and renders a simple visual timeline (Gantt-style) block inside the existing `BookingsTable` or as a expandable row details block, listing cleaner names and horizontal blocks of scheduled time.

### Files Changed
- **[apps/customer/src/components/admin/BookingsTable.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingsTable.tsx)**:
  - Embed inline timeline rows showing other jobs scheduled for the assigned cleaner on the same day.
- **[apps/customer/src/components/admin/BookingDetailPanel.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingDetailPanel.tsx)**:
  - Add inline warning displays and timeline visualization.

### Persona Impact
- Lowers visual hierarchy and clarity for admin scheduling since there is no centralized, bird's-eye view of all cleaners on a single screen.

### Schema Audit
- **Schema changes:** None.

---

## Recommended Strategy

We recommend **Strategy 1**. It fully satisfies the requirements of P2-E9 by providing a visual drag-and-drop board using `@dnd-kit` with columns for staff and an hourly schedule grid. Refactoring scheduling conflicts into a shared utility file keeps the codebase DRY, while reusing `assignCleanerTransaction` and `OverrideModal` preserves compliance data integrity.
