# E14 — FAQ Page · Implementation Plan

## Phase A — Planning Gate

**Epic:** E14 — FAQ Section + /faq Page
**Phase:** 2 (Content & Conversion) — final Phase 2 epic
**Date:** 2026-06-07

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P3 Margaret Storey** (primary) | Finds answer to "Can I request the same cleaner?" without calling; reads answers comfortably | Clear, reassuring answer to same-cleaner question; all text ≥ 16px; bottom CTA has tappable `tel:` phone link |
| **P1 Diane Lafleur** (primary) | Eco-products question answered in French; complete FR FAQ | All answers via `t()`; FR translations for all 10 Q&A pairs |
| **P6 Gallagher** (primary) | "What is included in the Airbnb Turnover package?" has a specific, complete answer | Answer explicitly lists: full clean, linen changeover, toiletry restocking, damage photos, 11am–3pm window |
| **P4 Kahnawà:ke Baptiste** | "Do you serve Cornwall Island / Akwesasne?" answered directly | Answer says "we cross the bridge" — same explicit language as the location page |
| **P5 Sophie Tremblay-Gagnon** | "Do you serve Snye QC?" answered directly; eco-products question in French | Both questions answered; eco-products answer mentions baby-safe |
| **P2 Travis McLeod** | Finds FAQ fast; booking CTA at the bottom | Bottom CTA section with `min-h-[48px]` Book Now button |

**Persona test gate (Phase C):**
- **Margaret:** Navigate to `/faq` from the homepage HowItWorks link → locate "Can I request the same cleaner every visit?" → answer visible on screen, clearly reassuring, without needing to call.
- **Diane:** Toggle to FR → all 10 questions and answers in French; eco-products answer mentions "produits à base végétale" and "sûrs pour les animaux".
- **Gallagher:** "Airbnb Turnover package" answer explicitly lists linen, toiletries, damage photos, and 11am–3pm window.

---

## Scope

A single `/faq` page. No homepage FAQ section — the homepage already links to `/faq` via the HowItWorks `faqLink` ("Have questions? See our FAQ"). The page contains:
- React 19 head tags (`<title>`, `<meta name="description">`)
- Page hero
- 10-item accordion FAQ list
- Bottom CTA section (phone + Book Now)

All 10 FAQ items are bilingual; answers live in `en.json` / `fr.json`. No Firestore ops. No new dependencies.

---

## Files Affected

| File | Action |
|---|---|
| `src/pages/FaqPage.tsx` | **Create** — `/faq` page with multi-open accordion |
| `src/App.tsx` | **Modify** — replace PlaceholderPage at `/faq` with `<FaqPage />` |
| `src/i18n/locales/en.json` | **Modify** — add `faq.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `faq.*` block |

No new lib data files — FAQ item keys are a module-scoped constant in `FaqPage.tsx`. No Tailwind config changes. No Firestore ops.

---

## Schema Audit

Zero Firestore reads/writes. All content is static i18n strings.

---

## FAQ Item Data (module-scoped constant in `FaqPage.tsx`)

```ts
interface FaqItem {
  id: string
  qKey: string
  aKey: string
}

