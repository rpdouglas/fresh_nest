# R19 — Booking Form E2E Coverage
**Epic:** R19 | **Phase:** Phase 2 | **Date:** 2026-06-11  
**Primary Personas:** Travis McLeod (P2), Margaret Storey (P3), Sophie Tremblay-Gagnon (P5)  
**Technical Finding Addressed:** F-20 (No E2E test coverage for booking form funnel)  

---

## 1. Context & User Story

As a developer (Ryan), I want automated E2E tests validating the multi-step booking form and language toggles so that regressions in the core booking funnel are immediately caught and blocked.

---

## 2. Technical Architecture & Tests

Tests will run against both Chromium and Firefox, checking:
1. Complete booking submission.
2. Back navigation between form steps.
3. Form validation triggers.
4. Navbar language switching (EN/FR).
5. French query parameter persistence and French labels.

### File: [playwright.config.ts](file:///workspaces/fresh_nest/playwright.config.ts)

Add Firefox project:
```typescript
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
```

---

## 3. Implementation Steps

1. Update `playwright.config.ts` to run both Chromium and Firefox.
2. Create `e2e/booking.spec.ts` for full booking validation, navigation, and validation error messages.
3. Create `e2e/language.spec.ts` for language toggles and persistent locale changes.
4. Run `npm run test:e2e` to verify all E2E tests pass.

---

## 4. Persona Acceptance Tests

*   **P2 Travis McLeod**: The Playwright booking suite completes a full booking from home, filling all inputs, submitting, and landing on the confirmation thank-you page under Chromium and Firefox.
*   **P3 Margaret Storey**: The booking form enforces required validation errors on clicking "Next" without inputs.
*   **P5 Sophie Tremblay-Gagnon**: Selecting the French language button updates all text inputs and page labels to French, verifying full bilingual functionality.
