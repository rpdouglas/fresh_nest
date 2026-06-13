# Fresh Nest Co. — Persona Reference

**Version:** 3.0 | **Updated:** June 2026  
**Status:** Human-defined — AI agents READ ONLY. Do NOT modify this file.  
**Supersedes:** v2.0 (June 2025)

> [!CAUTION]
> This document is human-defined and immutable to AI agents. It defines the twelve user archetypes whose needs drive every product decision across both the customer-facing website and the FSM (Field Service Management) platform. Before implementing any feature, identify which persona(s) it serves. If you cannot name one, halt and ask.

---

## What Changed in v3

Version 3 expands the persona suite from six customer-facing archetypes (P1–P6) to twelve, adding six staff-side personas (P7–P12) introduced alongside the FSM module initiative. The v2 customer personas are unchanged. The new staff personas are **system constraints**, not just user stories — each encodes a hard technical requirement that the FSM platform must enforce, not merely accommodate.

**Key architectural implication:** The FSM module serves two distinct user populations simultaneously. A feature that serves Carla (P7) may conflict with what serves Sarah (P12). When conflicts arise between staff personas, Sarah's compliance constraints take precedence — they represent legal and regulatory floors, not preferences.

---

## Persona Index

### Customer-Facing Personas (Website + Booking)

| ID | Name | Location | Primary Language | Key Need |
|---|---|---|---|---|
| P1 | Diane Lafleur | East Cornwall ON | French | French-language UX + consistent cleaner |
| P2 | Travis McLeod | Long Sault ON | English | Fast mobile booking + transparent pricing |
| P3 | Margaret Storey | West Cornwall ON | English | Accessibility + phone contact + trust |
| P4 | Kahnawà:ke Baptiste | Cornwall Island, Akwesasne | English / Mohawk | Island service recognition + logistics |
| P5 | Sophie Tremblay-Gagnon | Snye, QC | French | Cross-border service + eco products + French UX |
| P6 | Patricia & Dean Gallagher | South Glengarry | English | Reliable Airbnb turnover + photo proof |

### Staff-Side Personas (FSM Platform)

| ID | Name | Constraint Type | Hard System Requirement |
|---|---|---|---|
| P7 | Carla | ODSP Earnings Cap | Pre-claim earnings check + visual "Safe to Earn" meter |
| P8 | Jasmine | Transit-Only Commuter | Travel time buffer enforcement between shifts |
| P9 | Mike | Recovery Commitments | Recurring blocked-window filter on shift visibility |
| P10 | Ahmed | ESL / Low English Literacy | Icon-first UI + Arabic language toggle |
| P11 | Brenda | Visual Verification | Mandatory timestamped, geo-tagged photo uploads |
| P12 | Sarah | Owner / Compliance | Audit trail, rate snapshots, terms version tracking |

---

---

## PART 1 — Customer-Facing Personas (P1–P6)

*These personas are unchanged from v2.0. They drive the customer-facing website, booking flow, and all client-side communications.*

---

### P1 — Diane Lafleur · Francophone Homeowner

#### Profile

| Field | Detail |
|---|---|
| Age | 58 |
| Location | East Cornwall ON (Riverdale) |
| Languages | French (primary) · English (functional) |
| Income | ~$72,000/yr (pension) |
| Home | Owned 3-bed bungalow, 1,450 sq ft |
| Tech comfort | Moderate — Facebook, email, mobile |

#### Goals
- Maintain a clean home to her own high standards
- Same cleaner every visit — no rotation, no strangers
- Eco-friendly and fragrance-free products (cat allergy concern)
- Complete French-language service experience, from website to confirmation email

#### Fears
- English-only website or UI that switches unexpectedly to English
- Random cleaner rotations with no notice
- Chemical or scented products that harm her cat

#### Buying Behaviour
Diane researches 2–3 cleaning services in French on Facebook groups and Google before contacting anyone. She reads reviews in both languages and selects the first service with a fully French UI. She will not submit a form in English.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Language toggle | Visible in navbar on all pages |
| French translations | `fr.json` 100% complete — no English fallbacks |
| Trust Bar | Rendered in French |
| Meet Your Team | Preferred cleaner note available in booking form |
| Confirmation email | Entirely in French, sent within 60 seconds of booking |
| Booking form | All labels, placeholders, and error messages in French |

#### Persona Quote
> *"Je veux que mon chez-moi soit aussi propre que je le ferais moi-même — en français."*

#### Acceptance Test — P1
**Pass/Fail Gate for Phase C:**

1. Diane visits the homepage with browser locale set to `fr-CA`
2. Full French UI is displayed — no English text visible at initial render
3. She navigates to the booking form — all labels and options appear in French
4. She selects a preferred cleaner from the Meet Your Team section
5. She submits the booking
6. A confirmation email arrives in French within 60 seconds
7. The email contains her booking details and cleaner name in French

