# E19 Phase A — /pricing Page
**Date:** 2026-06-08
**Primary persona:** P2 Travis McLeod (price visible before contact info)
**Secondary personas:** P3 Margaret Storey (accessible design) · P1 Diane Lafleur (French UI)
**Depends on:** E06 (quotePricing.ts + QuoteCalculator component ✅)

---

## Persona Context

| Persona | Need | Acceptance Gate |
| :--- | :--- | :--- |
| Travis (P2) | See a real price within 3 taps, before giving any contact info | `PASS` if price ranges are visible above the fold at 375px without interaction |
| Margaret (P3) | 48px touch targets, 16px minimum text, no horizontal scroll at 768px | `PASS` if all interactive elements ≥ 48px and no text below text-base |
| Diane (P1) | Full French UI — no hardcoded EN strings | `PASS` if every string on the page uses t() and fr.json is complete |

---

## COMPLIANCE Pre-Check

No data collection on this page — purely informational. No CASL, PIPEDA, or Quebec Law 25 concerns.

---

## Schema Audit

No Firestore reads. All pricing is computed locally from `src/lib/quotePricing.ts` which already exports:
- `BASE_PRICES` — price ranges by property size
- `SERVICE_MULTIPLIER` — per-service multipliers
- `FREQUENCY_DISCOUNT` — recurring discount percentages
- `calculateQuote()` — the full computation function

**No schema changes required.**

---

## Page Structure (all three strategies share this skeleton)

```
/pricing
  ├── Hero — headline + subhead + breadcrumb
  ├── Section A — Service Tiers (what shapes the price)
  ├── Section B — Frequency Savings
  ├── Section C — [varies by strategy]
  └── Section D — CTA to /booking
```

---

## Strategy 1 — Static Service Cards + Embedded Quote Calculator (Recommended)

### How it works

The page has four sections:

1. **Hero** — "Transparent Pricing" headline, one-line subhead ("No hidden fees. No quotes required. Book in minutes."), bilingual.
2. **Service tier cards** — Six cards (Standard, Deep, Move-Out, Post-Construction, Airbnb, Commercial). Each card shows: service name, one-line description, and a computed price range anchored to the "2-bed" reference size so Travis sees a real number immediately. Commercial card shows "Custom quote — call us." Cards link to the respective `/services/*` page (placeholder links until E21).
3. **Frequency savings banner** — A 3-column callout: Weekly (save 20%), Bi-weekly (save 15%), Monthly (save 10%). Visual, no interaction required.
4. **Embedded QuoteCalculator** — The existing `QuoteCalculator` component from E06 is rendered directly in the page under the heading "Get Your Exact Price". Travis selects his size/service/frequency and sees his number. The CTA inside the calculator links to `/booking` with the calculator state passed via `?service=...&size=...&frequency=...` query params (same wiring as the homepage instance).
5. **CTA strip** — Full-width `bg-slate-brand` strip: "Ready to book?" + primary button to `/booking`.

### Files changed

| File | Action |
| :--- | :--- |
| `src/pages/PricingPage.tsx` | **Create** — full page component |
| `src/App.tsx` | **Modify** — replace PlaceholderPage at `/pricing` with `<PricingPage />` |
| `src/i18n/locales/en.json` | **Modify** — add `pricing.*` namespace |
| `src/i18n/locales/fr.json` | **Modify** — add `pricing.*` namespace |

### Persona impact
- Travis ✅ — price ranges visible immediately on page load at 375px; no contact info required; embedded calculator confirms his exact price; CTA goes straight to /booking
- Margaret ✅ — all cards and buttons use `min-h-[48px]`; body text is `text-base` throughout; no horizontal scroll at 768px
- Diane ✅ — all strings via `t()`; fr.json complete; language toggle already in Navbar

### Risks
- Service card prices are anchored to 2-bed reference — must make this reference explicit in the UI ("Starting price for a 2-bedroom home") to avoid expectation mismatch
- `QuoteCalculator` currently has its own internal heading — may need a `headingOverride` prop or CSS suppression to avoid duplicate H2s on the pricing page. Mitigation: pass a `compact` prop or wrap and hide the internal heading via a className toggle

