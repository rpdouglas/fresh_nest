# 0023. Fresh Nest Co. design system adoption

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

FNC Landing adopts the Fresh Nest Co. design system (`docs/fresh-nest-design-system.md`) as its authoritative visual theme and UI token standard:

1. **Color Tokens and Warm Surface Hierarchy:**
   - Background canvas uses parchment `--surface` (`#f7f1e8` light / `#14252a` dark).
   - Elevated cards, modal dialogs, and sticky table headers use warm linen `--surface-raised` (`#fffdf9` light / `#1d3238` dark).
   - Depressed areas and inputs use oatmeal `--surface-sunken` (`#e9ddcb` light / `#0f1d21` dark).
   - Typography uses deep spruce `--ink` (`#1f3135`) and weathered slate `--ink-muted` (`#4a5e63`).
   - Accent colors feature brand teal `--nest-teal` (`#3d6b75`), terracotta `--clay` (`#c17a54`), and sage `--sage` (`#dce5d6`).
   - Cold slate and sterile corporate blue surfaces are replaced with the warm surface palette.

2. **Typography System:**
   - Headings, hero figures, and card titles use **Fraunces** (`font-display`).
   - Operational interfaces, dense tables, and numerals use **Jost** (`font-sans`) with tabular figures (`tabular-nums`).
   - Warm personal flourishes and handwritten touches use **Caveat** (`font-script`).
   - All fonts are self-hosted locally via `@fontsource` packages for zero-latency rendering, offline functionality, and strict Content Security Policy (`font-src 'self'`) compliance. No external Google Fonts CDN requests are permitted.

3. **Brand Motifs:**
   - A reusable `<Sparkle />` SVG component (`web/src/components/Sparkle.tsx`) represents the 4-point Fresh Nest sparkle motif, used sparingly on sign-in, the app header, and kudos cards without distracting from operational data tables.

4. **Multi-Agent Governance and Enforcement:**
   - Shared guidelines reside in `.claude/rules/design-system.md` (mirrored to `.agents/rules/`).
   - Continuous verification is enforced via `scripts/check-design-system.mjs` running in CI.

## Why

The operations portal must feel unmistakably like Fresh Nest Co.: warm, grounded, calm, and editorial rather than sterile or generic software. Dense scheduling tables and critical operational workflows retain their exact grid calculations and compact efficiency while adopting the brand's organic warmth and clear visual hierarchy. Self-hosting via `@fontsource` guarantees that strict CSP security policies are preserved.

## Where it lives

`web/src/index.css`; `web/src/components/Sparkle.tsx`; `web/src/components/SignInGate.tsx`; `web/src/components/AppHeader.tsx`; `web/src/components/DashboardView.tsx`; `.claude/rules/design-system.md`; `scripts/check-design-system.mjs`; `docs/fresh-nest-design-system.md`.
