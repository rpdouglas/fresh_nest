# E12 — Reviews Section · Implementation Plan

## Phase A — Planning Gate

**Epic:** E12 — Reviews Section + Live Firestore Integration  
**Phase:** 2 (static data) → Phase 3 (live Firestore)  
**Date:** 2026-06-07

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P1 Diane Lafleur** (primary) | Reads reviews in both languages before booking; French reviews signal authentic bilingual service | FR-tagged reviews appear first when language is FR; all section UI chrome via `t()` |
| **P3 Margaret Storey** (primary) | Reviews from identifiable local clients build trust before she calls | `name` + `location` visible on every card; star rating explicit |
| **P2 Travis McLeod** | Quick social proof scan on mobile — confirms service is legit | Mobile-friendly layout; minimal friction |
| **P4 Kahnawà:ke Baptiste** | A review from Akwesasne/Cornwall Island confirms they actually cross the bridge | One review with `location: 'Akwesasne'` in the static set |
| **P5 Sophie Tremblay-Gagnon** | A French review from Snye, QC confirms cross-border service | One FR review with `location: 'Snye, QC'` in the static set |
| **P6 Gallagher** | An Airbnb Host review confirms professional-grade reliability | One review with Airbnb Host context in `location` |

**All six personas are served** — this is the universal trust section.

**Persona test gate (Phase C):**
- **Diane:** Toggle to FR → French reviews (`language: 'fr'`) appear before English reviews; section heading = "Ce que disent nos clients"; no English-only UI chrome.
- **Margaret:** Name, location, and star rating visible on every card at 768px; all text ≥ 16px; no horizontal scroll.

---

## Scope

A single homepage section with 5 hardcoded static reviews. **Zero Firestore reads in Phase 2.** The `Review` interface mirrors the `reviews` Firestore schema exactly — Phase 3 replaces the static array with `useApprovedReviews()` from TanStack Query + Firebase, with no component changes needed.

**Background:** MeetTheTeam uses `bg-cream` → Reviews uses `bg-warm-white` (alternating pattern).

**Bilingual rule (from master plan):** Review body text is NOT translated — it displays in the language the reviewer wrote it in. Only section UI chrome (heading, subhead, rating aggregate, star aria-labels) uses `t()`. This is intentional authenticity — do not put review bodies in `en.json` / `fr.json`.

**Rating aggregate:** `"5.0 ★★★★★ — Based on 80+ reviews"` hardcoded for Phase 2 (real aggregate computed from Firestore in Phase 3). The stars are decorative unicode in a `<span aria-hidden="true">`, paired with visually hidden text for screen readers.

---

## Files Affected

| File | Action |
|---|---|
| `src/components/home/Reviews.tsx` | **Create** |
| `src/lib/reviewsData.ts` | **Create** — static review array + `Review` interface |
| `src/pages/Home.tsx` | **Modify** — add `<Reviews />` below `<MeetTheTeam />` |
| `src/i18n/locales/en.json` | **Modify** — add `reviews.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `reviews.*` block |

No Tailwind config changes. No Firestore ops. No new routes. No new npm dependencies.

---

## Schema Audit

**Zero Firestore reads in Phase 2.** The `Review` interface is designed to match the `reviews` collection schema exactly:

| Interface field | Schema field | Notes |
|---|---|---|
| `id` | — | Local key only (React `key`); not in Firestore schema |
| `name` | `name` | ✓ string |
| `location` | `location` | ✓ string — e.g., `'Cornwall, ON'`, `'Airbnb Host'` |
| `language` | `language` | ✓ `'en' \| 'fr'` |
| `rating` | `rating` | ✓ `1–5` integer |
| `text` | `text` | ✓ string |
| — | `approved` | Not needed for display (query filter in Phase 3) |
| — | `createdAt` | Not rendered in Phase 2 cards (Phase 3 may add a date) |

No invented fields.

---

## Shared Data (`src/lib/reviewsData.ts`)

```ts
export interface Review {
  id: string
  name: string
  location: string
  language: 'en' | 'fr'
  rating: number
  text: string
}

