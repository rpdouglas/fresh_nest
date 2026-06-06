# E08 — Recurring Cleaning Section · Implementation Plan

## Phase A — Planning Gate

**Epic:** E08 — Recurring Cleaning Section  
**Phase:** 2 (Core Sections & Conversion)  
**Date:** 2026-06-06

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P2 Travis McLeod** (primary) | Biweekly discount visible; one-tap CTA to pre-populate booking | Sees 15% off biweekly without calculating; CTA → `/booking?freq=biweekly` |
| **P1 Diane Lafleur** | Full French UI | All strings via `t()`; FR discount phrasing (`15 % de rabais`) |
| **P3 Margaret Storey** | 48px targets; 16px text; no surprises | All CTAs `min-h-[48px]`; text `font-body text-base` |
| **P5 Sophie Tremblay-Gagnon** | FR comparison; biweekly for recurring | French frequency labels and discount copy |

**Persona test gate (Phase C):** Travis lands on the homepage, scrolls to the Recurring section, and can identify the biweekly discount and tap "Book Biweekly" in a single tap — with the booking form opening pre-set to `biweekly`.

---

## Scope

The master plan specifies: discount table (Weekly 20%, Biweekly 15%, Monthly 10%), "Set it and forget it" messaging, CTA to booking form with frequency pre-selected.

**No Firestore reads or writes.** This is a pure presentation section — same as Hero, TrustBar, QuoteCalculator, and ServicesGrid.

**Background:** ServicesGrid uses `bg-cream` → RecurringCTA must use `bg-warm-white` (alternating pattern).

**Animation:** `whileInView` with `viewport={{ once: true, margin: '-50px' }}` — same as ServicesGrid (all below-fold sections).

---

## Files Affected

| File | Action |
|---|---|
| `src/components/home/RecurringCTA.tsx` | **Create** |
| `src/pages/Home.tsx` | **Modify** — add `<RecurringCTA />` below `<ServicesGrid />` |
| `src/i18n/locales/en.json` | **Modify** — add `recurring.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `recurring.*` block |

No schema changes. No new routes. No Tailwind config changes.

---

## Schema Audit

No Firestore operations in this epic. The booking CTAs pass query params (`?freq=weekly`, `?freq=biweekly`, `?freq=monthly`) to the existing `/booking` route — same URL param convention used by QuoteCalculator. The `frequency` field in `docs/firestore-schema.md` already lists `'weekly' | 'biweekly' | 'monthly'` as valid values.

---

## Strategy 1 — Horizontal Discount Table + Single CTA

### Description

A centered section with a section heading, a three-column comparison table (frequency | discount | tagline), a "Set it and forget it" paragraph, and a single primary CTA defaulting to biweekly.

### Layout

```
[ Section Heading ]
[ Subhead — "Save up to 20% on recurring cleans." ]

[ Weekly | Biweekly | Monthly ]    ← horizontal 3-col table
[ 20% off | 15% off | 10% off ]
[ Best for… | Most popular | Flexible ]

[ "Set it and forget it." paragraph ]

[ Book a Recurring Clean → ] ← single CTA → /booking?freq=biweekly
```

### Files Changed
- `src/components/home/RecurringCTA.tsx` — created
- `src/pages/Home.tsx` — `<RecurringCTA />` added
- `en.json` / `fr.json` — `recurring.*` block

### Persona Impact

| Persona | Impact |
|---|---|
| Travis | Sees biweekly 15% discount and a CTA. Single CTA pre-fills biweekly. Cannot tap "Book Weekly" directly — minor friction |
| Diane | Full French. No issues |
| Margaret | Single CTA is easier — less choice paralysis. Touch target `min-h-[48px]` ✓ |
| Sophie | Sees all three options in FR. Single CTA limits direct choice |

### Risks
- Single CTA defaults to biweekly — Travis and Margaret can't choose weekly/monthly without entering the booking form first
- Table layout may feel flat without visual hierarchy differentiating the recommended option
- Less conversion surface than a multi-CTA approach

---

## Strategy 2 — Three Frequency Cards with Individual CTAs (Recommended)

### Description

Three cards in a responsive grid (1 col mobile → 3 col desktop). Each card shows: frequency name, discount badge, a short persona-targeted tagline, and a "Book [Frequency]" CTA pre-populating the booking form. The **Biweekly card** is inverted (`bg-slate-brand`) as the recommended/most popular option — matching the Commercial card inversion pattern from ServicesGrid.

### Layout

```
[ Section Heading ]
[ Subhead — "Save every time you book recurring." ]

