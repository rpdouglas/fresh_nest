# ADR-001 — Tailwind CSS v3 over v4
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, AI Agent Workflow Design

## Context

AI agentic tools (Antigravity, Claude Code, GitHub Copilot) generate Tailwind v3 class syntax by default. Tailwind v4 uses a completely different configuration approach (`@import 'tailwindcss'`, `@theme` blocks, `@tailwindcss/vite` plugin). Class failures in v4 are silent — no build error, just invisible styles.

In autonomous AI workflows with multiple agents, this creates compounding debugging overhead across every component. An agent may write 40 Tailwind classes that are all syntactically valid v3 classes but silently break in a v4 project, with no feedback until a human visually inspects the rendered page.

## Decision

Use **Tailwind CSS v3.4.x** for all styling in the Fresh Nest Co. project.

Configuration approach:
- Config file: `tailwind.config.js`
- Directives in CSS: `@tailwind base; @tailwind components; @tailwind utilities;`
- PostCSS via `postcss.config.js`

## Rationale

- v3 generates reliably from all current AI coding tools without correction
- Silent v4 styling failures are unacceptable in agentic workflows where no human reviews every class
- No Phase 1–4 feature requires v4-only utilities (container queries, etc.)
- v3 `postcss.config.js` approach is stable, well-documented, and broadly supported
- All custom design tokens (brand colors, fonts, spacing) are already defined in `tailwind.config.js` under the v3 schema

## Consequences

**Positive:**
- AI agents generate correct classes without human correction overhead
- Zero silent styling failures — what the agent writes is what renders
- Stable `postcss.config.js` configuration; no Vite plugin dependency
- All team members and AI tools share the same mental model of Tailwind

**Negative:**
- Will require a migration to v4 eventually (estimated 2027 when tooling catches up)
- Cannot use v4-only native container queries without a plugin workaround

**Neutral:**
- v3.4.x receives security patches but no new feature development from Tailwind Labs

## Alternatives Considered

- **Tailwind v4** — Rejected. Silent class failures in agentic workflow. `@theme` and `@import 'tailwindcss'` directives cause every AI agent to require human correction on every component. Compounding overhead is unacceptable.
- **Plain CSS** — Rejected. Loses the utility-first DX that makes AI-assisted component generation fast and consistent. Custom properties alone cannot replicate the authoring speed.
- **CSS Modules** — Rejected. Incompatible with AI generation patterns. Agents generate inline utility classes; CSS Module class mapping requires a separate file and import that agents frequently mishandle.
