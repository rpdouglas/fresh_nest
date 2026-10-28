import { describe, it, expect } from 'vitest'
import { onDailyReminderCheck } from '../src/scheduled/reminders'
import { onMonthlyEarningsRollover } from '../src/scheduled/earnings'
import { onDailyRecurringRenewal } from '../src/scheduled/renewals'
import { onReviewEmailScheduler } from '../src/scheduled/reviews'

// P3-E38 (ADR-020): every scheduled Function runs on Toronto time, so its local hour never moves
// when the clocks change (Nov 1, 2026).
const trigger = (fn: unknown) => (fn as { __endpoint: { scheduleTrigger: { schedule: string; timeZone: string } } })
  .__endpoint.scheduleTrigger

describe('scheduled Functions run on Toronto time', () => {
  it('P14 Sylvie: day-before reminders at 09:00 local', () => {
    expect(trigger(onDailyReminderCheck)).toMatchObject({ schedule: '0 9 * * *', timeZone: 'America/Toronto' })
  })

  it('P7 Carla / P13 Marcus: earnings roll over at midnight on the 1st, local', () => {
    expect(trigger(onMonthlyEarningsRollover)).toMatchObject({ schedule: '0 0 1 * *', timeZone: 'America/Toronto' })
  })

  it('renewals and review emails', () => {
    expect(trigger(onDailyRecurringRenewal).timeZone).toBe('America/Toronto')
    expect(trigger(onReviewEmailScheduler).timeZone).toBe('America/Toronto')
  })
})
