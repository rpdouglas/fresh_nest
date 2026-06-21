# Fresh Nest Co. — Auto-Scheduling: Industry Best Practices, Gap Analysis & Revised Final Plan

**Date:** June 17, 2026
**Supersedes:** `freshnest-auto-scheduling-feasibility.md` (P3-E28 draft v1)
**Research basis:** Constraint-based scheduling theory (CP-SAT/OR-Tools) · Field service market leaders (ServiceTitan, Jobber, Housecall Pro, Salesforce Field Service, Fieldproxy, Skedulo) · Human-in-the-loop AI research (NIST AI RMF, nurse scheduling fairness studies)

---

## Part 1 — What the Industry Actually Does

### 1.1 The academic/technical baseline: constraint-based scheduling

Outside any specific vendor, workforce scheduling is a well-studied optimization problem. The standard framing, confirmed across multiple sources:

Constraints should be classified as either hard (must be satisfied — minimum staffing, legal requirements) or soft (desirable but flexible — individual preferences). The dominant modern technique for solving this at scale is Constraint Programming (CP-SAT, e.g. Google OR-Tools), which models scheduling as a set of variables with domains and constraints, using search techniques to find valid assignments — increasingly blended with metaheuristics (genetic algorithms, simulated annealing) and ML-enhanced optimization that uses predictive analytics to improve schedule quality over time.

The practical takeaway: **hard vs. soft constraint separation is the single most important architectural decision**, and it's one our draft plan already got right (earnings cap violation = hard stop; travel buffer = soft, overridable warning). What the draft plan does not yet do is treat this as an explicit, named architectural layer — it's implicit in the scoring formula rather than a first-class concept admin can see and tune.

### 1.2 What field service market leaders actually ship in 2025–2026

**ServiceTitan (enterprise tier)** has built the most sophisticated dispatch AI in the category: Dispatch Pro uses AI-powered job value predictions to assign the right tech to the right job, factoring in recent technician performance, estimated job revenue, drive time, and skill match — and critically, it optimizes for revenue, not just efficiency, meaning it might assign a farther-away tech to a high-value job if that tech has a better close rate on big-ticket work. ServiceTitan also matches technician skills and certifications to job requirements — a job requiring a specific certification filters the available pool automatically rather than relying on a dispatcher's memory.

**Jobber and Housecall Pro (small-business tier — our actual peer tier)** are more modest: Jobber includes route optimization to reduce travel time, while Housecall Pro provides real-time dispatching to assign jobs based on technician availability — but neither does certification/skill-based filtering; that's reserved for the ServiceTitan/Fieldproxy/Skedulo tier. The honest sizing guidance from one comparison source: 1–10 technicians, Jobber or Housecall Pro handle this range well — the scheduling complexity doesn't yet justify an ML-driven system; 11–50 technicians is where AI scheduling ROI becomes measurable and real.

**This sizing guidance matters directly for Fresh Nest.** With a handful of cleaners today, we are squarely in the tier where industry consensus says simple rule-based suggestion is the right tool — not a full ML pipeline. This validates the original plan's Option A (suggestion engine) as correctly scoped, while flagging that some "nice to have" capabilities (skill/certification matching, revenue-aware ranking) are real industry patterns we should design room for, not invent from scratch later.

**The disruption-handling test.** One of the sharpest practical insights from the research: every vendor demo shows a clean schedule with no disruptions — the real test is to ask them to demo a mid-day disruption: a tech no-show at 10 a.m. with 6 jobs on their board and an emergency callout added at the same time, and to check how many clicks it takes to resolve, and whether the AI proposes the fix or just flags the problem. Our original plan's "decline/reassign loop" was scoped as a Phase 2 nice-to-have. The industry treats disruption-handling as the actual measure of whether a scheduling system works at all — a system that only handles the steady state is not considered a real scheduling system by this standard.

