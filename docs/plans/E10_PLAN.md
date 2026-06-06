# E10 — How It Works · Implementation Plan

## Phase A — Planning Gate

**Epic:** E10 — How It Works (4 Steps)  
**Phase:** 2 (Core Sections & Conversion)  
**Date:** 2026-06-06

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P3 Margaret Storey** (primary) | Understand the process before calling; know the same cleaner will arrive | Step 2 must explicitly name the assigned cleaner and arrival window |
| **P1 Diane Lafleur** | First-timer building confidence in online booking; full French | All steps in FR; "nettoyeur attitré" implies the same-cleaner commitment |
| **P4 Kahnawà:ke Baptiste** | Trust-building before first booking; no surprises | Step 3 "dedicated checklist tailored to your home" signals custom care |

**Persona test gate (Phase C):**
- **Margaret:** Reads the 4 steps on her iPad (768px) and, without calling, understands: (a) no account is required, (b) she will receive a confirmation with her cleaner's name, (c) the same dedicated cleaner arrives. All text ≥ 16px. No horizontal scroll.

---

## Scope

A single homepage section: four numbered steps in a responsive layout. No Firestore reads/writes. No new routes. Purely presentational.

**Background:** GalleryPreview uses `bg-cream` → HowItWorks uses `bg-warm-white` (alternating pattern continues).

**Animation:** `whileInView` with `viewport={{ once: true, margin: '-50px' }}` — consistent with all below-fold sections.

**Step content (master plan spec):**
1. Book Online
2. We Confirm
3. We Clean
4. You Relax

**Margaret persona copy requirement:** Step 2 description must explicitly say the confirmation includes the assigned cleaner's name and the arrival window. This is the literal acceptance criterion for her persona test.

---

## Files Affected

