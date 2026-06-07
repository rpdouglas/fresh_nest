# E11 — Meet Your Team · Implementation Plan

## Phase A — Planning Gate

**Epic:** E11 — Meet Your Team  
**Phase:** 2 (Core Sections & Conversion)  
**Date:** 2026-06-06

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P1 Diane Lafleur** (primary) | See real photos and names; French-bilingual bio; same-cleaner guarantee | All card copy via `t()`; FR bio must exist; "nettoyeur attitré" language visible |
| **P3 Margaret Storey** (primary) | Know who is coming to her home; same cleaner every visit | Section explicitly states consistent cleaner assignment; name + role visible |
| **P4 Kahnawà:ke Baptiste** | Human connection before first booking | Real names and bios signal a genuine local business, not a franchise |

**Persona test gate (Phase C):**
- **Diane:** Toggle to FR → Meet Your Team section visible → at minimum one bio in French with no English-only text in the section. The consistent-cleaner commitment is stated in French.
- **Margaret:** The section makes clear — without her having to call — that the same cleaner is assigned to her home on repeat visits.

---

## Scope

A single homepage section. No Firestore reads in Phase 2 — team member data is **hardcoded in the component** (a static data array). The data structure accepts `photoSrc: string | null` — E27 (real photography) sets real image paths with no component changes needed. Placeholder cards use an initials-based avatar component.

**Background:** HowItWorks uses `bg-warm-white` → MeetTheTeam uses `bg-cream` (alternating pattern).

**Animation:** `whileInView` — consistent with all below-fold sections.

**Master plan requirement:** "Mention of 'consistent cleaner assignment' explicitly on this section." All three strategies satisfy this — the differentiator is *how prominently* it is displayed.

**Placeholder names:** Phase 2 cards use `"Ryan D."` (owner) and `"Cleaner Name"` (generic placeholder). Real names, photos, and bios are supplied in E27 before launch. This is noted in the close report.

---

## Files Affected

