# 0040. Client patterns and routes: a street map with images from OpenStreetMap

- Date: 2026-10-16
- Decided by: Owner
- Status: In force

## Decision

1. **A report for planning routes.** "Client patterns and routes" shows each client's usual weekday, start time and
   visit length over the last 4, 8 or 12 finished pay periods, and plans four weeks of routes from the office for the
   clients the office keeps ticked, with 1 to 4 teams of two a day.
2. **Built from what the site already reads.** It reads the pay periods through `/api/timesheet-review`, one at a
   time, and places the sites with the schedule check's address lookups (decision [0009](0009-addresses-to-openstreetmap.md)).
   No new server route.
3. **A street map, drawn with Leaflet.** The browser fetches the map images from OpenStreetMap
   (`tile.openstreetmap.org`). Only the area being looked at goes there: no client name or address.
4. **Every team starts and ends at the office**, 367 Eleventh St E, Cornwall. A client whose address cannot be placed
   is put at Snye, QC, and marked as assumed. Both are in `web/src/lib/targets.ts`.

## Why

The owner asked for an interactive version of a one-off analysis (2026-10-16) and chose, of three approaches, the one
that reuses the existing routes over a new server route or a stored visit history. A street map makes the routes
readable; plain dots on a blank background were the other choice.

## Where it lives

`.claude/rules/client-patterns.md`; `web/src/lib/clientPatterns.ts`, `web/src/lib/routePlan.ts`,
`web/src/components/ClientPatternsView.tsx`, `web/src/components/RouteMap.tsx`; the CSP in `firebase.json`; the
browser tests' stand-in for the map images in `e2e/tests/helpers.ts`.
