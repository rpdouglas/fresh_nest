# E24 — Meta Tags + Bilingual Page Titles: Implementation Plan

**Primary Persona:** Sophie (FR search) + Travis (local search)

## Strategy 1: Reusable `<SEO>` Component with React 19 Native Metadata (Recommended & Approved)

**Overview:**
Create a centralized `<SEO>` component that leverages React 19's native document metadata hoisting. It will automatically manage `<title>`, description, Open Graph tags, and bilingual `hreflang` tags across the application.

**Steps:**
1. **i18n Update:** Modify `src/i18n/index.ts` to add `'querystring'` to the `detection.order` array (and configure `lookupQuerystring: 'lang'`). This ensures search engine bots following `?lang=fr` URLs get the correct French language version.
2. **SEO Component:** Create `src/components/seo/SEO.tsx`. It will accept `titleKey`, `descriptionKey`, and `image` props. Internally, it will use `useTranslation` to render localized metadata. It will generate `hreflang="en"` and `hreflang="fr"` tags pointing to the current pathname with `?lang=en` and `?lang=fr` respectively.
3. **Global Fallback:** Provide default values for Open Graph tags using `public/images/og-image-1200x630.jpg`.
4. **Integration:** Refactor all route entry points (e.g., `Home.tsx`, `ServicePage.tsx`, `LocationPage.tsx`, `FaqPage.tsx`, etc.) to use the `<SEO />` component instead of inline `<title>` and `<meta>` tags.

**Persona Impact:**
- **Sophie:** French search queries will match correctly against `hreflang` definitions, ensuring French titles and descriptions in SERP.
- **Travis:** Links shared via SMS or social media will feature a professional, robust Open Graph card.

**Risks & Mitigations:**
- **Location Sync:** We will use React Router's `useLocation` hook to ensure the canonical URL and `hreflang` URLs update correctly upon client-side navigation.
- **Schema Audit:** No Firestore schema changes required.

---

## Strategy 2: Using `react-helmet-async` (Discarded)
Introduce a third-party library to manage document head tags.
- **Pros:** Proven pattern for older React versions.
- **Cons:** Unnecessary given React 19's built-in support for metadata tags. Adds bundle weight.

---

## Strategy 3: Manual JSX Injection (Discarded)
Manually add `og:*` and `hreflang` `<meta>`/`<link>` tags alongside the existing `<title>` tags in every page component.
- **Pros:** Fast to implement initially.
- **Cons:** High maintenance burden, prone to inconsistencies, and requires repeating URL construction logic everywhere.

---

**Next Step:** Await human approval to proceed with Strategy 1 and execute Phase B.
