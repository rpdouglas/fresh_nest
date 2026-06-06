# Fresh Nest Co. — Persona Reference

**Version:** 2.0 | **Updated:** 2026-06-06
**Status:** Human-defined — AI agents READ ONLY. Do NOT modify this file.

> [!CAUTION]
> This document is human-defined and immutable to AI agents. It defines the six user archetypes whose needs drive every product decision. Before implementing any feature, identify which persona(s) it serves. If you cannot name one, halt and ask.

---

## Persona Index

| ID | Name | Location | Primary Language | Key Need |
|---|---|---|---|---|
| P1 | Diane Lafleur | East Cornwall ON | French | French-language UX + consistent cleaner |
| P2 | Travis McLeod | Long Sault ON | English | Fast mobile booking + transparent pricing |
| P3 | Margaret Storey | West Cornwall ON | English | Accessibility + phone contact + trust |
| P4 | Kahnawà:ke Baptiste | Cornwall Island, Akwesasne | English / Mohawk | Island service recognition + logistics |
| P5 | Sophie Tremblay-Gagnon | Snye, QC | French | Cross-border service + eco products + French UX |
| P6 | Patricia & Dean Gallagher | South Glengarry | English | Reliable Airbnb turnover + photo proof |

---

## P1 — Diane Lafleur · Francophone Homeowner

### Profile

| Field | Detail |
|---|---|
| Age | 58 |
| Location | East Cornwall ON (Riverdale) |
| Languages | French (primary) · English (functional) |
| Income | ~$72,000/yr (pension) |
| Home | Owned 3-bed bungalow, 1,450 sq ft |
| Tech comfort | Moderate — Facebook, email, mobile |

### Goals
- Maintain a clean home to her own high standards
- Same cleaner every visit — no rotation, no strangers
- Eco-friendly and fragrance-free products (cat allergy concern)
- Complete French-language service experience, from website to confirmation email

### Fears
- English-only website or UI that switches unexpectedly to English
- Random cleaner rotations with no notice
- Chemical or scented products that harm her cat

### Buying Behaviour
Diane researches 2–3 cleaning services in French on Facebook groups and Google before contacting anyone. She reads reviews in both languages and selects the first service with a fully French UI. She will not submit a form in English.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Language toggle | Visible in navbar on all pages |
| French translations | `fr.json` 100% complete — no English fallbacks |
| Trust Bar | Rendered in French |
| Meet Your Team | Preferred cleaner note available in booking form |
| Confirmation email | Entirely in French, sent within 60 seconds of booking |
| Booking form | All labels, placeholders, and error messages in French |

### Persona Quote
> *"Je veux que mon chez-moi soit aussi propre que je le ferais moi-même — en français."*

### Acceptance Test — P1
**Pass/Fail Gate for Phase C:**

1. Diane visits the homepage with browser locale set to `fr-CA`
2. Full French UI is displayed — no English text visible at initial render
3. She navigates to the booking form — all labels and options appear in French
4. She selects a preferred cleaner from the Meet Your Team section
5. She submits the booking
6. A confirmation email arrives in French within 60 seconds
7. The email contains her booking details and cleaner name in French

---

## P2 — Travis McLeod · Young Tradesperson

### Profile

| Field | Detail |
|---|---|
| Age | 29 |
| Location | Long Sault ON (South Stormont) |
| Languages | English (only) |
| Income | ~$68,000/yr |
| Home | Rented 2-bed apartment |
| Tech comfort | Very high — smartphone-first, apps for everything |

### Goals
- Book a cleaning in under 3 minutes on his iPhone
- See a real price before giving any contact information
- No account creation, no friction
- SMS confirmation he can reference on the job site

### Fears
- Hidden prices revealed only after a consultation call
- Booking forms that require account signup
- Desktop-only layouts that break on mobile
- Any friction that adds time to the booking flow

### Buying Behaviour
Travis searches on iPhone between job sites. He wants a visible price range within the first 3 taps. If he can't see a price and complete a booking in under 5 minutes, he leaves and tries the next result. He responds to biweekly discounts and does not respond to brand storytelling.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Instant Quote Calculator | Above the fold on homepage, mobile-optimised |
| Price visibility | Price range displayed before any contact fields |
| Biweekly discount | Visible and pre-selected option in calculator |
| Form pre-population | Calculator selections flow into booking form |
| Booking form | Mobile-first, no required account creation |
| SMS confirmation | Delivered within 30 seconds of booking submission |

### Persona Quote
> *"If I can't see a price and book it in three minutes, I'm moving on."*

### Acceptance Test — P2
**Pass/Fail Gate for Phase C:**

1. Travis opens the homepage on an iPhone (375px viewport)
2. He selects 4-bed + biweekly + standard clean in the Quote Calculator — within 3 taps
3. A price range is displayed immediately (no form submission required)
4. He taps the CTA — the booking form opens with his calculator selections pre-filled
5. He completes the booking without creating an account
6. Total time from landing to booking confirmation: under 3 minutes
7. SMS confirmation received within 30 seconds

