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
| **HOTFIX-02** | Shift Board permission fix — `listOpenShifts` callable, `test:rules` fix, CI functions deploy, Node 22 runtime | M | P0 | ✅ Completed 2026-09-30 |
| **P3-E30** | Business Email Setup — Zoho Mail inboxes + Resend domain/API key (app emails currently failing) | S | P0 | ⏸ Paused 2026-10-01 — waiting on human Zoho/Resend/CanSpace DNS setup; PR #26 (contact details) merged, remaining code in a follow-up PR. See [`projects/P3-E30.md`](projects/P3-E30.md) |
| **P3-E31** | Home hero reorder (logo → serving statement → headline), hide gallery / team / reviews behind flags, FAQ payment methods fix | S | P1 | ✅ Completed 2026-10-04 — see [`reports/P3-E31-close-2026-10-04.md`](reports/P3-E31-close-2026-10-04.md) |
| **P3-E32** | Before/after gallery managed from the admin page — phone upload, uniform photo fitting, publish/feature/reorder | M | P2 | 🔄 Merged and deployed 2026-10-27 (PR #28) — admin Gallery tab live; public gallery still hidden (`SHOW_GALLERY = false`). Remaining: human phone test, accept [ADR-015](decisions/ADR-015-gallery-storage-and-browser-image-processing.md), close report, then flip `SHOW_GALLERY` when real photos are in. See [`projects/P3-E32.md`](projects/P3-E32.md) |
| **HOTFIX-03** | Quote flow fixes — renewals no longer sent as quote requests, reminders only for confirmed bookings, Dispatch Board assignment transaction | S | P0 | ✅ Completed 2026-10-26 — see [`reports/HOTFIX-03-close-2026-10-26.md`](reports/HOTFIX-03-close-2026-10-26.md) |
| **HOTFIX-04** | Owner text alert for new quote requests and renewals (email down per P3-E30); admin guide: checking pending requests | S | P0 | ✅ Completed 2026-10-27 — see [`reports/HOTFIX-04-close-2026-10-27.md`](reports/HOTFIX-04-close-2026-10-27.md) |
| **P3-E35** | Roles: Owner and Manager (wave 0, W0-1) — `admin`→`owner`, new `manager` with full office access; only Owners grant/revoke office roles; Team & roles section | M | P1 | ⏸ Phase A — plan awaiting approval: [`plans/P3-E35_PLAN.md`](plans/P3-E35_PLAN.md) |
| **HOTFIX-09** | Stripe: `createPaymentIntent` requires sign-in; webhook accepts only Stripe-signed events (unsigned fallback removed) | S | P2 | ✅ Completed 2026-10-27 (PR #38, deployed) — see [`reports/HOTFIX-09-stripe-auth-2026-10-27.md`](reports/HOTFIX-09-stripe-auth-2026-10-27.md) |
| **HOTFIX-08** | Double-booking a cleaner is a blocking error in the booking panel and Dispatch Board — no override (was an overridable travel warning) | S | P1 | ✅ Completed 2026-10-27 (PR #38, deployed) — see [`reports/HOTFIX-08-overlap-not-overridable-2026-10-27.md`](reports/HOTFIX-08-overlap-not-overridable-2026-10-27.md) |
| **HOTFIX-07** | Staff notifications "mark as read" — recipient may set `read: true` only (rules were denying every update, so the unread badge never cleared) | S | P1 | ✅ Completed 2026-10-27 — rules deployed (Deploy Security Rules #2), badge check passed — see [`reports/HOTFIX-07-notifications-mark-read-2026-10-27.md`](reports/HOTFIX-07-notifications-mark-read-2026-10-27.md) |
| **HOTFIX-06** | Crew job photos — Storage rule for `jobs/{jobId}/photos/{uid}/…` (uploads were denied in production); manual **Deploy Security Rules** workflow (ADR-016, proposed) | S | P0 | ✅ Completed 2026-10-27 — deployed via the workflow, phone test passed — see [`reports/HOTFIX-06-crew-photo-storage-2026-10-27.md`](reports/HOTFIX-06-crew-photo-storage-2026-10-27.md) |
| **HOTFIX-05** | Booking emails stored lowercased so customers see their requests in the portal; renewal dedupe covers both spellings | S | P1 | ✅ Completed 2026-10-27 (backfill script for older bookings merged in PR #34, not yet run — see follow-ups) — see [`reports/HOTFIX-05-close-2026-10-27.md`](reports/HOTFIX-05-close-2026-10-27.md) |
| **ADR-014** | CI gates scoped to what changed — deploy audit moved to a daily job, E2E weekly, rules tests + lint on PRs, per-workflow filters | S | P1 | ✅ Completed 2026-10-27 — see [`reports/ADR-014-ci-close-2026-10-27.md`](reports/ADR-014-ci-close-2026-10-27.md) |
| **SEO-01** | SEO/AEO quick fixes — privacy policy copy, `www.freshnestco.ca` canonicals, FR self-canonicals, robots/sitemap/llms.txt, noindex + 404, JSON-LD images | S | P1 | ✅ Completed 2026-10-27 (PRs #33, #34) — live on `www.freshnestco.ca`; see [`reports/SEO-01-close-2026-10-27.md`](reports/SEO-01-close-2026-10-27.md) |
| **P3-E33** | Admin mobile, phase 1 — phone shell (no footer/cookie banner), section switcher + `?tab=`, accessible dialogs with sticky actions, cancel/confirm confirmation, admin copy/markup bug fixes; desktop unchanged | S–M | P1 | ✅ Complete 2026-10-27 (Strategy 2): [`reports/P3-E33-close-2026-10-27.md`](reports/P3-E33-close-2026-10-27.md) · review: [`reports/admin-mobile-review-2026-10-27.md`](reports/admin-mobile-review-2026-10-27.md) |
| **P3-E34** | Task lists on scheduled jobs — pick a saved list or build a custom one per job (Dispatch card, booking panel, New Booking); tasks copied onto the job; "use for future visits" carried by renewals; staff app reads the job's copy; open-jobs backfill script | M | P1 | ✅ Complete 2026-10-27 (Strategy 2): [`reports/P3-E34-close-2026-10-27.md`](reports/P3-E34-close-2026-10-27.md) · **human:** run `functions/scripts/backfill-job-checklists.cjs` (dry run, then `--apply`) after deploy |

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
| **P3-E16** | Dynamic Pricing Engine & Conversion Optimisation | L | P3 | ⬜ Not Started — *re-scope or drop: P3-E29 removed public pricing; at most an internal estimate tool* |
| **P3-E17** | Multi-Tenancy Schema Flag & ADR | S | P3 | ⬜ Not Started |
| **P3-E26** | Quote-First Booking System | XL | P2 | ⬜ Not Started — *public site already quote-first via P3-E29* |
| **P3-E29** | Remove Public Pricing & Discounts (quote follow-up) | M | P1 | ✅ Completed 2026-09-30 |
| **P3-E27** | Employee Onboarding System | XL | P1 | 🔄 In Progress — A1 ✅ 2026-06-21 · A2 ✅ 2026-06-22 · B1 ✅ 2026-06-22 · B2/C/D pending |
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
| **P3-E22** | Pricing Web Worker | M | P2 | ⬜ Not Started — *depends on the P3-E16 decision (P3-E29: no public pricing)* |
| **P3-E23** | React 19 `useSuspenseQuery` & Suspense Boundaries | M | P3 | ⬜ Not Started |
| **P3-E24** | VitePress Documentation Site | M | P3 | ⬜ Not Started |
| **P3-E25** | Storybook for `packages/ui` Primitives | M | P3 | ⬜ Not Started |

---

## Open Follow-Ups (from the 2026-10-27 reviews)
*Small items found while fixing the quote flow, CI and SEO. Not epics; pick up as hotfixes or fold into the epic named.*

| # | Follow-up | Owner | Source | Status |
| :--- | :--- | :--- | :--- | :--- |
| F1 | Finish business email setup — **all app emails still fail**; the owner SMS alert (HOTFIX-04) covers new quote requests meanwhile | Human (Zoho / Resend / DNS) | P3-E30 | ⏸ Waiting on human |
| F2 | Confirm `OWNER_PHONE` — owner alerts go to (613) 861-8812 unless `OWNER_PHONE` is set for Cloud Functions; that number must receive SMS | Human | HOTFIX-04 | ⬜ Open |
| F3 | Run the email backfill: `functions/scripts/backfill-lowercase-booking-emails.cjs` — dry run on `freshnest-dev`, then `(default)`; `--apply` on production needs human approval | Human + AI | HOTFIX-05 | ⬜ Open |
| F4 | Run **E2E (weekly)** and **Security Audit (daily)** once by hand (Actions → Run workflow) to confirm the new workflows | Human | ADR-014 | ⬜ Open |
| F5 | Repair the Playwright suite (15/31 failing per ADR-013), then a new ADR to make E2E a PR gate again | AI | ADR-013 / ADR-014 | ⬜ Open |
| F6 | Pre-render public pages at build time so non-JS crawlers (AI answer engines, social previews) get real content — needs an ADR + Phase A | AI | SEO-01 | ⬜ Open |
| F7 | Review-request emails link to `lilypad-freshnest.web.app` — move to `https://www.freshnestco.ca` (`functions/src/scheduled/reviews.ts`) | AI | SEO-01 | ⬜ Open |
| F8 | Optional: redirect `lilypad-freshnest.web.app` to `www.freshnestco.ca` in Firebase Hosting (canonicals already point to www) | Human (console) | SEO-01 | ⬜ Open |
| F9 | Confirm App Check is **enforced** for Firestore — the public quote form sends an SMS to any number entered (SMS-pumping risk); add a server-side rate limit if not | Human (console) + AI | Quote review | ⬜ Open |
| F10 | Referral codes are created for every quote request (active, never sent) — rethink when P3-E10 starts | AI | Quote review | → P3-E10 |
| F11 | Record quoted price, quote sent/accepted — no field holds them today | AI | Quote review | → P3-E26 |
| F12 | Privacy policy promises 7-year retention and access/correction rights — nothing enforces them yet; also add the privacy officer's name if wanted (Law 25) | Human + AI | SEO-01 | → P3-E15 |
| F13 | Tighten the public `bookings` create rule with `keys().hasOnly([...])` | Human approval (rules) | Quote review | ⬜ Open |
| F14 | Quote form minimum date uses UTC (after ~8 pm ET it skips a day) and isn't checked server-side; owner email lacks the short `Ref #` | AI | Quote review | ⬜ Open |

---

## Recommended Sprint Sequencing

| Sprint | Weeks | Epics |
| :--- | :--- | :--- |
| Sprint 1 | 1–2 | ✅ P3-E7 (P0 bug fix), P3-E18 (shared types), P3-E20 (App Check), P3-E5 (CI/CD) |
| Sprint 2 | 2–5 | ✅ P3-E1 (Stripe — XL), P3-E9 (remove mocks), P3-E4 (observability) |
| Sprint 3 | 5–7 | ✅ P3-E3 (admin booking), P3-E8 (server-side filters), P3-E2 (code splitting) |
| Sprint 4 | 7–9 | ✅ P3-E6 (accessibility) · ⬜ P3-E15 (PIPEDA erasure) and P3-E17 (multi-tenancy flag) not started (corrected 2026-10-27: no code or close report) |
| Sprint 5 | 9–11 | ✅ **P3-E27-A1** (P0 PIPEDA), **P3-E27-A2** (P0 race condition), P3-E19 (functions split), P3-E21 (converters) |
| Sprint 6 | 11–14 | ✅ P3-E27-B1 (welcome email) · P3-E27-B2 (background check consent), P3-E22 (pricing worker), P3-E17 (schema flag) |
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
