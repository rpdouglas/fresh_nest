// What the browser's Back button steps through. Owner's rule (2026-10-13): opening a different
// report is a step (a Dashboard link, a tab or a hub does that too); stepping week to week or period
// to period is not, so Back from a report returns to the one before it, on the dates it was left at.

/** How a change on screen is written to the browser's history: as a new step, or over the current one. */
export function historyStep(change: {
  /** A different report is now on screen. */
  viewChanged: boolean
  /** The change is the browser's own Back or Forward: the history already has it. */
  fromHistory: boolean
}): 'push' | 'replace' {
  return change.viewChanged && !change.fromHistory ? 'push' : 'replace'
}
