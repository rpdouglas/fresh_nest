import { describe, it, expect } from 'vitest'
import {
  estimateShiftPay,
  earningsOverage,
  overlapsBlockedWindow,
  findTravelConflict,
  resolveBufferMinutes,
} from '../src/lib/eligibility'
import { buildOpenShifts, resolveMunicipality, type JobRecord } from '../src/lib/openShifts'

// HOTFIX-02: these helpers back both claimJob (enforcement) and listOpenShifts (display).

const job = (id: string, overrides: Record<string, unknown> = {}): JobRecord => ({
  id,
  data: {
    bookingId: `booking-${id}`,
    clientName: 'Jane Smith',
    clientPhone: '6135559900',
    clientNotes: 'Gate code 1234',
    clientAddress: '456 Riverdale Ave, Cornwall ON K6H 1A1',
    serviceType: 'standard',
    scheduledDate: '2026-10-07',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    status: 'unassigned',
    assignedTo: null,
    checkedInGeo: null,
    payRateSnapshot: { rateId: 'rate-1', amount: 25, currency: 'CAD' },
    createdAt: { toMillis: () => 0 },
    ...overrides,
  },
})

describe('P7 Carla — earnings cap acceptance test', () => {
  // Limit $800, current $750 → $50 remaining
  it('blocks a $75 shift with a $25 overage and allows a $45 shift', () => {
    expect(earningsOverage(estimateShiftPay(75, '09:00', '10:00'), 800, 750)).toBe(25)
    expect(earningsOverage(estimateShiftPay(45, '09:00', '10:00'), 800, 750)).toBe(0)
  })

  // PERSONAS.md P7 step 6 says "$10 claimable, $11 blocked" at $795/$800, but only $5
  // remains at that point — flagged for human review. Asserting the arithmetic boundary.
  it('after claiming $45 (current $795): exactly the $5 remaining fits, $6 is blocked', () => {
    expect(earningsOverage(5, 800, 795)).toBe(0)
    expect(earningsOverage(6, 800, 795)).toBe(1)
  })

  it('applies no cap when monthlyEarningsLimit is null', () => {
    expect(earningsOverage(10_000, null, 750)).toBe(0)
  })
})

describe('P9 Mike — blocked window acceptance test', () => {
  // Tuesday 19:00–20:30 recurring. 2026-10-06 is a Tuesday, 2026-10-07 a Wednesday.
  const windows = [{ dayOfWeek: 2, startTime: '19:00', endTime: '20:30', recurring: true, label: 'Recovery meeting' }]

  it('hides Tuesday 18:30–20:00, shows Tuesday 20:30–22:00 and Wednesday 19:00–20:30', () => {
    expect(overlapsBlockedWindow('2026-10-06', '18:30', '20:00', windows)).toBe(true)
    expect(overlapsBlockedWindow('2026-10-06', '20:30', '22:00', windows)).toBe(false)
    expect(overlapsBlockedWindow('2026-10-07', '19:00', '20:30', windows)).toBe(false)
  })

  it('never sends a blocked shift (or the window label) in the board response', () => {
    const shifts = buildOpenShifts(
      [
        job('tue-blocked', { scheduledDate: '2026-10-06', scheduledStartTime: '18:30', scheduledEndTime: '20:00' }),
        job('tue-late', { scheduledDate: '2026-10-06', scheduledStartTime: '20:30', scheduledEndTime: '22:00' }),
        job('wed', { scheduledDate: '2026-10-07', scheduledStartTime: '19:00', scheduledEndTime: '20:30' }),
      ],
      { constraints: { blockedWindows: windows } },
      [],
    )
    expect(shifts.map((s) => s.id).sort()).toEqual(['tue-late', 'wed'])
    expect(JSON.stringify(shifts)).not.toContain('Recovery meeting')
  })

  it('matches one-off windows by date', () => {
    const oneOff = [{ date: '2026-10-07', startTime: '08:00', endTime: '12:00', recurring: false }]
    expect(overlapsBlockedWindow('2026-10-07', '09:00', '11:00', oneOff)).toBe(true)
    expect(overlapsBlockedWindow('2026-10-08', '09:00', '11:00', oneOff)).toBe(false)
  })
})