---

## P3 — Margaret Storey · Senior Recurring Client

### Profile

| Field | Detail |
|---|---|
| Age | 71 |
| Location | West Cornwall ON (McConnell Ave area) |
| Languages | English (only) |
| Income | ~$52,000/yr (pension + CPP) |
| Home | Owned 2-bed bungalow (downsized) |
| Tech comfort | Low-moderate — iPad, email, Facebook; avoids forms |

### Goals
- Maintain a clean, safe home independently
- Consistent same cleaner on every visit — no strangers
- Ability to call before booking if she has questions
- No hidden steps, no surprises in the checkout flow

### Fears
- Online-only booking with no phone number to call
- A different cleaner arriving each time
- Text too small to read comfortably on her iPad
- Complicated multi-step checkouts that lose her progress

### Buying Behaviour
Margaret reads every word on a page carefully. She calls before booking whenever a phone number is visible. Once trust is established with a service and a cleaner, she becomes a long-term recurring customer — potentially for years. She is not price-sensitive once she trusts the service.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Phone number | Visible in navbar AND footer without scrolling |
| Phone link | Must be a tappable `tel:` link — not plain text |
| Text size | Minimum 16px (`text-base`) across all viewport sizes |
| Touch targets | Minimum 48px height on all interactive elements |
| Contrast | WCAG AA — 4.5:1 minimum for all text/background pairs |
| Booking flow | Single-page option — no multi-step wizard that loses state |
| Layout | No horizontal scroll at 768px (iPad portrait) |

### Persona Quote
> *"I just need to know someone will show up who I recognize. And I need to be able to call if something goes wrong."*

### Acceptance Test — P3
**Pass/Fail Gate for Phase C:**

1. Margaret visits the homepage on an iPad (768px viewport, portrait)
2. The phone number is visible in the header without scrolling
3. All body text is 16px or larger
4. All buttons, inputs, and tappable elements are 48px or taller
5. She completes the booking form without horizontal scroll at 768px
6. No text or interactive element fails WCAG AA contrast (4.5:1)

---

## P4 — Kahnawà:ke Baptiste · Akwesasne Community Member

### Profile

| Field | Detail |
|---|---|
| Age | 37 |
| Location | Cornwall Island, Akwesasne (Ontario side) |
| Languages | English (primary) · Mohawk (conversational) · French (functional) |
| Income | ~$85,000/yr (combined household) |
| Home | Owned 3-bed on the island |
| Tech comfort | Moderate-high — Facebook, community apps, comfortable booking online |

### Goals
- A cleaning service that actually crosses the bridge and serves Cornwall Island
- Recognition of Akwesasne as a distinct community — not grouped under generic "Cornwall area"
- Deep cleans for family gatherings and seasonal events
- Feeling respected, not tokenised

### Fears
- Services that list "Akwesasne" in their service area but have never crossed the Seaway International Bridge
- Corporate-speak or tourist language that misrepresents the community
- Booking forms that cannot capture island access logistics (e.g., border crossing, address format)

### Buying Behaviour
Kahnawà:ke is community-networked and trust-gated. He asks in Facebook community groups before searching Google. One excellent experience converts immediately to a recurring client and generates powerful word-of-mouth referrals within Akwesasne. One dishonest claim destroys that trust permanently.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Location page | `/locations/akwesasne` exists and is indexed |
| Explicit island service | Page explicitly states "We serve Cornwall Island" — not implied |
| Notes field | Booking form notes field has island-specific access placeholder text |
| Community language | Copy uses respectful, community language — not tourism or generic "Cornwall" language |
| Referral program | Mentioned on the Akwesasne location page |

### Persona Quote
> *"Don't put our community on your service area list if you've never crossed the bridge."*

### Acceptance Test — P4
**Pass/Fail Gate for Phase C:**

1. `/locations/akwesasne` page exists and loads without error
2. Page explicitly states service to Cornwall Island — not just "Akwesasne area"
3. Page includes island-specific access information or notes
4. Booking form notes field has island-specific placeholder text (e.g., border crossing info)
5. Page copy uses respectful community language — no tourism tropes or generic Cornwall grouping

---

## P5 — Sophie Tremblay-Gagnon · Snye QC Cross-Border Client

### Profile

| Field | Detail |
|---|---|
| Age | 34 |
| Location | Snye, QC (Akwesasne Quebec side) |
| Languages | French (primary) · English (functional) |
| Income | ~$78,000/yr (combined household) |
| Home | Rented 3-bed, planning to buy |
| Tech comfort | Very high — books everything online, expects bilingual digital experience |

### Goals
- Deep clean before new baby arrives (high urgency)
- Eco-friendly and baby-safe cleaning products — non-negotiable
- A service that actually travels to the Quebec side of Akwesasne
- Full French-language service from website to confirmation

### Fears
- Services that advertise "Akwesasne" but only serve the Ontario side
- English-only websites with no French option
- No clear information about baby-safe or eco products
- Having to follow up to confirm they actually serve her area

