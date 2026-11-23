# 0046. The site gets a freshnestco.ca address; it stays a separate app

- Date: 2026-10-27
- Decided by: Owner
- Status: Decided, not set up (sprint 2.5)

## Decision

1. **FNC Landing is served at `https://reports.freshnestco.ca`** as well as `https://fnc-reports.web.app`. It is a
   custom domain on the same Hosting site (`fnc-reports`) in the same Firebase project (`lilypad-strategy-design`).
   No code, data, sign-in or deploy changes: the site already uses only its own address (`'self'`) everywhere.
2. **It is not merged into the Fresh Nest Co. website's admin dashboard** (`freshnestco.ca/admin`, repository
   `rpdouglas/fresh_nest`, Firebase project `freshnest-aa51e`). The two link to each other instead.
3. **`fnc-reports.web.app` keeps working.** Nobody is moved until the new address has been checked on the live
   site; then the team is told which address to use and to reinstall the app from it.

## Why

The owner asked (2026-10-27) to move the site under `freshnestco.ca/admin` and merge it with the website's admin
dashboard. Three ways were weighed:

- **A subdomain** (chosen): about a day of console and DNS work, nothing in the code to change.
- **A path, `freshnestco.ca/admin/reports`**: Firebase Hosting can only send `/api/...` to a function in its own
  project, so the function, `CAMELO_TOKEN` and every `schedule...` collection would move to `freshnest-aa51e`, and
  both apps would deploy together. Most of a merge's cost for little more than a subdomain gives.
- **A full merge** into the admin dashboard: every report restyled (this site is Tailwind v4, the website is held to
  v3 by its ADR-001), sign-in moved to the website's Firebase Auth roles, and one source of truth chosen for
  dispatch, pay rates and clock-in, which both apps keep today (this site from Camelo, the website in its own
  Firestore). Weeks of work, and the last part is a business decision that has not been made.

## What it costs, and what is not yet known

- A browser keeps sign-ins and the installed app per address. Office staff sign in again at the new address;
  cleaners sign in again with their code and reinstall the app from it (0043, 0045).
- The Google sign-in client must list the new address, or the Google button will not work there.
- `freshnestco.ca` itself was not yet confirmed to serve the website on 2026-10-27 (`rpdouglas/fresh_nest`,
  `docs/reports/SEO-01-close-2026-10-27.md`). The subdomain does not depend on it, but both use the same DNS zone,
  held at canspace.

## Where it lives

Sprint 2.5 in `docs/project-plan.md`; the steps in `docs/operations.md`, "The freshnestco.ca address".
