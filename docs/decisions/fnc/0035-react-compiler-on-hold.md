# 0035. React Compiler: on hold

- Date: 2026-10-13
- Decided by: Owner, by merging the pull request that carries this file
- Status: In force

## Decision

React Compiler is not switched on. The site keeps its hand-placed `useMemo` and `useCallback` calls (64 of them).
Nothing from the trial is kept in `web/`: no new packages, and `web/vite.config.ts` is as it was.

Look again when the React plugin for Vite (`@vitejs/plugin-react`) no longer calls its built-in compiler
experimental. That one needs no Babel, which is where most of the cost below comes from.

## Why

The trial (plan item 1.3.4) switched the compiler on the way the React plugin's own instructions say to for
Vite 8, through Babel, and measured it.

It works: the 196 unit tests pass, and the 27 browser tests pass. Nothing looked or behaved differently.

But it costs more than it gives:

| | Before | With the compiler |
| --- | --- | --- |
| Script the browser downloads, all reports | 490 kB (145 kB compressed) | 562 kB (178 kB compressed) |
| Dashboard's own script | 46 kB | 59 kB |
| `npm run build` | 3.5 s | 11 s |
| First page from a just-started dev server | under 5 s | over 5 s |

- **The download grows by 15%** (23% compressed), which undoes part of what Sprint 1.1 saved by splitting the
  reports.
- **Babel comes back.** Vite 8's React plugin stopped using Babel; the stable compiler still needs it, so the trial
  added three build packages, and every file is compiled a second time. That is the slower build, and it is why the
  first browser test of a run failed on its first try: the dashboard took longer than the 5 seconds the test allows
  to arrive from a dev server that had just started. It passed on a second try, and so did everything after it.
- **Babel has to be held a version back.** On Babel 8 the compiler gave up on 12 of 72 components and hooks; on
  Babel 7, on 6 of 70.
- **The tidying it promised is only partly there.** The six it skips are left exactly as written, so they keep
  needing their hand-placed calls, and they are the largest ones: `App`, the reports menu, Unapproved timesheets,
  Invoicing and the trends panel. It skips them for ordinary code it does not handle yet (a lazy `import()`, a
  `try` with `finally`, a `throw` inside a `try`), not for anything wrong in them.
- **There was nothing to speed up.** The site is not slow to draw; the tech stack review called this "a tidiness
  gain, not a speed fix".

## What it costs

The 64 hand-placed calls stay, and a new component still needs one where a heavy sum would otherwise be redone on
every keystroke. That is the cost today, and it has not caused a fault.

## Where it lives

Nowhere in the code. To try again: `web/node_modules/@vitejs/plugin-react/README.md`, "React Compiler", says how
for the installed version; compare `npm run build` output and run `npm test` in `e2e/`.
