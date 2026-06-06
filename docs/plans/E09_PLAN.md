# E09 — Before/After Gallery · Implementation Plan

## Phase A — Planning Gate

**Epic:** E09 — Before/After Gallery  
**Phase:** 2 (Core Sections & Conversion)  
**Date:** 2026-06-06

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P5 Sophie Tremblay-Gagnon** (primary) | Visual proof before booking a deep clean; FR captions | Before/after gallery as primary trust mechanism; all captions bilingual |
| **P3 Margaret Storey** | Quality signal; accessible navigation | Keyboard-navigable lightbox; 48px targets; 16px text; no horizontal scroll at 768px |
| **P6 Gallagher** | Standard of work proof for Airbnb turnover | Airbnb pair explicitly included; quality of after-state visible |

**Persona test gate (Phase C):**
- **Sophie:** Navigates from the FR homepage to `/gallery`, sees at minimum 3 before/after pairs, each with a French caption
- **Margaret:** Can open and close the lightbox using keyboard alone (Tab, Enter, Escape) at 768px on her iPad
- **Gallagher:** The gallery includes at minimum one Airbnb Turnover pair showing a guest-ready after state

---

## Scope

E09 delivers **two deliverables:**

1. **`src/components/home/GalleryPreview.tsx`** — Homepage section 7 (3 featured pairs + "View Gallery" CTA → `/gallery`)
2. **`src/pages/Gallery.tsx`** — Full `/gallery` page (replaces PlaceholderPage)

**Real photography:** Phase 4 (E27). All Phase 2 pairs use styled placeholder components with service labels and "Before" / "After" badges. Data structure is built to accept `beforeSrc`/`afterSrc` string paths — E27 replaces `null` values with real image paths, no component refactoring needed.

**Background:** RecurringCTA uses `bg-warm-white` → GalleryPreview homepage section uses `bg-cream`. Full `/gallery` page uses `bg-warm-white` (standard page background).

---

## Files Affected

| File | Action |
|---|---|
| `src/components/home/GalleryPreview.tsx` | **Create** — homepage preview section (3 featured pairs + CTA) |
| `src/pages/Gallery.tsx` | **Create** — full gallery page |
| `src/components/ui/Lightbox.tsx` | **Create** — shared Framer Motion lightbox (Strategy 2 only) |
| `src/App.tsx` | **Modify** — swap `/gallery` PlaceholderPage for `<Gallery />` |
| `src/pages/Home.tsx` | **Modify** — add `<GalleryPreview />` below `<RecurringCTA />` |
| `src/i18n/locales/en.json` | **Modify** — add `gallery.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `gallery.*` block |

No Tailwind config changes. No Firestore reads/writes. No new npm dependencies (Strategies 1 and 2).

---

## Schema Audit

No Firestore operations. Gallery pairs are static data — real images stored in `public/images/gallery/` when E27 runs. No schema changes.

---

## Shared Data Structure (all strategies)

```ts
import type { ServiceType } from '@/types'

interface GalleryPair {
  id: string
  serviceKey: ServiceType
  captionKey: string    // i18n key → gallery.pairs.[id].caption
  featured: boolean     // true → shown in GalleryPreview (first 3 featured)
  beforeSrc: string | null   // null = placeholder; E27 sets real path
  afterSrc: string | null
  beforeAltKey: string  // i18n key for alt text
  afterAltKey: string
}

