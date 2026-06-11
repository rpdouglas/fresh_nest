# E06 Refinement Plan: Quote Calculator Backgrounds & Color Variations

## 1. Persona Alignment
- **Primary Persona:** P2 Travis McLeod (fast booking + layout). Travis uses the quote calculator on mobile to get pricing instantly. Adding clean background images and soft color boundaries helps differentiate the selection steps visually.
- **Secondary Persona:** P3 Margaret Storey (A11y). Clear contrast boundaries between calculator sections make the selection steps easier to identify and navigate.

---

## 2. Strategies Analysis

### Strategy 1 (Recommended): Subtle Container Wrapping with Section Background Images
*   **Description:** Wrap each calculator section (Property Size, Service Type, Frequency) in a styled container (`relative overflow-hidden border border-sand rounded p-6`) with alternating background colors (`bg-white`, `bg-cream`, and `bg-slate-pale`) and corresponding birds nest cleaning background images at 25% opacity.
*   **Files Changed:**
    - `src/components/home/QuoteCalculator.tsx`
*   **Persona Impact:** High positive impact for both Travis and Margaret. Improves visual flow without changing the successful selection model.
*   **Risks:** Minor visual alignment shift of the selection grid.
*   **Schema Audit:** None.

### Strategy 2: Single Large Background Container
*   **Description:** Instead of wrapping individual sections, place one large container wrapper around the entire calculator input form, using a single background color and one combined background image.
*   **Files Changed:**
    - `src/components/home/QuoteCalculator.tsx`
*   **Persona Impact:** Medium. Does not separate the steps visually as clearly as Strategy 1.
*   **Risks:** Lower legibility and less step-by-step clarity.
*   **Schema Audit:** None.

### Strategy 3: CSS Grid with Color Badges
*   **Description:** Use CSS flex/grid layout properties to inject colored borders or badges next to the section headings instead of wrapping the entire containers.
*   **Files Changed:**
    - `src/components/home/QuoteCalculator.tsx`
*   **Persona Impact:** Low.
*   **Risks:** Leaves the layout looking very plain without the requested background images.
*   **Schema Audit:** None.

---

## 3. Detailed Implementation Steps (Strategy 1)

1. **Copy generated images**:
   - `public/images/quote-size.png`
   - `public/images/quote-service.png`
   - `public/images/quote-frequency.png`

2. **Update QuoteCalculator.tsx**:
   Replace the three layout divisions with styled wrappers:
   - Size: `bg-white border-sand rounded p-6` + `/images/quote-size.png`
   - Service: `bg-cream border-sand rounded p-6` + `/images/quote-service.png`
   - Frequency: `bg-slate-pale border-sand rounded p-6` + `/images/quote-frequency.png`

3. **Verify with Build Gate**:
   Run `npm run build && npm run lint && npm run test` to confirm everything compiles and runs correctly.