---

### P2 — Travis McLeod · Young Tradesperson

#### Profile

| Field | Detail |
|---|---|
| Age | 29 |
| Location | Long Sault ON (South Stormont) |
| Languages | English (only) |
| Income | ~$68,000/yr |
| Home | Rented 2-bed apartment |
| Tech comfort | Very high — smartphone-first, apps for everything |

#### Goals
- Book a cleaning in under 3 minutes on his iPhone
- See a real price before giving any contact information
- No account creation, no friction
- SMS confirmation he can reference on the job site

#### Fears
- Hidden prices revealed only after a consultation call
- Booking forms that require account signup
- Desktop-only layouts that break on mobile
- Any friction that adds time to the booking flow

#### Buying Behaviour
Travis searches on iPhone between job sites. He wants a visible price range within the first 3 taps. If he can't see a price and complete a booking in under 5 minutes, he leaves and tries the next result. He responds to biweekly discounts and does not respond to brand storytelling.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Instant Quote Calculator | Above the fold on homepage, mobile-optimised |
| Price visibility | Price range displayed before any contact fields |
| Biweekly discount | Visible and pre-selected option in calculator |
| Form pre-population | Calculator selections flow into booking form |
| Booking form | Mobile-first, no required account creation |
| SMS confirmation | Delivered within 30 seconds of booking submission |

#### Persona Quote
> *"If I can't see a price and book it in three minutes, I'm moving on."*

#### Acceptance Test — P2
**Pass/Fail Gate for Phase C:**

1. Travis opens the homepage on an iPhone (375px viewport)
2. He selects 4-bed + biweekly + standard clean in the Quote Calculator — within 3 taps
3. A price range is displayed immediately (no form submission required)
4. He taps the CTA — the booking form opens with his calculator selections pre-filled
5. He completes the booking without creating an account
6. Total time from landing to booking confirmation: under 3 minutes
7. SMS confirmation received within 30 seconds

---

### P3 — Margaret Storey · Senior Recurring Client

#### Profile

| Field | Detail |
|---|---|
| Age | 71 |
| Location | West Cornwall ON (McConnell Ave area) |
| Languages | English (only) |
| Income | ~$52,000/yr (pension + CPP) |
| Home | Owned 2-bed bungalow (downsized) |
| Tech comfort | Low-moderate — iPad, email, Facebook; avoids forms |

#### Goals
- Maintain a clean, safe home independently
- Consistent same cleaner on every visit — no strangers
- Ability to call before booking if she has questions
- No hidden steps, no surprises in the checkout flow

#### Fears
- Online-only booking with no phone number to call
- A different cleaner arriving each time
- Text too small to read comfortably on her iPad
- Complicated multi-step checkouts that lose her progress

#### Buying Behaviour
Margaret reads every word on a page carefully. She calls before booking whenever a phone number is visible. Once trust is established with a service and a cleaner, she becomes a long-term recurring customer — potentially for years. She is not price-sensitive once she trusts the service.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Phone number | Visible in navbar AND footer without scrolling |
| Phone link | Must be a tappable `tel:` link — not plain text |
| Text size | Minimum 16px (`text-base`) across all viewport sizes |
| Touch targets | Minimum 48px height on all interactive elements |
| Contrast | WCAG AA — 4.5:1 minimum for all text/background pairs |
| Booking flow | Multi-step flow must preserve state; no unexplained data loss |
| Layout | No horizontal scroll at 768px (iPad portrait) |

#### Persona Quote
> *"I just need to know someone will show up who I recognize. And I need to be able to call if something goes wrong."*

#### Acceptance Test — P3
**Pass/Fail Gate for Phase C:**

1. Margaret visits the homepage on an iPad (768px viewport, portrait)
2. The phone number is visible in the header without scrolling
3. All body text is 16px or larger
4. All buttons, inputs, and tappable elements are 48px or taller
5. She completes the booking form without horizontal scroll at 768px
6. No text or interactive element fails WCAG AA contrast (4.5:1)

---

### P4 — Kahnawà:ke Baptiste · Akwesasne Community Member

#### Profile

| Field | Detail |
|---|---|
| Age | 37 |
| Location | Cornwall Island, Akwesasne (Ontario side) |
| Languages | English (primary) · Mohawk (conversational) · French (functional) |
| Income | ~$85,000/yr (combined household) |
| Home | Owned 3-bed on the island |
| Tech comfort | Moderate-high — Facebook, community apps, comfortable booking online |

