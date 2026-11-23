# 0030. An AI morning brief on the dashboard

- Date: 2026-10-13 (parked 2026-10-14)
- Decided by: Owner
- Status: Parked (too complicated for right now, owner 2026-10-14)

## Decision

The dashboard opens with a short morning brief written by an AI model: a few plain sentences on what matters today,
such as how many visits there are, who is on course for overtime, missing timesheets from yesterday, approved visits
not yet invoiced, schedule problems today and the first visits at risk.

These hold however it is built:

- **The rules count, the AI only writes.** Every figure in the brief comes from the site's existing rules
  (`web/src/lib/`), worked out before the AI is asked. The AI puts them into sentences and orders them. A brief
  that contains a figure that was not in what it was given is not shown; the plain list of facts is shown instead.
  The same list shows when the AI service fails, so the dashboard never waits on it.
- **Read only.** The brief changes nothing in Camelo or in the site's data, apart from saving the brief itself.
- **The key stays on the server**, held like the Camelo token, and never reaches `web/`.
- **Bounded cost.** One brief per day, saved and reused, with a limited number of refreshes.

To decide in the plan (three approaches, the owner chooses): which AI service; where it runs; and what it may be
sent, whether real first names or stand-ins that the browser swaps back. Sending staff or client names to an outside
service is a new kind of sharing, like the addresses in [0009](0009-addresses-to-openstreetmap.md), and needs the
owner's yes on its own.

## Why

The owner wants the morning's picture without clicking through reports. Most of the facts already exist on the
dashboard; the brief puts them in one place and in plain words. Keeping the figures in the tested rules means the
AI cannot invent or miscount a figure that someone then acts on.

## Where it lives

`docs/project-plan.md` (sprint 2.2).
