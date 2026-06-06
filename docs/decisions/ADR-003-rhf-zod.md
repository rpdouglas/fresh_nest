# ADR-003 — React Hook Form + Zod over React 19 Native Forms
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, UX/Form Architecture

## Context

React 19 introduces `useActionState` and enhanced native form handling, offering a first-party way to manage form submissions without additional libraries. However, Fresh Nest Co. is a **Vite client-side SPA**, not a Next.js SSR application. The `useActionState` API is primarily designed for server-side progressive enhancement.

The multi-step booking form requires:
- Real-time per-field validation as the user types (not just on submit)
- Step-by-step error display across a multi-step wizard
- Complex conditional logic (e.g., `isAirbnb` flag toggles additional fields: turnaround window, key handoff notes, photo proof requirement)
- Type-safe Firestore writes validated at the boundary before any network call
- Accessible error messaging for Margaret persona (16px minimum, clear field association)

## Decision

Use **React Hook Form v7** + **Zod v4** for all form handling throughout the application.

- `useForm()` drives form state and per-field registration
- Zod schemas define validation rules and generate TypeScript types via `z.infer<>`
- `zodResolver` connects Zod schema to RHF validation pipeline
- Zod schemas serve dual purpose: browser validation + Firestore write validation

## Rationale

- RHF provides real-time per-field validation that `useActionState` does not cleanly replicate in client-only SPAs
- Zod schema validation generates TypeScript types automatically — no duplicate type definitions
- The same Zod schema that validates the form also validates the Firestore write payload, closing the gap between UI validation and database writes
- RHF's `watch()` and `setValue()` enable the conditional field logic (Airbnb toggle) cleanly
- Travis persona (P2) requires a frictionless booking flow — inline errors prevent form abandonment better than post-submit error pages
- Margaret persona (P3) requires accessible error messages — RHF's `formState.errors` maps cleanly to `aria-describedby` patterns

## Consequences

**Positive:**
- Real-time field errors reduce abandonment (Travis persona: zero-friction booking)
- Accessible, per-field error messages out of the box (Margaret persona: WCAG AA)
- Type-safe Firestore writes — Zod validates the payload before any `setDoc` call
- Conditional field logic (Airbnb toggle) is clean with `watch()` and `register()`
- Smaller bundle than Formik; better TypeScript support

**Negative:**
- Additional dependency weight (RHF ~25KB, Zod ~60KB minified+gzipped)
- React 19 native forms may eventually supersede this in SSR/hybrid contexts, requiring migration

**Neutral:**
- Zod v4 introduces minor API changes from v3; schemas must use v4 syntax throughout

## Alternatives Considered

- **React 19 native `useActionState`** — Rejected. Designed for SSR/Next.js progressive enhancement. In a Vite client SPA, real-time field validation requires additional custom state management that duplicates what RHF already provides cleanly. No meaningful DX advantage for a pure client-side context.
- **Formik** — Rejected. Heavier than RHF, slower re-render performance on field change, and less TypeScript-native. Zod integration with Formik is less ergonomic than with RHF's first-class `zodResolver`.
