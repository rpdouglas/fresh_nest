# Phase A Plan: P1-E2 Privacy Policy & PIPEDA Compliance

This plan outlines three strategies for implementing the Privacy Policy page and aligning it with PIPEDA/CASL requirements.

---

## Strategy 1: Fully Bilingual Embedded Page via i18n (Recommended)
Create a new structured React page component at `/privacy` replacing `PlaceholderPage`. All copy (EN and FR) is defined in `en.json` and `fr.json` translation files.

### Files Changed
- `apps/customer/src/pages/PlaceholderPage.tsx` (delete/replace with `PrivacyPage.tsx` or adjust routing)
- `apps/customer/src/App.tsx` (ensure path resolves to `PrivacyPage`)
- `apps/customer/src/i18n/locales/en.json` & `fr.json` (add complete policy strings)
- `apps/customer/src/components/layout/CookieBanner.tsx` (update link target)
- `docs/COMPLIANCE.md` (document compliance measures)

### Persona Impact
- **P1 Diane & P5 Sophie**: Full access to clear, legal terms and privacy disclosures in French.
- **P3 Margaret**: High readability, minimum 16px font sizing, clear section headings, semantic HTML (`<article>`, `<section>`, `<h2>`) for screen readers.

### Risks & Mitigations
- *Risk*: Huge size of JSON translation files if legal text is extremely verbose, leading to loading delays.
- *Mitigation*: Structure text logically; split into sections to keep translation bundles manageable.

### Schema Audit
- No database schema changes.

---

## Strategy 2: Single-Language Page with PDF Link for Bilingual Copy
Create a simpler `/privacy` page in English containing key summaries, with a download link to French and English full PIPEDA-compliant PDFs hosted on Firebase Storage.

### Files Changed
- `apps/customer/src/pages/PlaceholderPage.tsx`
- `apps/customer/src/i18n/locales/en.json` & `fr.json` (minimal summary strings)
- `docs/COMPLIANCE.md`

### Persona Impact
- **P1 Diane & P5 Sophie**: Poor user experience as they are forced to download a PDF instead of reading natively in-app.

### Risks & Mitigations
- *Risk*: PDF downloads are friction-heavy on mobile devices (e.g., for P2 Travis).
- *Mitigation*: Ensure PDFs are highly compressed and open in a new tab instead of triggering direct download prompts where possible.

### Schema Audit
- No database schema changes.

---

## Strategy 3: Dynamic Markdown Renderer from Firebase Storage
Save the policy text as `.md` files in Firebase Storage (or a Firestore document) in both languages, and render them dynamically in a simple `/privacy` container page using a markdown rendering library (or basic custom parser).

### Files Changed
- `apps/customer/src/pages/PlaceholderPage.tsx`
- `apps/customer/src/App.tsx`
- `docs/COMPLIANCE.md`

### Persona Impact
- **All users**: Dynamic fetch could display a loading spinner before text is rendered.

### Risks & Mitigations
- *Risk*: Adds dynamic API call dependency to load a legal page, which should ideally be available offline (via PWA) and load instantly.
- *Mitigation*: Cache the fetched markdown content locally.

### Schema Audit
- No database schema changes.
