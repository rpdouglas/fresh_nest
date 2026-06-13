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
| **E09** | Before/After Gallery | P0 | Sophie, Margaret, Gallagher | Completed ✅ |
| **E10** | How It Works | P0 | Margaret, Diane, Kahnawà:ke | Completed ✅ |
| **E11** | Meet Your Team | P0 | Diane, Margaret, Kahnawà:ke | Completed ✅ |
| **E12** | Reviews Section | P0 | All | Completed ✅ |
| **E13** | Service Areas + /locations/* | P0 | Kahnawà:ke, Sophie, Travis, Diane | Completed ✅ |
| **E14** | FAQ Page | P0 | All | Completed ✅ |
| **E15** | Multi-Step Booking Form | P0 | Travis, Margaret, Sophie, Kahnawà:ke | Completed ✅ |
| **E16** | Firestore Booking Integration | P0 | All | Completed ✅ |
| **E17** | Cloud Functions Bilingual Email | P0 | Diane, Travis, All | Completed ✅ |
| **E18** | SMS Confirmation + Reminders | P0 | Travis, Margaret | Completed ✅ |
| **E19** | /pricing Page | P0 | Travis, Margaret, Diane | Completed ✅ |
| **E20** | /services/airbnb-turnover | P0 | P6 Gallagher | Completed ✅ |
| **E21** | /services/* Individual Pages | P1 | P2 Travis, P3 Margaret, P1 Diane, P6 Gallagher | Completed ✅ |
| **E22** | /thank-you Confirmation Page | P0 | P2 Travis, P1 Diane | Completed ✅ |
| **E25** | WCAG AA Accessibility Audit | P0 | Dev Team | Completed ✅ |
| **E26** | Analytics Stack | P0 | Dev Team | Completed ✅ |
| **E27** | Real Photography | P1 | P5 Sophie, P6 Gallagher | Completed ✅ |
| **E28** | Firebase Auth + /admin | P1 | Owner | Completed ✅ |
| **E29** | Booking Dashboard | P1 | Owner | Completed ✅ |
| **E30** | Lead Source Dashboard | P1 | Owner | Completed ✅ |

---

### Phase R1 — Critical Security Hardening & Correctness Fixes
| Epic | Description | Priority | Primary Persona | Status |
| :--- | :--- | :--- | :--- | :--- |
| **R01** | Firestore Security Rules (Production) | Critical | Diane, Travis, Margaret | Completed ✅ (2026-06-11) |
| **R02** | Admin Authorization Server-Side Check | Critical | Ryan | Completed ✅ (2026-06-11) |
| **R03** | Remove `.env.production` from Version Control | High | Ryan | Completed ✅ (2026-06-11) |
| **R04** | Content-Security-Policy (CSP) Header | Medium | Ryan | Completed ✅ (2026-06-11) |
| **R05** | Fix `MIN_DATE` / `MAX_DATE` Calculations | High | Travis, Sophie | Completed ✅ (2026-06-11) |
| **R06** | Fix Footer Cornwall Location Link | High | Kahnawà:ke, Travis | Completed ✅ (2026-06-11) |
| **R07** | Add Missing Booking Status i18n Keys | High | Ryan | Completed ✅ (2026-06-11) |
| **R08** | Fix `QuoteCalculator` Animation Trigger | Medium | Travis, Sophie | Completed ✅ (2026-06-11) |
| **R09** | Remove Stale Repository Artifacts | Low | Dev Team | Completed ✅ (2026-06-11) |
| **R10** | Document `onDailyReminderCheck` DB Asymmetry | Medium | Ryan | Completed ✅ (2026-06-11) |

---

### Phase 3 — Refactoring & Architecture
| Epic | Description | Priority | Primary Persona | Status |
| :--- | :--- | :--- | :--- | :--- |
| **R11** | Decompose `AdminPage.tsx` Monolith | High | Owner, Dev Team | Completed ✅ (2026-06-11) |
| **R12** | Reorganize `src/lib/` Folders | High | Dev Team | Completed ✅ (2026-06-11) |
| **R13** | Consolidate Motion Animations | Medium | Dev Team | Completed ✅ (2026-06-11) |
| **R14** | `ServiceIcon` Mapping Refactor | Medium | Dev Team | Completed ✅ (2026-06-11) |
| **R15** | Wire TanStack Query to Firestore | High | Owner, Dev Team | Completed ✅ (2026-06-11) |

---

### Phase 4 — Organic Growth & Automation
| Epic | Description | Priority | Primary Persona | Status |
| :--- | :--- | :--- | :--- | :--- |
| **E31** | Referral Program ("Give $20, Get $20") | High | Margaret, Diane, Travis | Completed ✅ (2026-06-13) |
| **E32** | Blog & Content Engine | Medium | Sophie, Travis | Completed ✅ (2026-06-13) |
| **E33** | Recurring Booking Auto-Renewal | High | Travis, Margaret | Completed ✅ (2026-06-13) |

---

### Epic Log

#### R01 to R10 — Phase R1: Critical Security Hardening & Initial Fixes
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Server-side auth, Git secrets isolation, CSP headers, and correct date/link/translation fixes.
* **Persona tests:** All clients (PII protected), Travis (date boundary), Kahnawà:ke (Cornwall footer link), Ryan (server-side authorization, translations)
* **Close Report:** [PhaseR1-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/PhaseR1-close-2026-06-11.md)

#### E30 — Lead Source Dashboard
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Tabbed Admin Layout with Dynamic Recharts Dashboard (approved by human)
* **Persona tests:** Owner Lauren S. (marketing analytics visibility), P3 Margaret (accessibility min-h-[48px] targets)
* **Key Assets:**
  * [src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E30-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E30-close-2026-06-10.md)

#### E29 — Booking Dashboard
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** Real-time dashboard with filtering and collapsible rows (approved by human)
* **Persona tests:** Owner Lauren S. (management operations), P3 Margaret (accessibility min-h-[48px] targets)
* **Key Assets:**
  * [src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx)
  * [src/lib/firestore.ts](file:///workspaces/fresh_nest/src/lib/firestore.ts)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E29-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E29-close-2026-06-10.md)

#### E28 — Firebase Auth + /admin
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Client-Side Allowlist with Single Route (approved by human)
* **Persona tests:** Lauren S. (Owner), P3 Margaret (A11y)
* **Key Assets:**
  * [src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E28-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E28-close-2026-06-10.md)

#### E27 — Real Photography
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Local Generated High-End Realistic Photography (approved by human)
* **Persona tests:** P5 Sophie, P6 Gallagher, P1 Diane, P3 Margaret
* **Key Assets:**
  * [src/lib/galleryData.ts](file:///workspaces/fresh_nest/src/lib/galleryData.ts)
  * [src/components/home/MeetTheTeam.tsx](file:///workspaces/fresh_nest/src/components/home/MeetTheTeam.tsx)
  * [src/components/ui/GalleryImage.tsx](file:///workspaces/fresh_nest/src/components/ui/GalleryImage.tsx)
  * [src/components/ui/TeamAvatar.tsx](file:///workspaces/fresh_nest/src/components/ui/TeamAvatar.tsx)
* **Close Report:** [E27-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E27-close-2026-06-10.md)

#### E26 — Analytics Stack
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** 1 — Google Analytics 4 (GA4) + GTM integration (approved by human)
* **Key Assets:**
  * [src/lib/analytics.ts](file:///workspaces/fresh_nest/src/lib/analytics.ts)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
* **Close Report:** [E26-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/E26-close-2026-06-11.md)

#### E25 — WCAG AA Accessibility Audit
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Comprehensive Accessibility Audit & Fix
* **Persona tests:** P3 Margaret — All criteria tested: Single-page form, 48px touch targets, 16px min font-size, visible phone numbers with tel: link.
* **Key Assets:**
  * [src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/src/pages/BookingPage.tsx)
  * [src/components/booking/BookingStep1.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep1.tsx)
  * [src/components/booking/BookingStep2.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep2.tsx)
  * [src/components/booking/BookingStep3.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep3.tsx)
  * [src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep4.tsx)
  * [src/components/layout/Navbar.tsx](file:///workspaces/fresh_nest/src/components/layout/Navbar.tsx)
  * [src/components/layout/Footer.tsx](file:///workspaces/fresh_nest/src/components/layout/Footer.tsx)
* **Close Report:** [E25-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E25-close-2026-06-10.md)

#### E24 — Meta Tags + Bilingual Page Titles
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Reusable `<SEO>` component utilizing React 19 native metadata hoisting + bilingual `hreflang` query parameter sync (approved by human)
* **Key Assets:**
  * [src/components/seo/SEO.tsx](file:///workspaces/fresh_nest/src/components/seo/SEO.tsx)
  * [src/i18n/index.ts](file:///workspaces/fresh_nest/src/i18n/index.ts)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/pages/Gallery.tsx](file:///workspaces/fresh_nest/src/pages/Gallery.tsx)
  * [src/pages/PricingPage.tsx](file:///workspaces/fresh_nest/src/pages/PricingPage.tsx)
  * [src/pages/AirbnbTurnoverPage.tsx](file:///workspaces/fresh_nest/src/pages/AirbnbTurnoverPage.tsx)
  * [src/pages/PlaceholderPage.tsx](file:///workspaces/fresh_nest/src/pages/PlaceholderPage.tsx)
  * [src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/src/pages/BookingPage.tsx)
  * [src/pages/FaqPage.tsx](file:///workspaces/fresh_nest/src/pages/FaqPage.tsx)
  * [src/pages/LocationPage.tsx](file:///workspaces/fresh_nest/src/pages/LocationPage.tsx)
  * [src/pages/LocationsOverview.tsx](file:///workspaces/fresh_nest/src/pages/LocationsOverview.tsx)
  * [src/pages/ServicePage.tsx](file:///workspaces/fresh_nest/src/pages/ServicePage.tsx)
  * [src/pages/ServicesOverview.tsx](file:///workspaces/fresh_nest/src/pages/ServicesOverview.tsx)
  * [src/pages/ThankYouPage.tsx](file:///workspaces/fresh_nest/src/pages/ThankYouPage.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E24-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E24-close-2026-06-10.md)

#### E23 — JSON-LD Schema
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-10)
* **Strategy:** 1 — Custom `<JsonLd>` component + centralized `seo.ts` (approved by human)
* **Key Assets:**
  * [src/components/seo/JsonLd.tsx](file:///workspaces/fresh_nest/src/components/seo/JsonLd.tsx)
  * [src/lib/seo.ts](file:///workspaces/fresh_nest/src/lib/seo.ts)
  * [src/components/layout/Layout.tsx](file:///workspaces/fresh_nest/src/components/layout/Layout.tsx)
  * [src/pages/ServicePage.tsx](file:///workspaces/fresh_nest/src/pages/ServicePage.tsx)
  * [src/pages/AirbnbTurnoverPage.tsx](file:///workspaces/fresh_nest/src/pages/AirbnbTurnoverPage.tsx)
  * [src/pages/FaqPage.tsx](file:///workspaces/fresh_nest/src/pages/FaqPage.tsx)
* **Close Report:** [E23-close-2026-06-10.md](file:///workspaces/fresh_nest/docs/reports/E23-close-2026-06-10.md)

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

#### E21 — /services/* Individual Pages
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-09)
* **Strategy:** 1 — Shared ServicePage.tsx template + serviceData.ts config (LocationPage pattern)
* **Persona tests:** P2 Travis, P3 Margaret, P1 Diane, P6 Gallagher — all 4 acceptance criteria verified
* **Key Assets:**
  * [src/lib/serviceData.ts](file:///workspaces/fresh_nest/src/lib/serviceData.ts)
  * [src/pages/ServicePage.tsx](file:///workspaces/fresh_nest/src/pages/ServicePage.tsx)
  * [src/pages/ServicesOverview.tsx](file:///workspaces/fresh_nest/src/pages/ServicesOverview.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E21-close-2026-06-09.md](file:///workspaces/fresh_nest/docs/reports/E21-close-2026-06-09.md)

#### E22 — /thank-you Confirmation Page
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-09)
* **Strategy:** B — React Router state summary (in-memory, COMPLIANCE.md compliant, graceful refresh degradation)
* **Persona tests:** P2 Travis, P1 Diane — all 7 acceptance criteria verified
* **Key Assets:**
  * [src/pages/ThankYouPage.tsx](file:///workspaces/fresh_nest/src/pages/ThankYouPage.tsx)
  * [src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/src/pages/BookingPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E22-close-2026-06-09.md](file:///workspaces/fresh_nest/docs/reports/E22-close-2026-06-09.md)

#### E20 — /services/airbnb-turnover
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-08)
* **Strategy:** 1 — Single strategy (all decisions resolved in /grill-me interview)
* **Persona test:** P6 Gallagher — all 7 acceptance criteria verified
* **Key Assets:**
  * [src/pages/AirbnbTurnoverPage.tsx](file:///workspaces/fresh_nest/src/pages/AirbnbTurnoverPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
  * [public/images/airbnb-hero.jpg](file:///workspaces/fresh_nest/public/images/airbnb-hero.jpg)
  * [docs/plans/e20_PLAN.md](file:///workspaces/fresh_nest/docs/plans/e20_PLAN.md)
* **Close Report:** [E20-close-2026-06-08.md](file:///workspaces/fresh_nest/docs/reports/E20-close-2026-06-08.md)

#### E19 — /pricing Page
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-08)
* **Strategy:** 1 — Static Service Cards + Embedded Quote Calculator (approved by human)
* **Key Assets:**
  * [src/pages/PricingPage.tsx](file:///workspaces/fresh_nest/src/pages/PricingPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E19-close-2026-06-08.md](file:///workspaces/fresh_nest/docs/reports/E19-close-2026-06-08.md)

#### E18 — SMS Confirmation + Reminders
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-08)
* **Strategy:** 1 — Twilio + Daily Cloud Scheduler (approved by human)
* **Key Assets:**
  * [functions/src/smsTemplates.ts](file:///workspaces/fresh_nest/functions/src/smsTemplates.ts)
  * [functions/src/sendSms.ts](file:///workspaces/fresh_nest/functions/src/sendSms.ts)
  * [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)
  * [functions/package.json](file:///workspaces/fresh_nest/functions/package.json)
  * [functions/tsconfig.json](file:///workspaces/fresh_nest/functions/tsconfig.json)
* **Close Report:** [E18-close-2026-06-08.md](file:///workspaces/fresh_nest/docs/reports/E18-close-2026-06-08.md)

#### E17 — Cloud Functions Bilingual Email
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Strategy:** 1 — Firebase Functions v2 + Resend SDK (approved by human)
* **Key Assets:**
  * [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)
  * [functions/src/sendEmail.ts](file:///workspaces/fresh_nest/functions/src/sendEmail.ts)
  * [functions/src/emailTemplates.ts](file:///workspaces/fresh_nest/functions/src/emailTemplates.ts)
  * [functions/package.json](file:///workspaces/fresh_nest/functions/package.json)
  * [functions/tsconfig.json](file:///workspaces/fresh_nest/functions/tsconfig.json)
  * [firebase.json](file:///workspaces/fresh_nest/firebase.json)
* **Close Report:** [E17-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E17-close-2026-06-07.md)

#### E16 — Firestore Booking Integration
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Strategy:** 1 — Service function in `src/lib/firestore.ts` (approved by human)
* **Key Assets:**
  * [src/lib/firestore.ts](file:///workspaces/fresh_nest/src/lib/firestore.ts)
  * [src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/src/pages/BookingPage.tsx)
  * [src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep4.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
  * [docs/firestore-schema.md](file:///workspaces/fresh_nest/docs/firestore-schema.md)
* **Close Report:** [E16-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E16-close-2026-06-07.md)

#### E15 — Multi-Step Booking Form
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Strategy:** 2 — 4-step wizard with RHF FormProvider (approved by human)
* **Key Assets:**
  * [src/lib/bookingSchema.ts](file:///workspaces/fresh_nest/src/lib/bookingSchema.ts)
  * [src/components/booking/StepIndicator.tsx](file:///workspaces/fresh_nest/src/components/booking/StepIndicator.tsx)
  * [src/components/booking/BookingStep1.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep1.tsx)
  * [src/components/booking/BookingStep2.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep2.tsx)
  * [src/components/booking/BookingStep3.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep3.tsx)
  * [src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep4.tsx)
  * [src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/src/pages/BookingPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E15-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E15-close-2026-06-07.md)

#### E14 — FAQ Page
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Key Assets:**
  * [src/pages/FaqPage.tsx](file:///workspaces/fresh_nest/src/pages/FaqPage.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E14-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E14-close-2026-06-07.md)

#### E13 — Service Areas + /locations/* Pages
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Key Assets:**
  * [src/lib/locationData.ts](file:///workspaces/fresh_nest/src/lib/locationData.ts)
  * [src/pages/LocationPage.tsx](file:///workspaces/fresh_nest/src/pages/LocationPage.tsx)
  * [src/pages/LocationsOverview.tsx](file:///workspaces/fresh_nest/src/pages/LocationsOverview.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E13-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E13-close-2026-06-07.md)

#### E12 — Reviews Section
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Key Assets:**
  * [src/lib/reviewsData.ts](file:///workspaces/fresh_nest/src/lib/reviewsData.ts)
  * [src/components/home/Reviews.tsx](file:///workspaces/fresh_nest/src/components/home/Reviews.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E12-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E12-close-2026-06-07.md)

#### E11 — Meet Your Team
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-07)
* **Key Assets:**
  * [src/components/ui/TeamAvatar.tsx](file:///workspaces/fresh_nest/src/components/ui/TeamAvatar.tsx)
  * [src/components/home/MeetTheTeam.tsx](file:///workspaces/fresh_nest/src/components/home/MeetTheTeam.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E11-close-2026-06-07.md](file:///workspaces/fresh_nest/docs/reports/E11-close-2026-06-07.md)

#### E10 — How It Works
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/components/home/HowItWorks.tsx](file:///workspaces/fresh_nest/src/components/home/HowItWorks.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E10-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E10-close-2026-06-06.md)

#### E09 — Before/After Gallery
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-06)
* **Key Assets:**
  * [src/lib/galleryData.ts](file:///workspaces/fresh_nest/src/lib/galleryData.ts)
  * [src/components/ui/GalleryImage.tsx](file:///workspaces/fresh_nest/src/components/ui/GalleryImage.tsx)
  * [src/components/ui/Lightbox.tsx](file:///workspaces/fresh_nest/src/components/ui/Lightbox.tsx)
  * [src/components/home/GalleryPreview.tsx](file:///workspaces/fresh_nest/src/components/home/GalleryPreview.tsx)
  * [src/pages/Gallery.tsx](file:///workspaces/fresh_nest/src/pages/Gallery.tsx)
  * [src/App.tsx](file:///workspaces/fresh_nest/src/App.tsx)
  * [src/pages/Home.tsx](file:///workspaces/fresh_nest/src/pages/Home.tsx)
* **Close Report:** [E09-close-2026-06-06.md](file:///workspaces/fresh_nest/docs/reports/E09-close-2026-06-06.md)

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
* **Refinements (2026-06-11):** Wrapped selection sections in individual alternating color containers (white, cream, slate-pale) with custom nest cleaning background images at 25% opacity for improved step-by-step readability.

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

#### E21, E07 & E04 Refinement — Centered Hero, Watermark Background & Clickable Service Cards
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Key Assets:**
  * [public/images/howitworks-step1.png](file:///workspaces/fresh_nest/public/images/howitworks-step1.png)
  * [public/images/howitworks-step2.png](file:///workspaces/fresh_nest/public/images/howitworks-step2.png)
  * [public/images/howitworks-step3.png](file:///workspaces/fresh_nest/public/images/howitworks-step3.png)
  * [public/images/howitworks-step4.png](file:///workspaces/fresh_nest/public/images/howitworks-step4.png)
  * [public/images/weekly-recurring.png](file:///workspaces/fresh_nest/public/images/weekly-recurring.png)
  * [public/images/biweekly-recurring.png](file:///workspaces/fresh_nest/public/images/biweekly-recurring.png)
  * [public/images/monthly-recurring.png](file:///workspaces/fresh_nest/public/images/monthly-recurring.png)
  * [public/images/hero-nest-banner.png](file:///workspaces/fresh_nest/public/images/hero-nest-banner.png)
  * [src/index.css](file:///workspaces/fresh_nest/src/index.css)
  * [src/components/home/Hero.tsx](file:///workspaces/fresh_nest/src/components/home/Hero.tsx)
  * [src/components/home/RecurringCTA.tsx](file:///workspaces/fresh_nest/src/components/home/RecurringCTA.tsx)
  * [src/components/home/HowItWorks.tsx](file:///workspaces/fresh_nest/src/components/home/HowItWorks.tsx)
  * [src/pages/ServicePage.tsx](file:///workspaces/fresh_nest/src/pages/ServicePage.tsx)
  * [src/components/home/ServicesGrid.tsx](file:///workspaces/fresh_nest/src/components/home/ServicesGrid.tsx)
  * [src/i18n/locales/en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json)
  * [src/i18n/locales/fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json)
* **Close Report:** [E21-E07-refinement-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/E21-E07-refinement-close-2026-06-11.md)

#### Typography Contrast & Legibility Refinement
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Upgraded card bodies and subtitles globally to font-bold (700 weight), and changed white card text color to text-charcoal for maximum high-contrast legibility.
* **Close Report:** [typography-refinement-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/typography-refinement-close-2026-06-11.md)

#### Services Card Layout Optimization
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Placed the service icon and the service name inline on the same line to save vertical space. Wrapped both elements in a single clickable group link under h3 to ensure excellent accessibility, meeting Margaret's min-h-[48px] target and improving hover transitions.
* **Close Report:** [services-card-layout-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/services-card-layout-close-2026-06-11.md)

#### How It Works Card Layout Optimization
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Aligned the step number bubble and step title inline on a single line to save vertical space. Shrunk bubble to w-10 h-10, left-aligned step card contents to improve visual scanning, and corrected contrast on inverted descriptions to ensure full WCAG compliance.
* **Close Report:** [how-it-works-layout-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/how-it-works-layout-close-2026-06-11.md)

#### Heading Typography Bold Refinement
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Upgraded H1 and H2 display headings globally to bold (700 weight) to balance them against the heavy body and card designs. Loaded native 600/700 font weights for Cormorant Garamond from Google Fonts to avoid browser-synthetic bolding distortions, and updated the design system.
* **Close Report:** [heading-bold-typography-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/heading-bold-typography-close-2026-06-11.md)

#### Recurring Service Cards Layout Optimization
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Aligned the recurrence frequency title and discount badge inline to save space. Styled the popular badge as a premium top-right floating tag with safety margins to prevent text overlaps. Rectified all brand contrast violations on badge text, CTA buttons, and descriptions.
* **Close Report:** [recurring-cta-layout-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/recurring-cta-layout-close-2026-06-11.md)

#### Hero Headline Style Refinement
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Restructured the Hero main H1 title into three split lines using the Trans component. The second line ("Cleaning" in English, "Nettoyage" in French) was italicized and highlighted in brand blue (text-slate-brand), introducing an elegant visual accent.
* **Close Report:** [hero-headline-style-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/hero-headline-style-close-2026-06-11.md)

#### R16 — Enable Type-Aware ESLint Rules
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Refactored ESLint configuration to include recommendedTypeChecked and process config/E2E files via projectService. Resolved 30 type safety bugs globally including floating promises, unsafe type destructurings, and custom Vite environment variable typings.
* **Close Report:** [R16-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/R16-close-2026-06-11.md)

#### R17 — Wire @tanstack/eslint-plugin-query
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Integrated TanStack Query flat recommended linting rules to prevent React Query anti-patterns and safeguard upcoming refactoring phases.
* **Close Report:** [R17-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/R17-close-2026-06-11.md)

#### R18 — Add Vitest Coverage Threshold
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Configured Vitest to enforce 40% statement, line, and function coverage and 35% branch coverage using the `@vitest/coverage-v8` provider. Formally verified that the thresholds are enforced and that the current unit test suite meets these rules.
* **Close Report:** [R18-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/R18-close-2026-06-11.md)

#### R20 — Fix Analytics Singleton Test Isolation
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Added a `_resetForTesting()` hook to `src/lib/analytics.ts` that clears the cached `analyticsInstance` singleton when in `test` mode, and executed it in `beforeEach` in `analytics.test.ts` to ensure complete mock and analytics call isolation.
* **Close Report:** [R20-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/R20-close-2026-06-11.md)

#### R19 — Booking Form E2E Coverage
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Configured Playwright to run E2E suites across both Chromium and Firefox. Implemented comprehensive E2E tests in `e2e/booking.spec.ts` (validating full booking funnel submits, validation error triggers, and network/submission bypasses using a window-initialized mock submit handler) and `e2e/language.spec.ts` (verifying language toggles and persistent locale changes).
* **Close Report:** [R19-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/R19-close-2026-06-11.md)

#### Phase 3 — Refactoring & Architecture (R11, R12, R13, R14, R15)
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-11)
* **Strategy:** Strategy 1 (Centralized Refactoring & Native TanStack Query)
* **Persona tests:** Owner Lauren S. (admin dashboard layout, filtering mechanics, KPIs, Recharts graphs), Margaret S. (preserved 48px touch targets, contrast legibility, keyboard/mouse accessibility), Dev Team (improved DX, modular design, full type safety).
* **Key Assets:**
  * [src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx)
  * [src/components/admin/LoginPanel.tsx](file:///workspaces/fresh_nest/src/components/admin/LoginPanel.tsx)
  * [src/components/admin/AccessDeniedPanel.tsx](file:///workspaces/fresh_nest/src/components/admin/AccessDeniedPanel.tsx)
  * [src/components/admin/BookingsTable.tsx](file:///workspaces/fresh_nest/src/components/admin/BookingsTable.tsx)
  * [src/components/admin/BookingDetailPanel.tsx](file:///workspaces/fresh_nest/src/components/admin/BookingDetailPanel.tsx)
  * [src/components/admin/AnalyticsDashboard.tsx](file:///workspaces/fresh_nest/src/components/admin/AnalyticsDashboard.tsx)
  * [src/components/admin/hooks/useAdminAuth.ts](file:///workspaces/fresh_nest/src/components/admin/hooks/useAdminAuth.ts)
  * [src/components/admin/hooks/useBookings.ts](file:///workspaces/fresh_nest/src/components/admin/hooks/useBookings.ts)
  * [src/components/admin/hooks/useAdminAnalytics.ts](file:///workspaces/fresh_nest/src/components/admin/hooks/useAdminAnalytics.ts)
* **Close Report:** [Phase3-close-2026-06-11.md](file:///workspaces/fresh_nest/docs/reports/Phase3-close-2026-06-11.md)

#### Phase 4 — Organic Growth & Automation (E31, E32, E33)
* **Owner:** Dev Team
* **Status:** Completed ✅ (2026-06-13)
* **Strategy:** Static localized blog markdown content engine, secondary /referrals Firestore collection with client-side verification, deterministic code generation, and 2 AM Cloud Function scheduler for auto-renewals.
* **Persona tests:** 
  - Sophie (P5) & Travis (P2): Responsive bilingual blog listing and markdown details.
  - Margaret (P3) & Diane (P1): Visual discount confirmation, >= 48px touch targets, >= 16px font-size, French email notification.
  - Travis (P2): Fully automated renewal booking generation and SMS dispatch.
* **Key Assets:**
  - [src/lib/data/blogData.ts](file:///workspaces/fresh_nest/src/lib/data/blogData.ts)
  - [src/pages/Blog.tsx](file:///workspaces/fresh_nest/src/pages/Blog.tsx)
  - [src/pages/BlogPost.tsx](file:///workspaces/fresh_nest/src/pages/BlogPost.tsx)
  - [src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep4.tsx)
  - [src/pages/ThankYouPage.tsx](file:///workspaces/fresh_nest/src/pages/ThankYouPage.tsx)
  - [src/components/admin/AnalyticsDashboard.tsx](file:///workspaces/fresh_nest/src/components/admin/AnalyticsDashboard.tsx)
  - [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)
  - [functions/src/emailTemplates.ts](file:///workspaces/fresh_nest/functions/src/emailTemplates.ts)
* **Close Report:** [Phase4-close-2026-06-13.md](file:///workspaces/fresh_nest/docs/reports/Phase4-close-2026-06-13.md)
