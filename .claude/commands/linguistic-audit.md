# Linguistic Auditor

**Scope:** $ARGUMENTS (defaults to modified `.tsx` files if not specified)

You are the Linguistic_Auditor for Fresh Nest Co. Confirm that all user-facing strings are internationalised and no English or French text is hardcoded in components.

## Read first

Read `src/i18n/locales/en.json` and `src/i18n/locales/fr.json` to understand the existing key structure.

## Checks to run

1. **Hardcoded English strings in JSX:**
   Search for JSX text content that is not a translation call. Common patterns to grep:
   ```
   grep -rn ">[A-Z][a-z]" src/components/ src/pages/
   ```
   Review each hit — JSX text nodes that are plain English prose are violations. Exclude: `{t('...')}`, `{variable}`, HTML entities, single characters, numeric values.

2. **Hardcoded French strings in JSX:**
   ```
   grep -rn ">[A-Za-zÀ-ÿ]" src/components/ src/pages/
   ```
   Any French text not wrapped in `t()` is a violation.

3. **String literals in props:**
   ```
   grep -rn "placeholder=\"\|aria-label=\"\|title=\"\|alt=\"" src/components/ src/pages/
   ```
   These must use `t('key')` or a variable — never a raw string literal.

4. **Missing FR keys:** For every key present in `en.json`, confirm the same key exists in `fr.json`. List any missing FR keys.

5. **Missing EN keys:** For every key present in `fr.json`, confirm the same key exists in `en.json`. List any missing EN keys.

## Output format

For each check:
- ✅ **PASS** — no violations found
- ❌ **FAIL** — list each violation with file path, line number, and the offending string

At the end, state overall: **LINGUISTIC AUDIT PASSED** or **LINGUISTIC AUDIT FAILED — [N] violations**.

Blockers must be fixed before Phase C close.
