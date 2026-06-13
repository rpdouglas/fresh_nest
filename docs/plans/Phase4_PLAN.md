# Implementation Plan — Phase 4: Organic Growth & Automation
**Date:** June 13, 2026  
**Status:** Pending Approval  
**Base Roadmap:** [Unified Development Roadmap v1](file:///workspaces/fresh_nest/docs/FreshNestCo_UnifiedRoadmap_v1.md)

---

## 1. Executive Summary

This plan outlines the implementation of Phase 4 of the Fresh Nest Co. development cycle, covering the three core epics:
1. **E32: Blog & Content Engine** (Organic traffic acquisition)
2. **E31: Referral Program ("Give $20, Get $20")** (Word-of-mouth growth loops)
3. **E33: Recurring Booking Auto-Renewal** (Retention automation)

These features build on the modular security, caching, and testing foundations established in Phases 1–3.

---

## 2. Epic Details & Implementation Strategies

### Epic E32: Blog & Content Engine
- **Primary Persona**: Sophie Tremblay-Gagnon (P5) (Eco/French UX), Travis McLeod (P2) (Pricing-conscious).
- **Strategy**: Static TS/JSON article database bundled in the client. Articles will contain bilingual markdown strings, rendering via a unified dynamic routing layout `/blog` and `/blog/:slug`.
- **Files Changed**:
  - `src/lib/data/blogData.ts` (Create): Central repository for localized articles.
  - `src/pages/Blog.tsx` (Create): List view of all articles.
  - `src/pages/BlogPost.tsx` (Create): Detailed article view with dynamic `<SEO>` head tags.
  - `src/App.tsx` (Modify): Add `/blog` and `/blog/:slug` routes.
  - `src/components/layout/Footer.tsx` & `src/components/layout/Navbar.tsx` (Modify): Link "Blog" in navigation elements.
- **Risks**: High-contrast rendering of formatted markdown.
- **Schema Audit**: No database changes required.

---

### Epic E31: Referral Program ("Give $20, Get $20")
- **Primary Persona**: Margaret Storey (P3) (A11y/trust), Diane Lafleur (P1) (French UX).
- **Strategy**:
  1. A new public-read Firestore collection `/referrals` is created.
  2. A Cloud Function trigger `onBookingCreate` generates a referral code (e.g., `MARGARET-4B52`) when a booking is created, writes it to `/referrals/{code}` with metadata (`ownerName: "Margaret S.", active: true`), and appends the code to the parent booking.
  3. The Thank-You page displays the generated referral link (`/booking?ref=MARGARET-4B52`).
  4. If a visitor arrives via a referral link, the code is loaded into Step 1 of the booking form. The form queries `/referrals/{code}` to validate it. If valid, a visual discount confirmation ($20 off) is shown and `referredBy: "MARGARET-4B52"` is saved on booking submission.
  5. The Admin Dashboard's `BookingsTable` and `AnalyticsDashboard` are updated to display referral counts and marketing metrics.
- **Files Changed**:
  - `docs/decisions/ADR-009-referrals.md` (Create): Architectural Decision Record.
  - `firestore.rules` & `firestore.dev.rules` (Modify): Add read rules for `/referrals` collection.
  - `src/lib/schemas/bookingSchema.ts` (Modify): Add `referredBy` field validation.
  - `src/pages/BookingPage.tsx` (Modify): Parse URL `ref` parameters, show validation UI.
  - `src/pages/ThankYouPage.tsx` (Modify): Retrieve booking code and render sharing UI.
  - `src/components/admin/BookingsTable.tsx` & `AnalyticsDashboard.tsx` (Modify): Display referral fields.
  - `functions/src/index.ts` (Modify): Add `onBookingCreate` trigger.
- **Risks**: Security rules must strictly prevent public writes to `/referrals` while keeping reads open.
- **Schema Audit**:
  - `/bookings/{bookingId}`: Add `referredBy: string | null` (optional).
  - `/referrals/{referralCode}`: New collection. Schema:
    ```json
    {
      "ownerName": "string",
      "bookingId": "string",
      "active": "boolean",
      "createdAt": "timestamp"
    }
    ```

---

### Epic E33: Recurring Booking Auto-Renewal
- **Primary Persona**: Travis McLeod (P2) (Automation), Margaret Storey (P3) (Consistency).
- **Strategy**:
  1. Implement a scheduled daily Firebase Cloud Function `onDailyRecurringRenewal` running at 2 AM.
  2. The function queries `bookings` with `status == 'confirmed'` (or completed) and `frequency in ['weekly', 'biweekly', 'monthly']`.
  3. For each active recurring booking, calculate the target date of the next clean (7, 14, or 30 days out).
  4. Query to see if a booking already exists for the same user/address on that target date. If not, create a new booking with `status: 'pending'`, copying property and contact configurations.
  5. Dispatch confirmation email/SMS reminders in the user's selected language (`en`/`fr`).
- **Files Changed**:
  - `functions/src/index.ts` (Modify): Add `onDailyRecurringRenewal` scheduler.
  - `functions/src/emailTemplates.ts` & `smsTemplates.ts` (Modify): Add recurring renewal templates.
- **Risks**: Double-generation of bookings due to function retries. Mitigated by transaction checks or compound querying.
- **Schema Audit**: No schema structure modifications; uses the existing `bookings` fields.

---

## 3. Plan Timeline & Sequence

1. **Step 1: Write and Approve ADR-009** (Referral code schema & security).
2. **Step 2: Implement E32 (Blog & Content Engine)** (Independent marketing content).
3. **Step 3: Implement E31 (Referral Program)** (Updates rules, booking flow, and thank-you share card).
4. **Step 4: Implement E33 (Auto-Renewal scheduler)** (Firebase Cloud Functions).
5. **Step 5: Run all lint, type, and Playwright tests** to confirm zero regressions.
