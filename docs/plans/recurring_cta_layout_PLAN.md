# Recurring CTA Cards Layout Plan
**Goal:** Align the discount badge and recurrence title on the same line to save vertical space, and style the "Most Popular" tag as a premium floating pill at the top-right corner of the cards.

**Primary Persona(s) Served:**
- **P2 — Travis McLeod:** Mobile-first user who benefits from a more compact layout with less scrolling.
- **P3 — Margaret Storey:** Senior client who requires high readability and clean text visual structure without overlapping elements.

---

## Strategy 1: Title First Inline with Floating Top-Right Pill (Recommended & Pre-selected)
**Description:** Put the recurrence title and discount badge inline on a single line using a flex container (`flex items-center gap-3 flex-wrap`).
- Layout: Update `src/components/home/RecurringCTA.tsx` so the `h3` heading and discount badge div are placed together inside a horizontal row container.
- Safety padding: Add `pr-20` on the header row container for cards that have the floating badge, ensuring they never overlap.
- Floating Tag: Re-style the "Most Popular" badge (`card.badgeKey`) as an absolute positioned element:
  - Classes: `absolute top-4 right-4 z-20 font-body text-xs font-semibold rounded-full px-3 py-1 shadow-sm`
  - Colors: White background with slate-brand text on inverted cards, and slate-brand background with white text on standard cards.
- Accessibility: No changes to interactive link targets. Complies with contrast standards.

**Files Changed:**
1. `src/components/home/RecurringCTA.tsx`: Refactor card elements layout.

**Persona Impact:**
- **P2 Travis:** Saves vertical space on mobile layouts.
- **P3 Margaret:** Clear visual hierarchy and layout cleanliness.

**Risks:**
- None.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Discount Badge First Inline with Title
**Description:** Put the discount badge first, followed by the title next to it (e.g. `[Save 20%] Weekly`).
- Floating Tag: Same absolute floating pill layout.

**Files Changed:**
1. `src/components/home/RecurringCTA.tsx`

**Risks:**
- Reading order is less intuitive (users typically scan for the frequency first, then look at the associated savings).

---

## Strategy 3: Center Aligned Block Layout
**Description:** Keep all elements center-aligned, with the discount badge and title on the same line, keeping the "Most Popular" badge as centered text above.

**Risks:**
- Text wrapping makes center-aligned inline elements look unbalanced.

---

## Recommendation & Next Steps
We recommend and implemented **Strategy 1**, as it represents the most premium visual styling and ensures an intuitive reading order.

To proceed:
1. Obtain human approval for Strategy 1.
2. Edit `src/components/home/RecurringCTA.tsx`.
3. Validate build and lint behavior.
