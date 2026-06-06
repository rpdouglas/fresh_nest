# Fresh Nest Co. — Prioritized Backlog

**Last Updated:** 2026-06-06  
**E01 and E02 are complete.** The immediate next work items are E03, E04, E05, and E06 — all P0 Phase 1 epics that can begin now.

---

## 🚀 Immediate Next — Phase 1 Remaining (P0)

> E01 Infrastructure and E02 Design System are complete. These four epics are unblocked and ready to execute in order.

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 1 | **E03** | Navbar + Footer (Bilingual) | E02 Design System ✅ | P1 Diane, P3 Margaret | Bilingual nav with language toggle, phone number visible at all breakpoints, accessible footer with service area links |
| 2 | **E04** | Hero Section (Bilingual) | E03 Navbar ⬜ | P2 Travis, P1 Diane | Above-the-fold hero with headline, subhead, and primary CTA in EN/FR — price or quote hook visible without scrolling |
| 3 | **E05** | Trust Bar | E04 Hero ⬜ | P3 Margaret, P1 Diane | Social proof strip (reviews count, years in business, insured badge, local service area) below hero |
| 4 | **E06** | Instant Quote Calculator | E02 Design System ✅ | P2 Travis | Interactive, no-account price estimator — home size × service type → instant price range displayed on page |

---

