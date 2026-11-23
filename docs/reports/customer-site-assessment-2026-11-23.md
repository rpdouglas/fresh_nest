# Customer Website — Current-State Assessment & Recommendations

**Date:** 2026-11-23 · **Scope:** customer site only (`apps/customer`, live at `https://www.freshnestco.ca`) · **Type:** assessment, no code changed
**Personas:** P1 Diane, P2 Travis, P3 Margaret, P4 Kahnawà:ke, P5 Sophie, P6 Gallagher
**Screenshots:** [`assets/customer-site-assessment-2026-11-23/`](assets/customer-site-assessment-2026-11-23/)

---

## 1. Executive summary

**Overall grade: C+ (2.9 / 5).** The foundations are solid. The site is fully bilingual and accessible, has real before/after photos, needs no account to request a quote, and its SEO plumbing is mostly correct. What holds it back is not missing features. It is how the site looks and performs on a phone, and how little trust content it shows.

1. **The phone experience undersells the business.** On a 375px phone, the first screen is almost entirely a second, oversized logo. It has no headline, no visible phone number, and a "Request a Quote" button that sits under the cookie banner ([01](assets/customer-site-assessment-2026-11-23/01-home-mobile-first-screen.jpg)). The home page is 10,200px tall, about 13½ phone screens.
2. **The site is slow on mobile.** Lighthouse mobile performance scores 56–66, with page-load times (LCP) of 4.8–5.9s. The home page downloads **12 MB**, 10.7 MB of it images. Nine of those are 750–800 KB PNGs shown as faint backgrounds at 18% opacity.
3. **Trust signals are thin, and one is a liability.** Reviews and Meet the Team are switched off. There are no named people and no faces. Yet every service page still shows **"4.9 / 5 Google rating from verified clients"**, even though P3-E31 removed rating claims while reviews are hidden. That unbacked claim is a Competition Act risk.
4. **The content is too thin to rank or persuade.** Each location page has about 92 words. The FAQ has 10 questions. The blog has 3 posts, the newest from June, and one is credited to "Dev Team". The gallery has 4 pairs. Business hours conflict: the footer says Mon–Sat, while the structured data and llms.txt say Mon–Fri.
5. **The quote path works but has friction.** The quote selector pre-fills correctly, and the form passes in both EN and FR. But it is 4 steps and at least 15 taps, and it requires a full address and a date just to get a quote. It also produces contradictory data: "1–2 Bedroom Home — 3 bedrooms" ([09](assets/customer-site-assessment-2026-11-23/09-quote-form-review-mobile.jpg)). Airbnb hosts get a separate form with different promises.

---

## 2. Scorecard

| Area | Score | Evidence (one line) |
|---|---|---|
| First impression & brand | 3 / 5 | The palette and type are calm and premium, and the photos are real. The mobile first screen is all logo, and the headline ("Professional Cleaning & Organizing") is generic. |
| Mobile UX | 2.5 / 5 | No phone number in the mobile header. The cookie banner covers the hero button (y=765 of 812). The home page is 10,200px tall. There is no sticky quote/call bar. |
| Conversion path | 3 / 5 | Many CTAs, working pre-fill and no account. But the form is 4 steps and 15+ taps, address and date are required, there's no click-to-text, and Airbnb has a separate form. |
| Trust signals | 2 / 5 | Reviews and team are hidden. The ungated "4.9 Google rating" badge shows on 6 service pages. No owner name or face, no product names or certifications. The 24-hour guarantee is good. |
| Accessibility | 4 / 5 | Lighthouse a11y 96–100, visible focus on all 25 tab stops, skip link, no overflow at 200% zoom. Two axe "serious" issues (below). |
| Bilingual quality | 3.5 / 5 | 1,559/1,559 keys translated, `<html lang>` switches, FR self-canonicals. The FR hero headline is a literal translation, and the site uses "devis" where Québec readers say "soumission". |
| Performance | 2 / 5 | Mobile performance 56–66, LCP 4.8–5.9s, TBT 290–600ms, home page 12 MB, images cached only 1 hour, broken `registerSW.js` on every page. |
| Technical SEO | 3 / 5 | Per-page titles, canonicals, hreflang, sitemap (48 URLs), robots, llms.txt and JSON-LD are good *once JS runs*. The raw HTML is identical and generic on every URL. Unknown URLs return HTTP 200. |
| Local SEO | 2.5 / 5 | 5 location pages, but about 92 words each and nearly identical. Hours conflict. No Google Business Profile link or reviews. |
| Content depth | 2 / 5 | FAQ has 10 questions, the blog has 3 stale posts, the gallery has 4 pairs, and the About page is generic with no people. |
| Compliance | 3.5 / 5 | CASL consent is opt-in, unticked and separate, and the cookie banner has a Decline button. Risks: the unbacked rating, and absolute environmental claims ("100% baby-safe, non-toxic"). |
| Analytics | 3 / 5 | Analytics only runs after cookie consent and records quote starts, completed requests and phone-number taps. No events per form step, so you can't see where people drop off. |