---

## Strategy 2 — Pricing Matrix Table

### How it works

A single `<table>` shows all price combinations: rows = property sizes (Apartment, 1–2 bed, 3–4 bed, 5+ bed), columns = service types (Standard, Deep, Move-Out, Post-Construction, Airbnb). Each cell shows the computed price range. Commercial row has a "Call us" cell spanning columns.

Frequency discounts shown as a footnote row or separate callout below the table.

No interactive component — pure static computed data.

### Risks
- A 4-row × 5-column table with price ranges does not render usably at 375px without horizontal scroll — violates Margaret's acceptance gate
- Mitigation with responsive design (collapse to cards on mobile) adds significant complexity
- The table approach answers "what does *everything* cost" but Travis wants *his* price quickly — the table forces him to hunt for his row/column

### When to prefer
Choose Strategy 2 if the owner specifically wants a comprehensive static price reference page for SEO purposes (all combinations indexed). Not optimal for the Travis conversion goal.

---

## Strategy 3 — Service Cards Only (No Calculator)

### How it works

Same six service cards as Strategy 1, but no embedded QuoteCalculator. Price ranges show a wider band ("$100–$270 depending on home size"). A "Get an exact quote" CTA links to the homepage quote calculator or the booking form.

### Persona test result
- Travis ❌ **MARGINAL FAIL** — sees a price range, but it's a wide band. He has to navigate away to narrow it. His quote is: "If I can't see a price ... I'm moving on." A wide range without a drill-down risks him leaving. Acceptable only if the quote calculator adds too much page weight.

### Verdict
Strategy 3 is viable as a fallback if QuoteCalculator embedding causes layout regressions, but Strategy 1 is strictly better for Travis.

---

## Recommended: Strategy 1

Strategy 1 satisfies all three persona tests, reuses the existing `QuoteCalculator` component without duplication (different intent: the homepage calculator drives immediate conversion; the pricing page calculator answers a research question), and requires no new pricing logic.

The only implementation care: anchor the service card prices to the 2-bed reference and make that explicit in the UI copy.

---

## i18n Key Inventory (Strategy 1)

```
pricing.hero.title           "Transparent Pricing"
pricing.hero.subtitle        "No hidden fees. No quotes required."
pricing.services.heading     "Our Services"
pricing.services.reference   "Starting price for a standard 2-bedroom home"
pricing.services.commercial  "Custom quote — contact us"
pricing.frequency.heading    "Save with recurring cleans"
pricing.frequency.weekly     "Weekly — save 20%"
pricing.frequency.biweekly   "Bi-weekly — save 15%"
pricing.frequency.monthly    "Monthly — save 10%"
pricing.calculator.heading   "Get Your Exact Price"
pricing.calculator.subhead   "Select your home size, service, and frequency."
pricing.cta.heading          "Ready to book?"
pricing.cta.button           "Book a Clean"

# Service card names reuse existing quote.service.* keys from E06
# Service card descriptions are new:
pricing.card.standard.desc   "Our most popular clean — surfaces, floors, bathrooms, and kitchen."
pricing.card.deep.desc       "A thorough top-to-bottom clean including appliances and baseboards."
pricing.card.moveout.desc    "Inspection-ready clean for tenants and sellers."
pricing.card.postconstruction.desc  "Dust and debris removal after renovation or new build."
pricing.card.airbnb.desc     "Fast turnovers within the 11am–3pm window. Linen included."
pricing.card.commercial.desc "Offices and commercial spaces. Contact us for a custom quote."
```

---

## Subagent Pre-checks

- **Brand_Auditor:** All colour classes must use token names; all buttons `rounded` not `rounded-lg`; no `text-sm` body copy
- **Data_Steward:** No Firestore reads or writes on this page — N/A
- **Linguistic_Auditor:** Every visible string must use `t()`; fr.json must include all `pricing.*` keys

---

## Phase A Gate

**HALT — awaiting human approval of strategy before proceeding to Phase B.**