[ Weekly            ] [ BIWEEKLY ★ Most Popular  ] [ Monthly            ]
[ bg-white          ] [ bg-slate-brand (inverted) ] [ bg-white           ]
[ 20% off           ] [ 15% off                  ] [ 10% off            ]
[ "Ideal for…"      ] [ "Set it and forget it."  ] [ "Flexible…"        ]
[ Book Weekly →     ] [ Book Biweekly →           ] [ Book Monthly →     ]
  /booking?freq=weekly   /booking?freq=biweekly      /booking?freq=monthly
```

### Card Data Array (module scope)

```ts
interface FrequencyCard {
  freq: 'weekly' | 'biweekly' | 'monthly'
  discountPct: number
  inverted: boolean
  badgeKey: string    // 'recurring.mostPopular' on biweekly
}

const FREQUENCY_CARDS: FrequencyCard[] = [
  { freq: 'weekly',   discountPct: 20, inverted: false, badgeKey: '' },
  { freq: 'biweekly', discountPct: 15, inverted: true,  badgeKey: 'recurring.mostPopular' },
  { freq: 'monthly',  discountPct: 10, inverted: false, badgeKey: '' },
]
```

### Card Render

```tsx
<article className={cn(
  'rounded border p-6 flex flex-col gap-4',
  card.inverted
    ? 'bg-slate-brand border-slate-brand'
    : 'bg-white border-sand shadow-sm',
)}>
  {/* Discount badge */}
  <div className={cn(
    'inline-flex items-center font-body font-medium text-base rounded px-3 py-1 self-start',
    card.inverted ? 'bg-white text-slate-brand' : 'bg-slate-pale text-slate-brand',
  )}>
    {t('recurring.discountBadge', { pct: card.discountPct })}
  </div>

  {/* "Most popular" tag — biweekly only */}
  {card.badgeKey && (
    <span className="font-body text-sm text-white opacity-75">
      {t(card.badgeKey)}
    </span>
  )}

  {/* Frequency name */}
  <h3 className={cn('font-sub text-2xl', card.inverted ? 'text-white' : 'text-charcoal')}>
    {t(`quote.frequency.${card.freq}`)}    {/* reuse existing quote.frequency.* keys */}
  </h3>

  {/* Tagline */}
  <p className={cn('font-body text-base flex-1', card.inverted ? 'text-white' : 'text-text-muted')}>
    {t(`recurring.tagline.${card.freq}`)}
  </p>

  {/* CTA */}
  <Link
    to={`/booking?freq=${card.freq}`}
    aria-label={t('recurring.bookAriaLabel', { freq: t(`quote.frequency.${card.freq}`) })}
    className={cn(
      'inline-flex items-center font-body font-medium text-base rounded',
      'min-h-[48px] px-4 py-2 self-start transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      card.inverted
        ? 'border border-white text-white hover:bg-white hover:text-slate-brand focus:ring-white'
        : 'bg-slate-brand text-white hover:bg-slate-dark focus:ring-slate-brand',
    )}
  >
    {t('recurring.bookCta', { freq: t(`quote.frequency.${card.freq}`) })} →
  </Link>