const GALLERY_PAIRS: GalleryPair[] = [
  { id: 'kitchen-deep',   serviceKey: 'deep',     captionKey: 'gallery.pairs.kitchenDeep.caption',   featured: true,  beforeSrc: null, afterSrc: null, beforeAltKey: 'gallery.beforeAlt', afterAltKey: 'gallery.afterAlt' },
  { id: 'airbnb-turnover',serviceKey: 'airbnb',   captionKey: 'gallery.pairs.airbnbTurnover.caption',featured: true,  beforeSrc: null, afterSrc: null, beforeAltKey: 'gallery.beforeAlt', afterAltKey: 'gallery.afterAlt' },
  { id: 'bathroom-deep',  serviceKey: 'deep',     captionKey: 'gallery.pairs.bathroomDeep.caption',  featured: true,  beforeSrc: null, afterSrc: null, beforeAltKey: 'gallery.beforeAlt', afterAltKey: 'gallery.afterAlt' },
  { id: 'moveout-full',   serviceKey: 'moveout',  captionKey: 'gallery.pairs.moveoutFull.caption',   featured: false, beforeSrc: null, afterSrc: null, beforeAltKey: 'gallery.beforeAlt', afterAltKey: 'gallery.afterAlt' },
  { id: 'postconstruction',serviceKey:'postconstruction',captionKey:'gallery.pairs.postconstruction.caption',featured:false,beforeSrc:null,afterSrc:null,beforeAltKey:'gallery.beforeAlt',afterAltKey:'gallery.afterAlt'},
]
```

**`beforeAltKey` / `afterAltKey`** use a shared interpolated key:
- `gallery.beforeAlt` → `"Before: {{service}}"` — `{{service}}` is resolved from `services.${serviceKey}.title`
- `gallery.afterAlt` → `"After: {{service}}"`

This avoids 10 separate alt-text keys and keeps FR alt text automatic.

---

## Placeholder Image Component (all strategies)

```tsx
function GalleryImage({
  src, alt, label, className,
}: {
  src: string | null
  alt: string
  label: string   // "Before" or "After"
  className?: string
}) {
  if (src) {
    return (
      <img src={src} alt={alt} className={cn('w-full h-full object-cover', className)} />
    )
  }
  // Phase 2 placeholder — replaced by real <img> in E27
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-pale',
        className,
      )}
    >
      <span className="font-body text-sm text-slate-brand font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="font-body text-xs text-text-muted">Photo coming soon</span>
    </div>
  )
}
```

---

## i18n Keys (`gallery.*` namespace)

**en.json:**
```json
"gallery": {
  "ariaLabel":      "Before and after cleaning photos",
  "pageHeading":    "Our Work",
  "pageSubhead":    "Real results from our team — before and after every clean.",
  "previewHeading": "Before & After",
  "previewSubhead": "See the Fresh Nest difference.",
  "viewAll":        "View Full Gallery",
  "beforeLabel":    "Before",
  "afterLabel":     "After",
  "beforeAlt":      "Before: {{service}}",
  "afterAlt":       "After: {{service}}",
  "closeLabel":     "Close photo",
  "prevLabel":      "Previous photo",
  "nextLabel":      "Next photo",
  "pairs": {
    "kitchenDeep":      { "caption": "Kitchen deep clean — Cornwall, ON" },
    "airbnbTurnover":   { "caption": "Airbnb turnover — St. Lawrence waterfront" },
    "bathroomDeep":     { "caption": "Bathroom deep clean — Cornwall, ON" },
    "moveoutFull":      { "caption": "Full move-out clean — Long Sault, ON" },
    "postconstruction": { "caption": "Post-construction clean — Cornwall, ON" }
  }
}
```

**fr.json:**
```json
"gallery": {
  "ariaLabel":      "Photos avant et après le nettoyage",
  "pageHeading":    "Nos réalisations",
  "pageSubhead":    "Des résultats réels de notre équipe — avant et après chaque nettoyage.",
  "previewHeading": "Avant & Après",
  "previewSubhead": "Découvrez la différence Fresh Nest.",
  "viewAll":        "Voir toute la galerie",
  "beforeLabel":    "Avant",
  "afterLabel":     "Après",
  "beforeAlt":      "Avant : {{service}}",
  "afterAlt":       "Après : {{service}}",
  "closeLabel":     "Fermer la photo",
  "prevLabel":      "Photo précédente",
  "nextLabel":      "Photo suivante",
  "pairs": {
    "kitchenDeep":      { "caption": "Nettoyage en profondeur de la cuisine — Cornwall, ON" },
    "airbnbTurnover":   { "caption": "Rotation Airbnb — bord du Saint-Laurent" },
    "bathroomDeep":     { "caption": "Nettoyage en profondeur de la salle de bain — Cornwall, ON" },
    "moveoutFull":      { "caption": "Nettoyage de déménagement complet — Long Sault, ON" },
    "postconstruction": { "caption": "Nettoyage post-construction — Cornwall, ON" }
  }
}
```

**FR notes:**
- Colon in alt text uses thin-space: `"Avant : {{service}}"` (FR typographic convention)
- Caption copy localises service type and location names

---

## Strategy 1 — Static Grid, No Lightbox

### Description

Homepage preview section (3 featured pairs) + full `/gallery` page. Each pair is a 2-column tile (Before | After) with labels and a caption below. No lightbox — the gallery page shows all pairs in a grid, clicking does nothing beyond a hover scale effect.

### Layout

```
GalleryPreview (homepage section — bg-cream):
  [ Heading ]
  [ Pair 1 ]  [ Pair 2 ]  [ Pair 3 ]    ← 3 featured pairs in a grid
  Each pair: [ BEFORE | AFTER ] + caption
  [ View Full Gallery → ]

