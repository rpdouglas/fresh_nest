# ADR-005 — Multi-Page Architecture over Single-Page Scroll
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, SEO Strategy, UX Architecture

## Context

The v1 site was a single-page scroll layout: one URL (`/`), all content in vertical sections, internal navigation via anchor hash links. This is a common pattern for small business sites.

The problem: Google cannot rank a homepage `#services` anchor for the query "house cleaning Cornwall ON" as effectively as a dedicated page at `/services/house-cleaning` with its own title tag, meta description, canonical URL, and structured data. Local SEO for a cleaning service depends on dedicated, indexable pages per service and per location.

Additionally, personas Travis (P2), Sophie (P5), and Kahnawà:ke (P4) all check the service area for their specific location before anything else. They need a page URL they can bookmark, share with a partner, or return to — not a scroll position that loses state on back-navigation.

## Decision

Implement a **multi-page React SPA** using **React Router v6** with dedicated routes for all services and locations:

| Route Pattern | Purpose |
|---|---|
| `/` | Homepage (hero, trust bar, overview) |
| `/services` | Services overview grid |
| `/services/:slug` | Individual service pages (e.g., `/services/airbnb-turnover`) |
| `/locations` | Service areas overview |
| `/locations/:slug` | Individual location pages (e.g., `/locations/akwesasne`) |
| `/pricing` | Pricing and quote page |
| `/faq` | FAQ page |
| `/book` | Multi-step booking form |
| `/thank-you` | Booking confirmation |

## Rationale

- Each service and location page can rank independently on Google for local search queries
- Dedicated URLs are bookmarkable and shareable — critical for Travis (shares with partner), Sophie (returns from French search), and Kahnawà:ke (shares Cornwall Island service URL)
- React Router v6 provides clean client-side routing with no full-page reloads
- Page-level routing enables proper `<title>`, `<meta description>`, and JSON-LD structured data per page (ADR-006 bilingual routing also requires page-level language metadata)
- Individual location pages allow persona-specific copy: "We serve Cornwall Island" for Kahnawà:ke, "Nous desservons Snye QC" for Sophie
- React Router's `<Outlet>` pattern allows shared layouts (Navbar, Footer) without code duplication

## Consequences

**Positive:**
- Independent Google ranking per service and location page
- Shareable, bookmarkable URLs for every service area and service type
- Cleaner persona-specific landing pages with tailored copy
- Better hreflang implementation for bilingual SEO (EN/FR alternates at page level)
- Enables future sitemap.xml generation per route

**Negative:**
- More pages to build and maintain (34 epics vs. ~8 sections)
- Requires React Router v6 configuration and route guard patterns
- Each new service or location requires a new route + page component

**Neutral:**
- Firebase Hosting already supports SPA routing via `rewrites` in `firebase.json` — no additional configuration required for client-side routing

## Alternatives Considered

- **Single-page scroll** — Rejected. Cannot rank service or location pages independently in local SEO. A single URL competing for 6+ location keywords and 8+ service keywords is spread too thin. Anchor links lose state on back-navigation, degrading the persona experience for returning visitors.
