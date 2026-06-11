# How It Works Layout Optimization Plan
**Goal:** Adjust the steps in the `HowItWorks` component so that the step number bubble and step title are placed inline on the same line to save space, and left-align the cards for better text readability.

**Primary Persona(s) Served:**
- **P2 — Travis McLeod:** Mobile-first user who benefits from a more compact layout with reduced vertical scrolling.
- **P3 — Margaret Storey:** Senior client who reads sequentially. Left-aligning longer titles and paragraphs makes reading significantly easier and more accessible compared to centered block layouts.

---

## Strategy 1: Left-Aligned Inline Header with 40px Bubble (Recommended & Pre-selected)
**Description:** Put the step number bubble and step title inline on the same line using `flex items-center gap-3`. Left-align the card styling and descriptions.
- Sizing: Resize the number bubble from `w-12 h-12` (48px) to `w-10 h-10` (40px) with `text-lg` to fit inline.
- Layout: Update the article and content wrappers to use `items-start text-left` classes instead of `items-center text-center`.
- Semantic HTML: Keep the `<h3>` tag for the title, accompanied by the decorative `aria-hidden="true"` number bubble.

**Files Changed:**
1. `src/components/home/HowItWorks.tsx`: Modify step rendering and card classes.

**Persona Impact:**
- **P3 Margaret:** Left-alignment complies with visual reading aids and makes scanning the instructions easier.
- **P2 Travis:** Saves vertical space on mobile layout.

**Risks:**
- None.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Centered Inline Header with 40px Bubble
**Description:** Keep the card text centered (`items-center text-center`) but display the number bubble and step name side-by-side on the same line (`flex items-center justify-center gap-3`).
- Sizing: Bubble resized to `w-10 h-10` (40px).
- Layout: Keep original text alignment.

**Files Changed:**
1. `src/components/home/HowItWorks.tsx`

**Risks:**
- Visual imbalance: Side-by-side elements can look awkward when centered if the title wraps to multiple lines, as the center-aligned lines of text won't align cleanly with the circle bubble.

---

## Strategy 3: Inline Text Numbering (Bubble-less)
**Description:** Remove the circular number bubble entirely. Integrate the number directly into the header text (e.g., "1. Choose Your Plan").
- Layout: Left-aligned or centered text, completely text-only header.

**Files Changed:**
1. `src/components/home/HowItWorks.tsx`

**Risks:**
- Loses the premium brand identity of the rounded visual bubbles.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as it maximizes legibility (especially when step titles or descriptions wrap to multiple lines) and balances the visual elements cleanly.

To proceed:
1. Obtain human approval for Strategy 1.
2. Edit `src/components/home/HowItWorks.tsx`.
3. Validate typography, accessibility, and build behavior.