Gallery page (/gallery — bg-warm-white):
  H1 + subhead
  [ Pair 1 ] [ Pair 2 ] [ Pair 3 ]      ← all 5 pairs, 1-2-3 col responsive
  [ Pair 4 ] [ Pair 5 ]
  No lightbox. Hover: scale-[1.02] on pair.
```

### Persona Impact

| Persona | Impact |
|---|---|
| Sophie | Sees bilingual captions and before/after pairs. No lightbox means she cannot view the images full-size — weaker visual trust signal. |
| Margaret | Simple interaction model. Keyboard users have nothing to navigate beyond the "View Full Gallery" link. |
| Gallagher | Airbnb pair is present but can't be examined closely. |

### Risks
- **Fails master plan spec:** "Lightbox on click (full-size view)" is explicitly required. Strategy 1 does not meet this requirement.
- Weakest trust signal for Sophie — before/after comparison at small size loses impact.

---

## Strategy 2 — Grid Preview + /gallery + Custom Framer Motion Lightbox (Recommended)

### Description

Homepage preview section + full `/gallery` page with a custom keyboard-accessible lightbox built on Framer Motion `AnimatePresence`. No new dependencies. Clicking any pair opens the lightbox at the clicked pair; Prev/Next cycles through all pairs; Escape closes.

### Lightbox Component (`src/components/ui/Lightbox.tsx`)

```tsx
// Props
interface LightboxProps {
  pairs: GalleryPair[]
  initialIndex: number
  onClose: () => void
}

// Implementation
// - Rendered via React Portal into document.body
// - AnimatePresence wraps the outer motion.div (backdrop + panel)
// - Backdrop: fixed inset-0 bg-charcoal/80, click to close
// - Panel: max-w-4xl mx-auto, two-column Before/After layout
// - Navigation: prev/next buttons with aria-label from gallery.prevLabel/nextLabel
// - Close: × button top-right, aria-label from gallery.closeLabel
// - Keyboard: useEffect on window keydown — Escape closes, ArrowLeft/ArrowRight navigates
// - Focus trap: autoFocus on close button on open
// - aria-modal="true" role="dialog" aria-label from pair caption
```

**Lightbox keyboard handling:**
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
    if (e.key === 'ArrowRight') setIndex(i => Math.min(pairs.length - 1, i + 1))
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [onClose, pairs.length])
```

**Focus management:**
```tsx
// Restore focus to the trigger element when lightbox closes
// useRef on trigger → ref.current.focus() in onClose
```

### GalleryPreview (Homepage Section)

