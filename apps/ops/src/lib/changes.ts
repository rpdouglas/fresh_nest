// Changes made from the site, shown at once. When Camelo confirms an approval or a
// rejection it returns the entry's new state; that state is applied to the timesheets
// the page already holds instead of waiting for a reload. The reload that follows
// reads Camelo's list, which can be a moment behind, so for a short while a confirmed
// state wins over what the list says. The rules:
//  - only a change Camelo confirmed (ok, with a state) is applied;
//  - it is dropped as soon as the list agrees, or after OVERRIDE_MS, whichever is first.
import type { Timesheet } from '../types'

export const OVERRIDE_MS = 2 * 60_000

export interface Override {
  state: string
  at: number
}
/** Confirmed states, by timesheet id. */
export type Overrides = Record<string, Override>

interface Result {
  id: string
  ok: boolean
  state: string | null
}

/** The states Camelo confirmed in these results, added to the ones already held. */
export function overridesFrom(results: Result[], now: number, held: Overrides = {}): Overrides {
  const next = { ...held }
  for (const r of results) if (r.ok && r.state) next[r.id] = { state: r.state, at: now }
  return next
}

/**
 * The timesheets with each confirmed state applied, and the overrides still needed.
 * An entry that becomes approved gets an approval time if it has none.
 */
export function applyOverrides<T extends Timesheet>(timesheets: T[], overrides: Overrides, now: number): { timesheets: T[]; overrides: Overrides } {
  const live = Object.entries(overrides).filter(([, o]) => now - o.at < OVERRIDE_MS)
  if (!live.length) return { timesheets, overrides: {} }
  const byId = new Map(timesheets.map((t) => [t.id, t]))
  // keep an override until the list says the same; one for an entry not in this list is kept too
  const still = Object.fromEntries(live.filter(([id, o]) => byId.get(id)?.state !== o.state))
  const patched = timesheets.map((t) => {
    const o = still[t.id]
    return o ? { ...t, state: o.state, approvedAt: o.state === 'APPROVED' ? (t.approvedAt ?? new Date(o.at).toISOString()) : t.approvedAt } : t
  })
  return { timesheets: Object.keys(still).some((id) => byId.has(id)) ? patched : timesheets, overrides: still }
}