| File | Action |
|---|---|
| `src/components/home/MeetTheTeam.tsx` | **Create** |
| `src/components/ui/TeamAvatar.tsx` | **Create** — null-safe avatar; initials placeholder when `photoSrc` is null |
| `src/pages/Home.tsx` | **Modify** — add `<MeetTheTeam />` below `<HowItWorks />` |
| `src/i18n/locales/en.json` | **Modify** — add `team.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `team.*` block |

No Tailwind config changes. No Firestore ops. No new routes. No new npm dependencies.

---

## Schema Audit

Zero Firestore operations. Team data is static — Phase 2 uses a hardcoded array. If a `team` Firestore collection is added in Phase 5+, the component will be refactored at that time (not pre-built now per CLAUDE.md: "Don't design for hypothetical future requirements").

---

## Shared Data Structure (all strategies)

```ts
interface TeamMember {
  id: string
  name: string          // proper noun — same in EN/FR; not i18n
  roleKey: string       // i18n key → team.members.[id].role
  bioKey: string        // i18n key → team.members.[id].bio
  initials: string      // for avatar placeholder (1–2 chars)
  photoSrc: string | null   // null = placeholder; E27 sets real path
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'ryan',
    name: 'Ryan D.',
    roleKey: 'team.members.ryan.role',
    bioKey:  'team.members.ryan.bio',
    initials: 'R',
    photoSrc: null,
  },
  {
    id: 'cleaner-1',
    name: 'Cleaner Name',        // placeholder — replaced in E27
    roleKey: 'team.members.cleanerPlaceholder.role',
    bioKey:  'team.members.cleanerPlaceholder.bio',
    initials: '★',
    photoSrc: null,
  },
]
```

**`TeamAvatar` component** (shared across all strategies):

```tsx
// src/components/ui/TeamAvatar.tsx
function TeamAvatar({ src, name, initials }: { src: string | null; name: string; initials: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover object-top"
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className="w-full h-full flex items-center justify-center bg-slate-pale"
    >
      <span className="font-display text-4xl text-slate-brand">{initials}</span>
    </div>
  )
}
```

The `aria-hidden` on the placeholder div is correct: the `<img alt={name}>` carries accessibility when real. For the placeholder, the card's `<h3>{name}</h3>` heading already announces the name — the avatar div adds no new information.

---

## i18n Keys (`team.*` namespace)

**en.json:**
```json
"team": {
  "ariaLabel":        "Meet the Fresh Nest Co. cleaning team",
  "sectionHeading":   "Meet Your Team",
  "sectionSubhead":   "Real people who care about your home.",
  "assignmentNote":   "We assign the same dedicated cleaner to your home — every visit, every time. Request your preferred cleaner when booking.",
  "photoAlt":         "Photo of {{name}}",
  "members": {
    "ryan": {
      "role": "Owner & Lead Cleaner",
      "bio":  "Ryan founded Fresh Nest Co. to bring professional, reliable cleaning to Cornwall and surrounding communities. He personally manages every booking and ensures your home is cared for to the highest standard."
    },
    "cleanerPlaceholder": {
      "role": "Cleaning Specialist",
      "bio":  "Our team is growing. Real cleaner profiles — with photos and bios — will be added before launch."
    }
  }
}
```

**fr.json:**
```json
"team": {
  "ariaLabel":        "Rencontrez l'équipe de nettoyage Fresh Nest Co.",
  "sectionHeading":   "Rencontrez votre équipe",
  "sectionSubhead":   "Des personnes réelles qui se soucient de votre maison.",
  "assignmentNote":   "Nous attribuons le même nettoyeur attitré à votre domicile — à chaque visite, sans exception. Demandez votre nettoyeur préféré lors de la réservation.",
  "photoAlt":         "Photo de {{name}}",
  "members": {
    "ryan": {
      "role": "Propriétaire et nettoyeur principal",
      "bio":  "Ryan a fondé Fresh Nest Co. pour offrir un service de nettoyage professionnel et fiable à Cornwall et aux communautés environnantes. Il supervise personnellement chaque réservation et veille à ce que votre maison soit entretenue selon les plus hauts standards."
    },
    "cleanerPlaceholder": {
      "role": "Spécialiste en nettoyage",
      "bio":  "Notre équipe s'agrandit. Les profils réels des nettoyeurs — avec photos et biographies — seront ajoutés avant le lancement."
    }
  }
}
```

**FR copy notes:**
- "nettoyeur attitré" in `assignmentNote` — same terminology as HowItWorks Steps 2 & 3; consistent language across the page
- "Propriétaire et nettoyeur principal" — natural FR job title (no slash; French uses "et")
- "Notre équipe s'agrandit" — honest, forward-looking; better than "Placeholder" for a real business preview

---

## Strategy 1 — Card Grid, Assignment Message in Subhead

### Description

Two team member cards in a centered 1→2 column grid. Section heading + subhead contain all content — the subhead carries the consistent-assignment message. No separate visual callout. Clean and minimal.

### Layout

```
[ Meet Your Team ]
[ "Real people who care for your home — the same dedicated cleaner, every visit." ]

[ Ryan D.         ]  [ Cleaner Name    ]
[ Owner & Lead    ]  [ Specialist      ]
[ Bio text…       ]  [ Bio text…       ]
```

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | Consistent-cleaner message is in the subhead — present but easy to miss |
| Margaret | Must read the subhead carefully to find the same-cleaner commitment; could scroll past it |
| Kahnawà:ke | Sees names and bios — human connection present |

### Risks
- Master plan requires consistent assignment to be mentioned "explicitly" — buried in the subhead may not satisfy "explicit" for a user who skims
- Margaret specifically fears not knowing — the message needs to be unmissable for her persona test to pass

---

## Strategy 2 — Card Grid + Assignment Callout Band (Recommended)

### Description

Section heading + subhead, followed by a distinct `bg-slate-pale border border-sand rounded` callout band containing a checkmark, the consistent-assignment statement, and a link to the booking form's "preferred cleaner" option. Team member cards below in a 1→2 column grid. The callout is visually unmistakable — it cannot be skimmed past.

### Layout

```
[ Meet Your Team ]
[ "Real people who care about your home." ]

┌─────────────────────────────────────────────────────┐
│ ✓  We assign the same dedicated cleaner to your     │  ← bg-slate-pale
│    home — every visit, every time. Request your     │    border border-sand
│    preferred cleaner when booking.          [ Book ] │    rounded
└─────────────────────────────────────────────────────┘