---

## 3. Persona journey results

Measured on the live site with Playwright. **The quote form was never submitted**, so no real lead was created. Because nothing was sent, the confirmation-email language and timing were not tested.

| Persona | Test | Result | Measured |
|---|---|---|---|
| **P2 Travis** | Phone, landing → quote ready to send, < 3 min, quote selector in 3 taps | **Partial** | The selector's 3 taps plus its CTA pre-fill service, size and frequency. But the selector starts at y≈1,191px, below the first screen, behind the giant logo. Reaching Send takes **15 taps** plus typing 7 fields (automated run: 17s; realistic human time 2–3½ min). The cookie banner stays on screen through every step. A full street address and a date are required. |
| **P3 Margaret** | 768px, keyboard only, phone number visible, 200% zoom | **Pass** | Phone link at tab stop 9, first quote link at stop 11, focus visible at every stop, no sideways scrolling at 200% zoom. Minor: links at 4.34:1 contrast on location/services pages. 12–14px text on gallery captions and badges. |
| **P1 Diane / P5 Sophie** | Whole flow in FR | **Pass (copy issues)** | No English left on any of 24 FR pages. FR form reaches "Envoyer la demande de devis" with no layout breaks. FR hero headline "Professionnel Nettoyage & Organisation" is ungrammatical. "Devis" is used where Québec readers expect "soumission". "Bimensuelles" is ambiguous (in Québec it often means twice a month). FR email not tested (not submitted). |
| **P4 Kahnawà:ke** | Akwesasne page is community-specific | **Partial** | "We serve Cornwall Island — we cross the bridge" is explicit ✓. But the page has **92 words**, says the bridge line three times, lists 4 services (no Airbnb or commercial), and has no local testimonial, border/bridge FAQ or response-time note ([05](assets/customer-site-assessment-2026-11-23/05-location-akwesasne-mobile.jpg)). |
| **P6 Gallagher** | Airbnb host language, 11am–3pm, photo proof | **Partial** | 11am–3pm and "timestamped damage photo documentation" are explicit ✓. But the hero CTA is "Request a **Commercial Account**", which is off-putting for a host with a single property. "Confirm availability within **2 hours**" conflicts with "24 hours" everywhere else. "40+ turnovers completed annually" undersells. The separate form duplicates the main quote form ([07](assets/customer-site-assessment-2026-11-23/07-airbnb-desktop.jpg)). |

---

## 4. Findings by area

### 4.1 Home page ([01](assets/customer-site-assessment-2026-11-23/01-home-mobile-first-screen.jpg), [02](assets/customer-site-assessment-2026-11-23/02-home-mobile-full.jpg), [03](assets/customer-site-assessment-2026-11-23/03-home-desktop-full.jpg))
- **Duplicate logo hero.** The header already shows the logo, and the hero repeats it at 280–340px. On a phone it takes about 45% of the first screen. The headline only starts at y≈550 and the button at y≈765.
- **The headline says what you do, not why to pick you.** It doesn't mention bilingual service, local roots, consistency or the guarantee. The 24-hour guarantee, the reply promise and the bilingual service are your differentiators, but they appear only in small trust-bar text or further down the page.
- **The page stacks too much.** It runs: trust bar → quote selector → 6 service cards → 3 recurring cards (each with its own CTA) → gallery → how it works. That is about 14 CTAs, all saying "Request a … Quote". There is no closing call-to-action band, no reviews, no team and no service-area map.
- **Card text is all bold** (`font-bold` body copy on cards), which flattens the hierarchy. The quote form's step 1 has the same problem: the description is bolder and bigger than the title.

