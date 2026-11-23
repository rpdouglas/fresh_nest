import { describe, expect, it } from 'vitest'
import type { Timesheet } from '../types'
import { OVERRIDE_MS, applyOverrides, overridesFrom } from './changes'

const sheet = (id: string, state: string, approvedAt: string | null = null): Timesheet => ({
  id, state, from: '2026-10-12T08:00:00-04:00', to: '2026-10-12T10:00:00-04:00', totalDuration: 120, timezone: 'America/Toronto', approvedAt,
  employee: { id: 'maya', name: 'Maya' }, group: { name: 'Cleaning' }, client: { id: 'c1', name: 'Harper' }, jobSite: null,
})
const NOW = Date.parse('2026-10-12T15:00:00Z')

describe('what Camelo confirmed', () => {
  it('keeps the new state of each change that worked, and nothing for one that did not', () => {
    const held = overridesFrom([{ id: 'a', ok: true, state: 'APPROVED' }, { id: 'b', ok: false, state: 'SUBMITTED' }, { id: 'c', ok: true, state: null }], NOW)
    expect(held).toEqual({ a: { state: 'APPROVED', at: NOW } })
    expect(overridesFrom([{ id: 'd', ok: true, state: 'REJECTED' }], NOW + 5, held)).toEqual({ a: { state: 'APPROVED', at: NOW }, d: { state: 'REJECTED', at: NOW + 5 } })
  })
})

describe('showing it at once', () => {
  const approved = overridesFrom([{ id: 'a', ok: true, state: 'APPROVED' }], NOW)

  it('sets the confirmed state on that entry only, with an approval time', () => {
    const before = [sheet('a', 'SUBMITTED'), sheet('b', 'SUBMITTED')]
    const r = applyOverrides(before, approved, NOW)
    expect(r.timesheets.map((t) => [t.id, t.state, t.approvedAt])).toEqual([['a', 'APPROVED', new Date(NOW).toISOString()], ['b', 'SUBMITTED', null]])
    expect(r.timesheets[1]).toBe(before[1])
    expect(before[0].state).toBe('SUBMITTED')
  })

  it('wins over a reload while Camelo\'s list is still behind', () => {
    const r = applyOverrides([sheet('a', 'SUBMITTED')], approved, NOW + 30_000)
    expect([r.timesheets[0].state, Object.keys(r.overrides)]).toEqual(['APPROVED', ['a']])
  })

  it('is dropped once the list agrees, keeping Camelo\'s own approval time', () => {
    const fetched = [sheet('a', 'APPROVED', '2026-10-12T15:00:02Z')]
    const r = applyOverrides(fetched, approved, NOW + 30_000)
    expect([r.timesheets, r.overrides]).toEqual([fetched, {}])
    expect(r.timesheets).toBe(fetched)
  })

  it('stops applying after two minutes, so a later change made in Camelo itself shows', () => {
    const fetched = [sheet('a', 'SUBMITTED')]
    expect(applyOverrides(fetched, approved, NOW + OVERRIDE_MS - 1).timesheets[0].state).toBe('APPROVED')
    expect(applyOverrides(fetched, approved, NOW + OVERRIDE_MS)).toEqual({ timesheets: fetched, overrides: {} })
  })

  it('keeps a confirmed state for an entry that is in another period\'s list', () => {
    const other = [sheet('z', 'SUBMITTED')]
    const r = applyOverrides(other, approved, NOW)
    expect([r.timesheets, Object.keys(r.overrides)]).toEqual([other, ['a']])
  })

  it('does not put an approval time on a rejected entry', () => {
    const r = applyOverrides([sheet('a', 'SUBMITTED')], overridesFrom([{ id: 'a', ok: true, state: 'REJECTED' }], NOW), NOW)
    expect([r.timesheets[0].state, r.timesheets[0].approvedAt]).toEqual(['REJECTED', null])
  })
})