#### Goals
- A cleaning service that actually crosses the bridge and serves Cornwall Island
- Recognition of Akwesasne as a distinct community — not grouped under generic "Cornwall area"
- Deep cleans for family gatherings and seasonal events
- Feeling respected, not tokenised

#### Fears
- Services that list "Akwesasne" in their service area but have never crossed the Seaway International Bridge
- Corporate-speak or tourist language that misrepresents the community
- Booking forms that cannot capture island access logistics

#### Buying Behaviour
Kahnawà:ke is community-networked and trust-gated. He asks in Facebook community groups before searching Google. One excellent experience converts to a recurring client and generates powerful word-of-mouth referrals within Akwesasne. One dishonest claim destroys that trust permanently.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Location page | `/locations/akwesasne` exists and is indexed |
| Explicit island service | Page explicitly states "We serve Cornwall Island" — not implied |
| Notes field | Booking form notes field has island-specific access placeholder text |
| Community language | Copy uses respectful, community language — not tourism language |
| Referral program | Mentioned on the Akwesasne location page |

#### Persona Quote
> *"Don't put our community on your service area list if you've never crossed the bridge."*

#### Acceptance Test — P4
**Pass/Fail Gate for Phase C:**

1. `/locations/akwesasne` page exists and loads without error
2. Page explicitly states service to Cornwall Island — not just "Akwesasne area"
3. Page includes island-specific access information or notes
4. Booking form notes field has island-specific placeholder text
5. Page copy uses respectful community language — no tourism tropes or generic Cornwall grouping

---

### P5 — Sophie Tremblay-Gagnon · Snye QC Cross-Border Client

#### Profile

| Field | Detail |
|---|---|
| Age | 34 |
| Location | Snye, QC (Akwesasne Quebec side) |
| Languages | French (primary) · English (functional) |
| Income | ~$78,000/yr (combined household) |
| Home | Rented 3-bed, planning to buy |
| Tech comfort | Very high — books everything online, expects bilingual digital experience |

#### Goals
- Deep clean before new baby arrives (high urgency)
- Eco-friendly and baby-safe cleaning products — non-negotiable
- A service that actually travels to the Quebec side of Akwesasne
- Full French-language service from website to confirmation

#### Fears
- Services that advertise "Akwesasne" but only serve the Ontario side
- English-only websites with no French option
- No clear information about baby-safe or eco products
- Having to follow up to confirm they actually serve her area

#### Buying Behaviour
Sophie is research-heavy and urgency-driven. She compares 2–3 services, reads reviews in both languages, and responds strongly to before/after photo galleries and specific eco-product information.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Location page | `/locations/snye-qc` exists and is indexed |
| French copy | Page includes French copy: "Nous servons Akwesasne, côté Québec" |
| Eco-product info | Baby-safe / eco product information on homepage AND all service pages |
| Gallery | Before/after photo gallery as primary trust mechanism on location page |
| Bilingual confirmations | Confirmation email and SMS sent in French (matching booking language) |
| Quebec Law 25 | Explicit consent required for data collection — see COMPLIANCE.md |

#### Persona Quote
> *"Je n'ai trouvé qu'un seul service avec une option française qui va à Snye. Je l'ai réservé en quatre minutes."*

#### Acceptance Test — P5
**Pass/Fail Gate for Phase C:**

1. Sophie lands on the homepage with browser locale `fr-CA` — full French UI loads
2. She navigates to `/locations/snye-qc` — French copy is present, including explicit Quebec-side service statement
3. Eco/baby-safe product information is visible on the page
4. A before/after photo gallery is present and loading
5. She completes a deep clean booking in French
6. She receives a French-language confirmation email within 60 seconds
7. Data consent is captured explicitly per Quebec Law 25 (Bill 64)

---

### P6 — Patricia & Dean Gallagher · Airbnb Host

#### Profile

| Field | Detail |
|---|---|
| Ages | 49 & 52 |
| Location | South Glengarry (waterfront property) |
| Languages | English (only) |
| Income | ~$195,000/yr (combined household) |
| Properties | Primary home + 1 Airbnb unit on the St. Lawrence |
| Tech comfort | High — manages Airbnb via app, expects professional-grade tools |

#### Goals
- Guaranteed same-day turnover within the 11am–3pm checkout/check-in window
- Consistent quality and outcome every single visit
- Linen changeover, toiletry restocking, and damage photo documentation on each clean
- Commercial-grade reliability — never a last-minute cancellation

#### Fears
- Services that cannot commit to same-day availability
- No photo documentation (liability exposure for damage disputes)
- Last-minute cancellations that leave the property unprepared
- Being treated like a residential client when they have commercial needs

#### Buying Behaviour
High-value, high-expectation, intensely loyal when their specific needs are met. Willing to pay a premium for guaranteed availability and documentation. Manages 40–52 cleaning events per year at premium rates.

