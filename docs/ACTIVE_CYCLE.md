# Active Cycle Roadmap

This file tracks the status of developmental epics for the **Fresh Nest Co.** cleaning services platform.

## Current Cycle: Cycle 1 — Foundation & Core Components (Weeks 1–3)
**Goal:** Bootstrap the application stack, configure environments, set up automation channels, and build core responsive bilingual layout components.

---

### Phase 1 — Foundation & Infrastructure
| Epic | Description | Priority | Primary Persona | Status |
| :--- | :--- | :--- | :--- | :--- |
| **E01** | Infrastructure & CI/CD Setup | P0 | Ryan | Completed ✅ |
| **E02** | Design System & Brand Tokens | P0 | All | Completed ✅ |
| **E03** | Navbar + Footer (Bilingual) | P0 | Diane, Travis, Margaret | Completed ✅ |
| **E04** | Hero Section (Bilingual) | P0 | Travis, Sophie, Margaret | Completed ✅ |
| **E05** | Trust Bar Section | P0 | Diane, Margaret, Gallagher | Completed ✅ |
| **E06** | Instant Quote Calculator | P0 | Travis, Sophie, Gallagher | Completed ✅ |
| **E07** | Services Grid | P0 | All | Completed ✅ |
| **E08** | Recurring Cleaning Section | P0 | Travis, Diane, Margaret, Sophie | Completed ✅ |

---

### Epic Log

#### E01 — Infrastructure & CI/CD Setup
* **Owner:** Ryan
* **Status:** Completed ✅ (2026-06-06)
* **Close Report:** [E01-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E01-close-2026-06-06.md)

#### E02 — Design System & Brand Tokens
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:** 
  * [tailwind.config.js](file:///workspaces/fresh_nest/tailwind.config.js)
  * [src/index.css](file:///workspaces/fresh_nest/src/index.css)
  * [src/lib/utils.ts](file:///workspaces/fresh_nest/src/lib/utils.ts)
  * [src/types/index.ts](file:///workspaces/fresh_nest/src/types/index.ts)

#### E08 — Recurring Cleaning Section
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/components/home/RecurringCTA.tsx](file:///workspaces/fresh_nest/src/components/home/RecurringCTA.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E08-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E08-close-2026-06-06.md)

#### E07 — Services Grid
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/components/home/ServicesGrid.tsx](file:///workspaces/fresh_nest/src/components/home/ServicesGrid.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E07-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E07-close-2026-06-06.md)

#### E06 — Instant Quote Calculator
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/lib/quotePricing.ts](file:///workspaces/fresh_nest/src/lib/quotePricing.ts)
  * [src/components/home/QuoteCalculator.tsx](file:///workspaces/fresh_nest/src/components/home/QuoteCalculator.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E06-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E06-close-2026-06-06.md)

#### E05 — Trust Bar Section
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/components/home/TrustBar.tsx](file:///workspaces/fresh_nest/src/components/home/TrustBar.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E05-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E05-close-2026-06-06.md)

#### E04 — Hero Section (Bilingual)
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Strategy:** 2 — Two-Column with Framer Motion (approved by human)
* **Key Assets:**
  * [src/components/home/Hero.tsx](file:///workspaces/fresh_nest/src/components/home/Hero.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E04-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E04-close-2026-06-06.md)

#### E03 — Navbar + Footer (Bilingual)
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:** 
  * [src/components/layout/Navbar.tsx](file:///workspaces/fresh_nest/src/components/layout/Navbar.tsx)
  * [src/components/layout/Footer.tsx](file:///workspaces/fresh_nest/src/components/layout/Footer.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
* **Close Report:** [E03-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E03-close-2026-06-06.md)
