import { describe, expect, it } from 'vitest'
import type { ReviewSheet } from '../types'
import { approvalStats, lagLabel } from './approvals'

const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`
function sheet(id: string, who: string, day: number, over: Partial<ReviewSheet> = {}): ReviewSheet {
  return {
    id, state: 'SUBMITTED', from: at(day, '08:00'), to: at(day, '10:00'), totalDuration: 120, timezone: 'America/Toronto', approvedAt: null,
    employee: { id: who.toLowerCase(), name: who }, group: null, client: null, jobSite: null, referenceObject: { __typename: 'TimeCard', shiftId: 's' }, ...over,
  }
}
const NOW = Date.parse(at(9, '12:00'))

describe('approval speed and hand-entered time', () => {
  it('takes the median hours from clock-out to approval', () => {
    const { total } = approvalStats(
      [
        sheet('a', 'Maya', 5, { state: 'APPROVED', approvedAt: at(5, '12:00') }),
        sheet('b', 'Maya', 5, { state: 'APPROVED', approvedAt: at(6, '10:00') }),
        sheet('c', 'Maya', 5, { state: 'APPROVED', approvedAt: at(7, '10:00') }),
        sheet('d', 'Maya', 5, { state: 'APPROVED', approvedAt: at(5, '09:00') }),
      ],
      NOW,
    )
    // 2, 24, 48 and 0 (approved before clock-out counts as zero): median of 2 and 24
    expect([total.approved, total.medianLagHours]).toEqual([4, 13])
  })

  it('counts entries waiting more than three days, not rejected ones', () => {
    const { total } = approvalStats([sheet('a', 'Maya', 5), sheet('b', 'Maya', 8), sheet('c', 'Maya', 2, { state: 'REJECTED' }), sheet('d', 'Maya', 3, { state: 'DRAFT' })], NOW)
    expect(total.waitingLong).toBe(2)
  })

  it('calls anything but a clock-in entered by hand, leaves out leave, and ranks most by hand first', () => {
    const { rows, total } = approvalStats(
      [
        sheet('a', 'Maya', 5),
        sheet('b', 'Jo', 5, { referenceObject: null }),
        sheet('c', 'Jo', 6),
        sheet('d', 'Jo', 7, { referenceObject: { __typename: 'LeaveRequest' } }),
      ],
      NOW,
    )
    expect(rows.map((r) => [r.name, r.entries, r.byHand, r.byHandRate])).toEqual([['Jo', 2, 1, 0.5], ['Maya', 1, 0, 0]])
    expect([total.entries, total.byHand, total.medianLagHours]).toEqual([3, 1, null])
  })

  it('labels the lag in hours, or days past two days', () => {
    expect([lagLabel(null), lagLabel(5.46), lagLabel(50)]).toEqual(['–', '5.5 h', '2.1 days'])
  })
})