#### Feature Requirements

| Feature | Requirement |
|---|---|
| Service page | `/services/airbnb-turnover` exists and is indexed |
| Airbnb language | Page uses Airbnb host vocabulary — not residential cleaning language |
| Turnover window | 11am–3pm window explicitly stated on the service page |
| Linen service | Linen changeover listed as an included service |
| Damage photos | Photo documentation listed as an included deliverable |
| Commercial form | Inquiry form distinct from the standard residential booking form |
| Priority scheduling | Mention of priority scheduling or commercial account option |

#### Persona Quote
> *"I don't need the cheapest. I need the most reliable."*

#### Acceptance Test — P6
**Pass/Fail Gate for Phase C:**

1. `/services/airbnb-turnover` page exists and loads without error
2. Page uses Airbnb host language throughout
3. The 11am–3pm turnover window is explicitly stated
4. Linen changeover is listed as an included service item
5. Damage photo documentation is listed as an included deliverable
6. A commercial inquiry form is present and distinct from the standard residential booking form
7. Priority scheduling or commercial account option is mentioned

---

---

## PART 2 — Staff-Side Personas (P7–P12)

*These personas drive the FSM (Field Service Management) platform. They represent the cleaning staff and the business owner. Each persona encodes a hard system constraint — a requirement that the system must enforce, not merely make available as a setting.*

**Design principle for P7–P12:** Every constraint is a protection. Carla's earnings cap protects her housing. Mike's blocked windows protect his recovery. Ahmed's icon-first UI protects job quality. Brenda's photo requirement protects her from disputes. Jasmine's travel buffer protects her from impossible scheduling. Sarah's audit trail protects the business from liability. The FSM platform is a trust infrastructure, not just a workflow tool.

---

### P7 — Carla · ODSP Recipient

#### Profile

| Field | Detail |
|---|---|
| Situation | Single mother, receiving Ontario Disability Support Program (ODSP) benefits |
| Core constraint | Monthly earnings cap — earning above the ODSP limit triggers a benefits clawback that destabilizes her housing |
| Tech comfort | Moderate — smartphone, basic apps |
| Primary concern | Staying within her safe earning window without manually tracking dollars |

#### The Hard Constraint
Carla cannot earn more than her ODSP-allowable limit in a given month (e.g., $1,000/month net earned income after the earned income exemption) without triggering a partial or full clawback of her benefits. If the system allows her to claim a shift that pushes her over the limit, she faces a delayed financial penalty she cannot predict or absorb.

**The system must block this from happening, not warn her after the fact.**

#### Goals
- Work as many hours as she safely can without triggering a clawback
- Know at a glance how close she is to her monthly limit before claiming any shift
- Never have to do math to know if a shift is "safe"

#### Fears
- Claiming a shift, then discovering days later that she is now over the limit
- Having to manually track her earnings in a separate spreadsheet
- The app showing her shifts that she cannot actually take

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `staff.financials.monthlyEarningsLimit` | Integer, set by admin. Required field for ODSP-flagged staff profiles |
| `staff.financials.currentMonthEarnings` | Running total, updated on every confirmed shift claim |
| Pre-claim earnings check | Before a shift can be claimed: `(currentMonthEarnings + shiftGrossPay) <= monthlyEarningsLimit` must be true. If false, the claim button is disabled and a clear explanation is shown. This is a hard block, not a soft warning. |
| "Safe to Earn" progress bar | Visual indicator showing current month earnings vs. limit. Colour-coded: green (safe), amber (within $100 of limit), red (at or over limit). Present on dashboard and on every shift detail screen. |
| Shift listing filter | Shifts that would push Carla over her limit must be visually marked as unclaimed (greyed, with explanation) — they should still be visible so she understands why, but the claim action is disabled. |
| Admin override | Sarah (P12) can manually adjust `monthlyEarningsLimit` and `currentMonthEarnings` with an audit log entry. |

#### Persona Quote
> *"I can't afford to guess. If the app lets me claim it, I need to know it's safe."*

#### Acceptance Test — P7
**Pass/Fail Gate for Phase C:**

1. Carla's profile has `monthlyEarningsLimit` set to $800 and `currentMonthEarnings` at $750
2. She views a shift worth $75 — the claim button is disabled with a message explaining she is $25 over her limit for this shift
3. She views a shift worth $45 — the claim button is active
4. The "Safe to Earn" progress bar shows $750/$800 (94% — amber state)
5. After claiming the $45 shift, `currentMonthEarnings` updates to $795 and the bar shows red
6. A shift worth $10 remains claimable; a shift worth $11 or more is blocked

---