</article>
```

**Key reuse decision:** Frequency labels (`quote.frequency.weekly`, `quote.frequency.biweekly`, `quote.frequency.monthly`) are already in `en.json` / `fr.json` from E06. These are reused directly — no duplicate keys.

### i18n Keys (new — `recurring.*` namespace)

**en.json:**
```json
"recurring": {
  "ariaLabel":     "Recurring cleaning plans and pricing",
  "sectionHeading": "Save on Every Clean",
  "sectionSubhead": "Book a recurring schedule and save up to 20% — no contracts, cancel anytime.",
  "mostPopular":   "Most Popular",
  "discountBadge": "{{pct}}% off",
  "bookCta":       "Book {{freq}}",
  "bookAriaLabel": "Book {{freq}} cleaning",
  "tagline": {
    "weekly":    "Perfect for busy households. Your home, consistently fresh, every week.",
    "biweekly":  "Set it and forget it. The most popular option — fresh every two weeks.",
    "monthly":   "Flexible recurring clean. Great for lower-traffic homes or seasonal top-ups."
  }
}
```

**fr.json:**
```json
"recurring": {
  "ariaLabel":     "Forfaits de nettoyage récurrents et tarifs",
  "sectionHeading": "Économisez à chaque nettoyage",
  "sectionSubhead": "Réservez un nettoyage récurrent et économisez jusqu'à 20 % — sans contrat, annulation à tout moment.",
  "mostPopular":   "Le plus populaire",
  "discountBadge": "{{pct}} % de rabais",
  "bookCta":       "Réserver — {{freq}}",
  "bookAriaLabel": "Réserver un nettoyage {{freq}}",
  "tagline": {
    "weekly":    "Idéal pour les foyers actifs. Votre maison, toujours impeccable, chaque semaine.",
    "biweekly":  "Réservez et oubliez. L'option la plus populaire — propre aux deux semaines.",
    "monthly":   "Nettoyage récurrent flexible. Idéal pour les maisons moins fréquentées ou les remises à neuf saisonnières."
  }
}
```

**Note on `recurring.bookCta` interpolation:** `t('recurring.bookCta', { freq: t('quote.frequency.biweekly') })` → "Book Biweekly" (EN) / "Réserver — Aux deux semaines" (FR). The colon dash (` — `) in French separates verb and object per FR convention.

### Animation

Heading block: `whileInView` + `fadeUp`, `viewport={{ once: true, margin: '-50px' }}`.  
Card grid: `whileInView` + `stagger` (same variants as ServicesGrid — `staggerChildren: 0.1, delayChildren: 0.1`).

### Section Structure

```tsx
<section
  aria-label={t('recurring.ariaLabel')}
  className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
