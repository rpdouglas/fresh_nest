---
epic: P3-E31
title: Home Hero Reorder, Hide Unready Sections, FAQ Payment Fix — Plan
strategy: 2
approved: 2026-10-04
---

# P3-E31 PLAN — Home Hero Reorder, Hide Unready Sections, FAQ Payment Fix

**Phase A written:** 2026-10-04 · **Status:** ✅ Strategy 2 approved by human 2026-10-04

There is no `docs/projects/P3-E31.md` spec. The scope below is the human request of 2026-10-04,
and `P3-E31` is the next free epic ID after P3-E30.

## Scope (human request, 2026-10-04)

1. **Hero order.** Today the home hero reads: headline ("Professional Cleaning & Organizing") →
   serving statement → logo → button. Reverse it to: logo → serving statement → headline → button.
2. **Hide three sections**, in a way that lets them be switched back on when ready:
   before/after gallery, Meet the Team, reviews.
3. **FAQ payment answer.** It says we accept credit cards. We do not. We accept cash and e-Transfer only.

## Personas

| Persona | Why this epic touches them |
|---|---|
| **P3 Margaret** (primary) | Trust and accuracy. The logo first is brand recognition; the FAQ must not promise a payment method we refuse at the door. |
| **P1 Diane** | The FAQ fix must land in French too. Her key feature includes "Team" — hidden for now by this epic. |
| **P5 Sophie** | The before/after gallery is her primary trust mechanism (PERSONAS.md line 344, persona test item 4). Hidden for now by this epic. |
| **P2 Travis** | A shorter home page; the quote selector stays where it is. |

**Persona conflict to accept knowingly:** hiding the gallery and the team removes features that
PERSONAS.md lists for P5 and P1. This is a human decision (content is not ready), not a persona
change, so PERSONAS.md is not edited. The close report should record the P5 gallery test as
"deferred until the gallery is switched on".

## What the code looks like today

- `apps/customer/src/components/home/Hero.tsx` renders headline (`h1` over the nest watermark) →
  `hero.subhead` → logo image → Book Now button.
- `apps/customer/src/pages/Home.tsx` renders `GalleryPreview`, `MeetTheTeam` and `Reviews` unconditionally.
- The same content is reachable elsewhere:
  - `/gallery` and `/reviews` routes (`App.tsx`), linked from the footer (`Footer.tsx` lines 35–36).
  - `MeetTheTeam` is also rendered on `/about` (`AboutPage.tsx` line 146).
  - The trust bar shows "4.9 / 5 Google Rating" (`TrustBar.tsx`, `trustBar.rating`).
  - `lib/utils/seo.ts` emits `aggregateRating` 4.9 and `review` JSON-LD built from `STATIC_REVIEWS`.
- FAQ answer: `faq.*.a` at line 405 of both `en.json` and `fr.json`
  ("Interac e-Transfer, major credit cards, and cash").
- There is no feature-flag mechanism in the customer app today.
- E2E specs visit `/`, `/booking`, `/admin`, `/blog`, `/pricing` only — none visit `/gallery` or `/reviews`.

## Common to all three strategies

- **Hero:** reorder the existing blocks in `Hero.tsx` to logo → serving statement → headline → button.
  The `h1` stays the headline, so the heading structure is unchanged. No new copy.
- **FAQ:** new answer in both languages —
  - EN: "We accept cash and Interac e-Transfer. Payment is due on the day of service unless you have a recurring plan."
  - FR: "Nous acceptons l'argent comptant et le virement Interac. Le paiement est dû le jour du service, sauf si vous avez un forfait récurrent."
- **Schema audit:** no Firestore reads, writes or fields change. No `firestore.rules` change.
- **Tailwind audit:** no new classes. The hero reuses its existing classes
  (`font-display`, `font-body`, `text-charcoal`, `text-slate-brand`, `bg-warm-white`, `rounded`);
  hidden sections are simply not rendered.
- **Phase C docs:** `ACTIVE_CYCLE.md` row, close report, and a short "how to switch a section back on"
  note in `user-guide/admin-guide.md`.

---

## Strategy 1: Home page only, flags in `config.ts`

Add three boolean constants to `apps/customer/src/lib/config.ts`
(`SHOW_GALLERY`, `SHOW_TEAM`, `SHOW_REVIEWS`, all `false`). `Home.tsx` renders each section only when
its flag is true. Switching one on is a one-line change plus a deploy.

**Files changed:**
- `apps/customer/src/components/home/Hero.tsx` — reorder
- `apps/customer/src/pages/Home.tsx` — gate the three sections
- `apps/customer/src/lib/config.ts` — three flags
- `apps/customer/src/i18n/locales/en.json`, `fr.json` — FAQ answer
- `apps/customer/src/pages/Home.test.tsx` (new) — hidden sections are not rendered; hero order

