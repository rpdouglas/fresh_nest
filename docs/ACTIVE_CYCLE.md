# Active Cycle Roadmap — Phase 3

This file tracks the active cycle status of Phase 3 epics for the **Fresh Nest Co.** platform.
Authoritative spec: [`docs/reports/freshnest-master-project-plan-v4.md`](reports/freshnest-master-project-plan-v4.md)

---

## Completed History

| Phase | Status | Close date |
| :--- | :--- | :--- |
| Phase 1 — Stabilize & Secure (10 epics) | ✅ Complete | 2026-06-16 |
| Phase 2 — Compete (10 epics + HOTFIX-01) | ✅ Complete | 2026-06-18 |

> **Note on Phase 1/2 carryovers:** P1-E3 (Stripe), P1-E5 (Route Splitting), P1-E6 (Admin Booking Creation), P1-E7 (Observability), P1-E8 (CI/CD) and P2-E5 (Accessibility) were scoped but never implemented. They are promoted into Phase 3 as P3-E1 through P3-E6 — the highest-priority epics in the plan.

---

## Current Phase: Phase 3 — Stabilize Carryovers, Scale & Harden

**Goal:** Close all unimplemented Phase 1/2 items, eliminate live production bugs, build growth infrastructure, and establish the architectural foundations that make Phase 4 safe to build.
**Duration:** 28–34 weeks · **Epic count:** 28 · **Sprint count:** 10

---

### Band A — Carryover Critical Items
*Must ship before Band C or D growth work begins.*

| Epic ID | Epic Name | Complexity | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P3-E1** | Stripe Payment Integration *(was P1-E3)* | XL | P0 | ✅ Completed 2026-06-21 |
| **P3-E2** | Route Code Splitting *(was P1-E5)* | M | P1 | ✅ Completed 2026-06-21 |
| **P3-E3** | Admin Booking Creation *(was P1-E6)* | L | P1 | ✅ Completed 2026-06-21 |
| **P3-E4** | Observability & Error Tracking *(was P1-E7)* | M | P1 | ✅ Completed 2026-06-18 |
| **P3-E5** | CI/CD Pipeline Hardening *(was P1-E8)* | S | P1 | ✅ Completed 2026-06-18 |
| **P3-E6** | Accessibility Pass WCAG 2.1 AA *(was P2-E5)* | M | P2 | ✅ Completed 2026-06-21 |

---

### Band B — Live Production Bug Fixes
*Complete within first 2 weeks of Phase 3, in parallel with Band A carryovers.*

| Epic ID | Epic Name | Complexity | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P3-E7** | Cloud Functions Critical Bug Fixes | S | P0 | ✅ Completed 2026-06-18 |
| **P3-E8** | `useBookings` Server-Side Filtering Fix | M | P1 | ✅ Completed 2026-06-21 |
| **P3-E9** | Remove `window.__MOCK_*` from Production | S | P1 | ✅ Completed 2026-06-18 |

---

### Band C — Scale & Grow
*Original Phase 3 growth epics, enriched with June 17 analysis.*

| Epic ID | Epic Name | Complexity | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P3-E10** | Loyalty & Referral Reward Loop | L | P2 | ⬜ Not Started |
| **P3-E11** | CMS-Backed Blog | L | P3 | ⬜ Not Started |
| **P3-E12** | Bilingual SEO — Path-Based Language Routing | XL | P2 | ⬜ Not Started |
| **P3-E13** | Google Business Profile Booking Integration | M | P3 | ⬜ Not Started |
| **P3-E14** | Admin Calendar View | L | P3 | ⬜ Not Started |
| **P3-E15** | Data Retention & PIPEDA Right-to-Erasure | M | P2 | ⬜ Not Started |
| **P3-E16** | Dynamic Pricing Engine & Conversion Optimisation | L | P3 | ⬜ Not Started |
| **P3-E17** | Multi-Tenancy Schema Flag & ADR | S | P3 | ⬜ Not Started |
| **P3-E26** | Quote-First Booking System | XL | P2 | ⬜ Not Started |
| **P3-E27** | Employee Onboarding System | XL | P1 | 🔄 In Progress — A1 ✅ 2026-06-21 · A2 ✅ 2026-06-22 · B1 ✅ 2026-06-22 · B2 ✅ 2026-07-21 · C/D pending |
| **P3-E28** | Cleaner Suggestion & Auto-Assignment Engine v2 | L+M+S+M | P2 | ⬜ Not Started |

---