const FAQ_ITEMS: FaqItem[] = [
  { id: 'home',        qKey: 'faq.item1.q', aKey: 'faq.item1.a' },
  { id: 'eco',         qKey: 'faq.item2.q', aKey: 'faq.item2.a' },
  { id: 'same-cleaner',qKey: 'faq.item3.q', aKey: 'faq.item3.a' },
  { id: 'akwesasne',   qKey: 'faq.item4.q', aKey: 'faq.item4.a' },
  { id: 'snye',        qKey: 'faq.item5.q', aKey: 'faq.item5.a' },
  { id: 'airbnb',      qKey: 'faq.item6.q', aKey: 'faq.item6.a' },
  { id: 'reschedule',  qKey: 'faq.item7.q', aKey: 'faq.item7.a' },
  { id: 'insured',     qKey: 'faq.item8.q', aKey: 'faq.item8.a' },
  { id: 'guarantee',   qKey: 'faq.item9.q', aKey: 'faq.item9.a' },
  { id: 'payment',     qKey: 'faq.item10.q', aKey: 'faq.item10.a' },
]
```

`id` is a semantic slug used for the React `key` prop and ARIA IDs. Not an i18n key.

---

## i18n Keys (`faq.*`)

**en.json:**

```json
"faq": {
  "pageTitle":    "FAQ | Fresh Nest Co.",
  "metaDesc":     "Frequently asked questions about Fresh Nest Co. cleaning services — booking, products, coverage, and pricing.",
  "heading":      "Frequently Asked Questions",
  "subhead":      "Quick answers about booking, services, and what to expect.",
  "ctaHeading":   "Still have questions?",
  "ctaSubhead":   "We're happy to help — call us or book online.",
  "item1": {
    "q": "Do I need to be home during the clean?",
    "a": "No, you don't need to be home. Many clients provide a key or entry code. We treat your home with complete respect and care whether you're present or not. All staff are background-checked and bonded."
  },
  "item2": {
    "q": "What eco-friendly products do you use? Are they pet-safe?",
    "a": "We use plant-based, non-toxic cleaning products that are safe for children and pets. We're happy to use your preferred products or avoid specific ingredients — just let us know in your booking notes."
  },
  "item3": {
    "q": "Can I request the same cleaner every visit?",
    "a": "Yes — and we highly recommend it. We assign the same dedicated cleaner to your home on every visit whenever possible. If you'd like to request a specific team member, note their name in your booking form and we'll do our best to accommodate."
  },
  "item4": {
    "q": "Do you serve Cornwall Island / Akwesasne?",
    "a": "Yes. We cross the Seaway International Bridge and serve Cornwall Island and the broader Akwesasne community. Please include your island address and any bridge access details in your booking notes."
  },
  "item5": {
    "q": "Do you serve Snye, QC?",
    "a": "Yes. We travel to Snye and the Quebec side of Akwesasne. Standard, deep clean, and move-out cleaning are available. Service is fully bilingual — book in English or French."
  },
  "item6": {
    "q": "What is included in the Airbnb Turnover package?",
    "a": "Our Airbnb Turnover includes: full cleaning and sanitization of all rooms, linen and towel changeover, toiletry restocking, damage documentation photos upon completion, and guest-ready staging. Turnovers are typically completed within the 11am–3pm checkout-to-check-in window."
  },
  "item7": {
    "q": "How do I reschedule or cancel?",
    "a": "Call us or reply to your confirmation email. We ask for at least 24 hours' notice for rescheduling or cancellation. Cancellations with less than 24 hours' notice may be subject to a short-notice fee."
  },
  "item8": {
    "q": "Are you insured and bonded?",
    "a": "Yes. Fresh Nest Co. is fully insured and bonded. All staff undergo background checks before their first booking. You can request a copy of our insurance certificate at any time."
  },
  "item9": {
    "q": "Do you offer a satisfaction guarantee?",
    "a": "Yes. If you're not fully satisfied with your clean, contact us within 24 hours and we'll return to make it right — at no additional charge."
  },
  "item10": {
    "q": "What payment methods do you accept?",
    "a": "We accept Interac e-Transfer, credit card (Visa, Mastercard), and cash. Payment is due at the time of service. For recurring clients, automatic billing can be arranged."
  }
}
```

**fr.json** (complete, all 10 pairs):

```json
"faq": {
  "pageTitle":    "FAQ | Fresh Nest Co.",
  "metaDesc":     "Questions fréquentes sur les services de nettoyage Fresh Nest Co. — réservation, produits, zones desservies et tarifs.",
  "heading":      "Questions fréquentes",
  "subhead":      "Réponses rapides sur la réservation, les services et ce à quoi vous attendre.",
  "ctaHeading":   "Vous avez d'autres questions ?",
  "ctaSubhead":   "Nous sommes là pour vous aider — appelez-nous ou réservez en ligne.",
  "item1": {
    "q": "Dois-je être à la maison pendant le nettoyage ?",
    "a": "Non, vous n'avez pas besoin d'être présent. De nombreux clients nous laissent une clé ou un code d'entrée. Nous traitons votre domicile avec tout le respect qu'il mérite, que vous soyez là ou non. Tout notre personnel a fait l'objet d'une vérification des antécédents et est cautionné."
  },
  "item2": {
    "q": "Quels produits écologiques utilisez-vous ? Sont-ils sûrs pour les animaux ?",
    "a": "Nous utilisons des produits de nettoyage à base végétale, non toxiques et sûrs pour les enfants et les animaux de compagnie. Nous pouvons également utiliser vos propres produits ou éviter certains ingrédients — il suffit de le mentionner dans les notes de réservation."
  },
  "item3": {
    "q": "Puis-je demander le même nettoyeur à chaque visite ?",
    "a": "Oui — et nous le recommandons vivement. Nous attribuons le même nettoyeur attitré à votre domicile à chaque visite dans la mesure du possible. Si vous souhaitez un membre d'équipe en particulier, indiquez son nom dans votre formulaire de réservation et nous ferons notre possible pour répondre à votre demande."
  },
  "item4": {
    "q": "Desservez-vous l'île de Cornwall / Akwesasne ?",
    "a": "Oui. Nous traversons le pont international Seaway et desservons l'île de Cornwall et la communauté d'Akwesasne. Veuillez indiquer votre adresse sur l'île et les instructions d'accès dans les notes de réservation."
  },
  "item5": {
    "q": "Desservez-vous Snye, QC ?",
    "a": "Oui. Nous nous déplaçons à Snye et du côté québécois d'Akwesasne. Nettoyage standard, en profondeur et de déménagement disponibles. Service entièrement bilingue — réservez en français ou en anglais."
  },
  "item6": {
    "q": "Qu'est-ce qui est inclus dans le forfait Rotation Airbnb ?",
    "a": "Notre forfait Rotation Airbnb comprend : nettoyage et désinfection complets de toutes les pièces, changement du linge de lit et des serviettes, réapprovisionnement des articles de toilette, photos de documentation des dommages à la fin du nettoyage, et mise en scène pour les invités. Les rotations sont généralement effectuées dans le créneau 11h–15h."
  },
  "item7": {
    "q": "Comment puis-je reporter ou annuler ?",
    "a": "Appelez-nous ou répondez à votre courriel de confirmation. Nous demandons un préavis d'au moins 24 heures pour tout report ou annulation. Les annulations avec moins de 24 heures de préavis peuvent faire l'objet de frais d'annulation tardive."
  },
  "item8": {
    "q": "Êtes-vous assuré et cautionné ?",
    "a": "Oui. Fresh Nest Co. est entièrement assuré et cautionné. Tout le personnel fait l'objet d'une vérification des antécédents avant leur première réservation. Vous pouvez demander une copie de notre certificat d'assurance en tout temps."
  },
  "item9": {
    "q": "Offrez-vous une garantie de satisfaction ?",
    "a": "Oui. Si vous n'êtes pas entièrement satisfait de votre nettoyage, contactez-nous dans les 24 heures et nous reviendrons pour corriger le problème — sans frais supplémentaires."
  },
  "item10": {
    "q": "Quels modes de paiement acceptez-vous ?",
    "a": "Nous acceptons le virement Interac, les cartes de crédit (Visa, Mastercard) et l'argent comptant. Le paiement est dû au moment du service. Pour les clients récurrents, la facturation automatique peut être organisée."
  }
}
```

**FR copy notes:**
- Item 2: "produits de nettoyage à base végétale, non toxiques et sûrs pour les enfants et les animaux" — Diane's eco gate; Sophie's baby-safe gate ✓
- Item 3: "nettoyeur attitré" — consistent terminology with HowItWorks Steps 2 & 3, MeetTheTeam callout ✓
- Item 4: "l'île de Cornwall" — consistent with Akwesasne location page ✓
- Item 6: "créneau 11h–15h" — consistent with Airbnb service card description ✓
- `ctaHeading`: space before `?` per French typographic convention ✓

---

## Strategy 1 — Single-Open Accordion

### Description

`useState<number | null>(null)` — one item open at a time. Clicking an open item closes it; clicking a closed item closes the current one and opens the new one. The most common FAQ pattern.

### State Logic

```ts
const [activeIndex, setActiveIndex] = useState<number | null>(null)
const toggle = (i: number) =>
  setActiveIndex(prev => (prev === i ? null : i))
