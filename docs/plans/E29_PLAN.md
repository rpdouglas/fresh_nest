# Epic 29: Booking Dashboard
**Goal:** Implement a real-time, fully filterable, and sortable bookings management dashboard in the `/admin` portal. Enable the admin to update booking status and assign cleaners using collapsible row details.

**Primary Persona(s) Served:**
- **Lauren S. (Owner/Admin):** Needs to quickly see all booking details, filter out completed/cancelled jobs, assign staff members (Lauren S., Sarah M., or others), and change booking statuses in real time.
- **P6 Gallagher (Airbnb):** Benefits when Lauren has immediate access to Airbnb-specific photo confirmation requirements and clean status monitoring.
- **P1 Diane Lafleur:** Benefits when Lauren can easily check Diane's assigned cleaner to ensure consistency across recurring bookings.

---

## Strategy 1: Collapsible Rows with Inline Controls & Real-Time Sync (Recommended)
**Description:** Implement real-time synchronization with Firestore using `onSnapshot`. Build a clean, responsive table listing all bookings, filterable by Status, Service Type, and Language, and sortable by Preferred Date or Created Date. Clicking a booking row expands it to reveal inline dropdown controls for status and cleaner assignment, as well as property stats (bedrooms, bathrooms, sqft, address, pets, add-ons, notes, and lead source).

**Cleaner Assignment Selection:**
- A dropdown populated with `Lauren S.` and `Sarah M.`
- Option for `Custom / Other...` which displays an inline text field to write a custom name.
- Option for `Unassigned`.

**Files Changed:**
1. `src/lib/firestore.ts`: Export functions:
   - `subscribeToBookings(callback)`: Real-time listener.
   - `updateBookingStatus(id, status)`: Sets status.
   - `updateBookingAssignment(id, cleanerName)`: Sets assigned cleaner.
2. `src/pages/AdminPage.tsx`: Expand the authenticated dashboard placeholder into the full Bookings Dashboard layout (filter bar, sorting controls, stats cards, and collapsible bookings table).
3. `src/i18n/locales/en.json` & `src/i18n/locales/fr.json`: Localize all status types, service types, table headers, add-on labels, and placeholder texts.

**Persona Impact:**
- Zero lag: updates automatically.
- Accessible (min 48px targets on status/cleaner selectors, clear focus borders for P3 Margaret).

**Risks:**
- High read count if there are thousands of bookings (solved by adding query limits and pagination if necessary, though typical local volume is low).

**Schema Audit:**
- Updates `status` and `assignedTo` fields in the `bookings` collection. These are existing fields in `docs/firestore-schema.md` and are fully supported.

---

## Strategy 2: Standard Fetching with Modal Overlay Editor
**Description:** Load bookings on-demand via `getDocs` (pull-to-refresh). Clicking a row opens a full-screen Modal dialog containing the edit form and a "Save" button to write changes.
**Files Changed:** `src/lib/firestore.ts`, `src/pages/AdminPage.tsx`.
**Risks:**
- Slower workflow: modals require more clicks to open, edit, save, and close.
- No real-time updates.

---

## Strategy 3: Status Tabbed Navigation Panels
**Description:** Instead of advanced filters, split the dashboard into separate tabs/screens for "Pending", "Confirmed", "Completed", and "Cancelled" bookings.
**Files Changed:** `src/pages/AdminPage.tsx`.
**Risks:**
- Hard to search or sort all bookings holistically.
- Repetitive table code across multiple tab components.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as decided in our `/grill-me` session. We will:
1. Define the Firestore real-time snapshot listener and update helpers in `src/lib/firestore.ts`.
2. Construct the filtering, sorting, and collapsible row UI inside `src/pages/AdminPage.tsx`.
3. Add locale translations.

**Awaiting your explicit human approval to execute Strategy 1!**