**Persona impact:** P3 and P1 get the corrected FAQ and the new hero. P2 gets a shorter page.

**Risks:**
- The hidden content is still one click away: footer links to `/gallery` and `/reviews`, and the team
  on `/about`. If the reason for hiding is that the content is not real or not ready, this leaves it public.
- The trust bar and the search-engine markup keep claiming a 4.9 rating from reviews the page no longer shows.

**Schema audit:** none. **Tailwind audit:** no new classes.

## Strategy 2 (recommended): Site-wide hide, flags in `config.ts`

Same three flags, applied everywhere the content appears, so "hidden" means hidden.

- **Gallery flag:** home section, footer link, and the `/gallery` route (redirects to `/` while off).
- **Team flag:** home section and the team block on `/about`.
- **Reviews flag:** home section, footer link, the `/reviews` route (redirects to `/` while off),
  the "4.9 / 5 Google Rating" trust bar item, and the `aggregateRating` + `review` JSON-LD.
- `/leave-review` is left alone: it collects reviews and shows none.

**Files changed:**
- `apps/customer/src/components/home/Hero.tsx` — reorder
- `apps/customer/src/pages/Home.tsx` — gate the three sections
- `apps/customer/src/lib/config.ts` — three flags
- `apps/customer/src/App.tsx` — gate `/gallery` and `/reviews`
- `apps/customer/src/components/layout/Footer.tsx` — gate the two links
- `apps/customer/src/pages/AboutPage.tsx` — gate the team block
- `apps/customer/src/components/home/TrustBar.tsx` — gate the rating item
- `apps/customer/src/lib/utils/seo.ts` — omit rating and review markup while reviews are off
- `apps/customer/src/i18n/locales/en.json`, `fr.json` — FAQ answer
- `apps/customer/src/lib/sectionFlags.test.tsx` (new) — with flags off: sections, links, rating and
  JSON-LD are absent; hero order

**Persona impact:** as Strategy 1, plus P3 Margaret never lands on a page the business is not ready
to stand behind, and no rating is claimed without visible reviews.

**Risks:**
- More files touched (11 vs 6); each gate is a small conditional.
- Anyone with a bookmarked `/gallery` or `/reviews` link is redirected to the home page.
- Removing rating markup may drop star snippets in search results until reviews are switched back on.
- P5's gallery persona test cannot pass while the gallery is off (accepted above).

**Schema audit:** none. **Tailwind audit:** no new classes; the trust bar reflows with five items
instead of six using its existing layout classes (verify at 375px and 768px in Phase B).

## Strategy 3: Site-wide hide, flags from build environment variables

Same reach as Strategy 2, but the flags are read from `VITE_SHOW_GALLERY`, `VITE_SHOW_TEAM` and
`VITE_SHOW_REVIEWS`, set in the deploy workflows. Switching a section on is a workflow or repository
variable change, not an app code change.

**Files changed:** everything in Strategy 2, plus
- `apps/customer/src/vite-env.d.ts` — declare the three variables
- `.github/workflows/firebase-deploy.yml`, `.github/workflows/firebase-preview.yml` — pass the variables to the build
- `.env.example` — document them

**Persona impact:** same as Strategy 2.

**Risks:**
- Still needs a rebuild and redeploy to take effect, so it saves little over Strategy 2.
- Production and preview can drift apart if one workflow is updated and the other is not.
- Local builds depend on `.env.local`, which AI agents may not edit; the human has to set it.
- Touches the production deploy workflow for a content toggle.

**Schema audit:** none. **Tailwind audit:** same as Strategy 2.

## Considered and rejected: runtime toggle from Firestore or Remote Config

Switching sections on from the admin page without a deploy would need a settings document.
`docs/firestore-schema.md` has no settings or config collection, so this would be an invented
collection plus a `firestore.rules` change — both blockers under the Docs-as-Code contract.

---

## Open questions for the human — answered 2026-10-04

Answers: (1) Strategy 2, site-wide. (2) Yes, hide the rating. (3) FAQ wording approved as proposed.

1. **How far does "hide" go?** Home page only (Strategy 1), or also the `/gallery` and `/reviews`
   pages, their footer links, and the team on the About page (Strategies 2 and 3)?
2. **Rating claims.** With reviews hidden, should the "4.9 / 5 Google Rating" trust bar item and the
   4.9 rating in the search-engine markup be hidden too? Strategy 2 assumes yes.
3. **FAQ wording.** Is "Payment is due on the day of service unless you have a recurring plan"
   still correct, and is "Interac e-Transfer" the right name to use?