[ Ryan D.              ]  [ Cleaner Name         ]
[ avatar  Owner & Lead ]  [ avatar  Specialist   ]
[ Bio text…            ]  [ Bio text…            ]
```

### Callout Component

```tsx
<div className="flex items-start gap-4 bg-slate-pale border border-sand rounded p-5 mb-10">
  {/* Check icon */}
  <div className="shrink-0 w-6 h-6 text-slate-brand mt-0.5" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
         strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>

  <div className="flex-1">
    <p className="font-body text-base text-charcoal">{t('team.assignmentNote')}</p>
  </div>

  <Link
    to="/booking"
    className="shrink-0 inline-flex items-center font-body font-medium text-base
               text-slate-brand hover:text-slate-dark underline underline-offset-2
               transition-colors min-h-[48px] focus:outline-none focus:ring-2
               focus:ring-slate-brand rounded px-1"
  >
    {t('common.bookNow')}
  </Link>
</div>
```

### Card Layout

```tsx
// Cards: 1-col mobile → 2-col desktop, centered (not 3-col — 2 cards only)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
  {TEAM_MEMBERS.map(member => (
    <div className="bg-white border border-sand rounded shadow-sm overflow-hidden">
      {/* Avatar — square, full width */}
      <div className="aspect-square">
        <TeamAvatar src={member.photoSrc} name={member.name} initials={member.initials} />
      </div>
      {/* Info */}
      <div className="p-5">
        <h3 className="font-sub text-xl text-charcoal mb-1">{member.name}</h3>
        <p className="font-body text-sm text-slate-brand font-medium mb-3">
          {t(member.roleKey)}
        </p>
        <p className="font-body text-base text-text-muted">{t(member.bioKey)}</p>
      </div>
    </div>
  ))}
</div>
```

**Avatar aspect ratio:** `aspect-square` — equal width and height, consistent across all cards regardless of content below. Makes the placeholder initials look intentional and professional.

**Role text:** `text-sm font-medium text-slate-brand` — design system allows `text-sm` for supplemental labels (same documented exception as discount badges). Role is not body copy.

**Max-width constraint:** `max-w-2xl mx-auto` centers the 2-card grid without stretching cards to extreme widths on wide screens. Consistent with the principle of content-appropriate max-widths (QuoteCalculator also uses `max-w-2xl`).

### Section Structure

```tsx
<section aria-label={t('team.ariaLabel')} className="bg-cream py-12 px-4 md:py-20 md:px-6">
  <div className="max-w-content mx-auto">
    {/* Heading — whileInView fadeUp */}
    <motion.div ...>
      <h2>{t('team.sectionHeading')}</h2>
      <p>{t('team.sectionSubhead')}</p>
    </motion.div>

    {/* Assignment callout — whileInView fadeUp */}
    <motion.div ...>
      <div className="flex items-start gap-4 bg-slate-pale border border-sand rounded p-5 mb-10">
        …checkmark + assignmentNote + Book Now link…
      </div>
    </motion.div>

    {/* Cards — whileInView stagger */}
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto" ...>
      {TEAM_MEMBERS.map(member => (
        <motion.div key={member.id} variants={fadeUp}>
          <article className="bg-white border border-sand rounded shadow-sm overflow-hidden">
            …avatar + name + role + bio…
          </article>
        </motion.div>
      ))}
    </motion.div>
  </div>
</section>
```

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | Callout is unmissable in FR: "Nous attribuons le même nettoyeur attitré à votre domicile — à chaque visite, sans exception." Bilingual bio for Ryan. Photo placeholder signals real person coming. |
| Margaret | Callout is a distinct visual element she cannot skip past. "Same dedicated cleaner" + "Request your preferred cleaner when booking" — answers her exact fear. Booking link in callout reduces friction. |
| Kahnawà:ke | Ryan's genuine founder bio establishes the business as local and owner-operated — not a franchise. Human names and photos (placeholder now, real in E27) build the trust signal. |

### Risks
- Two-card layout looks sparse if the business grows to 5+ team members — mitigated: adding cards to `TEAM_MEMBERS` array requires zero component changes
- `text-sm` on role label — documented exception (supplemental label, not body copy)
- Callout + card grid may feel like two separate sections at first glance — mitigated by shared `bg-cream` background and consistent spacing

---

## Strategy 3 — Featured Owner Card + Sub-Grid

### Description

Owner gets a visually prominent half-width (md:col-span-1 in a 2-col grid) card with inverted `bg-slate-brand` styling and a longer bio. Remaining cleaner cards share the other half in a stacked mini-grid. The assignment note is integrated into the featured card copy.

### Layout

```
[ Meet Your Team ]
[ Subhead ]