describe('P8 Jasmine — travel buffer', () => {
  const assigned = { startTime: '10:00', endTime: '12:00', address: '1 Pitt St, Cornwall ON K6J 3P2' }

  it('defaults to 60 min for transit and 30 min otherwise; explicit setting wins', () => {
    expect(resolveBufferMinutes({})).toBe(60)
    expect(resolveBufferMinutes({ transportMode: 'personal_vehicle' })).toBe(30)
    expect(resolveBufferMinutes({ transportMode: 'transit', transitBufferMinutes: 90 })).toBe(90)
  })

  it('flags a shift starting inside the buffer in a different FSA', () => {
    const candidate = { startTime: '12:30', endTime: '14:00', address: '9 Main St, Long Sault ON K0C 1P0' }
    expect(findTravelConflict(candidate, [assigned], 60)).toEqual(assigned)
  })

  it('waives the buffer within the same FSA but still flags direct overlap', () => {
    const sameFsa = { startTime: '12:15', endTime: '14:00', address: '8 Second St, Cornwall ON K6J 1A1' }
    expect(findTravelConflict(sameFsa, [assigned], 60)).toBeNull()
    const overlap = { ...sameFsa, startTime: '11:00' }
    expect(findTravelConflict(overlap, [assigned], 60)).toEqual(assigned)
  })

  it('reports the conflicting shift times on the board, ignoring cancelled jobs', () => {
    const [shift] = buildOpenShifts(
      [job('open', { scheduledStartTime: '12:30', scheduledEndTime: '14:00', clientAddress: '9 Main St, Long Sault ON K0C 1P0' })],
      { constraints: { transportMode: 'transit' } },
      [
        job('mine', { status: 'assigned', assignedTo: 'jasmine', scheduledStartTime: '10:00', scheduledEndTime: '12:00', clientAddress: assigned.address }),
        job('cancelled', { status: 'cancelled', assignedTo: 'jasmine', scheduledStartTime: '14:10', scheduledEndTime: '15:00' }),
      ],
    )
    expect(shift.eligibility.travelConflict).toEqual({ startTime: '10:00', endTime: '12:00', bufferMinutes: 60 })
  })
})

describe('listOpenShifts projection — PII minimisation', () => {
  it('returns only whitelisted fields', () => {
    const [shift] = buildOpenShifts([job('j1')], {}, [])
    expect(Object.keys(shift).sort()).toEqual(
      ['area', 'eligibility', 'id', 'payRate', 'scheduledDate', 'scheduledEndTime', 'scheduledStartTime', 'serviceType'],
    )
    const json = JSON.stringify(shift)
    for (const pii of ['Jane Smith', '6135559900', 'Gate code', 'Riverdale', 'booking-j1']) {
      expect(json).not.toContain(pii)
    }
    expect(shift.area).toEqual({ municipality: 'Cornwall', postalPrefix: 'K6H' })
    expect(shift.eligibility).toMatchObject({ durationHours: 2, estimatedPay: 50, overage: 0, travelConflict: null })
  })

  it('excludes jobs that are not genuinely unassigned and sorts newest first', () => {
    const shifts = buildOpenShifts(
      [
        job('old', { createdAt: { toMillis: () => 1 } }),
        job('new', { createdAt: { toMillis: () => 2 } }),
        job('stale', { assignedTo: 'someone' }),
      ],
      {},
      [],
    )
    expect(shifts.map((s) => s.id)).toEqual(['new', 'old'])
  })

  it('resolves Cornwall Island (Akwesasne) ahead of Cornwall', () => {
    expect(resolveMunicipality('12 Island Rd, Cornwall Island ON K6H 5R7')).toBe('Cornwall Island')
    expect(resolveMunicipality('100 Water St, Cornwall ON')).toBe('Cornwall')
    expect(resolveMunicipality('')).toBeNull()
  })
})
