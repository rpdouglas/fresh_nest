# 0027. Browser errors go to our own log, and a failed report shows a message

- Date: 2026-10-13
- Decided by: Owner
- Status: In force

## Decision

1. **A failed report shows a message in its place.** The header, the reports menu and sign-out keep working, so
   another report can be opened or the same one tried again. Only a fault outside a report replaces the whole page.
   Not yet true of Daily teams, By client and By staff: their shifts are worked out in `App.tsx`, which the header
   and the menu also read, so a fault there replaces the whole page with a message and a Reload button. Project
   plan item 1.1.11 moves that inside the report. Done on 2026-10-13: the limit no longer applies.
2. **Browser errors are reported to the function's own log** (`POST /api/client-error`), not to an outside service.
   The route needs a sign-in like every other, so a fault before sign-in is not reported.
3. **A reported error emails the owner.** It is logged at ERROR, which the existing alert picks up (at most one
   email an hour). A browser sends at most five per page load and never the same one twice.
4. **What is sent:** the error, its stack and the name of the report. Not the page address or search text, which can
   hold a client's name.

## Why

Before this, a fault while a report was drawing left a blank page and nobody heard about it. Sentry is the usual
answer, but it is a third party that would receive error details from pages showing client names and addresses, and
it needs a new origin in the Content-Security-Policy. Our own log needs no new service and nothing leaves the project.

## Where it lives

`web/src/components/ErrorBoundary.tsx`; `web/src/lib/clientError.ts`; `web/src/main.tsx`; `web/src/App.tsx`;
`handleClientError` in `functions/src/core.ts`; `firebase.json` (the rewrite); `docs/operations.md` (Error alert).