### Buying Behaviour
Sophie is research-heavy and urgency-driven. She compares 2–3 services, reads reviews in both languages, and responds strongly to before/after photo galleries and specific eco-product information. She responds to urgency messaging ("book early, slots fill fast") and is prepared to act quickly when her needs are clearly met.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Location page | `/locations/snye-qc` exists and is indexed |
| French copy | Page includes French copy: "Nous servons Akwesasne, côté Québec" |
| Eco-product info | Baby-safe / eco product information on homepage AND all service pages |
| Gallery | Before/after photo gallery as primary trust mechanism on location page |
| Bilingual confirmations | Confirmation email and SMS sent in French (matching booking language) |
| Quebec Law 25 | Explicit consent required for data collection — see COMPLIANCE.md |

### Persona Quote
> *"Je n'ai trouvé qu'un seul service avec une option française qui va à Snye. Je l'ai réservé en quatre minutes."*

### Acceptance Test — P5
**Pass/Fail Gate for Phase C:**

1. Sophie lands on the homepage with browser locale `fr-CA` — full French UI loads
2. She navigates to `/locations/snye-qc` — French copy is present, including explicit Quebec-side service statement
3. Eco/baby-safe product information is visible on the page
4. A before/after photo gallery is present and loading
5. She completes a deep clean booking in French
6. She receives a French-language confirmation email within 60 seconds
7. Data consent is captured explicitly per Quebec Law 25 (Bill 64)

---

## P6 — Patricia & Dean Gallagher · Airbnb Host

### Profile

| Field | Detail |
|---|---|
| Ages | 49 & 52 |
| Location | South Glengarry (waterfront property) |
| Languages | English (only) |
| Income | ~$195,000/yr (combined household) |
| Properties | Primary home + 1 Airbnb unit on the St. Lawrence |
| Tech comfort | High — manages Airbnb via app, expects professional-grade tools |

### Goals
- Guaranteed same-day turnover within the 11am–3pm checkout/check-in window
- Consistent quality and outcome every single visit
- Linen changeover, toiletry restocking, and damage photo documentation on each clean
- Commercial-grade reliability — never a last-minute cancellation

### Fears
- Services that cannot commit to same-day availability
- No photo documentation (liability exposure for damage disputes)
- Last-minute cancellations that leave the property unprepared for incoming guests
- Being treated like a residential client when they have commercial needs

### Buying Behaviour
High-value, high-expectation, intensely loyal when their specific needs are met. Willing to pay a premium for guaranteed availability and documentation. Manages 40–52 cleaning events per year at premium rates. Will sign a recurring commercial agreement if the service proves reliable in the first 3 visits.

### Feature Requirements

| Feature | Requirement |
|---|---|
| Service page | `/services/airbnb-turnover` exists and is indexed |
| Airbnb language | Page uses Airbnb host vocabulary — not residential cleaning language |
| Turnover window | 11am–3pm window explicitly stated on the service page |
| Linen service | Linen changeover listed as an included service |
| Damage photos | Photo documentation listed as an included deliverable |
| Commercial form | Inquiry form distinct from the standard residential booking form |
| Priority scheduling | Mention of priority scheduling or commercial account option |

### Persona Quote
> *"I don't need the cheapest. I need the most reliable."*

### Acceptance Test — P6
**Pass/Fail Gate for Phase C:**

1. `/services/airbnb-turnover` page exists and loads without error
2. Page uses Airbnb host language throughout (not residential cleaning copy)
3. The 11am–3pm turnover window is explicitly stated
4. Linen changeover is listed as an included service item
5. Damage photo documentation is listed as an included deliverable
6. A commercial inquiry form is present and distinct from the standard residential booking form
7. Priority scheduling or commercial account option is mentioned

---

## Cross-Persona Requirements Matrix

| Requirement | P1 Diane | P2 Travis | P3 Margaret | P4 Baptiste | P5 Sophie | P6 Gallagher |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| French UI | ✅ | — | — | — | ✅ | — |
| Mobile-first booking | — | ✅ | — | — | ✅ | — |
| Phone in nav/footer | — | — | ✅ | — | — | — |
| 16px minimum text | — | — | ✅ | — | — | — |
| 48px touch targets | — | — | ✅ | — | — | — |
| Same cleaner note | ✅ | — | ✅ | — | — | — |
| Eco/baby-safe info | ✅ | — | — | — | ✅ | — |
| Location page exists | — | — | — | ✅ | ✅ | — |
| Service page exists | — | — | — | — | — | ✅ |
| SMS confirmation | — | ✅ | — | — | ✅ | — |
| French email confirmation | ✅ | — | — | — | ✅ | — |
| Notes field (logistics) | — | — | — | ✅ | — | — |
| Commercial inquiry form | — | — | — | — | — | ✅ |
| Photo documentation | — | — | — | — | ✅ | ✅ |

---

*End of Personas — Human-defined. AI agents read only. Do not modify.*