### Band D — Architecture & Technology Upgrades
*Structural refactors that accelerate all future development.*

| Epic ID | Epic Name | Complexity | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P3-E18** | Shared Types Package (`packages/shared`) | M | P1 | ✅ Completed 2026-06-18 |
| **P3-E19** | Cloud Functions Domain Split | M | P2 | ✅ Completed 2026-06-22 |
| **P3-E20** | Firebase App Check | S | P1 | ✅ Completed 2026-06-18 |
| **P3-E21** | Firestore `withConverter()` Adoption | M | P2 | ✅ Completed 2026-06-22 |
| **P3-E22** | Pricing Web Worker | M | P2 | ⬜ Not Started |
| **P3-E23** | React 19 `useSuspenseQuery` & Suspense Boundaries | M | P3 | ⬜ Not Started |
| **P3-E24** | VitePress Documentation Site | M | P3 | ⬜ Not Started |
| **P3-E25** | Storybook for `packages/ui` Primitives | M | P3 | ⬜ Not Started |

---

## Recommended Sprint Sequencing

| Sprint | Weeks | Epics |
| :--- | :--- | :--- |
| Sprint 1 | 1–2 | ✅ P3-E7 (P0 bug fix), P3-E18 (shared types), P3-E20 (App Check), P3-E5 (CI/CD) |
| Sprint 2 | 2–5 | ✅ P3-E1 (Stripe — XL), P3-E9 (remove mocks), P3-E4 (observability) |
| Sprint 3 | 5–7 | ✅ P3-E3 (admin booking), P3-E8 (server-side filters), P3-E2 (code splitting) |
| Sprint 4 | 7–9 | ✅ P3-E6 (accessibility), P3-E15 (PIPEDA erasure), P3-E17 (multi-tenancy flag) |
| Sprint 5 | 9–11 | **P3-E27-A1** (P0 PIPEDA), **P3-E27-A2** (P0 race condition), P3-E19 (functions split), P3-E21 (converters) |
| Sprint 6 | 11–14 | P3-E27-B1 (welcome email), P3-E27-B2 (background check consent), P3-E22 (pricing worker), P3-E17 (schema flag) |
| Sprint 7 | 14–18 | P3-E27-C1 (consent sequence), P3-E27-C2 (employee profile), P3-E27-D1 (staff panel) |
| Sprint 8 | 18–22 | P3-E27-C3 (training/WHMIS), P3-E27-D2 (probation), P3-E27-D3 (offboarding), P3-E10 (referral loop), P3-E15 (PIPEDA erasure) |
| Sprint 9 | 22–27 | P3-E26 (quote-first — XL), P3-E28 Stage 1 (suggestion engine) |
| Sprint 10 | 27–34 | P3-E11 (CMS blog), P3-E12 (bilingual SEO — XL), P3-E13 (GBP), P3-E14 (calendar), P3-E16 (dynamic pricing), P3-E28 Stages 2–4, P3-E23 (Suspense), P3-E24 (VitePress), P3-E25 (Storybook) |

---

## Open Decisions (ADR Required Before Blocking Epic Starts)

| # | Decision | Blocks | Recommendation |
| :--- | :--- | :--- | :--- |
| D3 | Blog CMS: Firestore-backed vs. headless | P3-E11 | **Firestore-backed** |
| D4 | Bilingual routing: `/fr/` prefix vs. subdomain | P3-E12 | **Path prefix** |
| D8 | Web Worker for pricing engine | P3-E16 | **Yes** |
| D9 | VitePress scope: admin-only vs. public help centre | P3-E24 | **Admin-only first** |
| D10 | Storybook: single monorepo instance vs. per-app | P3-E25 | **Single monorepo instance** |
| D11 | Quote-first ADR: web-first PDF, deposit model, token design | P3-E26 | Write ADR before any code |
| D12 | Auto-scheduling: autonomy table format and storage | P3-E28 | `schedulingConfig` Firestore document |

---

## AGY 3-Phase Gate Reminder

Before commencing any epic:
1. Create `docs/projects/[epic_id].md` from the v3 plan spec (JIT — create at Phase A start).
2. Generate 3-strategy plan in `docs/plans/[epic_id]_PLAN.md`.
3. **HALT. Wait for human approval.**
4. Execute approved strategy; run Brand_Auditor, Data_Steward, Linguistic_Auditor; `npm run build && npm run lint`.
5. Write `docs/reports/[epic_id]-close-YYYY-MM-DD.md`; mark epic ✅ here; update `firestore-schema.md` if schema changed.
