# Fresh Nest Co. — FSM Staff Personas
## docs/PERSONAS-STAFF.md

**Version:** 1.0
**Date:** June 17, 2026
**Owner:** Human-defined · AI reads only · Never modify without human approval
**Companion to:** docs/PERSONAS.md (customer personas P1–P6)
**Research basis:** Cornwall ON demographics · Akwesasne community context · Canada cleaning industry workforce data 2025–2026 · regional newcomer settlement services · cleaning industry retention research

---

## Why These Personas Exist

The six existing personas (P1 Diane through P6 Gallagher) drive all customer-facing feature decisions — booking flow, confirmations, the customer portal, and marketing copy. They are complete and well-calibrated for that surface.

Building the FSM (Field Staff Management app) requires a separate, equally rigorous set of personas for the people who will use it. Staff personas drive decisions about: the FSM app UX, onboarding flows, notification content, scheduling logic, earnings cap design, training delivery, bilingual requirements, and admin tooling in the customer app.

These are not theoretical archetypes. They are grounded in:

- Cornwall's workforce, in which nearly half of local residents have knowledge of both English and French — more than four times the Ontario average, and where Francophones represent 25.4% of the city's population
- The Akwesasne community, whose approximately 12,315 registered Mohawk members are majority English-speaking in daily use and have more interaction with the people of Cornwall than French-speaking Quebec towns
- The residential cleaning industry's workforce profile: roughly 2.9 million workers who are 88.6% female, on average 47 years old, with 27% working part-time and approximately 25% as independent contractors, and a brutal turnover rate of 200–400% per year
- The 2026 cleaning labour outlook, which finds that beyond pay, workers increasingly seek stability, clear communication, flexibility, and advancement opportunities
- Newcomer Employment & Welcome Services (NEWS), Cornwall's local immigrant employment integration program, confirming that newcomers are a genuine and growing segment of the regional labour pool

---

## Persona Rule (same as customer personas)

**No persona, no feature.** Before building any FSM feature, admin staff management tool, or onboarding flow, identify which staff persona(s) it serves. If you cannot name one, halt and ask.

**Persona tests are acceptance criteria.** The "Persona Test" in each epic spec is a pass/fail gate. SP2 Jasmine must complete onboarding in under 10 minutes on mobile. SP3 Brenda must see zero English strings in the FR flow. These are done conditions, not aspirations.

---

## Regional and Industry Context Summary

Before the personas, the key facts that shaped them:

**Cornwall, ON:**
- Population approximately 47,000; one of Eastern Ontario's largest cities
- Bilingual city: ~43% speak both EN and FR; French mother-tongue at 25.4% — far above Ontario average
- Shares its southern border with Akwesasne; tight economic and social integration between the two communities
- At the convergence of the Ontario, Quebec, and New York State borders; one of 14 Ontario border crossings between Canada and the United States
- Active newcomer infrastructure: NEWS (Newcomer Employment & Welcome Services), CÉSOC (French settlement services), and 5EO Local Immigration Partnership all operate locally
- Lower cost of living and lower average wages than Ottawa or Toronto; part-time and supplementary income work is common

**Akwesasne:**
- The Mohawk community of Akwesasne spans three districts: Kawehno:ke (Cornwall Island, Ontario), Kana:takon (St. Regis, Quebec), and Tsi Snaihne (Snye, Quebec)
- English-dominant in daily use; Kanien'kéha (Mohawk language) is spoken by community members and is culturally significant
- Strong community employment infrastructure through MCA and AERC
- Cross-border geography (Ontario + Quebec + New York) creates complex employment eligibility situations for some community members

**Cleaning industry workforce (Canada/North America):**
- In Canada, janitorial services are one of the top job sectors for new immigrants and part-time workers, but turnover is high
- The residential cleaning industry's workers are 88.6% female, on average 47 years old, earn a median wage, and have a turnover rate that runs 200–400% per year — costing $1,000–$2,500 per replacement — with 65% of companies saying finding staff is their biggest challenge
- Mature employees tend to demonstrate stronger loyalty, better punctuality, and lower absenteeism compared to younger demographics
- Companies that prioritize engagement, flexible schedules, and career growth maintain more stable workforces
- Care-related issues are the single most common reason employees leave the workforce; rigid or unpredictable work schedules are a primary driver of turnover

