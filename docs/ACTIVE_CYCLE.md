# Active Cycle Roadmap — Cycle 2

This file tracks the active cycle status of the developmental epics for the **Fresh Nest Co.** cleaning services and field service management ecosystem, based on the **Master Project Plan v2.0**.

## Current Cycle: Phase 3 — Scale (begins post-Phase 2 close)
**Goal:** Build the feedback loops, growth infrastructure, and architectural foundations that drive long-term customer lifetime value, organic acquisition, and operational scale.

> **Phase 2 — Compete: CLOSED 2026-06-18.** All 10 epics completed. Platform has a complete customer lifecycle — first booking through recurring relationship, payment-ready infrastructure, post-job communication, review automation, WCAG 2.1 AA accessibility, PWA, RBAC, visual dispatch board, and a hardened CI/CD + test coverage baseline.

---

### Phase 1 Epics Tracking

| Epic ID | Epic Name | Priority | Primary Persona / Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P1-E1** | Secrets & Security Remediation | P0 | Security Baseline / Dev Team | ✅ Completed |
| **P1-E2** | Privacy Policy & PIPEDA Compliance | P0 | Diane (P1), Sophie (P5), All users | ✅ Completed |
| **P1-E3** | Payment Integration (Stripe Hold) | P0 | Travis (P2), Gallagher (P6) | ⬜ Not Started |
| **P1-E4** | Critical Bug & Index Fixes | P1 | Jasmine (P8), Ahmed (P10) | ⬜ Not Started |
| **P1-E5** | Route Code Splitting | P1 | Performance / All users | ⬜ Not Started |
| **P1-E6** | Admin Booking Creation | P1 | Margaret (P3), Gallagher (P6) | ⬜ Not Started |
| **P1-E7** | Observability & Error Tracking | P1 | Operational Health / Dev Team | ⬜ Not Started |
| **P1-E8** | CI/CD Pipeline Hardening | P1 | Security Scanning / Dev Team | ⬜ Not Started |

### Phase 2 Epics Tracking

| Epic ID | Epic Name | Priority | Primary Persona / Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P2-E1** | Customer Account Portal | P0 | Diane (P1), Margaret (P3) | ✅ Completed |
| **P2-E2** | Post-Job Review Automation | P1 | Travis (P2), Margaret (P3), Sarah (P12) | ✅ Completed |
| **P2-E3** | "On My Way" Customer Notification | P1 | Travis (P2), Gallagher (P6) | ✅ Completed |
| **P2-E4** | Content Pages — About, Reviews & Careers | P1 | Diane (P1), Margaret (P3), Baptiste (P4), Sophie (P5) | ✅ Completed |
| **P2-E5** | Accessibility Pass (WCAG 2.1 AA) | P1 | Margaret (P3), Diane (P1), Sophie (P5), Ahmed (P10) | ✅ Completed |
| **P2-E6** | Admin Pagination & Server-Side Analytics | P2 | Lauren (Admin), Sarah (P12) | ✅ Completed |
| **P2-E7** | PWA Configuration | P2 | Travis (P2), FSM Cleaners | ✅ Completed |
| **P2-E8** | Firebase Custom Claims RBAC | P2 | Admin / Staff Operations, Sarah (P12) | ✅ Completed |
| **P2-E9** | FSM Dispatch Board & Scheduling Intelligence | P2 | Admin Operations (Lauren), Sarah (P12), Carla (P7) | ✅ Completed |
| **P2-E10** | Test Coverage Expansion | P2 | Sarah (P12), QA / Engineering | ✅ Completed 2026-06-18 |

---

## Active Epic Specifications & Guidelines

Refer to [freshnest-master-project-plan-FSM2.md](file:///workspaces/fresh_nest/docs/reports/freshnest-master-project-plan-FSM2.md) for the complete scope, key tasks, and acceptance criteria of each epic. 

### AGY 3-Phase Gate reminder
Before commencing work on any Epic, the AI Developer must:
1. Generate a 3-strategy plan in `docs/plans/[epic_id]_PLAN.md` mapping files changed, persona impact, and risks.
2. Wait for human approval.
3. Execute the approved strategy, run audits (`Brand_Auditor`, `Data_Steward`, `Linguistic_Auditor`), and verify with `npm run build && npm run lint`.
4. Create the corresponding epic close report at `docs/reports/[epic_id]-close-YYYY-MM-DD.md` and mark it completed here.
