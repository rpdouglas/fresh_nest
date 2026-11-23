import { describe, expect, it } from 'vitest'
import { REPORTS } from '../reports'
import { HUBS, hubOf, pageOf } from './hubs'

describe('hubs', () => {
  it('holds every report exactly once, so none is lost from the app', () => {
    const inHubs = HUBS.flatMap((h) => h.pages.flatMap((p) => p.views))
    expect([...inHubs].sort()).toEqual(REPORTS.map((r) => r.view).sort())
  })

  it('has five hubs, Home first, opening on the Dashboard', () => {
    expect(HUBS.map((h) => h.label)).toEqual(['Home', 'Schedule', 'Hours & pay', 'Billing', 'Clients'])
    expect(HUBS[0].pages[0].views[0]).toBe('dashboard')
  })

  it('folds the reports that share data into one page each, with a choice for each on its switch', () => {
    expect(pageOf('staff').tab).toBe('This week')
    expect(pageOf('schedvsactual').tab).toBe('Timesheets')
    expect(pageOf('invoicing').tab).toBe('Client time')
    for (const p of HUBS.flatMap((h) => h.pages)) if (p.choose) expect(p.choose.choices.length).toBeLessThanOrEqual(p.views.length)
  })

  it('finds the hub of an old address', () => {
    expect(hubOf('staff').id).toBe('schedule')
    expect(hubOf('schedvsactual').id).toBe('pay')
    expect(hubOf('invoicing').id).toBe('billing')
  })
})