**The route-orchestration pattern.** Several sources describe the same end-to-end chain regardless of vendor: capture the request once, match the right tech by skill and zone, route to minimize drive time, confirm with the customer, and feed completion data back automatically — and conversion and completion suffer when bookings ignore tech capability, so confirming the right tech up front prevents the costly return visit. This reframes "auto-assignment" from a dispatch-board feature into a full-lifecycle pattern that should ideally start at the booking/quote stage, not only at the dispatch stage — which is something our original plan touched on (suggesting at the Quote Workspace moment) but didn't elevate to a first principle.

**AI conversational booking and AI-assisted estimating** are real 2025–2026 industry features (ServiceTitan's AI-powered booking agents and text-based scheduling, Housecall Pro's CSR AI assistant for intake) but they sit a layer above scheduling itself — they affect how a job enters the system, not how it gets assigned. These are explicitly out of scope for this plan but worth flagging as adjacent future work.

### 1.3 The human-in-the-loop research consensus

This is where the original plan's instincts were directionally right but under-specified. The current consensus across NIST's AI Risk Management Framework and applied HITL research:

The future of human-in-the-loop AI is shifting toward "human-on-the-loop" models, where humans do not need to intervene at every moment but instead supervise AI operations continuously and retain the ability to take over when necessary — similar to how pilots monitor autopilot systems. Critically, intervention works when it is designed, not improvised: confidence thresholds, out-of-distribution signals, fairness/guardrail breaches, and material business impacts should all route to a human supervisor with the right context, and as governance, data quality, and model reliability improve, decisions can shift from full human-in-the-loop to human-on-the-loop without sacrificing safety.

A directly relevant applied study on nurse shift scheduling found that traditional shift scheduling, characterized by inflexible hours and limited employee control, often leads to stress and perceptions of unfairness contributing to high turnover, and explored whether AI-based scheduling could be perceived as fairer and more transparent by the actual workers being scheduled — not just the managers using it.

**This is the single biggest structural gap in our original plan.** The original draft designed the suggestion/scoring system entirely from the admin's (Lauren's) point of view — what she sees, what she clicks. It did not design for the staff member's (Jasmine's, Brenda's, Sylvie's) experience of being scheduled by an algorithm, which the research says is where trust and fairness perception actually live or die.

---

## Part 2 — Gap Analysis: Original Plan vs. Industry Best Practice

