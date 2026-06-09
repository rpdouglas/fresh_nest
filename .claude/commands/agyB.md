# AGY Phase B — Execution

**Epic:** $ARGUMENTS

You are entering Phase B of the AGY 3-Phase Gate. A strategy has been approved by the human.

## Pre-flight checks (before writing any code)

1. Confirm the approved strategy is recorded in `docs/plans/$ARGUMENTS_PLAN.md`.
2. Re-read `docs/firestore-schema.md` — you may only use fields that exist there.
3. Re-read `docs/design-system.md` — you may only use documented token names and classes.
4. Re-read `docs/COMPLIANCE.md` — flag any PII handling or consent requirements.

## Execution rules

- All UI strings must use `t()` — never hardcode English or French text in components.
- All Tailwind classes must use design-system tokens (slate-brand, slate-dark, cream, etc.).
- Border radius for brand elements: `rounded` (4px) — not `rounded-lg` or `rounded-xl`.
- Font classes: `font-display`, `font-sub`, `font-body` only.
- Never invent Firestore fields. Never hardcode database IDs outside `src/lib/firebase.ts`.
- Minimum 16px text and 48px touch targets on all interactive elements (P3 Margaret).

## Subagent audits (run after implementation, before Phase C)

Invoke each auditor in sequence:

**Brand_Auditor:** Grep for `rounded-lg`, `rounded-xl`, `rounded-full`, `text-sm`, inline hex colours, and any class not in `docs/design-system.md`. Report violations.

**Data_Steward:** Confirm every Firestore field written matches `docs/firestore-schema.md`. List any field that does not exist there as a blocker.

**Linguistic_Auditor:** Search all modified `.tsx` files for hardcoded English or French strings not wrapped in `t()`. Report any violation as a blocker.

## Build gate

Run: `npm run build && npm run lint`

- Both pass → proceed to Phase C.
- Either fails → halt, write a failure report, and wait for human guidance.