---

## The Six Staff Personas

---

### SP1 — Lauren Arsenault · Owner / Administrator

**Age:** 38 | **Location:** Cornwall, ON | **Role:** Business owner, admin, scheduler, primary contact
**Languages:** English (primary), conversational French
**Device:** Desktop (admin panel), iPhone (mobile admin tasks)

**Who she is:**
Lauren founded Fresh Nest Co. She handles everything: quoting, scheduling, client communication, staff management, payroll, and marketing. She is the only admin user of the platform. She is not a developer and will not make Firestore edits to manage her business. Every admin UI decision must work for someone running a business alone.

**Primary need:**
A single admin panel that lets her register staff, track onboarding compliance, assign jobs, manage the dispatch board, and view business analytics — without switching between tools or calling anyone.

**Key constraints:**
- Genuinely busy: admin tasks happen in 10-minute windows between jobs and calls
- Not comfortable with ambiguous system states — if something is unclear she will call the employee directly, creating more work
- Needs to be confident that compliance steps (background check, WHMIS, employment agreement) are complete before an employee touches a client's home
- She cares deeply about the Akwesasne and Cornwall communities; she wants her employment practices to reflect that

**What the FSM must do for Lauren:**
- Register a new staff member in under 3 minutes with a single form
- Show her — at a glance — where each employee is in their onboarding journey
- Alert her when a probation check-in is due, when a background check is pending, or when an employee's earnings are approaching their monthly cap
- Let her toggle intake mode (instant booking vs. quote-required) per service type without deploying code
- Give her a dispatch board that shows conflicts and capacity before she assigns anyone

**Persona test:**
Lauren registers a new cleaner. A welcome email with a magic link reaches the employee within 60 seconds. She can see the onboarding checklist status in the Staff panel without any Firestore editing. She activates the employee by clicking a single button after all required items are checked.

**FSM features driven by this persona:**
Admin Staff panel · Staff Detail Panel · Onboarding checklist UI · Dispatch board · Earnings cap meter · Probation tracking · IntakeModeSettings toggle · Admin booking creation · Quote workspace modal

---

### SP2 — Jasmine Beausoleil · New Entry-Level Cleaner

**Age:** 24 | **Location:** Cornwall, ON | **Role:** Cleaner (new hire)
**Languages:** English only
**Device:** Android smartphone (mid-range), no laptop
**Transit:** Public bus; transfers required to reach some client addresses

**Who she is:**
Jasmine grew up in Cornwall and is starting her first service-industry job after working retail. She heard about Fresh Nest from a friend and applied because of the flexible hours and the community reputation. She has no experience with cleaning professionally or with field service apps. She is comfortable with her phone but has never used a scheduling or job management app.

**Primary need:**
A first-login experience that tells her exactly what to do, in plain language, one step at a time. A job app that is simple enough to use without training. Clear confirmation that she is doing the right thing at the right time.

**Key constraints:**
- Mobile-only: every FSM screen must work perfectly on a 375px Android screen
- No laptop at home; cannot complete multi-page forms on desktop
- She will not read documentation; the UI must be self-explanatory
- She uses public transit: the transit buffer and blocked window settings matter for her real schedule
- If the first login fails for any reason, she will assume she did something wrong and may not try again — she is unlikely to call Lauren to troubleshoot

**What the FSM must do for Jasmine:**
- Send her a welcome email with a magic link that logs her in on the first click — no URL to remember, no password to set
- Walk her through onboarding one screen at a time with clear progress indicators
- Display her job list the moment she's done onboarding — no hunting through menus
- Show her the check-in button prominently when she arrives at a job location
- Confirm each checklist item with a satisfying visual state change (not just text)
- Show her earnings in plain dollar amounts, not percentages or abstract figures

**Persona test:**
Jasmine clicks the magic link in her welcome email. She completes all four first-login consent screens in under 10 minutes on her Android phone. She sees her assigned job with the client address, service type, and check-in button on the My Jobs page — all without calling Lauren or asking for help.