```

### Persona Impact

| Persona | Impact |
|---|---|
| Margaret | Finds "same cleaner" answer; but if she wants to check a second question she must close the first one first — minor friction for a careful reader |
| Diane | Works fine; answers in French |
| Gallagher | Finds Airbnb answer; clear and complete |

### Risks
- Margaret reads every word carefully — closing one answer to read another adds friction. If she has the same-cleaner answer open and wants to also check the guarantee, she loses the first answer.
- Single-open is the convention, so users will understand it — but it's suboptimal for a "read all carefully" persona.

---

## Strategy 2 — Multi-Open Accordion (Recommended)

### Description

`useState<Set<number>>(new Set())` — any number of items can be open simultaneously. Clicking a closed item opens it; clicking an open item closes it. Margaret can read "Can I request the same cleaner?" and "Are you insured and bonded?" side by side without losing either answer.

### State Logic

```ts
const [openItems, setOpenItems] = useState<Set<number>>(new Set())

const toggle = (i: number) => {
  setOpenItems(prev => {
    const next = new Set(prev)
    if (next.has(i)) {
      next.delete(i)
    } else {
      next.add(i)
    }
    return next
  })
}
```

### Accordion Item

```tsx
{FAQ_ITEMS.map((item, i) => {
  const isOpen = openItems.has(i)
  return (
    <div key={item.id} className="border-b border-sand last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
        onClick={() => toggle(i)}
        className="w-full flex items-center justify-between gap-4
                   py-5 font-sub text-lg text-charcoal text-left
                   hover:text-slate-brand transition-colors
                   focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-inset
                   min-h-[48px]"
      >
        <span>{t(item.qKey)}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
          className="shrink-0 text-slate-brand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
               className="w-5 h-5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            key={`answer-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="font-body text-base text-charcoal pb-5 pr-6 leading-relaxed">
              {t(item.aKey)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})}
```

**Question text:** `font-sub text-lg` (Marcellus, ~18px) — slightly larger than body text to create visual hierarchy between question and answer. `text-lg` = 1.125rem (18px) ≥ 16px ✓.

**Answer text:** `font-body text-base text-charcoal leading-relaxed` — 16px, standard body copy.

**Chevron:** `motion.span` with `rotate: isOpen ? 180 : 0` — smooth 0.2s rotation. `aria-hidden="true"` since the rotation is decorative; `aria-expanded` on the button conveys state to screen readers.

**Divider:** `border-b border-sand last:border-b-0` — bottom border on each item except the last; consistent with the `sand` design token for dividers.

**ARIA pattern:**
- `aria-expanded={isOpen}` on button — screen readers announce "expanded" / "collapsed"
- `aria-controls={faq-answer-${item.id}}` on button — links button to its answer panel
- `id={faq-answer-${item.id}}` on answer div — referenced by `aria-controls`
- No `role="region"` needed for a 10-item FAQ — roles add navigation landmarks that are unnecessary at this scale

### Full Page Structure

```tsx
export default function FaqPage() {
  const { t } = useTranslation()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <>
      <title>{t('faq.pageTitle')}</title>
      <meta name="description" content={t('faq.metaDesc')} />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}>
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t('faq.heading')}
            </h1>
            <p className="font-body text-base text-text-muted">{t('faq.subhead')}</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-sand rounded shadow-sm divide-y divide-sand px-6">
            {FAQ_ITEMS.map((item, i) => { /* accordion items */ })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto text-center">
          <h2 className="font-display text-3xl text-charcoal mb-2">{t('faq.ctaHeading')}</h2>
          <p className="font-body text-base text-text-muted mb-8">{t('faq.ctaSubhead')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+16139353555"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base text-slate-brand border border-slate-brand rounded
                         px-8 min-h-[48px] hover:bg-slate-brand hover:text-white
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              {t('phone')}
            </a>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base bg-slate-brand text-white hover:bg-slate-dark rounded
                         px-8 min-h-[48px] transition-colors
                         focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
            >
              {t('common.bookNow')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
```

**FAQ accordion container:** `bg-white border border-sand rounded shadow-sm divide-y divide-sand px-6` — the entire 10-item list sits inside one white card. `divide-y divide-sand` replaces individual `border-b border-sand` on items, producing the same divider effect more concisely. `max-w-3xl mx-auto` — narrower than the full `max-w-content` (FAQ text reads better in a contained column — typical UX pattern).

**Phone CTA:** `href="tel:+16139353555"` — tappable `tel:` link; `border border-slate-brand` outlined style (secondary); reuses existing `t('phone')` key; `min-h-[48px]` ✓. Margaret's gate: "Phone link must be a tappable `tel:` link — not plain text."

**Page sections:** hero `bg-warm-white` → accordion `bg-cream` → CTA `bg-warm-white` — same alternation as location pages.

### Persona Impact

| Persona | Impact |
|---|---|
| **Margaret (P3)** | Finds "Can I request the same cleaner?" (item 3); answer "Yes — and we highly recommend it. We assign the same dedicated cleaner to your home on every visit whenever possible" — genuinely reassuring; she can keep it open while reading other answers; phone link in bottom CTA is tappable `tel:` |
| **Diane (P1)** | FR locale → "Questions fréquentes"; item 3 answer uses "nettoyeur attitré"; item 2 answer confirms "produits à base végétale sûrs pour les animaux"; all 10 pairs in French |
| **Gallagher (P6)** | Item 6 answer explicitly lists: full clean + linen changeover + toiletry restocking + damage photos + 11am–3pm window — all 5 required elements from the persona feature matrix |
| **Kahnawà:ke (P4)** | Item 4: "We cross the Seaway International Bridge" — consistent language with location page |
| **Sophie (P5)** | Item 5: Snye QC confirmed; item 2: "baby-safe" eco products confirmed |
| **Travis (P2)** | Book Now CTA at bottom; `min-h-[48px]` on both CTAs |

### Risks
- `Set<number>` state with Framer Motion `AnimatePresence` requires stable `key` props — use `key={item.id}` (string slug), not `key={i}` (index). Index keys with AnimatePresence cause re-mount on reorder. ✓ (plan already uses `key={item.id}`)
- `divide-y divide-sand` inside `px-6` — the divider extends across the full card width, not just the padded content. This is intentional (card-wide dividers look better than padded dividers in an FAQ card)
- `height: 'auto'` in Framer Motion exit animation — Framer Motion supports this; `overflow-hidden` is required on the animated element ✓

---

## Strategy 3 — Grouped Accordion with Category Headings

### Description

Ten FAQ items grouped into 4 categories: "Booking & Scheduling" (items 1, 7, 10), "Services & Products" (items 2, 6), "Coverage" (items 4, 5), "Trust & Policies" (items 3, 8, 9). Each category has a `<h2>` heading and its own accordion card. Multi-open within each category.

### Risks
- Adds 4 i18n keys for category names (EN + FR)
- Grouping by topic requires users to know which category their question is in — adds cognitive load for 10 items (no benefit at this scale; grouping helps at 30+ items)
- Margaret doesn't benefit from taxonomy — she'll read linearly top-to-bottom
- More complex layout and more component state

**Rejected.** 10 items do not warrant category grouping.

---

## Recommended Strategy: **Strategy 2 — Multi-Open Accordion**

**Why over Strategy 1:** Margaret reads every word carefully and may want multiple answers visible simultaneously. The single-open pattern forces her to close one answer to read another — unnecessary friction for her persona. Multi-open is equally simple to implement and strictly better for every persona.

**Why over Strategy 3:** 10 items do not need taxonomy. Grouping adds cognitive load and component complexity with no UX benefit at this scale.

---

## Subagent Pre-checks (Phase B)

**Brand_Auditor:**
- Hero `bg-warm-white`, accordion `bg-cream`, CTA `bg-warm-white` — alternating ✓
- `bg-white border border-sand rounded shadow-sm` accordion card ✓
- H1 `font-display text-4xl md:text-5xl text-charcoal` ≥ 16px ✓
- Question: `font-sub text-lg text-charcoal` = 18px ≥ 16px ✓
- Answer: `font-body text-base text-charcoal` = 16px ✓ (Margaret gate)
- `min-h-[48px]` on FAQ buttons, phone link, Book Now ✓ (Margaret 48px gate)
- Phone link: `border border-slate-brand rounded px-8 min-h-[48px]` ✓ (secondary outlined style)
- Book Now: `bg-slate-brand hover:bg-slate-dark rounded px-8 min-h-[48px]` ✓
- `rounded` on accordion card (4px) ✓; no `rounded-lg` ✓
- Chevron: `w-5 h-5 text-slate-brand` — decorative `aria-hidden="true"` ✓

**Data_Steward:** Zero Firestore ops ✓; no invented fields ✓

**Linguistic_Auditor:**
- All UI strings via `t()` ✓
- `t(item.qKey)` and `t(item.aKey)` — qKey/aKey are `string` typed; react-i18next accepts ✓
- `t('phone')` reuses existing key ✓; `t('common.bookNow')` reuses existing key ✓
- FR item 3: "nettoyeur attitré" consistent with HowItWorks + MeetTheTeam ✓
- FR item 6: "créneau 11h–15h" consistent with services.airbnb.description ✓
- FR `ctaHeading`: "Vous avez d'autres questions ?" — space before `?` per French typographic rule ✓

---

## Verification Checklist (Phase C gate)

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Margaret test:** `/faq` → item 3 ("Can I request the same cleaner?") → answer visible; opens/stays open; wording is genuinely reassuring ("same dedicated cleaner… every visit"); bottom CTA has `tel:+16139353555` phone link; all text ≥ 16px; all interactive elements ≥ 48px
4. **Diane test:** FR locale → H1 = "Questions fréquentes"; item 2 answer = "produits de nettoyage à base végétale, non toxiques et sûrs pour les enfants et les animaux"; item 3 = "nettoyeur attitré"; no English-only text
5. **Gallagher test:** Item 6 answer contains: "linen and towel changeover", "toiletry restocking", "damage documentation photos", "11am–3pm" — all 4 elements explicit
6. **Multi-open:** Open items 3 and 8 simultaneously; both answers visible; each closes independently
7. **Keyboard:** Tab to each button; Enter/Space toggles; `aria-expanded` state announced by screen reader
8. **Mobile (375px):** No horizontal scroll; FAQ card fills width; CTA buttons stack vertically
9. **Routing:** Navigate from homepage HowItWorks "See our FAQ" link → `/faq` loads correctly
10. **React 19 title:** `<title>FAQ | Fresh Nest Co.</title>` in browser `<head>` when on `/faq`
11. **FR toggle:** All 10 questions and answers switch to French; Bottom CTA = "Vous avez d'autres questions ?"

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 2 — Multi-Open Accordion. Awaiting approval before Phase B execution.
