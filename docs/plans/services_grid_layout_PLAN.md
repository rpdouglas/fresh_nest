# Services Card Layout Optimization Plan
**Goal:** Adjust the service cards in `ServicesGrid` so that the service icon and the service name are displayed on the same line to save vertical space, while maintaining accessibility and brand design compliance.

**Primary Persona(s) Served:**
- **P2 — Travis McLeod:** Mobile-first user who benefits from a compact layout with less scrolling.
- **P3 — Margaret Storey:** Senior client who requires high accessibility (minimum 48px touch targets, minimum 16px text size, and clear contrast).

---

## Strategy 1: Combined Inline Link Header (Recommended & Pre-selected)
**Description:** Wrap both the SVG icon and the service name text in a single clickable `<Link>` component.
- Layout: Use `flex items-center gap-3 min-h-[48px]` to position the icon next to the text on the same line.
- Interactivity: Since both elements are part of the same `Link`, they share a single focus outline and keyboard tab stop.
- Hover Effects: Apply `group` styling. On hover/focus, the text is underlined, and the icon transitions color (from `text-slate-brand` to `text-slate-dark`, or `text-white` to `text-slate-light` for inverted cards).
- Accessibility: Extremely strong. Eliminates the redundant link issue for screen readers (where the same route was announced twice consecutively) and ensures the link is easily clickable with a minimum `min-h-[48px]` height.

**Files Changed:**
1. `src/components/home/ServicesGrid.tsx`: Refactor the card layout wrapper to merge the icon link and heading link.

**Persona Impact:**
- **P3 Margaret:** Meets accessibility target by combining targets into a single larger `min-h-[48px]` click region.
- **P2 Travis:** Saves vertical space on mobile, reducing scrolling on landing pages.

**Risks:**
- None. This is highly aligned with standard web accessibility practices.

**Schema Audit:**
- No Firestore schema modifications.

---

## Strategy 2: Side-by-Side Independent Links
**Description:** Place the icon link and service name link side-by-side on the same line but keep them as separate React Router `<Link>` components.
- Layout: `flex items-center gap-3` on the parent container.
- Sizing: Change the icon link wrapper from `w-10 h-10` to `w-12 h-12` (or add padding/minimum size) to satisfy Margaret's `min-h-[48px]` requirement.
- Hover Effects: Hovering the icon highlights/color-changes only the icon. Hovering the text underlines only the text.

**Files Changed:**
1. `src/components/home/ServicesGrid.tsx`

**Risks:**
- Redundant keyboard tab stops for assistive technologies (screen readers will read "Standard Cleaning" twice: once for the icon and once for the text).
- Extra CSS required to hit 48px targets for the icon link independently without throwing off alignment.

---

## Strategy 3: Static Icon with Title Link
**Description:** The icon is rendered on the same line as the service name, but only the service name text remains a clickable `<Link>`. The icon is static.
- Layout: `flex items-center gap-3` within the `<h3>` or wrapping container. The icon is static, and the link wraps only the text.
- Sizing: Link uses `min-h-[48px]` to ensure touch target compliance.

**Files Changed:**
1. `src/components/home/ServicesGrid.tsx`

**Risks:**
- Users (particularly P2 Travis or P3 Margaret) might expect the icon to be clickable and feel frustrated when tapping it does nothing.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as it is the most robust, provides the best accessibility (resolving the screen reader duplicate link issue), and guarantees the `min-h-[48px]` touch target requirement is met comfortably.

To proceed:
1. Obtain human approval for Strategy 1.
2. Edit `src/components/home/ServicesGrid.tsx` to implement Strategy 1.
3. Validate typography, accessibility, and build behavior.