export const STATIC_REVIEWS: Review[] = [
  {
    id: 'linda-m',
    name: 'Linda M.',
    location: 'Cornwall, ON',
    language: 'en',
    rating: 5,
    text: "Same cleaner every visit, exactly on schedule. I was nervous letting someone into my home, but Fresh Nest put me at ease right away. Highly recommend.",
  },
  {
    id: 'dean-g',
    name: 'Dean G.',
    location: 'South Glengarry — Airbnb Host',
    language: 'en',
    rating: 5,
    text: "Our Airbnb is turned over perfectly every time, always within the window. Guest review scores have jumped since we switched. Worth every cent.",
  },
  {
    id: 'marie-claire-b',
    name: 'Marie-Claire B.',
    location: 'Cornwall, ON',
    language: 'fr',
    rating: 5,
    text: "Service impeccable du début à la fin. Le même nettoyeur à chaque visite, toujours ponctuel. Je n'aurais pas pu demander mieux.",
  },
  {
    id: 'emilie-t',
    name: 'Émilie T.',
    location: 'Snye, QC',
    language: 'fr',
    rating: 5,
    text: "Je suis de l'autre côté de la rivière et ils font quand même le déplacement ! Produits écologiques, équipe souriante. Cinq étoiles sans hésitation.",
  },
  {
    id: 'james-a',
    name: 'James A.',
    location: 'Akwesasne',
    language: 'en',
    rating: 5,
    text: "They actually came to the island — no other service in the area would. Deep clean before a big family gathering. Spotless result.",
  },
]
```

**Coverage:**
- Linda M. (Cornwall) — recurring trust; Margaret gate
- Dean G. (South Glengarry Airbnb Host) — Gallagher gate
- Marie-Claire B. (Cornwall, FR) — Diane gate (FR review in English-dominant area)
- Émilie T. (Snye QC, FR) — Sophie gate (cross-border + eco + FR)
- James A. (Akwesasne) — Kahnawà:ke gate (island service confirmation)

These are Phase 2 placeholders, explicitly noted in the close report, replaced with real client reviews in Phase 3.

---

## Language Sorting

When `i18n.language === 'fr'`, FR-tagged reviews sort to the front. When `'en'`, EN reviews sort first.

```ts
// In Reviews.tsx — derived value, no state
const { i18n } = useTranslation()
const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
const sorted = [...STATIC_REVIEWS].sort((a, b) => {
  if (a.language === lang && b.language !== lang) return -1
  if (b.language === lang && a.language !== lang) return 1
  return 0
})
```

This is a stable partial sort — reviews with the current language float to the top; relative order within each group is preserved. No `useState` needed — `sorted` is derived on every render from the i18n context.

---

## `StarRating` Inline Component

A small private function inside `Reviews.tsx` (not a separate file — single use). Renders 5 star SVGs with filled/empty styling. The `<div>` carries `role="img"` + `aria-label` for screen reader accessibility; individual SVGs are `aria-hidden`.

```tsx
function StarRating({ rating }: { rating: number }) {
  const { t } = useTranslation()
  return (
    <div
      role="img"
      aria-label={t('reviews.starAriaLabel', { rating, max: 5 })}
      className="flex gap-0.5"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          strokeWidth={0}
          className={`w-4 h-4 ${i < rating ? 'text-sand-dark' : 'text-slate-pale'}`}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}
```

**Color rationale:**
- Filled star: `text-sand-dark` (`#c4b09a`) — warm sandy-gold; visually reads as "gold star" against white card backgrounds
- Empty star: `text-slate-pale` (`#d6e5ec`) — muted, clearly unfilled
- Both are decorative (`aria-hidden`); the `role="img"` + `aria-label` on the container carries the accessible meaning

---

## i18n Keys

**en.json** — add `"reviews"` block after `"howItWorks"`:

```json
"reviews": {
  "ariaLabel":        "Customer reviews",
  "sectionHeading":   "What Our Clients Say",
  "sectionSubhead":   "Real reviews from real clients across Cornwall and surrounding communities.",
  "ratingHeading":    "5.0",
  "ratingStars":      "★★★★★",
  "ratingBasis":      "Based on 80+ reviews",
  "ratingAriaLabel":  "Rated 5.0 out of 5 — based on 80 or more reviews",
  "starAriaLabel":    "{{rating}} out of {{max}} stars"
}
```

**fr.json** — matching block:

```json
"reviews": {
  "ariaLabel":        "Avis des clients",
  "sectionHeading":   "Ce que disent nos clients",
  "sectionSubhead":   "Des avis réels de clients partout à Cornwall et dans les communautés environnantes.",
  "ratingHeading":    "5,0",
  "ratingStars":      "★★★★★",
  "ratingBasis":      "Basé sur 80+ avis",
  "ratingAriaLabel":  "Note de 5,0 sur 5 — basé sur plus de 80 avis",
  "starAriaLabel":    "{{rating}} sur {{max}} étoiles"
}
```

**Why split `ratingHeading` / `ratingStars` / `ratingBasis`?**
- `ratingHeading` localises the decimal separator (`5.0` vs `5,0` — FR convention)
- `ratingStars` is the unicode string `★★★★★` — same in both locales but in its own key so it can be wrapped `aria-hidden`
- `ratingBasis` is the text label — fully translated
- `ratingAriaLabel` is the visually-hidden accessible text for the aggregate block

Note: review body text (`text`), `name`, and `location` fields are authentic reviewer content — NOT in `en.json` / `fr.json`. They render as-is.

---

## Strategy 1 — Responsive CSS Grid (1→2→3 Columns)

### Description

Five review cards in a responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` grid. At desktop, 3+2 layout (last row has 2 cards — the 2-card row is left-aligned with no centering hack). Rating aggregate sits in the section heading row. Cards: reviewer name, location, `StarRating`, review text. No interaction, no carousel, no JavaScript state.

### Layout

```
[ What Our Clients Say ]  [ 5.0 ★★★★★ Based on 80+ reviews ]

[ Linda M.       ] [ Dean G.        ] [ Marie-Claire B. ]
[ James A.       ] [ Émilie T.      ]
         (last row: 2 cards, left-aligned in 3-col grid)
```

### Card

```tsx
<article className="bg-white border border-sand rounded shadow-sm p-6 flex flex-col gap-3">
  <StarRating rating={review.rating} />
  <p className="font-body text-base text-charcoal flex-1">{review.text}</p>
  <div>
    <p className="font-sub text-base text-charcoal">{review.name}</p>
    <p className="font-body text-sm text-text-muted">{review.location}</p>
  </div>
</article>
```

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | FR reviews sort first; all chrome in French; 5 cards visible without interaction |
| Margaret | Name + location visible on every card; 16px text; no interaction required |
| Travis | Sees reviews without any scroll; simple layout loads fast |
| Kahnawà:ke | Akwesasne review is visible in the grid (position depends on sort) |

### Risks
- 3+2 grid leaves an awkward orphaned bottom row at lg — aesthetically imbalanced
- No peek/scroll affordance on mobile — user must scroll down to see more cards below the fold
- All 5 cards visible at once on desktop; feels less curated than a carousel

---

## Strategy 2 — Horizontal Scroll Carousel on Mobile, 3-Col Grid on Desktop (Recommended)

### Description

CSS snap-scroll on mobile: cards are `flex overflow-x-auto snap-x snap-mandatory`, each card is `snap-start shrink-0 w-[min(72,85vw)]` — shows a "peek" of the next card to signal scrollability. At `md+`, switches to `grid grid-cols-2 lg:grid-cols-3`. No JavaScript for navigation — native CSS snap handles the swipe. The 3+2 grid issue at lg is the same as Strategy 1, but the desktop layout is secondary to the mobile experience.

### Section Structure

```tsx
<section aria-label={t('reviews.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
  <div className="max-w-content mx-auto">

    {/* Heading row — heading left, rating aggregate right */}
    <motion.div ... whileInView fadeUp className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <h2 className="font-display text-4xl text-charcoal mb-2">{t('reviews.sectionHeading')}</h2>
        <p className="font-body text-base text-text-muted">{t('reviews.sectionSubhead')}</p>
      </div>
      {/* Rating aggregate */}
      <div className="shrink-0 text-right" aria-label={t('reviews.ratingAriaLabel')}>
        <p className="font-display text-3xl text-charcoal">{t('reviews.ratingHeading')}</p>
        <p className="font-body text-sm text-sand-dark" aria-hidden="true">{t('reviews.ratingStars')}</p>
        <p className="font-body text-sm text-text-muted">{t('reviews.ratingBasis')}</p>
      </div>
    </motion.div>

    {/* Cards — horizontal scroll on mobile, grid on md+ */}
    <motion.div
      className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4
                 md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                 lg:grid-cols-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={stagger}
    >
      {sorted.map(review => (
        <motion.article
          key={review.id}
          variants={fadeUp}
          className="snap-start shrink-0 w-[min(18rem,85vw)]
                     md:w-auto md:shrink
                     bg-white border border-sand rounded shadow-sm p-6
                     flex flex-col gap-3"
        >
          <StarRating rating={review.rating} />
          <p className="font-body text-base text-charcoal flex-1">{review.text}</p>
          <div className="pt-2 border-t border-sand">
            <p className="font-sub text-base text-charcoal">{review.name}</p>
            <p className="font-body text-sm text-text-muted">{review.location}</p>
          </div>
        </motion.article>
      ))}
    </motion.div>

  </div>
</section>
```

### Mobile UX detail

`w-[min(18rem,85vw)]` on mobile: cards are at most `18rem` (288px) wide, but shrink to `85vw` on very small screens. The `15vw` gap between the card edge and viewport edge creates the "peek" — users see ~15% of the next card, signaling that more content is available by swiping. `pb-4` adds bottom padding so the horizontal scrollbar (if visible in some browsers) doesn't clip card shadows.

At `md+`: `md:w-auto md:shrink` releases the fixed width and the `grid` layout takes over. `md:overflow-visible` removes the scroll container so grid height renders correctly.

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | FR reviews float to top when FR is active; all UI chrome in French; swipe carousel is natural on mobile |
| Margaret | At 768px (iPad portrait), grid shows 2 columns — all cards visible without horizontal scroll at md+; text ≥ 16px; no interaction required at desktop sizes |
| Travis | Swipe to browse reviews feels native on iPhone; sees social proof fast |
| Kahnawà:ke | Akwesasne review is visible (sorted into top 3 for EN users) |
| Sophie | Snye QC FR review appears first (or second) when FR is active |
| Gallagher | Airbnb Host review is in the set; visible at desktop |

### Risks
- Horizontal scroll markup on mobile + grid markup on desktop uses `md:grid` + `md:overflow-visible` overrides — the Tailwind class sequence must be carefully ordered (mobile-first: `flex overflow-x-auto` → `md:grid md:overflow-visible`)
- Framer Motion `stagger` on a mixed flex/grid container — `motion.article` children animate correctly regardless of layout mode (Framer tracks React lifecycle, not DOM position) ✓
- `text-sand-dark` on white background for star rating aggregate — stars are `aria-hidden` decorative; the `ratingAriaLabel` carries the accessible meaning ✓

---

## Strategy 3 — Featured Review + 4-Card Sub-Grid

### Description

The first review after language sorting is displayed as a full-width "featured pull quote" — `bg-slate-pale rounded p-8`, large `font-display text-2xl` body text, oversized `StarRating`, reviewer name prominent. The remaining 4 reviews are in a `grid-cols-2` sub-grid below with compact cards. The featured review changes dynamically with language toggle — Diane sees a French review featured when she switches to FR.

### Layout

```
[ What Our Clients Say ]  [ 5.0 ★★★★★ Based on 80+ reviews ]

┌────────────────────────────────────────────────────────────┐
│  ★★★★★                                                     │  ← bg-slate-pale
│  "Service impeccable du début à la fin. Le même nettoyeur  │    Full-width
│   à chaque visite, toujours ponctuel."                     │
│                         — Marie-Claire B. · Cornwall, ON   │
└────────────────────────────────────────────────────────────┘

[ Linda M.       ] [ Dean G.        ]
[ James A.       ] [ Émilie T.      ]
```

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | Switching to FR instantly promotes a French review to featured position — directly responsive to her experience |
| Margaret | The featured review is prominent and readable; 4-card sub-grid below is structured and familiar |
| Others | Sub-grid provides adequate social proof coverage |

### Risks
- The dynamic featured review (changes with language toggle) adds **visual instability** — if the user toggles FR mid-page, the featured card jumps content. This could feel jarring.
- The 4-card `grid-cols-2` sub-grid creates a consistent 2+2 layout — clean, but doesn't show all 5 reviews without pagination
- `bg-slate-pale` featured card is the fourth use of that token as a "highlight" surface (after TrustBar, Assignment callout, avatar placeholder) — dilutes its distinctiveness
- Most complex of the three strategies with highest risk of TypeScript/layout bugs

---

## Recommended Strategy: **Strategy 2 — Horizontal Scroll Carousel on Mobile, Grid on Desktop**

**Why over Strategy 1:** The 3+2 grid orphan at desktop is manageable (Strategy 1 has the same problem), but the mobile experience is the key differentiator. Travis (P2) is smartphone-first — native CSS snap-scroll for reviews is far more natural than scrolling past a stack of 5 tall cards. The carousel peek signals "more to see" without requiring a prev/next button.

**Why over Strategy 3:** Strategy 3's language-responsive featured card is elegant but introduces visual instability on toggle. The featured position is only meaningful to Diane — all other personas see an undifferentiated review promoted. The complexity cost outweighs the benefit. Strategy 2 achieves the FR-first requirement through sorting, which is stable and additive rather than repositioning.

---

## Subagent Pre-checks (Phase B)

**Brand_Auditor:**
- `bg-warm-white` section — ✓ alternates from MeetTheTeam's `bg-cream`
- `bg-white border border-sand rounded shadow-sm` cards — ✓
- `font-display text-4xl text-charcoal` heading; `font-sub text-base text-charcoal` reviewer name ✓ (≥ 16px)
- `font-body text-base text-charcoal` review body — 16px minimum ✓ (Margaret gate)
- `font-body text-sm text-text-muted` reviewer location — permitted supplemental label (same documented exception) ✓
- `text-sand-dark` on stars (decorative, `aria-hidden`) — no WCAG requirement; visual warmth only ✓
- `font-display text-3xl text-charcoal` rating number + `font-body text-sm text-text-muted` rating label — ✓
- `rounded` on cards — 4px ✓; no `rounded-lg` ✓

**Data_Steward:**
- Zero Firestore ops ✓
- `Review` interface matches `reviews` schema (minus display-irrelevant `approved`/`createdAt`) ✓
- No invented fields ✓

**Linguistic_Auditor:**
- All section UI chrome via `t()` ✓
- Review `text`, `name`, `location` are authentic reviewer content — intentionally NOT i18n keys ✓ (documented bilingual rule from master plan)
- `reviews.starAriaLabel` uses `{{rating}}` and `{{max}}` interpolation ✓
- FR: `5,0` decimal comma in `ratingHeading`; "sur" in `starAriaLabel` ✓

---

## Verification Checklist (Phase C gate)

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Diane test:** Toggle FR → section heading = "Ce que disent nos clients"; Marie-Claire B. (FR) and Émilie T. (FR) appear before EN reviews; no English-only UI text
4. **Margaret test:** At 768px, 2-column grid renders (no horizontal scroll); all text ≥ 16px; name + location visible on every card
5. **Kahnawà:ke test:** James A. `location: 'Akwesasne'` review is visible in the rendered set
6. **Mobile (375px):** Snap-scroll carousel renders; card peek visible (~15vw)
7. **Background:** `bg-warm-white` directly after MeetTheTeam's `bg-cream` ✓
8. **Rating aggregate:** `aria-label` on container; stars `aria-hidden` ✓
9. **Scroll reveal:** `whileInView` on heading + cards; nothing animates on page load
10. **Language toggle:** Sorted order updates correctly when switching EN↔FR

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 2 — Horizontal Scroll Carousel on Mobile, 3-Col Grid on Desktop. Awaiting approval before Phase B execution.