┌──────────────────────┐  ┌────────────────────┐
│                      │  │ Cleaner Name       │
│  R                   │  │ Specialist         │
│                      │  │ Bio…               │
│  Ryan D.             │  └────────────────────┘
│  Owner & Lead        │  ┌────────────────────┐
│  Bio + "I personally │  │ + Add your cleaner │
│  assign your         │  │ (slot available)   │
│  dedicated cleaner"  │  └────────────────────┘
└──────────────────────┘
bg-slate-brand (inverted)  bg-white border-sand
```

### Persona Impact

| Persona | Impact |
|---|---|
| Diane | Featured owner card signals owner accountability — strong trust. Inverted card is visually distinctive. |
| Margaret | Assignment message embedded in owner card bio — present but not as prominent as a standalone callout. |
| Kahnawà:ke | Owner's face (when E27 runs) + personal statement establishes genuine local relationship. |

### Risks
- Inverted owner card creates fourth use of `bg-slate-brand` inversion on the page (Commercial card, Biweekly card, and now owner card) — risks diminishing the visual impact of the inversion pattern
- Assignment message embedded in the bio is less prominent than a standalone callout — Margaret may miss it
- Asymmetric layout is more complex to implement and harder to extend when more cleaners are added
- The "slot available" placeholder card language is awkward for a real business preview

---

## Recommended Strategy: **Strategy 2 — Card Grid + Assignment Callout Band**

**Why over Strategy 1:** The master plan requires consistent assignment to be mentioned "explicitly." A callout band is unmissable; a subhead is skimmable. Margaret's persona test requires she understand this without calling — the callout makes it impossible to miss.

**Why over Strategy 3:** Strategy 3 uses the inverted `bg-slate-brand` pattern a fourth time, diluting its visual impact. The asymmetric layout is harder to maintain as the team grows. And the assignment message is less prominent than a dedicated callout band.

---

## Subagent Pre-checks (to run in Phase B)

**Brand_Auditor:**
- `bg-cream` section — ✓ alternates from HowItWorks's `bg-warm-white`
- `bg-slate-pale border border-sand rounded` callout — ✓ valid tokens; `rounded` (4px) ✓
- `bg-white border border-sand shadow-sm rounded` cards — ✓
- `font-display text-4xl` heading; `font-sub text-xl` card names; `font-body text-base` bios — ✓ all ≥ 16px
- `text-sm font-medium text-slate-brand` role labels — ✓ design system permits `text-sm` for supplemental labels
- Callout `Book Now` link: `min-h-[48px]` ✓
- `text-slate-brand` on `bg-slate-pale` — contrast check: `#5b7e8f` on `#d6e5ec` ≈ 3.0:1 (below 4.5:1) ⚠ — use `text-charcoal` for the `assignmentNote` body text; reserve `text-slate-brand` only for the role label and links where it's not the sole visual indicator

**Contrast fix:** `assignmentNote` body text → `text-charcoal` on `bg-slate-pale` ≈ 9.0:1 ✓. The checkmark icon is decorative (`aria-hidden`). The `Book Now` link uses `text-slate-brand underline` — underline provides the link indicator so colour is not the sole indicator ✓.

**Data_Steward:**
- Zero Firestore ops ✓

**Linguistic_Auditor:**
- All strings via `t()` ✓
- Member `name` is a proper noun, same in EN/FR — not i18n text ✓
- `team.photoAlt` uses `{{name}}` interpolation ✓
- `assignmentNote` fully translated including "nettoyeur attitré" ✓

---

## Verification Checklist

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Diane test:** FR locale → section heading = "Rencontrez votre équipe"; callout = "Nous attribuons le même nettoyeur attitré…"; Ryan's bio in French; no English-only text visible
4. **Margaret test:** Callout band is visible and distinct; "same dedicated cleaner" and "every visit" language present; all text ≥ 16px; Book Now link `min-h-[48px]`; no horizontal scroll at 768px
5. **Kahnawà:ke test:** Ryan D. card shows real name, role, and personal bio — signals local owner-operated business
6. **Background:** `bg-cream` directly after HowItWorks's `bg-warm-white` ✓
7. **Contrast:** `assignmentNote` body text uses `text-charcoal` (not `text-slate-brand`) on `bg-slate-pale` ✓
8. **Mobile (375px):** Cards in single column; avatar square fills card width; no overflow
9. **Tablet (768px):** 2-column card grid; callout visible above cards
10. **Scroll reveal:** All elements animate in via `whileInView`; nothing animates on page load

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 2 — Card Grid + Assignment Callout Band. Awaiting approval before Phase B execution.