**FSM features driven by this persona:**
First-login consent sequence (mobile-optimised) · Magic link welcome email · My Jobs page · Job detail screen · Check-in/check-out flow · Training module delivery (mobile) · Earnings display · Transit buffer setting

---

### SP3 — Brenda Côté · Experienced Lead Cleaner (French-Dominant)

**Age:** 41 | **Location:** Snye, QC | **Role:** Lead cleaner, supervisor-in-training
**Languages:** French (primary), working English
**Device:** iPhone (personal), comfortable with apps
**Transit:** Personal vehicle; commutes from Snye QC into Cornwall ON

**Who she is:**
Brenda has been cleaning homes professionally for eight years, most recently for a residential cleaning company in Valleyfield. She moved to Snye two years ago following her partner's relocation. She was referred to Fresh Nest by a neighbour. She is experienced, reliable, and is interested in moving into a supervisory role as the business grows. She prefers to work in French and finds it mentally tiring to process work communications in English at the end of a physical day.

**Primary need:**
Every interaction with Fresh Nest — welcome email, app screens, training modules, job notifications — entirely in French. No code-switching at work. She can handle English in a pinch but should never have to.

**Key constraints:**
- French must not be an afterthought: machine-translated strings or half-bilingual screens will immediately signal that her language and identity are not genuinely respected
- She is technically fluent with smartphone apps; the FSM app should not talk down to her
- Her commute from Snye into Cornwall adds 20–30 minutes each way; the scheduling system needs to account for travel time accurately
- She tracks her monthly earnings carefully because she manages a family budget on a mix of her income and her partner's

**What the FSM must do for Brenda:**
- Deliver every notification, email, training module, and UI string in French — zero English visible when her language is set to FR
- Respect the complexity of her commute: transit buffer and travel time matter
- Show her a career path: if she wants to move to lead or supervisor, the platform should support that with visible role progression
- Give her clear, detailed job information so she can prepare for a client she hasn't visited before

**Persona test:**
Brenda's device and app language are set to French. She receives her welcome email in French, completes all four onboarding screens in French (including WHMIS training in French), and views her assigned jobs and profile page — with zero English strings visible at any point. Linguistic_Auditor confirms.

**FSM features driven by this persona:**
Full bilingual FR parity across all FSM screens · French training module content · French email/SMS templates · Language-aware job notifications · Travel buffer accuracy · Role/career status display

---

### SP4 — Marcus Oakes · Part-Time Cleaner (Student / Second Income)

**Age:** 21 | **Location:** Cornwall, ON (east end) | **Role:** Cleaner, part-time, limited availability
**Languages:** English only
**Device:** iPhone, very app-comfortable (TikTok, Snapchat, delivery apps)
**Transit:** Personal vehicle (borrowed from family)

**Who he is:**
Marcus is a second-year student at St. Lawrence College's Cornwall campus, studying Business Administration. He works 15–20 hours per week maximum and cannot miss class. He found Fresh Nest on Instagram and applied because the schedule looked flexible. He has cleaned before — a summer job at a hotel — but residential cleaning is new. He is earnings-cap aware because he is managing his income against OSAP eligibility thresholds.

**Primary need:**
Clear control over when he works and transparent visibility into what he is earning — ideally with a warning before he hits any income threshold that affects his student assistance.

**Key constraints:**
- Fixed unavailability: Tuesday/Thursday 8am–1pm (lectures), Wednesday 6–9pm (lab), every exam period (2–3 weeks per semester) — these must be blockable in the app without calling Lauren
- Monthly earnings limit is real to him: exceeding it affects his OSAP. He will quit the job rather than lose student aid
- He is very comfortable with technology but has zero patience for slow or confusing UX — he will tap around and if something is not obvious within 10 seconds he will stop
- His social network is how Fresh Nest finds other part-time staff; if the job is good, he refers friends

