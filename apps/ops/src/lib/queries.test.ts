import { beforeEach, describe, expect, it } from 'vitest'
import type { Timesheet } from '../types'
import { applyConfirmed, forgetLoaded, queryClient } from './queries'

const sheet = (id: string, state: string) => ({ id, state }) as unknown as Timesheet
const key = ['camelo', 'review', '2026-10-02']
const held = () => queryClient.getQueryData<{ timesheets: Timesheet[] }>(key)!.timesheets.map((t) => `${t.id}:${t.state}`)

describe('a change Camelo has confirmed', () => {
  beforeEach(() => forgetLoaded())

  it('shows at once in what is loaded, keeps the time it was loaded, and marks it to be read again', () => {
    queryClient.setQueryData(key, { timesheets: [sheet('a', 'SUBMITTED'), sheet('b', 'SUBMITTED')] }, { updatedAt: 1_000 })
    queryClient.setQueryData(['camelo', 'week', '2026-10-05'], { shifts: [] }, { updatedAt: 1_000 })

    applyConfirmed([{ id: 'a', ok: true, state: 'APPROVED', message: null }])

    expect(held()).toEqual(['a:APPROVED', 'b:SUBMITTED'])
    const state = queryClient.getQueryState(key)!
    expect(state.dataUpdatedAt).toBe(1_000)
    expect(state.isInvalidated).toBe(true)
    // a week of shifts holds no timesheets: left alone
    expect(queryClient.getQueryState(['camelo', 'week', '2026-10-05'])!.isInvalidated).toBe(false)
  })

  it('does nothing for a change Camelo refused', () => {
    queryClient.setQueryData(key, { timesheets: [sheet('a', 'SUBMITTED')] }, { updatedAt: 1_000 })
    applyConfirmed([{ id: 'a', ok: false, state: null, message: 'no' }])
    expect(held()).toEqual(['a:SUBMITTED'])
    expect(queryClient.getQueryState(key)!.isInvalidated).toBe(false)
  })
})
