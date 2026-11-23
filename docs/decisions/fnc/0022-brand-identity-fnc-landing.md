# 0022. Brand identity: FNC Landing

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

The application's unified name is **FNC Landing**:

1. **User-facing branding:**
   - The browser tab title is dynamically set to `<Report> · FNC Landing` (or `FNC Landing` on the sign-in screen).
   - The sign-in screen heading displays `FNC Landing`.
   - The in-app header kicker above each report title displays `FNC Landing` (replacing the generic uppercase `REPORTS` label).
   - The reports navigation drawer header displays `FNC Landing`.
2. **Documentation:**
   - `README.md` and `AGENTS.md` use `FNC Landing` as the project's authoritative title.
3. **Infrastructure preservation:**
   - Existing Cloud Function names (`scheduleApi`), Firebase hosting targets (`hosting:schedule`, `fnc-reports`), environment variables (`SCHEDULE_EDITORS`), and git repository names (`rpdouglas/blurb`) remain unchanged. They operate within shared GCP and Firebase infrastructure; renaming them would risk deployment drift and broken external references.

## Why

The application was previously referred to interchangeably as "Blurb" (the repository's working name) and "Schedule" (the initial internal descriptor). Adopting "FNC Landing" establishes a distinct, professional brand identity for Fresh Nest Co.'s operations portal while cleanly separating product identity from underlying cloud infrastructure identifiers.

## Where it lives

`web/index.html`; `web/src/components/SignInGate.tsx`; `web/src/components/AppHeader.tsx`; `web/src/components/ReportsMenu.tsx`; `web/src/App.tsx`; `README.md`; `AGENTS.md`.