**What the FSM must do for Marcus:**
- Let him add blocked windows himself — recurring schedule blocks with a label — without emailing or calling Lauren
- Show him his earnings in real time, ideally with a progress bar and a clear warning at 80% of his monthly cap
- Let him claim available shifts from the shift board when he wants more hours, or ignore them when he is busy
- Send shift notifications by SMS, not just email — he does not check his student email reliably
- Make the check-in experience fast: open the app, tap check-in, close the app

**Persona test:**
Marcus adds two recurring blocked windows (Tuesday/Thursday 8am–1pm) from the Profile page without calling Lauren. He can see his current month earnings and monthly cap from the home dashboard. He receives an SMS when a new shift becomes available and claims it from the shift board in under 30 seconds.

**FSM features driven by this persona:**
Blocked window self-management · Earnings safety bar · Shift board (claim available jobs) · SMS shift notifications · Mobile-optimised check-in flow · Earnings cap warning thresholds

---

### SP5 — Sylvie Pilon · Primary Caregiver Returning to Work

**Age:** 47 | **Location:** Long Sault, ON (commutes into Cornwall) | **Role:** Cleaner, mornings only
**Languages:** French (primary), fluent English
**Device:** iPhone (hand-me-down from adult child), moderate app comfort
**Transit:** Personal vehicle

**Who she is:**
Sylvie raised three children and spent 12 years managing the family home. Her youngest started full-time school two years ago. She is re-entering the workforce for the first time in over a decade, choosing residential cleaning because the hours align with the school day. She is skilled at her work — she ran a very organized household — but lacks confidence in "professional" settings and worries about making mistakes. She heard about Fresh Nest through a community Facebook group.

**Primary need:**
A predictable, reliable schedule she can plan her family life around. Clear instructions for every job so she does not have to guess. A forgiving and supportive experience when she does not know how to do something in the app.

**Key constraints:**
- She must be done by 2:30pm on school days to pick up her youngest; no exceptions
- She is not highly tech-confident: an unfamiliar screen or an error message that she cannot decode will cause her to disengage from the app and call Lauren instead
- She has had a gap in her employment record; she is sensitive to feeling judged or dismissed as inexperienced
- She has caregiving responsibilities that occasionally cause schedule disruptions (sick child, school events) — she needs a way to communicate this without anxiety
- Her earnings contribute to household income but she is not the primary earner; income cap management is less critical than schedule predictability

**What the FSM must do for Sylvie:**
- Send her a day-before reminder for every scheduled job — she plans her day around her work schedule
- Make the job checklist a clear, visual guide she can follow step by step — not a checkbox list she has to interpret
- Provide simple, non-alarming error states: if something goes wrong, the app should tell her what to do next in plain language, not show a technical error
- Allow her to flag availability changes (sick child) in the app without having to explain herself in a phone call
- Show her that she is doing a good job: completed jobs, positive indicators, progress in the onboarding checklist all matter to her confidence

**Persona test:**
Sylvie receives a day-before SMS reminder for a 9am job in Cornwall. She opens the FSM app, views the job detail, follows the visual checklist to completion, uploads the after-photo, and checks out — all without calling Lauren. The app confirms her completion with a positive confirmation screen.

**FSM features driven by this persona:**
Day-before SMS reminder · Job detail with client notes and access information · Visual step-by-step checklist · Photo upload confirmation · Positive completion screen · Profile availability flag · Plain-language error states

---

### SP6 — Daniel Swamp · Akwesasne Community Member (English, Cross-Border Context)

**Age:** 33 | **Location:** Kawehno:ke (Cornwall Island), Akwesasne | **Role:** Cleaner, full-time ambition
**Languages:** English (primary), some Kanien'kéha
**Device:** Android smartphone, regular app user
**Transit:** Personal vehicle; crosses the bridge to mainland Cornwall for all jobs

**Who he is:**
Daniel lives on Cornwall Island and has family roots in Akwesasne. He is currently between jobs after a factory position ended and is looking for stable, local employment that does not require a long commute or further education. He was connected to Fresh Nest through the Akwesasne Employment Resource Center. He is reliable, physical, and takes pride in quality work. He is interested in becoming a lead cleaner over time.

