import { describe, expect, it } from 'vitest'
import { withoutOnCall } from './api'

describe('On Call timesheets', () => {
  it('are dropped as the data arrives, whatever the spelling', () => {
    const sheet = (id: string, name: string | null) => ({ id, group: name === null ? null : { name } })
    const data = {
      periodStart: '2026-10-09',
      timesheets: [sheet('a', 'Cleaning'), sheet('b', 'On Call'), sheet('c', ' on-call '), sheet('d', null)],
    }
    expect(withoutOnCall(data)).toEqual({ periodStart: '2026-10-09', timesheets: [data.timesheets[0], data.timesheets[3]] })
  })
})
