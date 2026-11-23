# 0043. A mobile-first app, installed on the phone, with one look throughout

- Date: 2026-10-17
- Decided by: Owner
- Status: Decided, not built (sprint 2.3)

## Decision

1. **Phone first, laptop second.** Every page is designed for a phone and then widened for a laptop.
2. **Installed as an app (a PWA)** on Android and iPhone: its own icon, full screen, no browser bar. It opens with
   no signal and says so, and updates itself; the data still needs the network. No notifications in the first
   version. The name stays **FNC Landing** ([0022](0022-brand-identity-fnc-landing.md)), on screen and under the icon.
3. **Cleaners install the same app.** A cleaner who signs in sees only My week, in the new look, with no tab bar
   ([0037](0037-staff-accounts-and-roles.md)).
4. **One look, from the Dashboard.** The reference is `docs/design/dashboard-reference.jpg`, drawn by `agy` from a
   brief with made-up names (2026-10-17). From the top: "Act now" cards with Handled and Call; the next 30 minutes;
   each pair's day as a row of blocks; the office to-do as chips; the pay period's progress and recent kudos. The
   7-day schedule check and the trends sit below, folded to one line until tapped. The same cards, chips and type
   carry through every page, in the Fresh Nest Co. palette ([0023](0023-fresh-nest-design-system.md)). Take the
   layout and style from the picture, not its words: its header name, its four tabs and its figures are the drawing's
   own; the name is as in 2, the tabs are the five hubs ([0042](0042-five-hubs-nine-pages.md)).
5. **Light and dark**, following the phone's setting, as today. The dark version is designed, not inverted.
6. **A coloured stripe down a card's left edge means it needs action**: red to act now, amber to watch. It goes on
   anything with a state (live visits, timesheets waiting, overtime, days not invoiced, schedule-check problems,
   complaints) and nowhere else, so the colour keeps its meaning.
7. **Wide grids become cards on a phone** (one per person or client, its days inside) and stay grids on a laptop.
   Payroll hours shows the same exact figures and totals in both.

## Why

The office uses the site mostly on phones, and the owner wants it on the home screen like any other app. The
reference look came from three Dashboard designs by Claude and three by `agy`, compared on 2026-10-17; the owner
chose `agy`'s first and asked for it to set the theme for the whole app.

## Where it lives

`docs/fresh-nest-design-system.md` ("The app on a phone"), `.claude/rules/design-system.md`; the manifest, service
worker and icons in `web/` (sprint 2.3).