**Key context — Cross-Border and Indigenous Employment:**
Daniel's situation involves nuances not present in other personas. He lives on Cornwall Island (Ontario territory of Akwesasne), crosses the bridge to mainland Cornwall for work, and may have complex employment tax and benefits situations depending on his specific status registration. Fresh Nest must be careful not to make assumptions about his tax situation in any documentation or platform output. Payroll and income reporting must be handled with awareness that Indigenous employees working on and off-reserve may have specific tax exemptions under Section 87 of the Indian Act — this is a payroll/accounting matter, not a platform matter, but the admin must be aware.

**Primary need:**
Reliable full-time hours, a clear path to a more senior role, and a workplace that genuinely recognises his community rather than treating Akwesasne as a footnote or generic geography.

**Key constraints:**
- Bridge and road conditions affect his commute in winter; the scheduling system must accommodate realistic travel times from Cornwall Island
- He is careful about how his income is categorised and reported; earnings records must be accurate and exportable
- He values being recognised as part of the community Fresh Nest serves, not just as an employee. The company's explicit acknowledgement of Akwesasne in its About page and community voice matters to him
- His community network is an important recruiting source for Fresh Nest — if Daniel has a good experience, he refers cousins and friends. If he does not, word travels quickly

**What the FSM must do for Daniel:**
- Accurately reflect his Cornwall Island address in the scheduling and transit buffer system — the bridge crossing adds real time
- Show him a clear path to lead/supervisor status in his profile or in a career section
- Provide exportable or printable earnings records that he can use for his own tax purposes
- Never display or generate content using Kanien'kéha language or cultural references without explicit instruction from Lauren or another community-authorised source (AI-generated Kanien'kéha is explicitly prohibited in the governance docs)

**Persona test:**
Daniel views his profile in the FSM app and can see his role (Cleaner), his current month earnings, and a note that his transport buffer is set for Cornwall Island commute time. His completed jobs are visible and exportable as a PDF or printable summary.

**FSM features driven by this persona:**
Accurate transit buffer for cross-bridge commute · Earnings export / printable record · Role and career status display · Accurate job history · Respectful community recognition (never AI-generated cultural content)

---

## Gap Analysis: What These Personas Cover That the Previous SP1–SP4 Draft Did Not

The earlier draft personas (from the onboarding project plan document) were correct in identifying SP1 Lauren, SP2 Jasmine, SP3 Brenda, and SP4 Marcus. This document expands and refines that set with two additional grounded personas and substantial research backing.

### SP5 — Sylvie Pilon fills a critical industry gap

The average residential cleaning worker is 47 years old, 88.6% female, and 27% work part-time. The most common archetype in the Canadian residential cleaning workforce is not a young person or a newcomer — it is a primary caregiver, often a woman in her 40s or 50s, returning to or supplementing paid work around family responsibilities. Sylvie represents this majority demographic. She drives several platform requirements that none of the previous four personas surfaced:

- Day-before reminders (caregivers plan their day around work, not the reverse)
- Plain-language error states (tech confidence gap in this demographic)
- Positive completion feedback (re-entering workforce after a gap, confidence matters)
- Visual step-by-step checklists (not just a checkbox list)
- Low-friction availability flagging (caregiving disruptions are real and frequent — care-related issues are the single most common reason employees leave the workforce)

Without Sylvie, the platform would be designed for tech-comfortable young people and would fail its most statistically likely employee.

### SP6 — Daniel Swamp fills a community-specific gap

The existing customer persona P4 (Kahnawà:ke Baptiste) establishes that Akwesasne community members are customers of Fresh Nest. But Fresh Nest also hires from this community — and the experience of working for Fresh Nest from Cornwall Island has specific constraints no other persona captures:

- Bridge crossing as a real scheduling variable (not just "transit mode")
- Cross-border employment and tax context (Indian Act Section 87 awareness)
- Community network effects: a good employee experience in Akwesasne generates referrals; a bad one does reputational damage at scale
- The prohibition on AI-generated Kanien'kéha (already in the governance docs) needs a persona anchor to explain why it exists

Daniel also surfaces the career progression feature gap: he has ambition and needs to see a path. Without this persona, the FSM app would have no persona-driven argument for showing role status or career progression information.