### 4.2 Service pages ([04](assets/customer-site-assessment-2026-11-23/04-service-standard-mobile.jpg))
- Good structure: hero, "What's Included", how it works, why choose us, CTA.
- **"4.9 / 5 Google rating from verified clients"** (`ServicePage.tsx` → `trust1Stat`) is not gated by `SHOW_REVIEWS`. P3-E31 removed the rating from the trust bar and the structured data, but this copy was missed.
- "What's Included" has 6 lines. Strong competitors publish room-by-room checklists, a "what's not included" list, and add-ons.
- Titles like "Deep Clean — Fresh Nest Co." contain no city. Meta descriptions run 73–98 characters (about 150 is the target).

### 4.3 Location pages ([05](assets/customer-site-assessment-2026-11-23/05-location-akwesasne-mobile.jpg))
- About 92–94 words of unique copy each, and the five pages share the same template. Google treats pages like this as thin, near-duplicate doorway pages.
- No local proof: no neighbourhood names, local testimonial, area-specific FAQ, photo or response time.
- The map loads, but late (it is lazy-loaded). It shows only a place search, not a service-area outline.

### 4.4 Quote form ([06](assets/customer-site-assessment-2026-11-23/06-quote-form-step1-mobile.jpg), [08](assets/customer-site-assessment-2026-11-23/08-quote-form-step2-mobile.jpg), [09](assets/customer-site-assessment-2026-11-23/09-quote-form-review-mobile.jpg))
- 4 steps: 11 radios + checkbox, then 2 fields + 4 radios + 6 add-on checkboxes, then 7 contact fields, then review and consent.
- **Data bug:** "Property size" and the separate Bedrooms counter don't sync. The selector's "1–2 Bed" becomes "1–2 Bedroom Home — 3 bedrooms / 1 bathrooms" in the review and in the lead. ("1 bathrooms" is also a plural bug.)
- On a phone, step 1 is about 2½ screens of long, bold service descriptions before property size.
- Asking for a full address and a preferred date at the quote stage is more than the business needs. Postal code (or town) plus a best-contact time would do, with the address collected at confirmation.
- Radio dots are 16px, but each sits inside a 48px label, so the tap targets meet the requirement.

### 4.5 Trust, About, FAQ, Blog, Gallery
- **About** has no founder name, photo, story specifics or year founded. It makes an absolute claim ("100% baby-safe, eco-friendly, and non-toxic products") and a comparative one ("Unlike other services…") without evidence.
- **FAQ** has 10 questions. Missing: how the quote is worked out (without prices), supplies and equipment, keys and access, what isn't included, cancellation notice, what to do before the cleaner arrives, how long a visit takes, tipping, and bad weather or the bridge.
- **Blog** has 3 posts (June 1–8, 2026). One is credited to "**By Dev Team**". Dates show as ISO ("2026-06-08").
- **Gallery** has 4 before/after pairs with casual captions. The photos are real, which is a strength, but there's no service type or town on each.

### 4.6 Performance (Lighthouse 12.6, live site)

| Page | Mobile perf | LCP | TBT | Desktop perf | Weight |
|---|---|---|---|---|---|
| Home | 56 | 5.3s | 600ms | 74 (CLS 0.138) | 12.0–13.1 MB |
| Deep cleaning | 66 | 5.2s | 290ms | 93 | 1.4 MB |
| Akwesasne | 61 | 5.9s | 370ms | 90 | 1.7 MB |
| Quote form | 62 | 4.8s | 440ms | 95 | 1.3 MB |

- The 10 largest files are all decorative PNGs or JPGs of 736–805 KB (`howitworks-step*.png`, `*-recurring.png`, `quote-*.png`, `airbnb-hero.jpg`). Lighthouse estimates 9–11 MB of savings from switching to WebP/AVIF and serving smaller images on phones.
- The page's main image is the 18%-opacity hero background, which isn't preloaded (about 2.4s potential saving).
- About 400 KB of JavaScript isn't used. Firebase Auth (`iframe.js`) and App Check load on public marketing pages.
- **`/registerSW.js` returns HTML** (the file was never deployed). The browser refuses it on every page, so the service worker, the update prompt and the offline page never work.
- **App Check token exchange returns 403** in headless Chromium on every page. This is probably reCAPTCHA scoring the automated browser as a bot, but check the App Check metrics in the Firebase console to confirm real users aren't affected.
- Static images are cached for only 1 hour (`max-age=3600`).

