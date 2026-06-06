# ADR-006 — Bilingual UX (EN/FR) as Core Architecture at Launch
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, UX Strategy, Market Research

## Context

19.3% of Cornwall residents are French primary speakers. The service area extends into Snye QC and Akwesasne, where French and English bilingualism is culturally expected rather than optional.

Two of the six core personas — Diane Lafleur (P1) and Sophie Tremblay-Gagnon (P5) — explicitly require French-language UX to convert. Sophie stated she booked the only French-option cleaning service she could find online. Diane will leave an English-only site without contacting.

Treating French as a "Phase 2" feature would mean launching without two of six target personas able to use the site effectively. The competitive opportunity is real: no local competitor in Cornwall/Akwesasne currently offers bilingual digital booking.

## Decision

Implement **full bilingual EN/FR support using `react-i18next` at launch**:

- All UI strings stored in `src/i18n/en.json` and `src/i18n/fr.json`
- No hardcoded English or French strings in any component — all text via `t()` hook
- Language toggle in Navbar (persists across navigation)
- Selected language stored in `localStorage` for session persistence
- Selected language written to Firestore `booking.language` field (`'en'` | `'fr'`)
- `booking.language` field drives bilingual email (Cloud Functions, Phase 3) and SMS (Phase 3) confirmations
- French copy written by a human copywriter — not machine translated

## Rationale

- Diane (East Cornwall, P1) will immediately leave an English-only site — her conversion depends on French UX being present at first load, not hidden behind a setting
- Sophie (Snye QC, P5) explicitly chose her previous service provider because they were the only French-language digital option in the area — this is a direct competitive signal
- 19.3% French primary speaker market is the largest addressable segment gap versus competitors
- Bilingual communications infrastructure (email/SMS in client's language) is a trust signal that reinforces the booking experience after submission
- Machine translation was evaluated and rejected — French copy quality is a trust signal, not just a convenience feature, for Diane and Sophie

## Consequences

**Positive:**
- Diane and Sophie personas can convert at launch rather than being deferred to Phase 2
- Competitive differentiation: no local competitor offers bilingual digital booking
- Firestore `booking.language` field drives bilingual communications infrastructure — email and SMS arrive in the client's chosen language
- Establishes the translation infrastructure that future content (blog, seasonal promotions) can reuse

**Negative:**
- All UI copy must be written and maintained in two languages — every new feature adds French copy to the scope
- All AI agents working on UI components must use the `t()` hook exclusively and never hardcode strings — enforced by Linguistic_Auditor subagent in Phase B

**Neutral:**
- `react-i18next` is a mature, well-documented library with React 19 compatibility confirmed

## Alternatives Considered

- **English-only at launch** — Rejected. Loses Diane (P1) and Sophie (P5) on day one — two of six core personas cannot use the site. Deferring French support defers the competitive differentiator. The cost of retrofitting i18n later (extracting all strings from components) exceeds the cost of building bilingual from day one.
- **Machine translation (e.g., Google Translate widget)** — Rejected. French copy quality is a direct trust signal for Diane and Sophie. A machine-translated booking confirmation or service description reads as unprofessional to a French primary speaker and undermines the trust the site is trying to build. Human-written French copy is non-negotiable.
