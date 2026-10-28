import { describe, it, expect } from 'vitest'
import { buildAuditEntry, resolveActor, auditValue, UNKNOWN_ACTOR, DELETE_STAMP_WINDOW_MS } from '../src/shared/audit'

// P3-E37 (W0-3): the pure diff engine behind the audit triggers.

const ts = (ms: number) => ({ toMillis: () => ms })
const NOW = 1_800_000_000_000
const stamp = (by: string, at: number, extra: Record<string, unknown> = {}) => ({
  lastChange: { by, at: ts(at), source: 'admin', ...extra },
})

const booking = {
  firstName: 'Margaret', lastName: 'Storey', preferredDate: '2026-11-03', status: 'pending',
  address: '1 Main St', assignedTo: null, serviceType: 'standard',
}

describe('buildAuditEntry — updates', () => {
  it('one entry per save, listing every watched change with old and new values', () => {
    const entry = buildAuditEntry({
      collection: 'bookings', documentId: 'b1', nowMs: NOW,
      before: { ...booking, ...stamp('lauren@x.ca', NOW - 60_000) },
      after: { ...booking, preferredDate: '2026-11-05', assignedTo: 'Brenda', ...stamp('lauren@x.ca', NOW, { reason: 'Client asked' }) },
    })
    expect(entry).toMatchObject({
      action: 'update', actor: 'lauren@x.ca', source: 'admin', reason: 'Client asked',
      recordLabel: 'Margaret Storey · 2026-11-05',
      changes: [
        { field: 'preferredDate', before: '2026-11-03', after: '2026-11-05' },
        { field: 'assignedTo', before: null, after: 'Brenda' },
      ],
      changedBy: 'lauren@x.ca', field: 'preferredDate, assignedTo', oldValue: null, newValue: null,
    })
  })

  it('unwatched or identical changes write nothing', () => {
    expect(buildAuditEntry({ collection: 'bookings', documentId: 'b1', nowMs: NOW,
      before: { ...booking, estimatedPrice: 1 }, after: { ...booking, estimatedPrice: 2 } })).toBeNull()
    expect(buildAuditEntry({ collection: 'jobs', documentId: 'j1', nowMs: NOW,
      before: { status: 'assigned', checkedInAt: ts(5) }, after: { status: 'assigned', checkedInAt: { seconds: 0, nanoseconds: 5e6 } } })).toBeNull()
  })

  it('nested and array fields are compared by value; single changes keep the old columns', () => {
    const entry = buildAuditEntry({ collection: 'staff', documentId: 's1', nowMs: NOW,
      before: { financials: { monthlyEarningsLimit: 1000, currentMonthEarnings: 5 }, constraints: { blockedWindows: [{ day: 1 }] } },
      after: { financials: { monthlyEarningsLimit: 1000, currentMonthEarnings: 90 }, constraints: { blockedWindows: [{ day: 2 }] } },
    })
    expect(entry?.changes).toEqual([{ field: 'constraints.blockedWindows', before: [{ day: 1 }], after: [{ day: 2 }] }])
    expect(entry).toMatchObject({ field: 'constraints.blockedWindows', oldValue: [{ day: 1 }], newValue: [{ day: 2 }] })
  })

  it('unaudited collections are ignored', () => {
    expect(buildAuditEntry({ collection: 'notifications', documentId: 'n', nowMs: NOW, before: { read: false }, after: { read: true } })).toBeNull()
  })
})

