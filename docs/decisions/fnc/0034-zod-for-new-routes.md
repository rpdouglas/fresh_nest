# 0034. Zod checks what new routes are sent; the old routes keep their own checks

- Date: 2026-10-13
- Decided by: Owner, by merging the pull request that carries this file (closing it instead drops the idea)
- Status: In force

## Decision

A new route on the server describes what it accepts as a Zod schema and checks requests with `parse` in
`functions/src/validate.ts`. The two routes of the trial, `/api/schedule-check` and `/api/snapshots`, stay
converted. The other eight routes keep their hand-written checks and are **not** converted, unless one is being
rewritten anyway. The routes that change Camelo (`/api/timesheet-actions`) are left alone in any case.

The owner chose Zod over Valibot and over tidying the hand-written checks into helpers (2026-10-13): it runs only
on the server, so Valibot's smaller size buys nothing.

## Why

The trial (plan item 1.3.2) converted the two newest routes and kept every status and every message. A test
written first, against the hand-written code, pins 42 bad requests to the words each one gets; it passed unchanged
after the conversion.

What the trial showed:

- **It is not less code.** The two routes went from 177 lines to 182, plus 33 for the shared helper. The saving the
  tech stack review expected ("replaces about 50 hand-written checks") is not there for simple requests: three
  fields and three messages are three lines either way.
- **It is clearer where the request has a shape.** A snapshot (totals by name, lists of rows) reads as a
  description of the thing and not as a run of `typeof` tests, and the route got shorter (72 lines to 68). The
  types come from the schema, so the casts on each field go: seven of them
  in the two routes before (`totals as Record<string, number>` and the like), none after.
- **Our own words survive.** Each field has one plain message, kept in a small table beside the schema; Zod's own
  messages are never shown.
- **The cost is small.** One dependency with none of its own; about 75 ms more when a fresh instance starts.

So it earns its place on the routes still to be written, most of which take structured entries (checklists, the
live board, leads, campaigns), and does not earn a rewrite of checks that work and are tested.

## What it costs, and what to watch

- **One request is answered differently.** A key named `__proto__` in a snapshot's totals or rows was refused; Zod
  drops that key and accepts the rest. The site cannot send one, and dropping it is the safer of the two. Pinned in
  the test.
- A refinement runs even when an earlier one failed, unless the earlier one says `abort: true`. One that calls
  `torontoMidnight` on text that is not a date throws, which would be a 500 and not a 400. `day` in `validate.ts`
  aborts for this reason; a new refinement after a date check must be able to take bad input, or follow an abort.
- A message set on a `z.record(...)` also covers a bad key, not only "this is not an object".
- Zod's own date check accepts years the site's does not, so `day` uses the site's `validDate`.
- Fields are reported in the order the schema lists them: list them in the order the person should be told.

## Where it lives

`functions/src/validate.ts` (`parse`, `day`, `id`, `dayRange`); the schemas at the top of
`functions/src/routes/schedule-check.ts` and `functions/src/routes/snapshots.ts`; the test "say what is wrong
with a request" in `functions/src/core.test.ts`. To drop it later: put the checks back from the history of those
two files and remove `zod` from `functions/package.json`; the test says whether the words came back the same.