### P8 — Jasmine · Transit-Only Commuter

#### Profile

| Field | Detail |
|---|---|
| Situation | No personal vehicle. Relies entirely on Cornwall Transit for getting to job sites. |
| Core constraint | Transit travel time between two job sites may make back-to-back shifts physically impossible |
| Tech comfort | Moderate-high — smartphone, comfortable with apps |
| Primary concern | Not being assigned or claiming shifts that are geographically impossible given her transport method |

#### The Hard Constraint
If Jasmine's first shift ends at 12:00 PM in one part of Cornwall and her next shift starts at 12:30 PM across town, she physically cannot make it using Cornwall Transit. If the system allows this pairing, she either misses the second job (damaging client trust and triggering a performance flag) or sprints and arrives flustered, delivering lower quality work.

**The system must prevent impossible schedule pairings, not just flag them.**

#### Goals
- Only see and claim shifts that are realistically reachable given transit travel time
- Never be presented with a schedule that looks valid but is actually impossible
- Get to every job on time, calm, and ready to work

#### Fears
- Back-to-back shifts with insufficient travel time between them
- Being penalised for lateness caused by a transit route she cannot control
- Being assigned to geographically clustered work (which is ideal) vs. scattered work (which wastes her day)

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `staff.constraints.transportMode` | Enum: `'personal_vehicle' \| 'transit' \| 'rideshare' \| 'walk'`. Set on staff profile. |
| `staff.constraints.transitBufferMinutes` | Integer. Default `60` for transit users. Configurable by admin. |
| Travel time conflict engine (v1) | On shift claim or assignment: if `previousShiftEndTime + transitBufferMinutes > nextShiftStartTime`, the claim is blocked with an explanation. Uses address-based heuristic (same postal prefix = waive buffer). |
| Travel time conflict engine (v2, future) | Replace heuristic with Google Maps Transit API query: `travelTime(origin, destination, mode='transit', arrivalTime)`. Block if API response `duration > availableWindow`. |
| Shift listing — transit filter | When Jasmine views available shifts, shifts that conflict with her existing confirmed schedule (based on buffer) are shown as unavailable with a "Travel conflict" label. They are not hidden — she can see them and understand why they are blocked. |
| Cluster view | Optional dashboard view showing shifts grouped by geographic area (postal code prefix). Allows Jasmine to plan a transit-efficient day. |

#### Persona Quote
> *"I can't teleport. Show me shifts I can actually get to."*

#### Acceptance Test — P8
**Pass/Fail Gate for Phase C:**

1. Jasmine's profile has `transportMode: 'transit'` and `transitBufferMinutes: 60`
2. She has a confirmed shift ending at 12:00 PM at Address A
3. She views an available shift starting at 12:30 PM at Address B (different postal prefix) — it is shown with a "Travel conflict" label; the claim button is disabled
4. She views an available shift starting at 1:15 PM at Address B — the claim button is active
5. If Address B shares the same postal prefix as Address A, the 60-min buffer is waived and both shifts show as available
6. Admin can override a conflict with an audit log entry

---

### P9 — Mike · Recovery Commitment Worker

#### Profile

| Field | Detail |
|---|---|
| Situation | Re-entering the workforce. Attends mandatory support group meetings on a recurring schedule (e.g., every Tuesday at 7:00 PM) as part of his recovery program |
| Core constraint | Recurring blocked windows that must never have work scheduled against them |
| Tech comfort | Moderate — smartphone, simple UI preferred |
| Primary concern | His recovery meetings are non-negotiable. Work and recovery must not conflict. |

#### The Hard Constraint
Mike's support group meetings are not preferences — they are a condition of his recovery program. If a shift is assigned or becomes visible during a blocked window, it creates direct conflict between his livelihood and his recovery. The system must make blocked windows invisible from the shift marketplace — shifts during those times simply do not appear for him.

**This is not a warning. It is a visibility filter. Blocked shifts must not appear.**

#### Goals
- Work as much as possible outside his blocked windows
- Never be tempted or pressured by a shift that falls within a blocked window
- Never have to manually cross-reference his meeting schedule with the shift schedule