>
  <div className="max-w-content mx-auto">
    {/* Heading — whileInView fadeUp */}
    <h2 className="font-display text-4xl text-charcoal mb-4">
      {t('recurring.sectionHeading')}
    </h2>
    <p className="font-body text-base text-text-muted mb-10">
      {t('recurring.sectionSubhead')}
    </p>

    {/* Card grid — whileInView stagger */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {FREQUENCY_CARDS.map(card => (
        <motion.div key={card.freq} variants={fadeUp}>
          <article ...>...</article>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

### Persona Impact

| Persona | Impact |
|---|---|
| Travis | Biweekly card is visually prominent; single tap "Book Biweekly" → `/booking?freq=biweekly`; discount visible at a glance |
| Diane | Full French across all 3 cards; discount format `15 % de rabais` per FR convention |
| Margaret | Three distinct, clearly labelled cards; each CTA `min-h-[48px]`; `font-body text-base` throughout; no precision clicking required |
| Sophie | FR UI; biweekly tagline "Réservez et oubliez" speaks to recurring commitment she values |

### Risks
- Three CTAs vs. one — slightly more decision surface for Margaret (mitigated: cards are visually distinct and labelled)
- Inverted biweekly card creates visual anchor that may draw eye away from the section heading (acceptable — the card IS the primary content)

---

## Strategy 3 — Two-Column Split (Hero-Style)

### Description

Left column: section heading, three discount rows as a feature list with checkmarks, "Set it and forget it" paragraph. Right column: a panel with inline frequency selection (3 segmented buttons reusing QuoteCalculator's pattern), a discount display that updates on selection, and a single "Book Now" CTA.

### Layout

```
[ LEFT COLUMN ]                         [ RIGHT COLUMN PANEL ]
Section heading                         [ Weekly | Biweekly | Monthly ]
Save up to 20%                          
                                        15% off your clean
✓ Weekly — 20% off every visit
✓ Biweekly — 15% off every clean       [ Book Recurring → ]
✓ Monthly — 10% off every clean

No contracts, cancel anytime.
```

### Persona Impact

| Persona | Impact |
|---|---|
| Travis | Interactive panel — must click a frequency before CTA. Marginally more friction than Strategy 2 |
| Diane | FR UI. State-driven discount text must use `t()` with interpolation — doable |
| Margaret | Two-column layout collapses to single on mobile. Interactive panel is familiar from QuoteCalculator, but adds a second stateful control for her to navigate |
| Sophie | Same as Diane |

### Risks
- Introduces React `useState` for selected frequency — adds complexity beyond what's needed for a simple section
- Two-column layout mirrors Hero exactly — risks feeling repetitive
- Right-panel with interactive segmented buttons creates perceptual overlap with QuoteCalculator (the section immediately above)
- Weakest differentiation from QuoteCalculator — risks user confusion about purpose of two interactive sections

---

## Recommended Strategy: **Strategy 2 — Three Frequency Cards**

**Why Strategy 2 over 1:** Individual CTAs let each persona enter the booking form at their preferred frequency in one tap — Strategy 1 forces everyone through the biweekly default.

**Why Strategy 2 over 3:** Strategy 3 introduces stateful interactivity that duplicates QuoteCalculator's UX pattern. Strategy 2 is purely presentational and follows the proven ServicesGrid card model. Three distinct cards with clear labels are faster to scan than a two-column panel with an interactive selector.

---

## Subagent Pre-checks (to run in Phase B)

**Brand_Auditor:**
- `bg-warm-white` section — ✓ alternates from ServicesGrid's `bg-cream`
- `bg-white border-sand shadow-sm` standard cards — ✓
- `bg-slate-brand border-slate-brand` inverted biweekly card — ✓
- `font-display text-4xl` heading, `font-sub text-2xl` card headings, `font-body text-base` all copy — ✓
- `rounded` (4px) on cards and all CTAs — no `rounded-lg` — ✓
- `min-h-[48px]` on all 3 CTAs — ✓

**Data_Steward:**
- No Firestore reads or writes — ✓
- Query params (`?freq=...`) match schema `frequency` values — ✓

**Linguistic_Auditor:**
- All strings via `t()` — ✓
- Frequency labels reuse existing `quote.frequency.*` keys — no duplication — ✓
- `recurring.bookCta` uses `{{freq}}` interpolation — not hardcoded — ✓

---

## Verification Checklist

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Persona test (Travis):** On 375px mobile, biweekly card is visible below ServicesGrid; "Book Biweekly" CTA taps through to `/booking?freq=biweekly`
4. **Persona test (Margaret):** All 3 CTAs register 48px or greater height; all text renders at 16px or larger on 768px iPad
5. **Persona test (Diane / Sophie):** Language toggle switches all card content to French; discount format `15 % de rabais` with space before `%`
6. **Background alternation:** Section is `bg-warm-white` immediately after ServicesGrid's `bg-cream`
7. **Scroll reveal:** Cards animate in as user scrolls; do not animate on page load
8. **Inverted card:** Biweekly card renders `bg-slate-brand`, white text, outlined CTA
9. **Mobile (375px):** Single column, no horizontal overflow
10. **Desktop (1024px+):** 3-column grid

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 2 — Three Frequency Cards. Awaiting approval before Phase B execution.
