# 0042. Five hubs and nine pages in place of fifteen reports

- Date: 2026-10-17
- Decided by: Owner
- Status: Decided, not built (sprint 2.3)

## Decision

1. **Five hubs**: Home, Schedule, Hours & pay, Billing, Clients. On a phone they are a tab bar along the bottom; on a
   laptop the same five are a slim bar down the left side. The menu button and its list of fifteen cards go.
2. **Nine pages**, each a tab in its hub. Reports that show the same data become one page with a switch, and each
   view keeps what it has today:

   | Hub | Page | Switch | Today's reports |
   | --- | --- | --- | --- |
   | Home | Dashboard | none | Dashboard, Live board (the live day built in; the full board one tap away) |
   | Schedule | This week | Group by: Day & team · Cleaner · Client | Daily teams, By staff, By client; "See as the cleaner" opens My week |
   | Schedule | Patterns & routes | none | Client patterns and routes |
   | Hours & pay | Timesheets | Show: To approve · Scheduled vs actual | Unapproved timesheets, Scheduled vs actual |
   | Hours & pay | Payroll hours | none | Payroll hours |
   | Hours & pay | Punctuality | none | Punctuality |
   | Billing | Client time | Show: Hours · To invoice | Client hours, Invoicing |
   | Billing | Prices | none | Client prices |
   | Clients | Feedback | none | Client feedback |

3. **A switch opens on its first view.**
4. **Old addresses open the new page on the matching view** (`?view=staff` opens This week grouped by cleaner), so
   bookmarks and the Back button keep working.
5. **No figure or rule changes.** The pages reuse today's working-out. On Call still shows only in Day & team
   ([0004](0004-on-call-only-on-daily-teams.md)); Payroll hours stays its own page ([0005](0005-payroll-hours-is-the-pay-record.md)).

## Why

The menu was one column of fifteen tall cards, about three phone screens long, with nothing to say which reports
belong together. Daily teams, By staff and By client are one component over one week of shifts, grouped three ways;
the timesheet pair and the client-time pair are the same. The owner compared three approaches as working mock-ups
(grouped by job, hubs with tabs, grouped by when used), with a second opinion from `agy`, and chose the hubs
(2026-10-17).

## Where it lives

`web/src/reports.ts` and the app shell (built in sprint 2.3); `.claude/rules/web-ui.md`; the README.
