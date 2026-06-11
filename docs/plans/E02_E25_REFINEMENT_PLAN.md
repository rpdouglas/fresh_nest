# Typography & Contrast Refinement Plan: Card Bodies and Subtitles Legibility (Phase 2)

## 1. Persona Alignment
- **Primary Persona:** P3 Margaret Storey (A11y, high readability). Margaret struggles to read low-contrast text. Changing `text-text-muted` to `text-charcoal` and upgrading font weight to `font-bold` (700 weight) on white cards and section subtitles provides maximum contrast (WCAG AAA compliant ratio) and visual comfort.
- **Secondary Persona:** P1 Diane Lafleur / P5 Sophie Tremblay-Gagnon (French-language experience). High-contrast typography makes reading long-form bilingual descriptions easier.

---

## 2. Strategies Analysis

### Strategy 1 (Recommended): Comprehensive Contrast & Boldness Upgrade
*   **Description:**
    1. Upgrade all card body texts and section subtitles across the site to `font-bold` (700 weight).
    2. Change the text color of card bodies and section subtitles on white/light backgrounds from `text-text-muted` to `text-charcoal`.
    3. Keep card bodies on blue cards white (`text-white` or `text-white/95`) but upgrade their weight to `font-bold`.
*   **Files Changed:**
    - `src/components/home/Hero.tsx`
    - `src/components/home/ServicesGrid.tsx`
    - `src/components/home/RecurringCTA.tsx`
    - `src/components/home/HowItWorks.tsx`
    - `src/components/home/MeetTheTeam.tsx`
    - `src/components/home/Reviews.tsx`
    - `src/components/home/QuoteCalculator.tsx`
    - `src/pages/ServicesOverview.tsx`
    - `src/pages/LocationsOverview.tsx`
    - `src/pages/LocationPage.tsx`
    - `src/pages/PricingPage.tsx`
    - `src/pages/AirbnbTurnoverPage.tsx`
    - `src/pages/ServicePage.tsx`
    - `src/components/booking/BookingStep1.tsx`
    - `src/components/booking/BookingStep2.tsx`
    - `src/components/booking/BookingStep3.tsx`
    - `src/components/booking/BookingStep4.tsx`
*   **Persona Impact:** Significant boost to accessibility and visual contrast. Subtitles and descriptions will stand out clearly.
*   **Risks:** Bold text takes up slightly more space. Inspect layouts for text wrapping.
*   **Schema Audit:** None.

### Strategy 2: Change Font Weights Only (Keep Muted Color)
*   **Description:** Upgrade text weight to `font-bold` but keep color as `text-text-muted`.
*   **Persona Impact:** Low-medium. Muted gray on a white background still has suboptimal contrast even when bold.
*   **Risks:** Contrast compliance issues for visually impaired users.
*   **Schema Audit:** None.

---

## 3. Detailed Implementation Steps (Strategy 1)

1. **Modify Homepage Components**:
   - `Hero.tsx`: Change subhead to `text-xl font-bold text-charcoal`. (Wait! The Hero subhead is on `warm-white` bg, so changing it to `text-charcoal` will make it pop!)
   - `ServicesGrid.tsx`: Subhead `text-lg font-bold text-charcoal`. White card body `text-lg text-charcoal font-bold`. Blue card body `text-lg text-white font-bold`.
   - `RecurringCTA.tsx`: Subhead `text-lg font-bold text-charcoal`. White card body `text-lg text-charcoal font-bold`. Blue card body `text-lg text-white/95 font-bold`.
   - `HowItWorks.tsx`: Subhead `text-lg font-bold text-charcoal`. White card body `text-lg text-charcoal font-bold`. Blue card body `text-lg text-white/95 font-bold`.
   - `MeetTheTeam.tsx`: Subhead `text-lg font-bold text-charcoal`. Card bios `text-lg font-bold text-charcoal`. Callout text `text-lg font-bold text-charcoal`.
   - `Reviews.tsx`: Subhead `text-lg font-bold text-charcoal`. Card texts `text-lg font-bold text-charcoal`.
   - `QuoteCalculator.tsx`: Subhead `text-lg font-bold text-charcoal`.

2. **Modify Inner Pages & Booking Steps**:
   - `ServicesOverview.tsx`: Page subhead `text-lg font-bold text-charcoal`.
   - `LocationsOverview.tsx`: Page subhead `text-lg font-bold text-charcoal`. Card body `text-lg font-bold text-charcoal`.
   - `LocationPage.tsx`: Subhead `text-lg font-bold text-charcoal`. Description `text-lg font-bold text-charcoal`. Callout `text-lg font-bold text-charcoal`.
   - `PricingPage.tsx`: Hero subhead `text-lg font-bold text-charcoal`. Section subhead `text-lg font-bold text-charcoal`. Card body `text-lg font-bold text-charcoal`. Frequency subhead `text-lg font-bold text-charcoal`. Frequency card body `text-lg font-bold text-charcoal`.
   - `AirbnbTurnoverPage.tsx`: Hero subhead `text-lg font-bold text-slate-pale` (since hero background is charcoal/dark, we keep text light for contrast). Included items `text-lg font-bold text-charcoal`. How it works step description `text-lg font-bold text-charcoal` (wait, section background is `bg-cream`, so `text-charcoal` is perfect). Trust signal label `text-lg font-bold text-slate-pale` (section is `bg-slate-dark`, so keep it light). Form subhead `text-lg font-bold text-charcoal`.
   - `ServicePage.tsx`: Hero subhead `text-lg font-bold text-slate-pale`. Included items `text-lg font-bold text-charcoal`. How it works description `text-lg font-bold text-charcoal`. Trust signal label `text-lg font-bold text-slate-light` -> wait, section is `bg-slate-dark`, so `text-slate-light` might be low contrast. Let's make it `text-slate-pale` or keep as `text-slate-light`? Let's check: it was `text-slate-light font-semibold`. Let's make it `text-slate-pale font-bold` or `text-white font-bold` for high contrast! Custom pricing body `text-lg font-bold text-charcoal`.
   - `BookingStep1.tsx`: Radio descriptions `text-lg font-bold text-charcoal`. Pets hint `text-lg font-bold text-charcoal`.
   - `BookingStep2.tsx`: Date hint `text-lg font-bold text-charcoal`.
   - `BookingStep3.tsx`: Address hint `text-lg font-bold text-charcoal`.
   - `BookingStep4.tsx`: Review details `text-lg font-bold text-charcoal`. (Note values are already text-charcoal, labels like contact info and section summaries will be upgraded).

3. **Verify with Build Gate**:
   Run linter, tests, E2E tests, and build command.