```tsx
// bg-cream py-12 px-4 md:py-20 md:px-6
// Section heading + subhead (whileInView fadeUp)
// 3 featured pairs in a grid: grid-cols-1 md:grid-cols-3 gap-6 (whileInView stagger)
// Each pair tile: click → navigate to /gallery (not open lightbox — home section links to full page)
// "View Full Gallery →" CTA → /gallery (bg-slate-brand, min-h-[48px])
// PairTile:
//   <article> with role="link" appearance or <Link to="/gallery">
//   Two-column before/after: grid grid-cols-2 gap-1
//   GalleryImage × 2 (aspect-[4/3] each — consistent tile height)
//   Caption below: font-body text-sm text-text-muted
//   Before/After labels: absolute top-1.5 left-1.5 badges (bg-charcoal/70 text-white text-xs px-1.5 py-0.5 rounded)
```

**Homepage tile behaviour:** Each tile is a `<Link to="/gallery">` — clicking navigates to the full gallery page. No lightbox on the homepage section. The lightbox lives exclusively on `/gallery`.

### Gallery Page (`src/pages/Gallery.tsx`)

```tsx
// bg-warm-white page, py-12 px-4 md:py-20 md:px-6
// H1: font-display text-5xl text-charcoal (page title)
// Subhead: font-body text-base text-text-muted
// Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
// Each cell: <button> wrapping the pair tile — onClick opens Lightbox at that index
// Lightbox state: { open: boolean, index: number }
// {open && <Lightbox pairs={GALLERY_PAIRS} initialIndex={index} onClose={() => setOpen(false)} />}
// Booking CTA banner at bottom: "Ready to get started?" + Book Now button
```

### App.tsx Change

```tsx
// Swap:
import Gallery from '@/pages/Gallery'
// Replace PlaceholderPage at path: 'gallery' with element: <Gallery />
```

### Section Structure Summary

```
Home.tsx section order (updated):
  <Hero />           bg-warm-white
  <TrustBar />       bg-cream
  <QuoteCalculator/> bg-warm-white
  <ServicesGrid />   bg-cream
  <RecurringCTA />   bg-warm-white
  <GalleryPreview /> bg-cream         ← E09
  ... (E10–E14 below)
```

### Persona Impact

| Persona | Impact |
|---|---|
| Sophie | Bilingual captions on homepage; navigates to `/gallery` to view full pairs; lightbox shows full-size before/after — satisfies visual trust requirement |
| Margaret | Lightbox keyboard-accessible (Escape, arrows); 48px nav buttons; close button `min-h-[48px]`; pairs readable at 768px tablet |
| Gallagher | Airbnb Turnover pair prominent; full-size view in lightbox shows guest-ready after state clearly |

### Risks
- Custom lightbox is ~60 additional lines of code vs. a library
- Focus trap must be carefully managed to avoid trapping non-lightbox tab flow (mitigated: portal + keydown handler cleans up on unmount)
- Portal requires `document.body` access — SSR-safe guard needed (not relevant for this Vite SPA, but document it)

---

## Strategy 3 — Grid Preview + /gallery + `yet-another-react-lightbox`

### Description

Same homepage preview + gallery page structure as Strategy 2, but the lightbox is powered by `yet-another-react-lightbox` (YARL) — a production-grade library with touch swipe, zoom, keyboard navigation, and WCAG accessibility built in.

### Dependency

```bash
npm install yet-another-react-lightbox
```

**Size:** ~14KB gzipped. No peer dep conflicts.

### Integration

```tsx
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

// Slides array from GALLERY_PAIRS:
const slides = GALLERY_PAIRS.flatMap(pair => [
  { src: pair.beforeSrc ?? '/placeholder.svg', alt: t(pair.beforeAltKey, {...}) },
  { src: pair.afterSrc  ?? '/placeholder.svg', alt: t(pair.afterAltKey,  {...}) },
])

<Lightbox
  open={open}
  close={() => setOpen(false)}
  index={index}
  slides={slides}
/>
```