describe('attribution (lastChange)', () => {
  it('a stamp set by this write names the person, source, reason and override type', () => {
    const entry = buildAuditEntry({ collection: 'jobs', documentId: 'j1', nowMs: NOW,
      before: { status: 'unassigned', assignedTo: null },
      after: { status: 'assigned', assignedTo: 'brenda', ...stamp('lauren@x.ca', NOW, { overrideType: 'travel_conflict_exceeded', reason: 'Short drive' }) },
    })
    expect(entry).toMatchObject({ actor: 'lauren@x.ca', overrideType: 'travel_conflict_exceeded', reason: 'Short drive' })
  })

  it('an old stamp left over from an earlier save is not credited (server or older-app change)', () => {
    const old = stamp('lauren@x.ca', NOW - 86_400_000)
    const entry = buildAuditEntry({ collection: 'jobs', documentId: 'j1', nowMs: NOW,
      before: { status: 'assigned', ...old }, after: { status: 'cancelled', ...old } })
    expect(entry).toMatchObject({ actor: UNKNOWN_ACTOR, source: 'system', reason: null })
  })

  it('a write with no stamp at all is unknown', () => {
    expect(resolveActor({ status: 'a' }, { status: 'b' }, NOW).by).toBe(UNKNOWN_ACTOR)
  })

  it('server code stamps system:<function>; staff app and portal stamps keep their source', () => {
    expect(resolveActor(null, { lastChange: { by: 'system:onDailyRecurringRenewal', at: ts(NOW), source: 'system' } }, NOW).by)
      .toBe('system:onDailyRecurringRenewal')
    expect(resolveActor(null, { lastChange: { by: 'brenda@x.ca', at: ts(NOW), source: 'staff_app' } }, NOW).source).toBe('staff_app')
    expect(resolveActor(null, { lastChange: { by: 'x', at: ts(NOW), source: 'bogus' } }, NOW).source).toBe('system')
  })
})

describe('create and delete', () => {
  it('create lists the watched fields that were set', () => {
    const entry = buildAuditEntry({ collection: 'payRates', documentId: 'r1', nowMs: NOW, before: null,
      after: { role: 'cleaner', amountCents: 2200, currency: 'CAD', createdBy: 'x', ...stamp('lauren@x.ca', NOW) } })
    expect(entry?.action).toBe('create')
    expect(entry?.changes.map((c) => c.field)).toEqual(['role', 'amountCents', 'currency'])
  })

  it('delete keeps a trimmed snapshot and credits a stamp made just before deleting', () => {
    const before = { captionEn: 'Kitchen', published: true, ...stamp('lauren@x.ca', NOW - 1000) }
    const entry = buildAuditEntry({ collection: 'galleryPairs', documentId: 'g1', nowMs: NOW, before, after: null })
    expect(entry).toMatchObject({ action: 'delete', actor: 'lauren@x.ca', changes: [], field: '(deleted)',
      snapshot: { captionEn: 'Kitchen', published: true } })
    expect(entry?.snapshot).not.toHaveProperty('lastChange')
  })

  it('a delete long after the last stamp is unknown; job snapshots drop photos', () => {
    const before = { clientName: 'A', photos: ['x'], checklistCompletions: {}, status: 'done', ...stamp('l@x.ca', NOW - DELETE_STAMP_WINDOW_MS - 1) }
    const entry = buildAuditEntry({ collection: 'jobs', documentId: 'j1', nowMs: NOW, before, after: null })
    expect(entry?.actor).toBe(UNKNOWN_ACTOR)
    expect(entry?.snapshot).toEqual({ clientName: 'A', status: 'done' })
  })
})

describe('auditValue', () => {
  it('caps long text and summarises oversized structures; timestamps pass through', () => {
    expect(String(auditValue('x'.repeat(1200))).length).toBe(1001)
    expect(auditValue({ big: 'y'.repeat(6000) })).toEqual({ truncated: true })
    const t = ts(5)
    expect(auditValue(t)).toBe(t)
    expect(auditValue(undefined)).toBeNull()
  })
})

describe('serverStamp (functions/src/lib/audit.ts)', () => {
  it('names people by lowercased email and server code as system:<function>', async () => {
    const { serverStamp } = await import('../src/lib/audit')
    expect(serverStamp('Lauren@X.ca', { source: 'admin' })).toMatchObject({ by: 'lauren@x.ca', source: 'admin', reason: null })
    expect(serverStamp('brenda@x.ca')).toMatchObject({ source: 'staff_app' })
    expect(serverStamp('onDailyRecurringRenewal')).toMatchObject({ by: 'system:onDailyRecurringRenewal', source: 'system' })
    expect(serverStamp('system:x', { reason: 'r', overrideType: 'o' })).toMatchObject({ by: 'system:x', reason: 'r', overrideType: 'o' })
  })
})
