# Epic 30: Lead Source Dashboard
**Goal:** Implement a marketing analytics dashboard in the protected `/admin` portal showing a breakdown of booking volumes and estimated revenues by marketing channel, along with monthly trend charts.

**Primary Persona(s) Served:**
- **Owner Lauren S.:** Needs clear visibility into marketing lead sources (`organic`, `google`, `referral`, `facebook`, `direct`) and dynamic monthly trends to optimize marketing spends and evaluate channel ROI.

---

## Strategy 1: Tabbed Admin Layout with Dynamic Recharts Dashboard (Recommended)
**Description:** Implement a tab navigation inside the existing `/admin` portal to toggle between "Bookings" and "Marketing Analytics" (preserving the single protected route). When the analytics tab is active:
1. Show summary stats for each channel (total bookings and estimated revenue).
2. Render a Recharts `PieChart` / Donut chart showing lead source distribution.
3. Render a Recharts `BarChart` / `AreaChart` displaying monthly booking volume and estimated revenue trends.
4. Calculate estimated revenue dynamically using the booking specification mapping from `src/lib/quotePricing.ts` (bedrooms, bathrooms, frequency, and add-ons).
5. Implement time range filters: *All Time*, *Last 30 Days*, *Last 90 Days*, *Year to Date (YTD)*, and *This Month*.

**Files Changed:**
1. `src/pages/AdminPage.tsx`: Add tab navigation state, data aggregation hooks, time range filters, and Recharts components.
2. `src/i18n/locales/en.json` & `src/i18n/locales/fr.json`: Localize chart titles, legends, time ranges, and dashboard labels.

**Persona Impact:**
- Lauren S. gets a unified dashboard showing operations and marketing ROI on a single page with responsive, animated charts that align with brand typography and spacing tokens.

**Risks:**
- Installing `recharts` package under React 19 can sometimes trigger peer dependency warnings. Resolved by installing with `--legacy-peer-deps` or validating versions.
- Client-side computation of estimated revenue for large historical datasets. (Minor risk, as current local volume is low and calculations are simple O(N) loops).

**Schema Audit:**
- Read-only access to the `bookings` collection. Uses the existing `leadSource` field (restricted to values in `docs/firestore-schema.md`) and specs. Zero schema modifications.

---

## Strategy 2: Dedicated Routed Analytics Page
**Description:** Define a separate route `/admin/analytics` in the Router, guarded by Google Auth. Create a new page component specifically for marketing analytics and code-split the Recharts package using `React.lazy()` so that non-admin clients do not download the charting library bundle.
**Files Changed:**
1. `src/App.tsx`: Define the new route `/admin/analytics` and lazy loading.
2. `src/pages/AdminAnalyticsPage.tsx` (New): Recharts analytics dashboard.
3. `src/components/layout/Navbar.tsx` / `src/pages/AdminPage.tsx`: Add links to navigate between pages.

**Risks:**
- Modifying routing configuration increases security footprint.
- Navigation between tabs feels like a full page transition rather than a smooth in-memory toggle.

---

## Strategy 3: Lightweight SVG/CSS Charts (Dependency-Free)
**Description:** Avoid npm charting packages entirely. Build a custom CSS/SVG-based pie donut chart and visual bar chart using simple SVG rects and circles, animated with Framer Motion.
**Files Changed:**
1. `src/pages/AdminPage.tsx`
**Risks:**
- High complexity in designing legible axis ticks, grid lines, and hover tooltips for trend lines from scratch in pure SVG, potentially leading to poorer layout consistency and design-system mismatches.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as it maintains a single secure admin route, uses a standard, robust chart rendering system (`recharts`), and provides the most unified and premium admin experience.

To proceed:
1. Install `recharts` library (handling React 19 installation options).
2. Refactor `src/pages/AdminPage.tsx` to add tab toggles, date filtering, and aggregated charting metrics.
3. Define locale labels.
