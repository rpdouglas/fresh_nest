---
epic: P3-E18
title: Shared Types Package — Plan
strategy: 1
approved: 2026-06-18
---

# P3-E18 PLAN — Shared Types Package

## Strategy 1 (Approved): New type files in @freshnest/shared, re-export in apps

**Files changed:**
- `packages/shared/src/types/booking.ts` (new)
- `packages/shared/src/types/staff.ts` (new)
- `packages/shared/src/types/job.ts` (new)
- `packages/shared/src/types/common.ts` (new)
- `packages/shared/src/index.ts` (updated)
- `apps/customer/src/types/index.ts` (rewritten)
- `apps/fsm/src/types/index.ts` (rewritten)
- `apps/fsm/src/pages/JobPage.tsx` (labelKey→labelEn/labelFr)
- `apps/fsm/src/context/OfflineUploadProvider.tsx` (geoLat/geoLng→lat/lng)
- `apps/fsm/src/pages/JobPage.test.tsx` (mock data updated)

**Persona impact:** All — type safety prevents booking/job data corruption across apps.

**Risks:** Type divergences must be resolved (standardized on labelEn/labelFr and lat/lng). IndexedDB internal schema (`QueuedPhoto`) deliberately excluded from shared types.

**Schema audit:** No Firestore schema change. Types only.