| # | Gap | Severity | What the Original Plan Had | What Best Practice Requires |
|---|---|---|---|---|
| 1 | No explicit hard/soft constraint architecture | 🔴 Critical | Constraints implicit in a single scoring formula (penalties subtracted from one number) | A first-class, admin-visible separation: hard constraints that can never be violated without explicit override (earnings cap, blocked window, double-booking) vs. soft constraints that influence ranking but never block (travel efficiency, load balancing, preferred cleaner) |
| 2 | No disruption-handling design | 🔴 Critical | "Can't make this" decline flow listed as a Phase 2 nice-to-have, with no specific re-solve mechanic | Industry treats disruption handling as the actual test of a scheduling system — a no-show at 10am with 6 other jobs on the board needs an explicit, fast, few-click re-solve path. This needs to be a named, designed flow, not an afterthought |
| 3 | No worker-facing fairness/transparency design | 🔴 Critical | Suggestion UI designed only for Lauren (admin); no design for how Jasmine/Brenda/Sylvie experience being scheduled by an algorithm | Research on algorithmic shift scheduling shows worker perception of fairness and transparency is a primary driver of trust and turnover — the system needs a worker-facing "why was I assigned this" explanation, not just an admin-facing one |
| 4 | No skill/service-type matching dimension | 🟡 Significant | Scoring formula only considers earnings cap, travel, blocked windows, preferred cleaner, load balancing | Industry leaders (ServiceTitan, Fieldproxy, Skedulo) treat skill/certification matching as a first-class scheduling dimension — for Fresh Nest this maps to service-type proficiency (e.g., not every cleaner is trained/comfortable with post-construction or commercial-grade equipment) |
| 5 | No revenue/value-awareness in ranking | 🟡 Significant | Pure efficiency/conflict-avoidance scoring | ServiceTitan's Dispatch Pro explicitly optimizes for revenue, not just efficiency — for Fresh Nest this could mean weighting toward the cleaner most likely to convert a one-time booking into a recurring relationship, not just whoever is closest |
| 6 | Booking-time matching not elevated as a first principle | 🟡 Significant | Suggestion engine mentioned at Quote Workspace as one of several insertion points | Industry pattern explicitly treats matching jobs to the right person *at intake*, not just at dispatch, as a primary lever for avoiding costly mismatches discovered later — Lauren confirming a booking should always trigger a suggestion, not just an action she might remember to take |
| 7 | No confidence/threshold framework for when to auto-act vs. ask | 🟡 Significant | Binary Option A (always ask) / Option B (always auto-assign), with Option B gated on "a few weeks of observation" — no ongoing mechanism | HITL research is explicit: intervention thresholds should be designed in advance (confidence levels, out-of-distribution signals, business-impact thresholds) — not a one-time graduation from manual to automatic, but a continuously tuned threshold where routine cases auto-resolve and edge cases always surface to Lauren |
| 8 | No explicit mention of generative-AI assistance as a distinct option | 🟢 Moderate | "Include AI where it makes sense" was implicit in the scoring engine itself, but no LLM-based assistant was proposed | A real, low-effort opportunity exists to use an LLM (not just rule-based scoring) for the *explanation* layer — translating the structured conflict data into a natural, readable rationale for both Lauren and the cleaner, and potentially for handling ambiguous, free-text constraints in the future (e.g., a cleaner texting "I can't do Thursday this week, my kid has a dentist appointment") |
| 9 | No explicit metric/feedback loop for whether suggestions are good | 🟢 Moderate | No mention of measuring suggestion acceptance rate or outcome quality | ML-enhanced optimization approaches explicitly incorporate predictive analytics that improve schedule quality over time — even a simple acceptance-rate tracker (did Lauren take the #1 suggestion or override it?) is the seed of that feedback loop and currently absent |
| 10 | Auto-assignment described as a single end-state rather than a tunable autonomy dial | 🟢 Moderate | Phase 3 was framed as "fully automatic, no human click" | Best practice frames automation level as a continuous dial per scenario type (e.g., recurring bookings with a known preferred cleaner = safe to fully automate; new/first-time bookings or commercial jobs = always surface for confirmation), not a single global on/off switch |

---

## Part 3 — Revised Final Plan

### What Stays the Same (validated by research)

- **Reusing `checkCleanerSchedulingConflicts()` as the foundation** — correct. Hard/soft constraint logic should still be built from this function, not replaced.
- **Starting with a suggestion engine before full automation** — correct, and now explicitly validated: 1–10 technicians is squarely in the "simple rule-based suggestion, not ML-driven" tier per industry sizing guidance.
- **Protecting `preferredCleaner` continuity for Diane** — correct, and reinforced by the fairness research: a customer or worker-facing relationship the algorithm silently overrides for a marginally better score is exactly the kind of decision that damages trust.
- **The need for real travel-time data (`clientLatLng` + geocoding) before any full automation** — correct and unchanged.

### What Changes

#### Change 1 — Make hard/soft constraints an explicit, visible architecture (closes Gap 1)

Replace the single penalty-subtracting scoring formula with two distinct, named layers:

```typescript
interface HardConstraintResult {
  passes: boolean
  violations: Array<{
    type: 'earnings_cap' | 'blocked_window' | 'double_booked' | 'background_check_not_cleared' | 'whmis_not_complete'
    detail: string
  }>
}

interface SoftConstraintScore {
  travelEfficiencyScore: number      // 0-100, based on real distance once available
  loadBalanceScore: number           // 0-100, inverse of weekly hours already booked
  preferredCleanerBonus: number      // large fixed bonus, not a "score" — see below
  serviceTypeProficiencyScore: number // NEW — see Change 4
  revenueAlignmentScore: number       // NEW — see Change 5
}
```

A candidate that fails any hard constraint is **never eligible for auto-assignment** and is shown to Lauren only in an explicitly separate "not eligible" section of the suggestion list, with the specific violation named — never silently hidden, never blended into a single sortable score with eligible candidates. This single change makes the system auditable in the way HITL research calls for: a human can always see *why* the ranking looks the way it does, not just trust a number.

#### Change 2 — Design the disruption-handling flow as a named, first-class feature, not a Phase 2 afterthought (closes Gap 2)

New flow, explicitly modeled on the industry "no-show at 10am" test case:

1. Cleaner (or Lauren, on their behalf) marks a job as `cant_make_it` from the FSM app or admin panel
2. The system immediately re-runs the suggestion engine for that specific job, against the **current, real-time state** of every other cleaner's schedule that day (not a cached morning snapshot)
3. Lauren sees a single-screen resolution: "Reassign to [top suggestion]" / "See alternatives" / "Contact client to reschedule" — three buttons, no menu diving
4. If the client has already been told a cleaner is en route (relevant to P6 Gallagher's time-sensitive Airbnb turnovers), the resolution screen flags this prominently so Lauren knows the stakes are higher than a routine reassignment
5. The reassignment, once confirmed, fires the same notification pipeline already built (SMS to new cleaner, "on my way" update path to customer)

This directly answers the "how many clicks does it take to resolve, and does the system propose the fix or just flag the problem" test the research surfaces — the target is three clicks or fewer from "can't make it" to resolved.

#### Change 3 — Add a worker-facing explanation layer, not just an admin-facing one (closes Gap 3)

When a cleaner is assigned (whether by suggestion-click or future auto-assignment), the FSM app job detail screen includes a short, plain-language "why you" note:

```
You were matched to this job because:
• It's close to your other job that day (same neighbourhood)
• It fits within your usual hours
• [If applicable] This is one of your regular clients
```

This is deliberately simple — not a debug dump of the scoring internals, but a translation of the same structured data already computed for Lauren's suggestion list, rephrased for the person being scheduled. This is the single most directly-actionable finding from the human-in-the-loop research: workers' perception of fairness and transparency in algorithmic scheduling is a primary driver of trust, and right now the original plan had zero design for this — the algorithm's reasoning was visible only to the admin.

This also gives SP2 Jasmine and SP5 Sylyvie (the personas least comfortable with ambiguous systems) a concrete, reassuring answer any time a job appears in their list that they didn't personally request.

#### Change 4 — Add service-type proficiency as a real, lightweight scheduling dimension (closes Gap 4)

This does not need to be a full certification/skills system like ServiceTitan's enterprise tier — that would be over-engineering for Fresh Nest's current size. The lightweight version:

- Add `serviceProficiencies: string[]` to the `Staff` schema (e.g., `['standard', 'deep_clean', 'move_out']` — defaults to all standard residential types; admin explicitly adds `'post_construction'` or `'commercial'` only for cleaners trained/equipped for those)
- The suggestion engine treats a missing proficiency for a specialty service type as a **soft constraint penalty**, not a hard block (Lauren may still want to see Jasmine ranked, just lower, if no one else is available) — except where the booking explicitly requires equipment/training the cleaner doesn't have, in which case it should be a hard constraint
- This is a small schema addition with outsized value: it prevents the scenario where a brand-new cleaner with zero post-construction experience gets auto-suggested for a job requiring specialized equipment handling, purely because they had the best travel-efficiency score that day

#### Change 5 — Add a lightweight revenue-alignment signal, scoped appropriately for our size (closes Gap 5)

ServiceTitan's revenue-optimizing Dispatch Pro is enterprise-tier and not something Fresh Nest should replicate wholesale. But the underlying principle — *not all jobs are equally valuable, and the algorithm shouldn't treat them as interchangeable* — is worth a small, explainable addition:

- A soft-constraint bonus for assigning a cleaner with a strong completion/review history to a booking flagged as a **first-time customer on a recurring-frequency booking** (the highest-leverage moment for converting a one-off into a long-term relationship)
- This is intentionally narrow in scope — not a black-box "value score," but one named, explainable rule that Lauren can see and turn off if she disagrees with it

#### Change 6 — Elevate booking/quote-time matching to a first-class trigger point, not just dispatch (closes Gap 6)

The suggestion engine should fire automatically (not just be available on click) at three specific moments, in this priority order:

1. **Quote acceptance** (P3-E26) — the moment a signed quote converts to a confirmed booking is the single best moment to suggest a cleaner, because Lauren is already in a "set this client up" mindset
2. **Admin booking creation** (P1-E6/P3-E3) — same logic for phone-in/walk-in bookings
3. **Dispatch board** — the fallback/review surface for anything not resolved at intake, plus the home for the disruption-handling flow (Change 2)

This reframes the suggestion engine from "a button on the dispatch board" to "a step that happens by default whenever a job needs a cleaner," matching the industry's "capture once, match by skill and zone immediately" pattern.

#### Change 7 — Replace the binary "Option A vs Option B" framing with a tunable autonomy dial per scenario type (closes Gap 7 and Gap 10)

Instead of a single global switch between "always suggest" and "always auto-assign," the revised plan defines per-scenario autonomy levels that Lauren can configure (and that default conservatively):

| Scenario | Default autonomy level | Rationale |
|---|---|---|
| Recurring booking, same `preferredCleaner` available with zero hard-constraint violations | **Auto-assign, notify Lauren after the fact** | Lowest-risk case — the client already has an established relationship; this is pure repetition |
| Recurring booking, preferred cleaner unavailable | **Suggest top 3, require Lauren's click** | A real decision is happening (who replaces the preferred cleaner) — keep a human in the loop |
| New/first-time customer booking | **Suggest top 3, require Lauren's click** | Highest-value relationship-forming moment; Change 5's revenue-alignment signal feeds into the ranking here |
| Commercial / quote-first booking (P3-E26) | **Suggest top 3 with proficiency-aware ranking, require Lauren's click** | Higher stakes, often requires Change 4's service proficiency match |
| Disruption / reassignment (Change 2) | **Suggest top 3, require Lauren's click, three-click resolution target** | Time-pressured but still consequential — never auto-resolve silently |

This is the structural fix the HITL research calls for: intervention thresholds are designed in advance per scenario type, rather than treating "automatic" as a single global maturity milestone the whole system graduates into at once. It also means the system can deliver real automation value (the top row) immediately, without waiting for every other scenario to be "proven safe" first — something the original plan's single Phase 3 milestone didn't allow for.

#### Change 8 — Add an LLM-based explanation and natural-language constraint layer as an explicit, scoped AI option (closes Gap 8 — this is the "include AI where it makes sense" requirement)

This is intentionally separated from the rule-based scoring engine (Changes 1–7), which should remain deterministic, auditable, and free of any LLM dependency for its core decision logic — for the same reason the HITL research stresses explainability: a black-box model choosing who cleans a client's home is a worse trust proposition than a transparent rule, even if the rule is simpler.

Where an LLM genuinely adds value, scoped narrowly:

**8a. Natural-language explanation generation (low risk, real value).**
The structured `HardConstraintResult` and `SoftConstraintScore` objects (Change 1) are already machine-readable. An LLM call can turn them into the plain-language explanation in Change 3 ("You were matched to this job because...") and into a richer, more natural admin-facing summary than a fixed template could produce — especially useful once multiple soft-constraint signals are stacking up and a templated sentence starts reading awkwardly. This is low-risk because the LLM is only *describing* a decision that was already made deterministically — it never makes the decision itself.

**8b. Free-text availability parsing (medium value, build later).**
Cleaners like SP4 Marcus or SP5 Sylyvie may eventually want to text something like "can't work next Tuesday, dentist appointment" rather than navigating a blocked-window form. An LLM can parse this into a structured one-off `blockedWindow` entry (date, time range inferred or defaulted to full-day) for Lauren or the cleaner to confirm before it's saved. This should always require a confirmation step before writing to Firestore — the LLM proposes a structured interpretation, a human confirms it, exactly matching the "AI proposes the fix, human confirms" pattern the disruption-handling research describes as the right shape for this kind of automation.

**8c. What NOT to use an LLM for.**
The hard/soft constraint evaluation itself, the actual ranking/scoring, and any auto-assignment decision (Change 7's top row) should remain deterministic rule-based logic — not an LLM call. This isn't a limitation; it's the correct design. A scheduling decision needs to be the same every time given the same inputs, needs to be debuggable when Lauren asks "why did it pick Brenda," and needs to never hallucinate a constraint that doesn't exist in the data. None of those properties come naturally from an LLM call, and all of them come for free from the rule-based engine already proven out in `scheduling.ts`. AI here is an enhancement to communication and intake, not a replacement for the decision engine.

#### Change 9 — Add a lightweight suggestion-quality feedback loop (closes Gap 9)

A new field on the assignment-transaction record (already written via `assignCleanerTransaction`):

```typescript
suggestionMetadata: {
  wasSuggested: boolean
  suggestedRank: number | null      // 1, 2, 3, or null if not from the suggestion list
  acceptedTopSuggestion: boolean
} | null
```

No new UI is required to start — this is purely an instrumentation addition that costs almost nothing to build now and pays off later: after a few months of data, Lauren (or a future analytics view) can see whether the #1 suggestion is actually being accepted most of the time, which is the simplest possible signal that the soft-constraint weights (Change 1's `SoftConstraintScore`) are well-calibrated or need adjusting. This is the seed of the "ML-enhanced optimization" pattern the research describes, without committing to building actual machine learning before there's enough data to justify it.

---

## Part 4 — Revised Epic: P3-E28 — Cleaner Suggestion & Auto-Assignment Engine (v2)

**Complexity:** L (Stage 1) → +M (Stage 2: travel time) → +S (Stage 3: AI explanation layer) → +M (Stage 4: tuned autonomy + disruption flow)
**Priority:** P2
**Band:** C (Scale & Grow)

**Personas served:** SP1 Lauren (primary administrative beneficiary) · SP2 Jasmine / SP3 Brenda / SP4 Marcus / SP5 Sylvie / SP6 Daniel (all benefit from Change 3's worker-facing explanation and Change 4's proficiency-aware matching, which protects them from being assigned work they aren't suited or equipped for) · P1 Diane (preferred-cleaner continuity, explicitly protected and now the safest auto-assign case per Change 7)

### Revised Build Sequence

**Stage 1 — Rule-based suggestion engine with explicit hard/soft architecture**
1. Build `autoAssign.ts` with the `HardConstraintResult` / `SoftConstraintScore` split (Change 1) — reuses `checkCleanerSchedulingConflicts()` (M)
2. Add `serviceProficiencies` to `Staff` schema; wire into soft/hard constraint logic per Change 4 (S)
3. Add suggestion UI to `DispatchBoard`, Admin Booking Creation, and Quote Workspace per Change 6 (M)
4. Add `suggestionMetadata` instrumentation per Change 9 (S)
5. Unit + emulator tests across representative scenarios, including explicit hard-constraint-failure cases (S)

**Stage 2 — Real travel-time data (unchanged from v1, still the prerequisite for safe automation)**
6. Add `clientLatLng` to `Booking`/`Job`; geocode on creation via Cloud Function (M)
7. Replace postal-prefix heuristic with real distance/drive-time calculation; feeds `travelEfficiencyScore` (M)

**Stage 3 — Worker-facing transparency + AI explanation layer**
8. Build the worker-facing "why you" explanation screen in FSM job detail (Change 3) (S)
9. Wire an LLM call (Claude via the existing Anthropic API patterns already used elsewhere in this project) to generate natural-language explanations from the structured constraint objects, both for admin and worker-facing surfaces (Change 8a) (S)

**Stage 4 — Disruption handling + tuned per-scenario autonomy**
10. Build the "can't make it" → real-time re-solve → three-click resolution flow (Change 2) (M)
11. Implement the per-scenario autonomy table (Change 7) — starting with auto-assign-and-notify for the recurring/preferred-cleaner-available case only; all other scenarios remain suggest-and-confirm (M)
12. (Optional, build when there's appetite) Free-text availability parsing for blocked windows via LLM, always confirmation-gated (Change 8b) (S)

### Revised Acceptance Criteria

**Stage 1:**
- Every suggestion list visibly separates "eligible" candidates (ranked by soft-constraint score) from "not eligible" candidates (named hard-constraint violation), never blended into one list
- A cleaner without `serviceProficiencies` covering the booking's service type is ranked lower (soft) or excluded entirely (hard, if the service type requires equipment they don't have) — Lauren can see which applies
- Diane's `preferredCleaner` always appears first with an explicit "preferred cleaner" label, regardless of score
- Suggestion list appears automatically at quote acceptance and admin booking creation, not only on manual dispatch-board click

**Stage 3:**
- Every FSM job assigned via suggestion (or future auto-assignment) shows a 2–3 line plain-language "why you" explanation generated from the same structured data shown to Lauren
- The explanation text passes Linguistic_Auditor in both EN and FR (this is a new bilingual surface — Brenda must see hers in French)

**Stage 4:**
- A cleaner marking "can't make it" results in a re-solved suggestion list and a resolved reassignment in three clicks or fewer for Lauren, measured directly
- Recurring bookings with an available preferred cleaner and zero hard-constraint violations are assigned automatically, with a notification (not a confirmation request) sent to Lauren — this is the only scenario auto-assigned without a click in this version of the plan
- All other scenario types remain suggest-and-confirm; the per-scenario table (Change 7) is stored as configuration, not hardcoded, so Lauren can adjust autonomy level per scenario type as trust in the system grows

**Dependencies:** Same as v1 (P2-E9 done, P3-E18 Shared Types, sequence after P3-E3 Admin Booking Creation) — plus: Stage 3's LLM explanation layer depends on whatever Claude API integration pattern is already established elsewhere in the codebase (reuse, do not re-invent a second AI integration pattern)

---

## Summary: What Actually Changed From v1 to v2

| Theme | v1 (feasibility draft) | v2 (this revision) |
|---|---|---|
| Constraint model | Single weighted score | Explicit hard (block) vs. soft (rank) split, always visible |
| Disruption handling | Mentioned as Phase 2 nice-to-have | Named, designed, three-click-resolution target flow |
| Worker experience | Not designed at all | Explicit "why you" explanation screen, bilingual |
| Skill/proficiency matching | Absent | Lightweight `serviceProficiencies` field, soft or hard depending on service type |
| Revenue awareness | Absent | One narrow, named, explainable soft-constraint rule for first-time recurring customers |
| Trigger points | Mostly dispatch-board-centric | Elevated to fire at quote acceptance and booking creation by default |
| Automation framing | Binary Option A / Option B, time-gated graduation | Per-scenario autonomy table, tunable, starts narrow and expands per scenario as trust is earned |
| AI/LLM usage | Implicit in scoring only | Explicit, scoped: LLM for explanation generation and (later) free-text parsing — never for the core ranking decision itself |
| Feedback loop | Absent | Lightweight `suggestionMetadata` instrumentation seeded now for future tuning |
