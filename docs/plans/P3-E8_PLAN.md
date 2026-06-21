# P3-E8: `useBookings` Server-Side Filtering Fix — Phase A Strategy Plan

**Epic:** P3-E8 · **Priority:** P1 · **Complexity:** M
**Prepared:** 2026-06-21
**Persona gate:** P12 Lauren Arsenault — filtering by status returns results from ALL pages, not just page 1.

---

## Problem Statement

`useBookings` uses `useInfiniteQuery` with 50-doc pages, but applies `statusFilter`, `serviceFilter`, and `languageFilter` as client-side `useMemo` over the already-loaded page. Lauren can see "0 confirmed bookings" while 150+ exist on pages 2–4. This is a correctness bug that worsens as booking volume grows.

Additionally, the hook returns 37 values (UI toggle state mixed with data-fetching concerns), making it difficult to reason about what belongs where.

---

## Approved Strategy: Strategy 1 — Full Server-Side Push + 7 Composite Indexes + UI State Split ✅

**Approved:** 2026-06-21

### Decision locked in approval

| # | Question | Decision |
|---|---|---|
| 1 | Multi-filter index strategy | **Option A** — declare all 7 composite index combinations so any filter combination works correctly |

---

## Strategy 1 — Full Server-Side Push + UI State Split (Approved)

**What:** Add `statusFilter`, `serviceFilter`, `languageFilter` to the `queryKey`. Add conditional `where()` clauses in the `queryFn` for each non-`'all'` filter. Declare all 7 composite index combinations for the bookings collection. Move `expandedRowId`, `customCleanerNames`, `showCustomInput`, and `handleCustomCleanerSave` to `BookingsTable` local state.

### Files changed

| File | Change |
| :--- | :--- |
| `apps/customer/src/components/admin/hooks/useBookings.ts` | Add `statusFilter`, `serviceFilter`, `languageFilter` to `queryKey`; add conditional `where()` clauses in `queryFn`; remove `expandedRowId`, `setExpandedRowId`, `customCleanerNames`, `setCustomCleanerNames`, `showCustomInput`, `setShowCustomInput`, `handleCustomCleanerSave` from return |
| `apps/customer/src/components/admin/BookingsTable.tsx` | Lift `expandedRowId`, `customCleanerNames`, `showCustomInput`, and `handleCustomCleanerSave` into local `useState`; remove those props from the `useBookings` destructure |
| `firestore.indexes.json` | Add 7 composite indexes for all non-empty subsets of {status, serviceType, language} × preferredDate |

### The 7 required composite indexes

All with `orderBy preferredDate ASCENDING` (Firestore requires the orderBy field in composite indexes):

```
1. preferredDate + status
2. preferredDate + serviceType
3. preferredDate + language
4. preferredDate + status + serviceType
5. preferredDate + status + language
6. preferredDate + serviceType + language
7. preferredDate + status + serviceType + language
```

### `queryFn` pattern

```typescript
queryKey: ['bookings', startDate, endDate, statusFilter, serviceFilter, languageFilter],
queryFn: async ({ pageParam }) => {
  let q = query(
    collection(db, 'bookings'),
    where('preferredDate', '>=', startDate),
    where('preferredDate', '<=', endDate),
    orderBy('preferredDate', 'desc'),
    limit(50)
  )
  if (statusFilter !== 'all')   q = query(q, where('status', '==', statusFilter))
  if (serviceFilter !== 'all')  q = query(q, where('serviceType', '==', serviceFilter))
  if (languageFilter !== 'all') q = query(q, where('language', '==', languageFilter))
  if (pageParam)                q = query(q, startAfter(pageParam))
  return await getDocs(q)
}
```

### Sort stays client-side

`sortBy` and `sortOrder` are NOT added to the `queryKey`. Cursor-based pagination (`startAfter`) depends on the Firestore `orderBy` field (`preferredDate`). Changing `orderBy` dynamically would invalidate cursors. Client-side sort within the returned pages is acceptable for secondary sort preference.

### Free-text search stays client-side

`searchQuery` (name/email/phone/address) remains a client-side `useMemo` filter. This is correct behaviour — full-text search is not a Firestore capability. Document clearly in the hook as "searches within loaded pages only."

### UI state migration

Move these from `useBookings` return → `BookingsTable` local `useState`:
- `expandedRowId` / `setExpandedRowId`
- `customCleanerNames` / `setCustomCleanerNames`
- `showCustomInput` / `setShowCustomInput`
- `handleCustomCleanerSave` (depends on the above state)

`handleAdminCreate` and `isCreating` remain in `useBookings` — they are data mutations, not UI toggle state.

### Persona impact

- **P12 Lauren**: Filtering by `status: confirmed` returns ALL confirmed bookings across all pages — not just page 1. Any filter combination (e.g. confirmed + deep-clean) works correctly.
- **All**: No change to visible UI — filter dropdowns behave identically; correctness is the only change.

### Risks

- 7 new Firestore indexes must be deployed before the code ships — the new `where()` clauses will throw missing-index errors in production until indexes are built. Deploy indexes first, wait for build completion, then deploy the code.
- `BookingsTable` integration test must verify `handleCustomCleanerSave` works correctly after the state move.

### Schema audit

No new Firestore fields. `docs/firestore-schema.md` does not need updating (indexes are not schema). `firestore.indexes.json` changes require `firebase deploy --only firestore:indexes` before the app code ships.

---

## Strategy 2 — Status Filter Only (Rejected)

Push only `statusFilter` to the server; keep `serviceFilter` and `languageFilter` client-side. 1 index required. Rejected: partial correctness — Lauren selecting "confirmed + deep clean" still sees only page-1 results for the service filter.

---

## Strategy 3 — Cloud Callable Analytics Query (Rejected)

Route all filtered queries through `getAnalyticsKPIs` Cloud Function. Rejected: adds cold-start latency to a UI interaction, bypasses cursor-based pagination, and over-engineers a straightforward query fix.

---

## Proceeding to Phase B.