#### Fears
- Being offered a well-paying shift during a blocked window and feeling pressure to choose
- The system showing him a conflict rather than silently filtering it away
- His private recovery commitments being visible to other staff members or to clients

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `staff.constraints.blockedWindows` | Array of `{ dayOfWeek: 0-6, startTime: 'HH:MM', endTime: 'HH:MM', recurring: boolean, label: string }`. The `label` is only visible to the staff member and to Sarah (admin). Never displayed to clients or other staff. |
| Shift visibility filter | Any shift whose time window overlaps with any of Mike's `blockedWindows` is **completely hidden** from his available shifts view. It does not appear as greyed-out or unavailable — it is absent. |
| Admin scheduling guard | When Sarah (P12) attempts to manually assign a shift to Mike during a blocked window, the system shows a warning: "This shift overlaps with a blocked window for this staff member." Sarah can override with a reason (audit-logged). |
| Privacy | `blockedWindows` labels are visible only to the staff member in their own profile, and to admin. No label, reason, or detail is visible to other staff or to booking clients. |
| One-time vs. recurring | Blocked windows support both recurring (e.g., every Tuesday 7–9 PM) and one-time (e.g., specific date for medical appointment). One-time windows expire automatically after the date passes. |

#### Persona Quote
> *"My meetings aren't optional. I need the schedule to just know that."*

#### Acceptance Test — P9
**Pass/Fail Gate for Phase C:**

1. Mike's profile has a blocked window: `{ dayOfWeek: 2 (Tuesday), startTime: '19:00', endTime: '20:30', recurring: true }`
2. There is an available shift on a Tuesday from 18:30–20:00 — it does not appear in Mike's available shifts list
3. There is an available shift on a Tuesday from 20:30–22:00 — it appears normally in his list
4. There is an available shift on a Wednesday from 19:00–20:30 — it appears normally (different day)
5. When Sarah attempts to manually assign the Tuesday 18:30 shift to Mike, she receives a warning but can override with a logged reason
6. The blocked window label ("Recovery meeting" or whatever Mike entered) is not visible to other staff or to clients

---

### P10 — Ahmed · ESL / Newcomer Staff Member

#### Profile

| Field | Detail |
|---|---|
| Situation | Recent immigrant with a strong work ethic and high reliability, but low English reading literacy |
| Core constraint | Text-heavy instructions result in misunderstood tasks, missed steps, and errors that are blamed on him — not the UI |
| Languages | Arabic (primary) · limited English · no French |
| Tech comfort | High physical dexterity with smartphones; low with text-heavy apps |
| Primary concern | Understanding exactly what he needs to do at each job without reading paragraphs of English |

#### The Hard Constraint
Ahmed can recognize icons faster than he can decode English sentences. A text-only checklist for a deep clean is not equally accessible to him as it is to an English-literate worker. The system must communicate tasks primarily through visual means — icons, photos, and short labels — and must provide language options that include Arabic.

**This is an accessibility requirement, not a preference. An inaccessible task interface degrades job quality and misattributes errors.**

#### Goals
- Understand his full task list for a job without relying on English text
- Navigate the shift claim and check-in process without getting lost in menus
- Feel respected by the tools he uses — not treated as less capable

#### Fears
- Arriving at a job and misunderstanding the task list
- Making an error that was caused by unclear instructions, then being blamed for it
- An app that feels designed for someone else

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `staff.preferences.language` | Enum: `'en' \| 'fr' \| 'ar'`. Applied globally to all FSM staff-facing UI strings. |
| Arabic UI translations | All FSM task labels, checklist items, navigation, and status messages available in Arabic (RTL layout support required). English and French already covered by customer-facing i18n. |
| Icon-first task UI | All checklist task types have a mandatory icon alongside the label. Standard icon set: `Mop`, `Toilet`, `Trash`, `Key`, `Bed`, `Oven`, `Fridge`, `Window`, `Photo`, `Check`. Icons are non-decorative — they are the primary communication channel for this persona. |
| Task confirmation | Completing a checklist item requires tapping the icon + a checkmark swipe (two-gesture confirmation). This prevents accidental completion and reinforces the visual communication pattern. |
| Photo task fallback | If a task requires a "Before" or "After" photo (P11 Brenda requirement), the camera icon triggers the photo upload flow directly — no text navigation required. |
| Onboarding | New staff onboarding flow uses icon-matched visual steps, not paragraph instructions. A language selection screen appears on first login. |

#### Persona Quote
> *"Show me what to do. I'll do it right."*

#### Acceptance Test — P10
**Pass/Fail Gate for Phase C:**

1. Ahmed's profile has `language: 'ar'`
2. All FSM task labels, navigation items, and status messages render in Arabic on his device
3. The checklist for a standard clean shows task icons alongside each label (Mop, Toilet, Bed, etc.)
4. He can complete a full shift — claim, check-in, checklist, photo upload, check-out — without reading a single English word
5. RTL layout renders correctly at 375px and 768px viewports
6. A language selection screen appears on first login

---

### P11 — Brenda · Visual Verifier

#### Profile

