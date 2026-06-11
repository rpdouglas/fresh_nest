# Typography Refinement Plan: Card Bodies and Subtitles Legibility

## 1. Persona Alignment
- **Primary Persona:** P3 Margaret Storey (A11y, high readability). Margaret needs large, high-contrast, easily readable text on her iPad. Bolding card bodies and section subtitles using a real `600` weight font helps her parse information without straining.
- **Secondary Persona:** P2 Travis McLeod (fast booking on mobile). Larger text with clear visual weight ensures he can scan pricing and service descriptions in seconds.

---

## 2. Strategies Analysis

### Strategy 1 (Recommended): Comprehensive Global Upgrade (Font Loads + Semantic Tailwind Updates)
*   **Description:** 
    1. Update the Google Fonts link in [index.html](file:///workspaces/fresh_nest/index.html) to request DM Sans weights `300;400;500;600;700` (adding `600` and `700`).
    2. Change all card body/description copy and section subtitles/descriptions to use `text-lg font-semibold` (or `text-xl font-semibold` for Hero subtitle).
    3. Apply this globally to all pages: Home, Services Overview, Locations Overview, Location details, Pricing, Airbnb Turnover, Service details, and informational texts in the Booking form steps.
*   **Files Changed:**
    - `index.html`
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
*   **Persona Impact:** High positive impact for Margaret. True semibold weights render crisp and readable on high-DPI screens (iPads, smartphones) and standard monitors alike.
*   **Risks:** Minor layout shifts on cards or sections containing tight content due to increased font size.
*   **Schema Audit:** None.

### Strategy 2: Localized Homepage Styling with Synthetic Bolding (No Font Loading)
*   **Description:**
    1. Apply `font-semibold` and `text-lg` to homepage components only.
    2. Keep the Google Fonts loading link as-is (weights `300;400;500`).
*   **Files Changed:** Homepage TSX components only.
*   **Persona Impact:** Medium. The browser will artificially synthesize weight 600, which can look blurry, aliased, or inconsistent across Safari (Margaret's iPad), Chrome, and Firefox. Leaves other pages hard to read.
*   **Risks:** Visual degradation of font quality.
*   **Schema Audit:** None.

### Strategy 3: CSS-Driven Class Overrides
*   **Description:**
    1. Update font weights in `index.html`.
    2. Define global CSS selector overrides or utility classes in `src/index.css` (e.g. `.global-card-body`, `.global-subhead`) and apply them to elements instead of utility classes.
*   **Files Changed:** `index.html`, `src/index.css`, various components.
*   **Persona Impact:** High positive impact.
*   **Risks:** Breaks convention with standard Tailwind utility pattern in use across the rest of the site, making long-term maintenance harder for the development team.
*   **Schema Audit:** None.

---

## 3. Detailed Implementation Steps (Strategy 1)

1. **Font Weight Loading:**
   Modify the link in `index.html` from:
   `family=DM+Sans:wght@300;400;500`
   to:
   `family=DM+Sans:wght@300;400;500;600;700`

2. **Component Updates:**
   Scan and replace typography classes on all cards and section descriptions to `text-lg font-semibold`. Specifically:
   - **Hero subtitle**: `text-xl font-semibold`
   - **Section subtitles**: `text-lg font-semibold` (updated from `text-base` or `text-lg font-medium`)
   - **Card body texts**: `text-lg font-semibold` (updated from `text-base` or `text-lg font-medium`)
   - **Booking Form informational helpers/notes**: `text-lg font-semibold` (such as the Airbnb helper note on Step 1, dates hints, etc.).

3. **Validation:**
   Run `npm run build && npm run lint && npm run test && npm run test:e2e` to ensure all gates pass.