### ADR Requirement

**CLAUDE.md requires an ADR before any stack change.** Adding YARL is a new UI dependency. An ADR would need to be written and approved before Phase B can proceed under Strategy 3.

### Persona Impact

| Persona | Impact |
|---|---|
| Sophie | Same as Strategy 2, plus touch swipe (she is mobile-confident) |
| Margaret | WCAG accessibility is YARL's strongest selling point — built-in focus trap, ARIA, keyboard |
| Gallagher | Zoom plugin available for examining photo detail |

### Risks
- **ADR required first** — cannot proceed to Phase B without human approval of the dependency
- YARL's default CSS may conflict with Tailwind classes — requires careful scoping
- Placeholder images require a `src` string — would need a real placeholder SVG in `public/` rather than a rendered React div
- Adds a third-party dep to a simple Phase 2 section that Phase 4 will replace with real photos anyway

---

## Recommended Strategy: **Strategy 2 — Custom Framer Motion Lightbox**

**Why over Strategy 1:** The master plan explicitly requires "Lightbox on click (full-size view)." Strategy 1 fails the spec.

**Why over Strategy 3:** Strategy 3 requires an ADR and a new dependency for a Phase 2 section whose images will be placeholders until E27. The custom Framer Motion lightbox uses a dep already installed, keeps the bundle clean, and gives full control over the placeholder→real-image transition. If YARL is needed in the future (e.g., zoom for Gallagher's photo proof in Phase 6), an ADR can be filed then.

---

## Subagent Pre-checks (to run in Phase B)

**Brand_Auditor:**
- `bg-cream` homepage section — ✓ alternates from RecurringCTA's `bg-warm-white`
- `bg-warm-white` gallery page — ✓ standard page background
- `bg-slate-pale` placeholder divs — ✓ valid token
- `bg-charcoal/70` Before/After badge overlays — standard Tailwind opacity modifier on a defined token ✓
- `font-display text-5xl` H1 on gallery page; `font-display text-4xl` H2 on homepage section ✓
- `font-body text-sm text-text-muted` captions — design system allows `text-sm` for captions (same as discount badges in E06) ✓
- All CTAs and lightbox nav buttons: `min-h-[48px]` ✓
- `rounded` (4px) on any buttons — no `rounded-lg` ✓

**Data_Steward:**
- Zero Firestore operations ✓
- No fields invented outside schema ✓

**Linguistic_Auditor:**
- All strings via `t()` ✓
- `gallery.beforeAlt` / `gallery.afterAlt` use `{{service}}` interpolation ✓
- FR colon with thin-space in alt text (`"Avant : {{service}}"`) ✓
- No hardcoded EN/FR copy in component ✓

---

## Verification Checklist

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Sophie test:** Toggle to FR → `/gallery` → 3+ pairs visible → captions in French
4. **Margaret test:** Open lightbox via keyboard (Tab to pair, Enter) → Escape closes → focus returns to trigger button → no horizontal scroll at 768px
5. **Gallagher test:** Airbnb Turnover pair is present in both homepage preview and full gallery
6. **Homepage section:** `bg-cream` directly after RecurringCTA's `bg-warm-white` ✓
7. **Lightbox backdrop:** Click outside panel closes lightbox
8. **Mobile (375px):** GalleryPreview tiles in single column; gallery page 1-column; lightbox panel fills screen
9. **Tablet (768px):** 2-column gallery grid; lightbox panel max-w-4xl centred
10. **Desktop (1024px+):** 3-column gallery grid
11. **FR toggle:** All labels (Before/Avant, After/Après), captions, CTA text switch correctly
12. **App.tsx:** `/gallery` route serves `<Gallery />`, not PlaceholderPage

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 2 — Custom Framer Motion Lightbox. Awaiting approval before Phase B execution.