| Field | Detail |
|---|---|
| Situation | Detail-oriented, experienced cleaner. Has had past disputes about damage she did not cause and jobs she completed that clients claimed were skipped. |
| Core constraint | She needs proof of her work — timestamped, geo-tagged photographic evidence — as protection against "he said/she said" disputes |
| Tech comfort | High — comfortable with smartphone cameras and photo uploads |
| Primary concern | Being falsely blamed for damage she did not cause, or having completed work disputed |

#### The Hard Constraint
Trust without evidence is insufficient. For high-value items and dispute-prone situations, the system must require photo documentation — not offer it as optional. If photo upload is optional, it will be skipped when workers are tired or rushed. Brenda's protection requires mandatory photo capture, not a suggestion.

**Photo requirements for designated task types are enforced — the task cannot be marked complete without a valid photo.**

#### Goals
- Have timestamped, geo-tagged evidence that she was present and completed her work
- Know which specific items require photos before she arrives at a job
- Never lose a dispute because she didn't think to take a photo in the moment

#### Fears
- Arriving at a job not knowing which items need documentation
- Taking a photo that gets rejected because it was taken at the wrong time or location
- Clients claiming damage that was pre-existing — with no photo evidence to refute it

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `task.requiresPhoto` | Boolean. Set per task type in the service template. Task types that default to `requiresPhoto: true`: Stove (before), Stove (after), Fridge (before), Fridge (after), primary bathroom (after), property entry (before = arrival photo) |
| Photo capture enforcement | A task with `requiresPhoto: true` cannot be marked complete until a photo has been uploaded. The complete/checkmark button is disabled until the photo upload succeeds. |
| Photo metadata — timestamp | `photo.capturedAt`: ISO timestamp from device clock at capture time. Displayed on all stored photos. |
| Photo metadata — geolocation | `photo.geoLat` and `photo.geoLng`: GPS coordinates captured at upload time. If geolocation is denied by the device, the upload is permitted but flagged as `geoTagged: false` with a visible indicator. |
| Photo metadata — staffId | `photo.staffId`: The ID of the authenticated staff member who uploaded. Stored immutably. |
| Photo storage | Photos stored in Firebase Storage under `jobs/{jobId}/photos/{photoId}`. Accessible to admin (P12). Accessible to the uploading staff member. Not accessible to other staff members or to clients in Phase 1. |
| Dispute review | Sarah (P12) can view all photos for any job from the admin dashboard, including metadata. Photo viewer shows timestamp, geo status, and staff name on each image. |

#### Persona Quote
> *"I do the job right every time. I just need proof that I did."*

#### Acceptance Test — P11
**Pass/Fail Gate for Phase C:**

1. A deep clean job template has the Stove task configured with `requiresPhoto: true`
2. Brenda arrives at the job and opens the checklist — the Stove task shows a camera icon indicating a photo is required
3. She taps the Stove task — the camera launches directly
4. She attempts to mark the Stove task complete without taking a photo — the complete button is disabled
5. She takes a photo — it uploads successfully with `capturedAt` timestamp and `geoLat/geoLng` metadata
6. The complete button becomes active; she marks the task done
7. Sarah views the job record in the admin dashboard and sees the photo with timestamp and geo status displayed

---

### P12 — Sarah · Business Owner / Compliance

#### Profile

| Field | Detail |
|---|---|
| Situation | Business owner responsible for payroll accuracy, employment standards compliance, HST remittance, and liability protection |
| Core constraint | Every employment and financial transaction must produce an immutable audit trail that can withstand a labour board audit |
| Tech comfort | High — comfortable with complex dashboards and operational software |
| Primary concern | A labour board inspection or legal dispute should never be able to catch Fresh Nest Co. without documentation |

#### The Hard Constraint
Compliance is not a feature. It is the floor beneath every other feature. If a pay rate changes, every historical shift record must retain the rate that was in effect at the time of the shift — not the current rate. If staff accept terms of service, the version they accepted must be stored permanently. If a dispute arises, every action in the system must be traceable to a timestamp and a user.

**Sarah's requirements override convenience. No UX optimization is permitted to compromise the audit trail.**

#### Goals
- Know that every shift record is a complete, frozen snapshot of what was agreed to at the time
- Maintain proof that all staff have accepted current terms and that version history is tracked
- Be able to produce a complete employment record for any staff member on demand
- Never have a "we can't find that record" conversation with an auditor

#### Fears
- Pay rate changes retroactively altering historical shift records
- A staff member claiming they never accepted a policy change
- Photo, GPS, or time records that can be altered after the fact
- Data loss of any financial or employment record

#### Feature Requirements

