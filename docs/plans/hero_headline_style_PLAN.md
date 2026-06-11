# Hero Headline Style Optimization Plan
**Goal:** Restructure the Hero main heading (H1) into three lines: Professional (current color), Cleaning (italics and logo blue), and & Organizing (current color), with corresponding localized layout for French.

**Primary Persona(s) Served:**
- **P1 & P5 (Diane & Sophie):** Francophone users who receive a fully translated and styled French version.
- **P3 (Margaret):** Benefits from clear typographic focus and WCAG AA passing contrast.

---

## Strategy 1: React Router Trans Component with Highlight Tags (Recommended & Pre-selected)
**Description:** Use the `Trans` component from `react-i18next` in `Hero.tsx` to insert styled span highlights and line breaks dynamically.
- Component changes: Update `src/components/home/Hero.tsx` to import `Trans` and map components:
  ```tsx
  <Trans
    i18nKey="hero.headline"
    components={{
      highlight: <span className="italic text-slate-brand" />,
      br: <br />
    }}
  />
  ```
- Translation updates:
  - English (`en.json`): `"headline": "Professional <br /> <highlight>Cleaning</highlight> <br /> & Organizing"`
  - French (`fr.json`): `"headline": "Professionnel <br /> <highlight>Nettoyage</highlight> <br /> & Organisation"`
- Color: The class `text-slate-brand` uses the exact logo/button brand blue.

**Files Changed:**
1. `src/components/home/Hero.tsx`
2. `src/i18n/locales/en.json`
3. `src/i18n/locales/fr.json`

**Persona Impact:**
- Visual design is more premium, offering a nice styled accent in the hero headline.
- Fully translated and styled for French.

**Risks:**
- None.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Raw HTML Translation Injection
**Description:** Use `dangerouslySetInnerHTML` to inject raw HTML tags (`<br />` and `<span class="...">`) directly from the translation JSON files.

**Risks:**
- XSS vulnerability risks when injecting raw HTML from localization databases.
- Synthetic className bindings in React can sometimes skip compile-time Tailwind checking.

---

## Strategy 3: JSX-Hardcoded Splitting
**Description:** Hardcode the words directly in the JSX and render different elements depending on the current language setting (`i18n.language === 'en'`).

**Risks:**
- Violates the rule of not hardcoding copy and languages in component files, making localization maintenance harder.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as it is the most secure, standard i18next practice, and maintains translation integrity.

To proceed:
1. Obtain human approval for Strategy 1.
2. Edit `src/components/home/Hero.tsx`, `en.json`, and `fr.json`.
3. Verify build and lint behaviour.