---

## Persona × Feature Matrix

| Feature | SP1 Lauren | SP2 Jasmine | SP3 Brenda | SP4 Marcus | SP5 Sylvie | SP6 Daniel |
|---|---|---|---|---|---|---|
| Welcome email + magic link | ✓ triggers | ✓ primary | ✓ FR version | ✓ | ✓ | ✓ |
| First-login consent sequence | admin view | ✓ primary | ✓ FR primary | ✓ fast | ✓ reassurance | ✓ |
| WHMIS training (FR) | admin view | EN | ✓ FR primary | EN | EN | EN |
| Blocked window self-management | admin view | ✓ transit | ✓ Snye commute | ✓ primary | ✓ school pickup | ✓ bridge |
| Earnings safety bar | admin manages cap | ✓ | ✓ family budget | ✓ OSAP primary | secondary | ✓ export |
| Day-before SMS reminder | admin sends | helpful | helpful | SMS primary | ✓ primary | helpful |
| Visual step-by-step checklist | admin configures | ✓ | experienced | comfortable | ✓ primary | comfortable |
| Photo upload | admin reviews | ✓ | ✓ | ✓ | ✓ primary | ✓ |
| Shift board (claim jobs) | admin posts | ✓ | ✓ | ✓ primary | secondary | ✓ |
| Career / role progression display | admin sets | future | ✓ promotion | future | future | ✓ primary |
| Earnings record export | admin | — | ✓ | ✓ OSAP | — | ✓ primary |
| Bilingual FR all screens | admin EN | EN | ✓ primary | EN | ✓ | EN |
| Staff Detail Panel | ✓ primary | viewed by | viewed by | viewed by | viewed by | viewed by |
| Probation check-in alerts | ✓ receives | subject | subject | subject | subject | subject |
| Offboarding checklist | ✓ manages | — | — | seasonal | — | — |
| Plain-language error states | secondary | ✓ | ✓ | tolerates ambiguity | ✓ primary | ✓ |

---

## What to Add to docs/PERSONAS.md

The following entry should be added to the existing `docs/PERSONAS.md` to cross-reference this document:

```markdown
## Staff Personas

The FSM platform (apps/fsm) and all staff-facing admin features are governed by a separate staff persona set.

See: docs/PERSONAS-STAFF.md

Staff personas:
| ID  | Name             | Role                       | Key Constraint                       |
|-----|------------------|----------------------------|--------------------------------------|
| SP1 | Lauren Arsenault | Owner / Admin              | Single admin user; no Firestore edits |
| SP2 | Jasmine Beausoleil | New Cleaner (EN, transit) | Mobile-only; first-time app user     |
| SP3 | Brenda Côté      | Lead Cleaner (FR)          | French-primary; zero EN strings      |
| SP4 | Marcus Oakes     | Part-Time Student          | OSAP earnings cap; blocked windows   |
| SP5 | Sylvie Pilon     | Caregiver Returning to Work | Schedule predictability; tech gap   |
| SP6 | Daniel Swamp     | Akwesasne Community Member | Bridge commute; cross-border context |

Rule: No AI-generated Kanien'kéha content. Ever. SP6's community context is informational only.
```

---

## Notes for AI Agents

When building any FSM feature, admin Staff panel component, onboarding screen, or notification template:

1. Identify which staff persona(s) the feature serves from the matrix above
2. Read the relevant persona's constraints before writing a single line of UI copy or code
3. SP3 Brenda's bilingual requirement means every new FSM string needs a key in both `en.json` and `fr.json` — Linguistic_Auditor verifies
4. SP2 Jasmine's mobile constraint means every new screen must be designed for 375px first, not 1280px first
5. SP5 Sylvie's error state constraint means no technical error messages surfaced raw — all errors need a human-readable next-step instruction
6. SP6 Daniel's cultural constraint: **never generate, suggest, or auto-populate Kanien'kéha language.** This is in the governance contract. The constraint is not negotiable.
7. SP4 Marcus's earnings cap constraint: the monthly earnings limit display is not decorative — it is a live compliance tool for a real financial planning need (OSAP eligibility)