| Field / Requirement | Specification |
|---|---|
| `staff.compliance.acceptedTermsVersion` | String (semantic version, e.g., `"2.1"`). Updated only when the staff member explicitly accepts the new terms document. All versions are stored in `staff.compliance.termsHistory[]`. |
| `shift.payRateSnapshot` | Object: `{ rateId: string, amount: number, currency: 'CAD', effectiveAt: ISO timestamp, snapshotAt: ISO timestamp }`. Captured at the moment the shift is confirmed/claimed. Immutable after capture — no update pathway exists. |
| Immutable shift records | Once a shift status reaches `completed`, no field on the shift record can be updated except by an admin override that creates a new record with a `reason` field (the original record is preserved). |
| Audit log | Every write operation on `staff`, `shifts`, and `bookings` collections that changes a financial, status, or compliance field generates an entry in `auditLog/{docId}`: `{ collection, documentId, field, oldValue, newValue, changedBy, changedAt }`. |
| Admin override trail | Any time Sarah (or another admin) overrides a system rule (P7 earnings cap, P8 travel conflict, P9 blocked window, P11 photo requirement), the override is recorded in the audit log with a mandatory `reason` field. No silently-overridden rules. |
| Rate history | `payRates` collection stores all historical rates with `effectiveFrom` and `effectiveTo` dates. Sarah can view the full rate history timeline from the admin dashboard. |
| Staff record export | Admin can export a complete employment record for any staff member as a structured JSON or PDF: all shifts, pay snapshots, terms acceptance history, and audit log entries for that staff member. |
| Terms distribution | When Sarah publishes a new terms version, all active staff receive an in-app notification requiring acceptance before their next shift can be claimed. |

#### Persona Quote
> *"If there's ever an audit, I need to be able to show everything. Not most of it — everything."*

#### Acceptance Test — P12
**Pass/Fail Gate for Phase C:**

1. A pay rate is changed in the system from $18/hr to $20/hr effective today
2. A shift that was confirmed last week at $18/hr still shows `payRateSnapshot.amount: 18` — the rate change did not retroactively update it
3. A new shift confirmed today shows `payRateSnapshot.amount: 20`
4. Sarah publishes Terms v2.1 — all active staff see an in-app prompt requiring acceptance before their next shift claim
5. Staff member Ahmed accepts v2.1 — `acceptedTermsVersion: "2.1"` is stored, and the previous version `"2.0"` is retained in `termsHistory[]`
6. Sarah uses the admin override to bypass Carla's earnings cap for one shift — the audit log records the override with the reason Sarah entered
7. Sarah exports Brenda's employment record — the export includes all shifts, pay snapshots, terms history, and audit entries

---

---

## Cross-Persona Requirements Matrix

### Customer-Facing (P1–P6)

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

### Staff-Side (P7–P12)

| Requirement | P7 Carla | P8 Jasmine | P9 Mike | P10 Ahmed | P11 Brenda | P12 Sarah |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Earnings cap enforcement | ✅ | — | — | — | — | ✅ (admin) |
| Travel time buffer | — | ✅ | — | — | — | ✅ (override) |
| Blocked window filter | — | — | ✅ | — | — | ✅ (override) |
| Arabic UI | — | — | — | ✅ | — | — |
| Icon-first UI | — | — | — | ✅ | — | — |
| Mandatory photo upload | — | — | — | — | ✅ | ✅ (view) |
| Photo geo + timestamp | — | — | — | — | ✅ | ✅ (audit) |
| Pay rate snapshots | — | — | — | — | — | ✅ |
| Terms version tracking | — | — | — | — | — | ✅ |
| Audit log | — | — | — | — | — | ✅ |
| Override trail | ✅ (earns) | ✅ (travel) | ✅ (blocks) | — | ✅ (photo) | ✅ (all) |

---

## Persona Conflict Resolution Rules

When a feature decision produces a conflict between persona requirements, the following priority order applies:

1. **P12 Sarah (Compliance) overrides all.** Legal and audit trail requirements cannot be compromised for UX convenience. If a feature would create a compliance gap, it is redesigned, not the compliance requirement.

2. **P7/P8/P9/P11 hard constraints override soft preferences.** An earnings cap block, travel conflict block, or photo requirement are not dismissible by the staff member. They can only be overridden by an admin (P12) with an audit-logged reason.

3. **P1/P5 bilingual requirements apply to all customer-facing surfaces.** No customer-facing feature is shipped in English only.

4. **P3 accessibility requirements apply to all staff-facing surfaces as well.** 48px touch targets and 16px minimum text are not customer-only constraints — the FSM mobile UI must meet the same standards.

5. **P10 icon-first requirements apply to FSM task UIs.** All task lists must include icons regardless of the viewing user's language, because icon-first benefits all users, not just Ahmed.

---

*End of Personas — Human-defined. AI agents read only. Do not modify.*  
*v3.0 — Adds P7–P12 (Staff-Side FSM Personas). Customer personas P1–P6 unchanged from v2.0.*