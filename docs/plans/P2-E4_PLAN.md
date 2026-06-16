# Phase A Plan: P2-E4 Content Pages — About, Reviews & Careers

This plan outlines three strategies for replacing the remaining `PlaceholderPage` routes with fully functional, bilingual, accessible content pages (`/about`, `/careers`) and ensuring the `/reviews` page is verified and integrated.

---

## Strategy 1: Independent Dedicated Page Components & Wired Routes (Recommended)
This strategy replaces the placeholders in `App.tsx` with dedicated React page components (`AboutPage.tsx` and `CareersPage.tsx`) while wiring up the existing `PrivacyPage.tsx` and verifying the existing `ReviewsPage.tsx`. All content copy is 100% externalized in `en.json` and `fr.json`.

### Files Changed
- [apps/customer/src/App.tsx](file:///workspaces/fresh_nest/apps/customer/src/App.tsx): Import and wire up `AboutPage`, `CareersPage`, and `PrivacyPage`.
- [apps/customer/src/pages/AboutPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AboutPage.tsx): (New page) Implements company story, mission, community statements, and reuses the existing `MeetTheTeam` component.
- [apps/customer/src/pages/CareersPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/CareersPage.tsx): (New page) Showcases employee benefits, an active "Residential Cleaning Specialist" opening, and clear application instructions (email link).
- [apps/customer/src/i18n/locales/en.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/en.json): Add translation bundles under `aboutPage` and `careersPage` namespaces.
- [apps/customer/src/i18n/locales/fr.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/fr.json): Add French translation counterparts.
- [docs/plans/P2-E4_PLAN.md](file:///workspaces/fresh_nest/docs/plans/P2-E4_PLAN.md) (This document).

### Persona Impact
- **P1 Diane Lafleur & P3 Margaret Storey**: Can view company values, story, and meet team members (`MeetTheTeam`) to establish local trust.
- **P4 Kahnawà:ke Baptiste**: Explicitly sees "Cornwall Island / Akwesasne" bridge-crossing service mentioned in community statements.
- **P5 Sophie Tremblay-Gagnon**: Explicitly sees Quebec-side (Snye, QC) service area details and eco-friendly baby-safe product statements in French.
- **Margaret Storey (P3)**: Minimum 16px body copy and 48px touch targets for links/buttons are strictly enforced.

### Risks & Mitigations
- *Risk*: Duplicating layout code across multiple static content pages.
  - *Mitigation*: Ensure shared layout structures (like section headers or margins) leverage existing design tokens and standard HTML tags in a clean, consistent layout style.
- *Risk*: Lengthy content translations bloating standard pages.
  - *Mitigation*: Organize translation files clearly with sub-objects for sections (e.g. `aboutPage.story`, `aboutPage.community`) to keep components clean.

### Schema Audit
- No database schema changes are required for this epic. Static pages do not perform Firestore writes.

---

## Strategy 2: Direct Inline Component Translation Arrays (Not Recommended)
This strategy embeds English and French text directly in the components as locale objects, rather than using `en.json` and `fr.json`.

### Files Changed
- [apps/customer/src/pages/AboutPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AboutPage.tsx): Local translation constants dictionary.
- [apps/customer/src/pages/CareersPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/CareersPage.tsx): Local translation constants dictionary.

### Persona Impact
- High translation maintenance overhead; violates linguistic auditor compliance.

### Risks & Mitigations
- *Risk*: Directly violates the Linguistic Auditor's rule against hardcoded copy in components.
- *Risk*: Difficult to localize dynamically or maintain consistently with `react-i18next`.

---

## Strategy 3: Dynamic DynamicContentPage Generic Wrapper
A single dynamic wrapper page `DynamicContentPage.tsx` is created, which loads the target route name (e.g., `/about` or `/careers`), reads its page sections dynamically from the i18n JSON, and dynamically maps them to generic layouts.

### Files Changed
- [apps/customer/src/pages/DynamicContentPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/DynamicContentPage.tsx): Generic page mapper.
- [apps/customer/src/App.tsx](file:///workspaces/fresh_nest/apps/customer/src/App.tsx): Routes mapped to `DynamicContentPage`.

### Persona Impact
- Dynamic data mapping might make custom layout elements (like injecting the `MeetTheTeam` component or specific custom SVG icons for benefits) difficult or messy.

### Risks & Mitigations
- *Risk*: Over-engineering static pages leads to code complexity and poor readability.
- *Mitigation*: Independent dedicated pages (Strategy 1) are simpler, safer, and much easier to customize for page-specific visual elements.