### 4.7 Technical & local SEO
- **No prerendering.** Every URL serves the same `<title>`, description and an empty `<div id="root">`. Google renders JavaScript, but Bing, social previews, AI answer engines and Google's first crawl pass see generic content. The structured data (LocalBusiness, Service, FAQPage) exists only after JS runs.
- Unknown URLs return **HTTP 200** with a noindex tag (a "soft 404"). This is acceptable, but a real 404 status is better.
- The French URLs use `?lang=fr` query strings. This works, but a `/fr/...` path is stronger for French rankings and easier to share.
- **NAP / hours inconsistency:** the footer says "Mon–Sat: 8am–6pm", while the structured data's opening hours and llms.txt say Mon–Fri.
- No Google Business Profile link, review link or embedded reviews.

### 4.8 Accessibility (axe-core, WCAG 2.2 AA, 96 page renders)
- `label-content-name-mismatch` (serious, **all pages**): the mobile language toggle shows "FR" but is announced as "Switch to French". Voice-control users who say "tap FR" will fail.
- `color-contrast` (serious, 24 renders): `text-slate-brand` (#547788) links on `cream` (#f7f3ee) measure 4.34:1, just under 4.5:1. Affected: location page service chips and service card links on /services.
- 12–14px text: before/after badges and captions, "Most Popular", blog bylines, "Optional".
- The Airbnb page nests two `<main id="main-content">` elements (duplicate landmark and ID).

### 4.9 Compliance
- ✅ CASL: marketing consent is a separate, unticked checkbox with unsubscribe wording, and the cookie banner offers Decline.
- ⚠️ **Rating claim** without public, verifiable reviews (see 4.2).
- ⚠️ **Environmental claims** ("eco-friendly", "100% baby-safe", "non-toxic", "plant-based") now fall under the Competition Act's greenwashing provisions (Bill C-59, 2024). Those provisions require proper substantiation. The Bureau's final guidelines are dated June 2025, and the March 2026 budget act changed the methodology requirement, so check the current guidance. Name the products and certifications, or soften the absolutes.

---

## 5. What already works (keep it)
- Truly bilingual: full key coverage, `<html lang>`, FR canonicals and hreflang, a language toggle in the nav.
- Accessibility basics: skip link, visible focus, 48px targets, 16px body text, phone in the tablet/desktop nav.
- No account needed, and the quote selector pre-fills the form. The CASL consent design is correct.
- Real before/after photography managed from the admin page.
- Explicit Cornwall Island and Snye QC service, and the 11am–3pm Airbnb window.
- Clear 24-hour satisfaction guarantee, plus a clear "what happens next" on the review and thank-you pages.
- A helpful 404 page (home, quote, phone), plus sitemap, robots and llms.txt.

---

## 6. Prioritized recommendations

Effort: **S** < 1 day · **M** 1–5 days · **L** > 1 week. Flags: 🔒 needs owner decision · 🗄 schema change · 📜 ADR.

### Quick wins (each under a day)

| ID | Recommendation | Persona(s) | Impact | Effort | Evidence |
|---|---|---|---|---|---|
| QW-1 | Gate or remove the "4.9 / 5 Google rating" stat on service pages (tie it to `SHOW_REVIEWS`), replacing it with "24-hour guarantee" or "Reply within 24 hours". | All | H | S | 4.2, 4.9 |
| QW-2 | Fix the hours mismatch: make the footer, JSON-LD and llms.txt agree (and match the Google Business Profile). | P3, P4 | H | S | 4.7 |
| QW-3 | Mobile header: show a tap-to-call icon button (48px) next to FR and the menu. | P3, P2 | H | S | Header at 375px has no phone |
| QW-4 | Mobile hero: drop the duplicate large logo below `md`. Lead with the headline, a one-line promise and two buttons (Request a Quote / Call). | P2, P3 | H | S | [01](assets/customer-site-assessment-2026-11-23/01-home-mobile-first-screen.jpg) |
| QW-5 | Make the cookie banner a compact bottom bar that doesn't cover the primary CTA (or hold it back until the first scroll), and don't show it in the middle of the quote form. | P2 | M | S | Banner covers hero CTA and every form step |
| QW-6 | Sync the quote selector's size with the Bedrooms counter (or drop the counter), and fix "1 bathrooms" pluralisation. | P2, staff | M | S | [09](assets/customer-site-assessment-2026-11-23/09-quote-form-review-mobile.jpg) |
| QW-7 | Convert the 15 decorative images to WebP/AVIF at the sizes actually displayed, with mobile versions. Preload the hero. Set `Cache-Control: max-age=31536000, immutable` on renamed images. | All, mostly P2 | H | S–M | 4.6, ~10 MB saving |
| QW-8 | Fix or remove `registerSW.js` (deploy it, or set `injectRegister: false` if offline support isn't wanted). | P3 | M | S | Console error on every page |
| QW-9 | A11y: change the language toggle's `aria-label` to include "FR" (e.g. "FR — Français"), and darken `slate-brand` link text on cream to ≥4.5:1 (use `slate-dark`). | P3 | M | S | 4.8 |
| QW-10 | Remove the "Dev Team" byline. Show dates in a readable local format ("8 juin 2026" / "June 8, 2026"). | P1, P5 | L | S | 4.5 |
| QW-11 | FR copy fixes: hero headline ("Nettoyage et organisation professionnels"). Pick "soumission" or "devis" and use it everywhere. Replace "bimensuelles" with "aux deux semaines". | P1, P5 | M | S | 3 |
| QW-12 | Airbnb page: change the CTA to "Request a Turnover Quote", reconcile "2 hours" vs "24 hours", and replace "40+ turnovers annually" with something stronger (or remove it). | P6 | M | S | [07](assets/customer-site-assessment-2026-11-23/07-airbnb-desktop.jpg) |
| QW-13 | Write longer meta descriptions (~150 chars) and add the town to service-page titles ("Deep Cleaning in Cornwall, ON — Fresh Nest Co."). | P2, P4 | M | S | 4.2 |

### Next sprint

| ID | Recommendation | Persona(s) | Impact | Effort | Evidence | Suggested epic |
|---|---|---|---|---|---|---|
| NS-1 | **Real reviews program:** set up and link the Google Business Profile, run a post-visit review request (the `/leave-review` page exists), then flip `SHOW_REVIEWS` with genuine reviews and a link to Google. | All | H | M | 4.5, 4.9 | Reviews go-live |
| NS-2 | **Meet the team / owner story:** a founder photo and name, 2–4 cleaner bios (first name, languages, years), then flip `SHOW_TEAM`. 🔒 needs staff photo consent. | P1, P3, P4 | H | M | 4.5 | Team go-live |
| NS-3 | **Shorter quote form:** combine it into 2–3 steps. Ask for postal code/town, not the full address. Make the date optional ("flexible"). Add a "best time to call" field. Keep the review and CASL step. 🗄 check the `bookings` schema for optional address and date. | P2, P3 | H | M | 3, 4.4 | Quote form v2 |
| NS-4 | **Sticky mobile action bar** (Quote · Call · Text) on every page except the form. | P2, P3, P6 | H | S–M | No sticky CTA | Mobile conversion |
| NS-5 | **Location pages, deeper content:** 400–600 unique words each, covering neighbourhoods, a local FAQ (bridge, border, island addresses for Akwesasne; FR-first copy for Snye), a local before/after, a local testimonial, all services including Airbnb, and a response time. | P4, P5 | H | M | 4.3 | Local SEO |
| NS-6 | **FAQ expansion to 25–30 questions** in both languages, including "How is my quote worked out?" (factors only, no numbers), supplies, access/keys, exclusions, cancellation and visit length. Keep the FAQPage structured data. | P2, P3, P6 | M | S–M | 4.5 | Content |
| NS-7 | **Substantiate the eco and safety claims:** list the actual products and their certifications (e.g. EcoLogo or Safer Choice, where true) on an "Our Products" section, and soften absolutes ("100%", "non-toxic") until they can be backed up. | P5, P1 | M | S | 4.9 | Compliance |
| NS-8 | **Funnel analytics:** add a GA4 event for each form step (`quote_step_1…4`), track click-to-text, and set up a weekly drop-off view in the admin analytics page. | Owner (P12) | M | S | 2 | Analytics |
| NS-9 | **Home page restructure:** hero → trust bar → reviews → services → how it works → gallery → service area → FAQ teaser → closing CTA band. Cut repeated CTAs to one per section. Use regular-weight body copy on cards. | All | M | M | 4.1 | Home v2 |
| NS-10 | **Unify the Airbnb inquiry with the main quote flow** (service = Airbnb with host-specific fields), so leads land in one pipeline with one set of promises. 🗄 check the schema. | P6 | M | M | 4.4 | Airbnb funnel |

### Strategic

| ID | Recommendation | Persona(s) | Impact | Effort | Evidence | Suggested epic |
|---|---|---|---|---|---|---|
| ST-1 | **Prerender public routes** at build time (e.g. a static prerender step or vite-plugin-ssg) so every URL ships its own title, meta, structured data and content. Serve a real 404 status. 📜 needs an ADR (hosting and build change). | All, plus search and AI engines | H | L | 4.7 | SEO-02 |
| ST-2 | **French URL paths** (`/fr/services/...`) instead of `?lang=fr`, with 301 redirects. 📜 needs an ADR. | P1, P5 | M | M–L | 4.7 | SEO-02 |
| ST-3 | **Performance budget in CI:** Lighthouse CI on home, service, location and booking pages, failing the build if mobile performance drops below 80 or LCP goes above 2.5s. Lazy-load Firebase Auth and App Check only on routes that need them. | P2 | H | M | 4.6 | Perf |
| ST-4 | **Content engine:** 2 bilingual posts a month on local topics (move-out checklist for Cornwall rentals, Airbnb turnover checklist, a seasonal deep-clean guide), written by named authors. | P1, P5, P6 | M | L (ongoing) | 4.5 | Content |
| ST-5 | **Click-to-text / SMS quote channel** (two-way SMS to the office line). | P2, P6 | M | M | Industry norm | Comms |
| ST-6 | **Gallery growth:** 12+ pairs tagged by service and town, plus 1–2 short process videos. | P5, P6 | M | M (ongoing) | 4.5 | Gallery |

---

## 7. Policy questions for the owner
1. **No public prices (P3-E29).** Industry guidance strongly favours some price transparency, and hiding it is widely cited as a conversion killer. I am **not** recommending breaking the rule. Would you consider a middle ground that still shows no numbers? For example: "What affects your quote" (size, condition, frequency), "Typical visit length", and "Reply within 24 hours" shown next to every CTA.
2. **Reviews and team.** What has to be true before `SHOW_REVIEWS` and `SHOW_TEAM` can be switched on? Is the Google Business Profile live, and how many reviews does it have?
3. **"Devis" vs "soumission".** Which term should the French site standardise on? I'd recommend a native Québec/Franco-Ontarian reviewer for one full pass.
4. **Hours.** Which is correct: Mon–Fri or Mon–Sat?
5. **Eco claims.** Which products do you actually use, and do any carry third-party certification?

---

## 8. Method and limits
- **Live crawl:** 24 public routes × EN/FR × 375/768/1280px (144 page renders), plus one home render at 1920px, with Playwright/Chromium. axe-core (WCAG 2.0/2.1/2.2 A/AA) on the 375 and 1280px renders. Scrolled full-page screenshots of key pages.
- **Lighthouse 12.6.1:** mobile and desktop on home, deep cleaning, Akwesasne and booking. These are single runs, so expect about ±5 points of run-to-run variation.
- **Persona journeys:** scripted with Playwright, stopped at the review step. **No quote was submitted**, so confirmation email/SMS language and timing were not tested. A human should confirm by submitting one EN and one FR test request (on the dev site if possible).
- **Code reading:** `Home.tsx`, `Hero.tsx`, `BookingPage.tsx` and its steps, `bookingSchema.ts`, `seo.ts`, `config.ts`, `vite.config.ts`, locale files.
- **Not done:** `npm run build` bundle analysis (Lighthouse's unused-JS figures stand in for it), real-device testing, Search Console or GBP data (no access), and competitor site crawls. The benchmark below uses published industry guides instead.

**Sources consulted (industry practice and regulation):**
- [Jobber — cleaning company website examples](https://getjobber.com/academy/cleaning/cleaning-company-website-examples/)
- [Housecall Pro — cleaning company website](https://www.housecallpro.com/resources/cleaning-company-website/)
- [Nano Globals — 14 cleaning company websites (2026)](https://nanoglobals.com/housecleaning-company-websites/)
- [WebCitz — best cleaning website designs 2026](https://www.webcitz.com/blog/best-cleaning-websites/)
- [Service Autopilot — cleaning website design elements](https://www.serviceautopilot.com/cleaning/10-cleaning-business-website-design-elements-that-shine/)
- [Competition Bureau — final guidelines on environmental claims (June 2025)](https://www.canada.ca/en/competition-bureau/news/2025/06/competition-bureau-issues-final-guidelines-regarding-environmental-claims.html)
- [McCarthy Tétrault — greenwashing guidelines summary](https://www.mccarthy.ca/en/insights/publications/competition-bureau-releases-long-awaited-greenwashing-guidelines)

Note: most industry guides come from vendors with a commercial interest. The practices they recommend are consistent with each other, but their conversion-lift claims are unverified.