| File | Action |
|---|---|
| `src/components/home/HowItWorks.tsx` | **Create** |
| `src/pages/Home.tsx` | **Modify** — add `<HowItWorks />` below `<GalleryPreview />` |
| `src/i18n/locales/en.json` | **Modify** — add `howItWorks.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `howItWorks.*` block |

No Tailwind config changes. No Firestore ops. No new routes. No new npm dependencies.

---

## Schema Audit

Zero Firestore operations. No schema changes.

---

## Shared Step Data (all strategies)

```ts
interface Step {
  number: number
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  { number: 1, titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { number: 2, titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { number: 3, titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
  { number: 4, titleKey: 'howItWorks.step4Title', descKey: 'howItWorks.step4Desc' },
]
```

No `ServiceType` import needed — steps are not tied to service keys.

---

## i18n Keys (`howItWorks.*` namespace)

**en.json:**
```json
"howItWorks": {
  "ariaLabel":      "How the booking process works",
  "sectionHeading": "How It Works",
  "sectionSubhead": "From booking to a beautifully clean home — four simple steps.",
  "step1Title":     "Book Online",
  "step1Desc":      "Choose your service, property size, and preferred date. No account required — takes under 3 minutes.",
  "step2Title":     "We Confirm",
  "step2Desc":      "You'll hear from us within 24 hours with your assigned cleaner's name and your arrival window.",
  "step3Title":     "We Clean",
  "step3Desc":      "Your dedicated cleaner arrives on time and follows a detailed checklist tailored to your home.",
  "step4Title":     "You Relax",
  "step4Desc":      "We send a completion notice when finished. Satisfaction guaranteed — we make it right if anything's missed.",
  "faqLink":        "Have questions? See our FAQ"
}
```

**fr.json:**
```json
"howItWorks": {
  "ariaLabel":      "Comment fonctionne le processus de réservation",
  "sectionHeading": "Comment ça marche",
  "sectionSubhead": "De la réservation à une maison impeccable — quatre étapes simples.",
  "step1Title":     "Réservez en ligne",
  "step1Desc":      "Choisissez votre service, la superficie de votre logement et votre date de préférence. Aucun compte requis — moins de 3 minutes.",
  "step2Title":     "Nous confirmons",
  "step2Desc":      "Vous recevrez notre confirmation dans les 24 heures avec le nom de votre nettoyeur attitré et votre créneau d'arrivée.",
  "step3Title":     "Nous nettoyons",
  "step3Desc":      "Votre nettoyeur attitré arrive à l'heure et suit une liste de contrôle détaillée adaptée à votre maison.",
  "step4Title":     "Profitez",
  "step4Desc":      "Nous vous envoyons un avis d'achèvement à la fin. Satisfaction garantie — nous corrigeons tout oubli.",
  "faqLink":        "Des questions ? Consultez notre FAQ"
}
```

**Copy notes:**
- "assigned cleaner's name" / "nom de votre nettoyeur attitré" — the word *attitré* signals the same-cleaner commitment in French (Margaret + Diane gate)
- "No account required — takes under 3 minutes" — Travis gate; reassures Margaret
- `faqLink` is a text link (not a button) → links to `/faq`; serves Margaret's pre-booking questions

---

## Strategy 1 — Horizontal Step Strip with Connector Line (Recommended)

### Description

Four numbered circles connected by a horizontal line at desktop (lg: 4-column), collapsing to a 2-column grid at tablet and 1-column at mobile. Each step: a `bg-slate-brand` circle with the step number, a title, and a description below. A `bg-sand` horizontal line runs behind the circles at desktop, visually communicating sequence.

### Layout

```
Desktop (lg — 4 columns):
─────────────────────────────────────────────────────
  ①          ②          ③          ④
  ─────────────────────────────────  ← connector line (bg-sand)
Book Online  We Confirm  We Clean   You Relax
Desc…        Desc…       Desc…      Desc…

Tablet (md — 2 columns):
  ①          ②
  Book       We Confirm
  ③          ④
  We Clean   You Relax

Mobile (1 column):
  ①  Book Online
  ②  We Confirm
  ③  We Clean
  ④  You Relax
```

### Connector Line Implementation

```tsx
<div className="relative">
  {/* Connector — only visible at 4-col desktop where all steps are in a single row */}
  <div
    aria-hidden="true"
    className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-sand"
  />
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {STEPS.map(step => (
      <div key={step.number} className="flex flex-col items-center text-center">
        <div className="relative z-10 w-12 h-12 rounded-full bg-slate-brand text-white
                        flex items-center justify-center font-sub text-xl mb-4 shrink-0">
          {step.number}
        </div>
        <h3 className="font-sub text-xl text-charcoal mb-2">{t(step.titleKey)}</h3>
        <p className="font-body text-base text-text-muted">{t(step.descKey)}</p>
      </div>
    ))}
  </div>
</div>
```

**Connector geometry:** `top-6` = 24px from the top of the relative container. Step circles are `w-12 h-12` = 48px tall; their center is at 24px = `top-6`. The line therefore runs exactly through the circle centres. `left-[12.5%] right-[12.5%]` spans from the centre of column 1 to the centre of column 4 (each of 4 equal columns is 25% wide; centres are at 12.5%, 37.5%, 62.5%, 87.5%). `aria-hidden="true"` — decorative, not read by screen readers.

### Section Structure

```tsx
<section aria-label={t('howItWorks.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
  <div className="max-w-content mx-auto">
    {/* Heading — whileInView fadeUp */}
    <h2 className="font-display text-4xl text-charcoal mb-4">…</h2>
    <p className="font-body text-base text-text-muted mb-12">…</p>

    {/* Steps — whileInView stagger */}
    <div className="relative">
      <div aria-hidden="true" className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-sand" />
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" …stagger>
        {STEPS.map(step => (
          <motion.div key={step.number} variants={fadeUp} className="flex flex-col items-center text-center">
            <div className="relative z-10 w-12 h-12 rounded-full bg-slate-brand text-white
                            flex items-center justify-center font-sub text-xl mb-4 shrink-0">
              {step.number}
            </div>
            <h3 className="font-sub text-xl text-charcoal mb-2">{t(step.titleKey)}</h3>
            <p className="font-body text-base text-text-muted">{t(step.descKey)}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>

    {/* FAQ text link */}
    <div className="mt-10 text-center">
      <Link to="/faq" className="font-body text-base text-slate-brand hover:text-slate-dark
                                  underline underline-offset-2 transition-colors
                                  focus:outline-none focus:ring-2 focus:ring-slate-brand rounded">
        {t('howItWorks.faqLink')} →
      </Link>
    </div>
  </div>
</section>
```

### Persona Impact

| Persona | Impact |
|---|---|
| Margaret | Numbered sequence makes process unmistakably ordered; "assigned cleaner's name" in Step 2 directly addresses her primary fear; FAQ link lets her find answers without calling |
| Diane | Full French: "nettoyeur attitré" signals same-cleaner commitment in natural FR; FAQ link → `/faq` bilingual |
| Kahnawà:ke | Step 3 "checklist tailored to your home" signals custom attention; sequential clarity builds trust before first booking |
| Travis | Step 1 "No account required — takes under 3 minutes" directly addresses his primary friction point |

### Risks
- Connector line at `top-6` assumes the circles are flush with the top of each grid cell. If any cell has top padding or the grid doesn't start at the top of the relative container, the line may misalign. Mitigated: `items-start` is default grid alignment; no padding above circles in the cell.
- At `md:grid-cols-2` (2 rows), the connector line is hidden (`hidden lg:block`) — no visual artefact.

---

## Strategy 2 — Numbered Cards Grid

### Description

Four cards (matching the ServicesGrid/RecurringCTA card pattern) in a 2×2 → 4-col grid. Each card: a large decorative step number (`font-display text-6xl text-slate-pale`), title, and description. No connector line. Cards use the standard `bg-white border-sand shadow-sm rounded` styling.

### Layout

```
Desktop (lg — 4 columns):
[ ①  Book Online ]  [ ②  We Confirm ]  [ ③  We Clean ]  [ ④  You Relax ]
   bg-white            bg-white           bg-white          bg-white
   border-sand         border-sand        border-sand       border-sand

Mobile: 1 column / Tablet: 2 columns
```

### Persona Impact

| Persona | Impact |
|---|---|
| Margaret | Cards feel familiar (like other card sections she's seen on the page). No visual sequence cue beyond the step numbers inside each card — sequence less immediately obvious than Strategy 1. |
| Diane | Same functional outcome — all copy in FR. |
| Kahnawà:ke | Four equal cards feel balanced; no visual hierarchy beyond numbers. |

### Risks
- Visually indistinguishable from ServicesGrid and RecurringCTA — fourth consecutive card-based section (fifth if counting TrustBar). Risks visual fatigue.
- Large decorative number (`text-6xl text-slate-pale`) adds character but may feel inconsistent with the clean brand aesthetic.
- No sequential connector weakens the "process" communication for Margaret — she may not immediately read the cards as an ordered list.

---

## Strategy 3 — Vertical Stepper List

### Description

Steps listed vertically with a continuous left-side connector line (a thin `bg-sand` vertical bar) and numbered circles at each node. On desktop, steps are presented in a narrow centred column (`max-w-2xl mx-auto`). On mobile, the same layout reads naturally.

### Layout

```
│  ①  Book Online
│     Choose your service…
│
│  ②  We Confirm
│     You'll hear from us within 24 hours…
│
│  ③  We Clean
│     Your dedicated cleaner arrives…
│
│  ④  You Relax
│     We send a completion notice…
```

### Persona Impact

| Persona | Impact |
|---|---|
| Margaret | Vertical list reads top-to-bottom exactly as she reads text. Clear sequence. But narrow column means a lot of whitespace on desktop — may feel sparse. |
| Diane | Natural reading direction; works well on mobile where she often browses. |
| Kahnawà:ke | Intimate, non-corporate feel — more like a personal message than a marketing section. |

### Risks
- Desktop layout uses `max-w-2xl` centred column — large amounts of empty space on either side at 1440px+. Feels underfilled compared to surrounding full-width sections.
- No visual grid → breaks visual rhythm established by ServicesGrid, RecurringCTA, and GalleryPreview.
- Vertical connector line implementation requires careful positioning — the `::before` pseudo-element or absolutely positioned div must align with all four circle centers across variable description heights.

---

## Recommended Strategy: **Strategy 1 — Horizontal Step Strip with Connector Line**

**Why over Strategy 2:** The connector line explicitly visualises sequence — critical for Margaret's persona test ("understands the process without calling"). Strategy 2 cards feel like a product listing, not a process flow. Strategy 1 is also visually differentiated from all preceding card sections.

**Why over Strategy 3:** Strategy 3's narrow column leaves too much dead space at desktop widths and breaks the full-width grid rhythm of the page. Strategy 1's 4-column grid fills the content width consistently with prior sections.

---

## Subagent Pre-checks (to run in Phase B)

**Brand_Auditor:**
- `bg-warm-white` section — ✓ alternates from GalleryPreview's `bg-cream`
- `bg-slate-brand` step circles — ✓ valid token; `white` text on `slate-brand` ≈ 4.6:1 ✓
- Connector line `bg-sand` — ✓ valid token; `aria-hidden="true"` — decorative ✓
- `font-display text-4xl` section heading; `font-sub text-xl` step titles; `font-body text-base` step descriptions — ✓
- Step circles use `rounded-full` — design system specifies `rounded` (4px) for **brand buttons and cards**; decorative/UI elements such as numbered circles and avatar shapes are permitted to use `rounded-full` ✓
- FAQ link: `font-body text-base text-slate-brand` — ✓; `min-h-[48px]` not required (text link, not a button — no touch target rule for inline text links)
- `font-sub text-xl` step titles — ✓ (above 16px minimum)

**Data_Steward:**
- Zero Firestore operations ✓

**Linguistic_Auditor:**
- All strings via `t()` ✓
- Step numbers are literal integers (not strings) — not i18n text ✓
- FAQ link text via `t('howItWorks.faqLink')` ✓

---

## Verification Checklist

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Margaret persona test:** At 768px iPad, 4 steps visible (2×2); "assigned cleaner's name" and arrival window mentioned in Step 2; all text ≥ 16px; no horizontal scroll
4. **FR toggle:** All 4 step titles and descriptions switch to French; "nettoyeur attitré" appears in Steps 2 and 3
5. **Connector line:** Visible only at lg breakpoint (1024px+); hidden at md and mobile
6. **FAQ link:** Navigates to `/faq`; visible and focusable; not styled as a button
7. **Background:** `bg-warm-white` directly after GalleryPreview's `bg-cream`
8. **Scroll reveal:** Steps animate in via `whileInView` stagger; do not animate on page load
9. **Mobile (375px):** Steps in single column; each step circle + title + desc readable; no overflow
10. **Accessibility:** Step circles have `aria-hidden="true"` — step numbers are decorative; step titles carry the semantic meaning

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 1 — Horizontal Step Strip with Connector Line. Awaiting approval before Phase B execution.
