# P3-E2: Route Code Splitting — Phase A Strategy Plan

**Epic:** P3-E2 · **Priority:** P1 · **Complexity:** M
**Prepared:** 2026-06-18
**Persona gate:** All — initial JS payload ≥ 40% reduction on mobile networks.

---

## Strategy 1 — React.lazy() on All Routes + PageLoader (Recommended)

**What:** Wrap every page-level component import in `App.tsx` with `React.lazy()`. Add a single `<Suspense>` boundary around `RouterProvider` with a brand-consistent `PageLoader` fallback.

**Files changed:**
- `apps/customer/src/App.tsx` — replace all eager `import Page from ...` with `const Page = React.lazy(() => import(...))`; wrap `RouterProvider` in `<Suspense fallback={<PageLoader />}>`
- `apps/customer/src/components/common/PageLoader.tsx` — new component: centered spinner using `slate-brand` border on `warm-white` background, `min-h-screen`
- `apps/customer/vite.config.ts` — add `rollup-plugin-visualizer` in devDependencies; generate `stats.html` on build
- `apps/customer/package.json` — add `rollup-plugin-visualizer` devDependency

**Persona impact:** Travis on mobile sees significantly faster first load (admin Recharts + DND Kit bundle deferred until admin route is hit). Margaret on lower-end device benefits from smaller initial parse.

**Risks:**
- Suspense boundary here is a prerequisite for P3-E23 (`useSuspenseQuery`) — must be implemented correctly so data-fetching suspense can be layered in later
- `ErrorBoundary` should wrap the `Suspense` to handle chunk load failures (network drops during lazy load)
- All existing Playwright E2E tests must pass — verify route transitions work after lazy wrapping

**Schema audit:** No Firestore changes. No `docs/firestore-schema.md` update required.

---

## Strategy 2 — Vite Manual Chunking Only (No React.lazy)

**What:** Use Vite's `rollupOptions.output.manualChunks` to group admin-only imports into a separate chunk. No `React.lazy()` — all routes still eager, but the admin chunk is not part of the initial entry bundle.

**Files changed:**
- `apps/customer/vite.config.ts` — add `manualChunks` grouping admin components, Recharts, DND Kit into `admin` vendor chunk

**Persona impact:** Reduces initial parse cost for non-admin users. Does not provide per-route loading states — no fallback UI between route transitions.

**Risks:** Vite's chunking applies at build time but the browser still requests admin chunks immediately on parse unless combined with dynamic imports. Without `React.lazy()`, the Suspense boundary needed for P3-E23 is not established. This is a half-measure.

**Schema audit:** None.

---

## Strategy 3 — Lazy-Load Admin Routes Only

**What:** Apply `React.lazy()` only to admin-facing page components (`AdminPage`, `FSMPage`), leaving public marketing pages as eager imports.

**Files changed:**
- `apps/customer/src/App.tsx` — `React.lazy()` on `AdminPage` and any FSM pages only
- `apps/customer/src/components/common/PageLoader.tsx` — same as Strategy 1

**Persona impact:** Removes the admin bundle (Recharts, DND Kit) from the public initial load — the highest-value split. Public pages load slightly faster. Admin pages continue to load quickly for authenticated users.

**Risks:** Less thorough than Strategy 1. Location pages, service pages, and blog pages remain in the main bundle. Does not achieve the 40% payload reduction target if those pages are large. Still establishes the Suspense boundary needed by P3-E23.

**Schema audit:** None.

---

## Recommended Strategy: **Strategy 1**

Full lazy-loading of all routes is the plan-specified approach, achieves the 40% reduction target by ejecting the admin bundle from public load, and establishes the Suspense infrastructure P3-E23 depends on. Strategy 3 is a valid fallback if the 40% target proves harder to hit after measurement.

**Awaiting human approval to proceed to Phase B.**
