# Fresh Nest Co. — Epic Index

**Last Updated:** 2026-06-10  
**Total Epics:** 34  
**Completed:** 29 (E01-E29)  
**In Progress:** 0  
**Not Started:** 5

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ | Completed |
| 🔄 | In Progress |
| ⬜ | Not Started |
| 🚫 | Blocked |

---

## Phase 1 — Foundation (Weeks 1–3)

> **Goal:** Deployable site with brand system, bilingual shell, hero, trust signals, and quote tool.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E01 | Infrastructure & CI/CD | P0 | All | ✅ Completed |
| E02 | Design System & Brand Tokens | P0 | All | ✅ Completed |
| E03 | Navbar + Footer (Bilingual) | P0 | P1 Diane, P3 Margaret | ✅ Completed |
| E04 | Hero Section (Bilingual) | P0 | P2 Travis, P1 Diane | ✅ Completed |
| E05 | Trust Bar | P0 | P3 Margaret, P1 Diane | ✅ Completed |
| E06 | Instant Quote Calculator | P0 | P2 Travis | ✅ Completed |

---

## Phase 2 — Content & Social Proof (Weeks 4–6)

> **Goal:** Full content site with services, locations, team, gallery, and reviews.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E07 | Services Grid | P0 | P2 Travis, P6 Gallagher | ✅ Completed |
| E08 | Recurring Cleaning Section | P1 | P1 Diane, P3 Margaret | ✅ Completed |
| E09 | Before/After Gallery | P1 | P5 Sophie, P6 Gallagher | ✅ Completed |
| E10 | How It Works | P1 | P2 Travis, P3 Margaret | ✅ Completed |
| E11 | Meet Your Team | P1 | P1 Diane, P3 Margaret | ✅ Completed |
| E12 | Reviews Section + Firestore | P0 | P3 Margaret, P1 Diane | ✅ Completed |
| E13 | Service Areas + /locations/* | P0 | P4 Kahnawà:ke, P5 Sophie | ✅ Completed |
| E14 | FAQ Section + /faq | P1 | P3 Margaret, P2 Travis | ✅ Completed |

---

## Phase 3 — Booking Engine (Weeks 7–8)

> **Goal:** End-to-end booking flow from form submission to bilingual confirmation.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E15 | Multi-Step Booking Form | P0 | P2 Travis, P3 Margaret | ✅ Completed |
| E16 | Firestore Booking Integration | P0 | All | ✅ Completed |
| E17 | Cloud Functions Bilingual Email | P0 | P1 Diane, P5 Sophie | ✅ Completed |
| E18 | SMS Confirmation + Reminders | P1 | P2 Travis, P4 Kahnawà:ke | ✅ Completed |
| E19 | /pricing Page | P0 | P2 Travis | ✅ Completed |
| E20 | /services/airbnb-turnover | P0 | P6 Gallagher | ✅ Completed |
| E21 | /services/* Individual Pages | P1 | P2 Travis, P6 Gallagher | ✅ Completed |
| E22 | Thank You Page | P0 | P2 Travis, P1 Diane | ✅ Completed |

---

## Phase 4 — SEO & Accessibility (Week 9)

> **Goal:** WCAG AA, structured data, analytics, and real photography.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E23 | JSON-LD Schema | P0 | All (SEO) | ✅ Completed |
| E24 | Meta Tags + Bilingual Page Titles | P0 | All (SEO) | ✅ Completed |
| E25 | WCAG AA Accessibility Audit | P0 | P3 Margaret | ✅ Completed |
| E26 | Analytics Stack | P1 | All (Business) | ✅ Completed |
| E27 | Real Photography | P1 | P5 Sophie, P6 Gallagher | ✅ Completed |

---

## Phase 5 — Admin & Auth (Week 10+)

> **Goal:** Owner-facing admin dashboard for booking management and lead tracking.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E28 | Firebase Auth + /admin | P1 | Owner | ✅ Completed |
| E29 | Booking Dashboard | P1 | Owner | ✅ Completed |
| E30 | Lead Source Dashboard | P2 | Owner | ⬜ Not Started |
| E31 | Referral Program | P2 | P3 Margaret, P1 Diane | ⬜ Not Started |

---

## Phase 6 — Post-Launch Growth

> **Goal:** Long-term growth features after launch validation.

| Epic ID | Name | Priority | Primary Persona(s) | Status |
|---|---|---|---|---|
| E32 | Blog/Content Engine | P2 | All (SEO) | ⬜ Not Started |
| E33 | Recurring Booking Auto-Renewal | P2 | P1 Diane, P3 Margaret | ⬜ Not Started |
| E34 | Stripe Deposit Integration | P2 | P2 Travis, P6 Gallagher | ⬜ Not Started |

---

## Summary by Phase

| Phase | Total Epics | Completed | In Progress | Not Started |
|---|---|---|---|---|
| Phase 1 — Foundation | 6 | 6 | 0 | 0 |
| Phase 2 — Content | 8 | 8 | 0 | 0 |
| Phase 3 — Booking Engine | 8 | 8 | 0 | 0 |
| Phase 4 — SEO & Accessibility | 5 | 5 | 0 | 0 |
| Phase 5 — Admin & Auth | 4 | 2 | 0 | 2 |
| Phase 6 — Post-Launch | 3 | 0 | 0 | 3 |
| **Total** | **34** | **29** | **0** | **5** |

---

## Dependency Chain (Critical Path)

```
E01 Infrastructure ✅
  └── E02 Design System ✅
        ├── E03 Navbar + Footer
        │     └── E04 Hero
        │           └── E05 Trust Bar
        │                 └── E06 Quote Calculator
        │                       └── [Phase 2 Epics]
        │                             └── E15 Booking Form
        │                                   ├── E16 Firestore Integration
        │                                   │     ├── E17 Email (Cloud Functions)
        │                                   │     └── E18 SMS
        │                                   └── E22 Thank You Page
        └── E13 Locations (/locations/*)
              └── [Phase 4 SEO]
```
