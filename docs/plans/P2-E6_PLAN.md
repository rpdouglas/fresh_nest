# Phase A Plan: P2-E6 Admin Pagination & Server-Side Analytics

This plan outlines three strategies for establishing admin pagination, date-range filtering, and cached server-side analytics.

---

## Strategy 1: TanStack Infinite Query Pagination, `estimatedPrice` Firestore Writes, and Range-Specific Cloud Function Caching (Recommended)

This strategy refactors the admin bookings list to fetch data in pages of 50 using `useInfiniteQuery` and `getDocs` (one-time fetch), and implements date-range controls in the UI. It also updates the booking creation flow to write `estimatedPrice` directly into documents, allowing the server-side Cloud Function `getAnalyticsKPIs` to use Firestore's native `count()` and `sum()` aggregation queries. The Cloud Function will cache analytics results in the `reports` collection by time range with a 1-hour TTL. Finally, it limits the jobs collection query in the operations dashboard by date.

### Files Changed

- **[apps/customer/src/types/index.ts](file:///workspaces/fresh_nest/apps/customer/src/types/index.ts)**:
  - Add `estimatedPrice?: number` to the `Booking` interface.
- **[apps/customer/src/i18n/locales/en.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/en.json)** and **[apps/customer/src/i18n/locales/fr.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/fr.json)**:
  - Add translation keys for new pagination elements: "Start Date", "End Date", "Load More", "Loading..." and status indicators.
- **[apps/customer/src/lib/firebase/firestore.ts](file:///workspaces/fresh_nest/apps/customer/src/lib/firebase/firestore.ts)**:
  - Update `submitBooking` to calculate the estimated price (using the `calculateQuote` helper) and store it in `estimatedPrice: number` field at creation time.
  - Delete the unused, unbounded `subscribeToBookings` function to keep the codebase clean.
- **[docs/firestore-schema.md](file:///workspaces/fresh_nest/docs/firestore-schema.md)**:
  - Document the new `estimatedPrice` field under the `bookings` collection.
  - Document the schema and structure of the new `reports` collection.
- **[apps/customer/src/components/admin/hooks/useBookings.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useBookings.ts)**:
  - Refactor to use `useInfiniteQuery` from `@tanstack/react-query` instead of `useCollectionQuery`.
  - Accept `startDate` and `endDate` parameters (defaulting to the last 90 days).
  - Construct a paginated Firestore query using `limit(50)`, date range constraints on `preferredDate` or `createdAt`, and `startAfter` cursor.
  - Return `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage` to support a "Load More" button.
  - Ensure status/assignment update mutations invalidate the `['bookings']` query key to refresh list.
- **[apps/customer/src/components/admin/BookingsTable.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingsTable.tsx)**:
  - Add two date inputs (`Start Date`, `End Date`) to the filters panel, defaulting to the last 90 days.
  - Connect date selections to `useBookings` query parameters.
  - Render a "Load More" button at the bottom of the table when `hasNextPage` is true.
  - Include a spinner for loading states and `isFetchingNextPage`.
- **[apps/customer/src/components/admin/hooks/useOperationsDashboard.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useOperationsDashboard.ts)**:
  - Refactor `jobsQuery` to fetch jobs within a date-range parameter matching the active dashboard filter rather than reading the entire collection.
- **[functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)**:
  - Write Cloud Function `getAnalyticsKPIs` as an HTTPS callable (`onCall`).
  - The function accepts a `timeRange` parameter (`'all' | '30days' | '90days' | 'ytd' | 'month'`).
  - Reads `reports/${timeRange}` cache document to check if cached data exists and is under 1 hour old (`expiresAt > Timestamp.now()`).
  - If a cache hit occurs, returns the cached payload immediately.
  - If a cache miss occurs, runs Firestore aggregation queries (`count()`, `sum('estimatedPrice')`) filtered by the requested range.
  - Dynamic fallback: Runs an in-memory estimate calculation for any historical documents lacking the `estimatedPrice` field to guarantee accurate revenue reporting.
  - Saves the computed analytics payload to `reports/${timeRange}` with `computedAt: Timestamp.now()` and `expiresAt: Timestamp.now() + 1 hour`.
- **[apps/customer/src/components/admin/hooks/useAdminAnalytics.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useAdminAnalytics.ts)**:
  - Refactor to use `@tanstack/react-query`'s `useQuery` calling `getAnalyticsKPIs` Cloud Function via `httpsCallable`.
  - Pass the active `analyticsTimeRange` to the Cloud Function.
- **[apps/customer/src/components/admin/AnalyticsDashboard.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/AnalyticsDashboard.tsx)**:
  - Adapt charts to consume the server-side calculated KPIs payload.
  - Display loading skeleton when fetching server-side analytics.

### Persona Impact
- **Admin Operations (Lauren)**: High impact. Lauren experiences instant dashboard loads, because she is no longer downloading the entire history of bookings and jobs. Date filtering allows her to zoom in on specific operational weeks.
- **Business Operations (Sarah - P12)**: High impact. Dramatically reduces Firebase document reads (and costs) as database volume grows. The 1-hour cached function means navigating around the admin panel causes zero duplicate queries.

### Risks & Mitigations
- *Risk*: Aggregation query fails or is inaccurate if a field doesn't exist on older documents.
  - *Mitigation*: Firestore's native `sum()` aggregation ignores documents missing the field. The Cloud Function will run a fallback in-memory estimate calculation for any historical documents lacking the `estimatedPrice` field to guarantee accurate revenue reporting.
- *Risk*: Query performance on date ranges.
  - *Mitigation*: Ensure Firestore indexes are configured if we order by `createdAt` while filtering by date fields. (If needed, configure them in `firestore.indexes.json`).
- *Risk*: Empty or incomplete pages if filtering is applied on paginated data.
  - *Mitigation*: The UI filters (status, service, language) will operate client-side on the loaded date-range subset. The default 90-day window ensures a reasonable amount of data is present, and a "Load More" indicator will encourage loading further records.

### Schema Audit
- **Collections modified:**
  - `bookings`: Added `estimatedPrice` (`number`, optional).
  - `reports` (New collection): Added documents for caching KPIs with keys matching time ranges (e.g., `reports/{timeRange}`). Cache structure: `{ computedAt: Timestamp, expiresAt: Timestamp, data: AnalyticsPayload }`.
- **firestore.rules changes:**
  - Allow read-only access to `reports` collection for authenticated admins, deny writes (since backend writes with admin privilege).
  - Validate `estimatedPrice` type on bookings creation (ensure it is a number if present).
- **firestore.indexes.json changes:**
  - None required for basic date range queries when ordered by the same field, but if compound queries (e.g. status + date range) are implemented, we will define them here.

---

## Strategy 2: Page-Based Offset Pagination and In-Memory Cloud Function Aggregations (No Schema Changes)

This strategy refactors the bookings panel to use page-by-page index pagination (e.g. Page 1, Page 2, Page 3 buttons) instead of infinite scroll. Instead of writing `estimatedPrice` to the database, the Cloud Function fetches all bookings for the requested time range and calculates the estimated prices in-memory before caching.

### Files Changed
- **[apps/customer/src/components/admin/hooks/useBookings.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useBookings.ts)**: Implement page-based query using `limit(50)` and track offsets manually.
- **[apps/customer/src/components/admin/BookingsTable.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/admin/BookingsTable.tsx)**: Render pagination controls (Prev, Next, Page numbers).
- **[apps/customer/src/components/admin/hooks/useOperationsDashboard.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useOperationsDashboard.ts)**: Refactor `jobsQuery` to fetch jobs within a date-range parameter matching the active dashboard filter.
- **[functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)**: Cloud Function `getAnalyticsKPIs` fetches the raw bookings matching the range, calculates quote ranges in Node.js using BASE_PRICES/SERVICE_MULTIPLIER hardcoded objects, and caches the result.

### Persona Impact
- **Business Operations (Sarah - P12)**: Reduces database reads for the bookings list, but the Cloud Function still reads many booking documents to calculate in-memory quotes, which increases functions execution costs.
- **Admin Operations (Lauren)**: Page-based navigation is slightly higher friction than infinite scrolling / "Load More".

### Risks & Mitigations
- *Risk*: Pricing logic diverges between client and server.
  - *Mitigation*: We must maintain duplicate copies of the pricing matrices (`BASE_PRICES`, multipliers, etc.) in both the frontend utility and the backend Cloud Function.

### Schema Audit
- **Schema changes:** None.
- **firestore.rules changes:** None.
- **firestore.indexes.json changes:** None.

---

## Strategy 3: Dynamic Client-Side Filtering with 90-day Subscriptions (Minimal Code Changes)

This strategy retains the existing `useCollectionQuery` subscriptions in the frontend but wraps them in a strict 90-day time limit query. No Cloud Function or `reports` collection caching is used.

### Files Changed
- **[apps/customer/src/components/admin/hooks/useBookings.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useBookings.ts)**: Limit the query to `where('createdAt', '>=', 90_days_ago)`.
- **[apps/customer/src/components/admin/hooks/useOperationsDashboard.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useOperationsDashboard.ts)**: Limit the `jobsQuery` to `where('createdAt', '>=', 90_days_ago)`.
- **[apps/customer/src/components/admin/hooks/useAdminAnalytics.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useAdminAnalytics.ts)**: Restrict calculations to the loaded 90-day window.

### Persona Impact
- **Admin Operations (Lauren)**: Very poor. Lauren can no longer view or search bookings older than 90 days without changing code. Historical analytics are lost.
- **Business Operations**: Saves reads by capping history, but cuts off business insights.

### Risks & Mitigations
- *Risk*: Truncating historical operations visibility creates friction for customer inquiries and makes yearly/historical business performance tracking impossible.
  - *Mitigation*: None. This is a fundamental trade-off of this strategy.

### Schema Audit
- **Schema changes:** None.
- **firestore.rules changes:** None.
- **firestore.indexes.json changes:** None.

---

## Recommended Strategy

We recommend **Strategy 1**. It achieves the best scalability by moving calculations to the server, utilizing native Firestore aggregation queries, caching queries for 1 hour, and implementing standard infinite scroll pagination.
