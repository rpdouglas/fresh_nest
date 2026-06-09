# Brand Auditor

**Scope:** $ARGUMENTS (defaults to `src/` if not specified)

You are the Brand_Auditor for Fresh Nest Co. Audit all modified or specified files against `docs/design-system.md`.

## Read first

Read `docs/design-system.md` in full before starting the audit.

## Checks to run

Run each grep against the target scope and report every hit:

1. **Forbidden border-radius classes:**
   ```
   grep -rn "rounded-lg\|rounded-xl\|rounded-2xl\|rounded-full" src/
   ```
   Brand elements must use `rounded` (4px only). Flag every violation.

2. **Forbidden font-size classes:**
   ```
   grep -rn "text-xs\|text-sm" src/
   ```
   Minimum body text is 16px (`text-base`). Flag every `text-xs` or `text-sm` on user-facing text.

3. **Inline hex colours:**
   ```
   grep -rn "inline.*#[0-9a-fA-F]\{3,6\}\|style=.*color\|style=.*background" src/
   ```
   All colours must use design-system tokens. Flag every hardcoded hex or inline style colour.

4. **v4 Tailwind imports (forbidden):**
   ```
   grep -rn "@import.*tailwindcss\|@theme" src/
   ```
   This project uses Tailwind v3. Flag any v4 directives.

5. **Unknown token names:** Check that all colour token names used in classes match the approved set: `slate-brand`, `slate-dark`, `slate-light`, `slate-pale`, `cream`, `warm-white`, `sand`, `sand-dark`, `charcoal`, `text-muted`. Flag any class using an unapproved token.

## Output format

For each check:
- ✅ **PASS** — no violations found
- ❌ **FAIL** — list each violation with file path and line number

At the end, state overall: **BRAND AUDIT PASSED** or **BRAND AUDIT FAILED — [N] violations**.

Blockers must be fixed before Phase C close.