## P0 Epics — Phase 2

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 5 | **E07** | Services Grid | E04 Hero ⬜ | P2 Travis, P6 Gallagher | Responsive service card grid linking to individual `/services/*` pages with pricing tier and description |
| 6 | **E12** | Reviews Section + Firestore | E02 Design System ✅ | P3 Margaret, P1 Diane | Google Reviews-style section reading from Firestore `reviews` collection; bilingual display |
| 7 | **E13** | Service Areas + /locations/* | E03 Navbar ⬜ | P4 Kahnawà:ke, P5 Sophie | Dedicated location pages for Cornwall, Akwesasne, Snye QC, Long Sault, Morrisburg — "We serve Cornwall Island" explicit |

---

## P0 Epics — Phase 3

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 8 | **E15** | Multi-Step Booking Form | E06 Quote Calculator ⬜, E16 ⬜ | P2 Travis, P3 Margaret | RHF + Zod multi-step wizard: service type → date/time → contact → confirm; real-time field validation; 48px targets |
| 9 | **E16** | Firestore Booking Integration | E15 Booking Form ⬜ | All | Form submission writes to Firestore `bookings` collection with correct schema including `language` field |
| 10 | **E17** | Cloud Functions Bilingual Email | E16 Firestore ⬜ | P1 Diane, P5 Sophie | Cloud Function triggered on new booking doc; sends confirmation email in `booking.language` (EN or FR) |
| 11 | **E19** | /pricing Page | E07 Services Grid ⬜ | P2 Travis | Dedicated pricing page with service tiers, transparent price ranges, and CTA to booking form |
| 12 | **E20** | /services/airbnb-turnover | E07 Services Grid ⬜ | P6 Gallagher | Airbnb host–specific service page: 11am–3pm window explicit, photo proof mention, priority scheduling, host language |
| 13 | **E22** | Thank You Page | E16 Firestore ⬜ | P2 Travis, P1 Diane | Post-booking confirmation page with booking summary, next steps, bilingual content |

---

## P0 Epics — Phase 4

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 14 | **E23** | JSON-LD Schema | E13 Locations ⬜, E21 Services ⬜ | All (SEO) | LocalBusiness + Service structured data on all location and service pages |
| 15 | **E24** | Meta Tags + Bilingual Page Titles | E03 Navbar ⬜ | All (SEO) | Unique `<title>` and `<meta description>` per route in EN and FR; hreflang alternates |
| 16 | **E25** | WCAG AA Accessibility Audit | E22 Thank You ⬜ | P3 Margaret | Full WCAG AA audit pass: 48px targets, 4.5:1 contrast, skip nav, screen reader labels, keyboard navigation |

---

## P1 Epics — Phase 2

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 17 | **E08** | Recurring Cleaning Section | E07 Services Grid ⬜ | P1 Diane, P3 Margaret | Homepage section explaining recurring plans (weekly/biweekly) with trust language around consistent cleaner |
| 18 | **E09** | Before/After Gallery | E27 Photography ⬜ | P5 Sophie, P6 Gallagher | Image gallery component with before/after pairs; placeholder images until E27 real photography lands |
| 19 | **E10** | How It Works | E04 Hero ⬜ | P2 Travis, P3 Margaret | 3–4 step visual explainer (Book → We clean → You enjoy) reducing friction for first-time visitors |
| 20 | **E11** | Meet Your Team | E27 Photography ⬜ | P1 Diane, P3 Margaret | Team member cards with photo, name, and brief bio — supports trust for recurring cleaner preference |
| 21 | **E14** | FAQ Section + /faq | E04 Hero ⬜ | P3 Margaret, P2 Travis | Accordion FAQ covering pricing, cancellation, supplies, area coverage; bilingual; dedicated `/faq` route |

---

## P1 Epics — Phase 3

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 22 | **E18** | SMS Confirmation + Reminders | E16 Firestore ⬜ | P2 Travis, P4 Kahnawà:ke | Twilio (or equivalent) SMS on booking confirmation and 24hr reminder; message in `booking.language` |
| 23 | **E21** | /services/* Individual Pages | E07 Services Grid ⬜ | P2 Travis, P6 Gallagher | Individual route + page for each service type (deep cleaning, move-out, recurring, etc.) |

---

## P1 Epics — Phase 4 & 5

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 24 | **E26** | Analytics Stack | E22 Thank You ⬜ | All (Business) | GA4 + Firebase Analytics events: page views, quote interactions, booking funnel drop-off |
| 25 | **E27** | Real Photography | External (photoshoot) | P5 Sophie, P6 Gallagher | Replace placeholder images with real before/after, team, and property photos from actual jobs |
| 26 | **E28** | Firebase Auth + /admin | E16 Firestore ⬜ | Owner | Firebase Auth gate on `/admin` route; owner login with email link or Google SSO |
| 27 | **E29** | Booking Dashboard | E28 Auth ⬜ | Owner | Admin view of all bookings with filter by date/status; basic CRUD (cancel, reschedule flag) |
| 28 | **E31** | Referral Program | E16 Firestore ⬜ | P3 Margaret, P1 Diane | Referral code generation and tracking in Firestore; discount applied on next booking |

---

## P2 Epics — Phase 5 & 6

| # | Epic ID | Name | Blocking Dependencies | Persona(s) Served | Core Deliverable |
|---|---|---|---|---|---|
| 29 | **E30** | Lead Source Dashboard | E26 Analytics ⬜, E29 Dashboard ⬜ | Owner | Admin view linking booking to lead source (Google, referral, direct, etc.) |
| 30 | **E32** | Blog/Content Engine | E24 Meta Tags ⬜ | All (SEO) | MDX or Firestore-backed blog for seasonal cleaning tips, local content, FR/EN posts |
| 31 | **E33** | Recurring Booking Auto-Renewal | E16 Firestore ⬜, E28 Auth ⬜ | P1 Diane, P3 Margaret | Automated Firestore doc creation for next recurring booking cycle; owner approval workflow |
| 32 | **E34** | Stripe Deposit Integration | E15 Booking Form ⬜, E16 Firestore ⬜ | P2 Travis, P6 Gallagher | Optional deposit payment at booking time via Stripe; Firestore `booking.depositPaid` flag |

---

## Dependency Map

```
READY NOW (E01 ✅ + E02 ✅ complete):
  ├── E03 Navbar + Footer         ← START HERE
  │     └── E04 Hero
  │           └── E05 Trust Bar
  │           └── E10 How It Works
  │           └── E14 FAQ
  │     └── E24 Meta Tags
  ├── E06 Quote Calculator        ← START PARALLEL WITH E03
  ├── E12 Reviews + Firestore     ← START PARALLEL
  │
AFTER E03:
  └── E13 Locations
  └── E04 Hero
        └── E07 Services Grid
              ├── E08 Recurring Section
              ├── E19 /pricing Page
              ├── E20 /services/airbnb-turnover
              └── E21 /services/* Pages
                    └── E23 JSON-LD Schema

AFTER E06 + E07:
  └── E15 Booking Form
        └── E16 Firestore Integration
              ├── E17 Bilingual Email
              ├── E18 SMS
              ├── E22 Thank You Page
              ├── E28 Auth + /admin
              │     └── E29 Booking Dashboard
              │           └── E30 Lead Source Dashboard
              └── E31 Referral Program

AFTER E27 (Photography):
  └── E09 Before/After Gallery
  └── E11 Meet Your Team

AFTER E22 (Thank You):
  └── E25 WCAG AA Audit
  └── E26 Analytics Stack
        └── E32 Blog
```
