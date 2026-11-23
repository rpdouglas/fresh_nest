import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildStaffLeadSummary } from '../src/callable/leads'
import {
  leadAssignedSubject,
  leadAssignedHtml,
  leadDigestSubject,
  leadDigestHtml,
} from '../src/leadEmailTemplates'
import { leadAssignedSms } from '../src/smsTemplates'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { planPipelineBackfill } = require('../scripts/backfill-booking-pipeline.cjs') as {
  planPipelineBackfill: (
    booking: Record<string, unknown>,
    defaultOwnerEmail: string,
    defaultOwnerRole?: string,
  ) => Record<string, unknown> | null
}

// ── In-memory Firestore mock for callable tests ──────────────────────────────

const { store, makeFakeDb } = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>()
  let autoId = 0

  function getNested(obj: Record<string, unknown>, field: string): unknown {
    return field.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
      return undefined
    }, obj)
  }

  function setNested(obj: Record<string, unknown>, field: string, value: unknown): void {
    const keys = field.split('.')
    let cur = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {}
      cur = cur[k] as Record<string, unknown>
    }
    cur[keys[keys.length - 1]] = value
  }

  function makeDocRef(path: string): any {
    return {
      id: path.split('/').pop()!,
      path,
      collection: (sub: string) => makeCollectionRef(`${path}/${sub}`),
      get: async () => ({
        id: path.split('/').pop()!,
        exists: store.has(path),
        data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined),
        ref: makeDocRef(path),
      }),
      set: async (data: Record<string, unknown>) => {
        store.set(path, structuredClone(data))
      },
      update: async (patch: Record<string, unknown>) => {
        const prev = structuredClone(store.get(path) ?? {})
        for (const [k, v] of Object.entries(patch)) {
          if (k.includes('.')) setNested(prev, k, v)
          else prev[k] = v
        }
        store.set(path, prev)
      },
    }
  }

  function makeCollectionRef(colPath: string): any {
    const filters: Array<{ field: string; value: unknown }> = []
    const queryObj: any = {
      doc: (id?: string) => makeDocRef(`${colPath}/${id ?? `auto-${++autoId}`}`),
      where: (field: string, _op: string, value: unknown) => {
        filters.push({ field, value })
        return queryObj
      },
      orderBy: () => queryObj,
      limit: () => queryObj,
      get: async () => {
        const prefix = `${colPath}/`
        const docs: any[] = []
        for (const [k, v] of store.entries()) {
          if (!k.startsWith(prefix)) continue
          const rest = k.slice(prefix.length)
          if (rest.includes('/')) continue
          const matches = filters.every((f) => getNested(v, f.field) === f.value)
          if (!matches) continue
          docs.push({
            id: rest,
            exists: true,
            data: () => structuredClone(v),
            ref: makeDocRef(k),
          })
        }
        return { empty: docs.length === 0, size: docs.length, docs }
      },
    }
    return queryObj
  }

  function makeFakeDb() {
    return {
      collection: (name: string) => makeCollectionRef(name),
      runTransaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
        const tx = {
          get: (ref: any) => ref.get(),
          set: (ref: any, data: Record<string, unknown>) => {
            void ref.set(data)
          },
          update: (ref: any, patch: Record<string, unknown>) => {
            void ref.update(patch)
          },
        }
        return fn(tx)
      },
    }
  }

  return { store, makeFakeDb }
})

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => makeFakeDb(),
  FieldValue: { serverTimestamp: () => new Date('2026-11-23T15:00:00.000Z') },
  Timestamp: {
    now: () => ({ toDate: () => new Date('2026-11-23T15:00:00.000Z'), toMillis: () => new Date('2026-11-23T15:00:00.000Z').getTime() }),
  },
}))

vi.mock('firebase-functions/v2/https', async () => {
  const actual = await vi.importActual<typeof import('firebase-functions/v2/https')>('firebase-functions/v2/https')
  return {
    ...actual,
    onCall: (handlerOrOpts: unknown, maybeHandler?: unknown) =>
      typeof handlerOrOpts === 'function' ? handlerOrOpts : maybeHandler,
  }
})

import { listMyLeads, getMyLead, updateMyLead, addMyLeadNote } from '../src/callable/leads'

describe('P3-E40 leads domain, callables, templates & backfill', () => {
  beforeEach(() => {
    store.clear()
    store.set('bookings/lead-1', {
      firstName: 'Travis',
      lastName: 'McLeod',
      email: 'travis@example.com',
      phone: '613-555-0199',
      language: 'en',
      serviceType: 'standard',
      frequency: 'biweekly',
      propertyType: '3-4bed',
      bedrooms: 3,
      bathrooms: 2,
      preferredDate: '2026-12-02',
      address: '123 Pitt St, Cornwall, ON K6J 3P5',
      notes: 'Ring bell',
      isAirbnb: false,
      status: 'pending',
      stripePaymentIntentId: 'pi_secret_should_never_leak',
      createdAt: new Date('2026-11-23T14:00:00.000Z'),
      pipeline: {
        stage: 'new',
        ownerEmail: 'brenda@freshnest.ca',
        ownerRole: 'lead',
        needsSiteVisit: false,
        nextFollowUpDate: null,
        firstContactAt: null,
        quotedPriceCents: null,
        quoteSentAt: null,
        closedAt: null,
        lostReason: null,
        lostNote: null,
      },
    })
    store.set('bookings/lead-visit', {
      firstName: 'Sophie',
      lastName: 'Tremblay',
      email: 'sophie@example.com',
      phone: '613-555-0122',
      language: 'fr',
      serviceType: 'commercial',
      frequency: 'weekly',
      propertyType: 'commercial',
      bedrooms: 0,
      bathrooms: 2,
      preferredDate: '2026-12-05',
      address: '88 rue Principale, Snye, QC J0S 1A0',
      notes: '',
      isAirbnb: false,
      status: 'pending',
      createdAt: new Date('2026-11-23T14:15:00.000Z'),
      pipeline: {
        stage: 'new',
        ownerEmail: 'brenda@freshnest.ca',
        ownerRole: 'lead',
        needsSiteVisit: true,
        nextFollowUpDate: null,
        firstContactAt: null,
        quotedPriceCents: null,
        quoteSentAt: null,
        closedAt: null,
        lostReason: null,
        lostNote: null,
      },
    })
    store.set('bookings/other-lead', {
      firstName: 'Other',
      lastName: 'Client',
      email: 'other@example.com',
      phone: '613-555-0188',
      language: 'en',
      serviceType: 'standard',
      frequency: 'one-time',
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      preferredDate: '2026-12-10',
      address: '99 Water St, Cornwall, ON',
      status: 'pending',
      createdAt: new Date('2026-11-23T14:30:00.000Z'),
      pipeline: {
        stage: 'new',
        ownerEmail: 'ryan@freshnest.ca',
        ownerRole: 'manager',
        needsSiteVisit: false,
      },
    })
  })

  it('minimizes address in buildStaffLeadSummary unless needsSiteVisit or stage === site_visit', () => {
    const standard = buildStaffLeadSummary('lead-1', store.get('bookings/lead-1')!)
    expect(standard.hasFullAddress).toBe(false)
    expect(standard.locationDisplay).toBe('Cornwall, ON K6J')
    expect(standard.locationDisplay).not.toContain('123 Pitt St')
    expect((standard as unknown as Record<string, unknown>).stripePaymentIntentId).toBeUndefined()

    const siteVisit = buildStaffLeadSummary('lead-visit', store.get('bookings/lead-visit')!)
    expect(siteVisit.hasFullAddress).toBe(true)
    expect(siteVisit.locationDisplay).toBe('88 rue Principale, Snye, QC J0S 1A0')
  })

  it('lists only leads owned by the signed-in staff member', async () => {
    const res = await (listMyLeads as any)({
      auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
      data: {},
    })
    expect(res.leads).toHaveLength(2)
    expect(res.openCount).toBe(2)
    expect(res.leads.map((l: { bookingId: string }) => l.bookingId).sort()).toEqual(['lead-1', 'lead-visit'])
  })

  it('denies non-owner access in getMyLead and updateMyLead', async () => {
    await expect(
      (getMyLead as any)({
        auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
        data: { bookingId: 'other-lead' },
      }),
    ).rejects.toThrow(/only view leads assigned to you/i)

    await expect(
      (updateMyLead as any)({
        auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
        data: { bookingId: 'other-lead', stage: 'contacted' },
      }),
    ).rejects.toThrow(/only update leads assigned to you/i)
  })

  it('blocks non-office owners from marking a lead Won and requires lostReason for Lost', async () => {
    await expect(
      (updateMyLead as any)({
        auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
        data: { bookingId: 'lead-1', stage: 'won' },
      }),
    ).rejects.toThrow(/Only an Owner or Manager can mark a lead Won/i)

    await expect(
      (updateMyLead as any)({
        auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
        data: { bookingId: 'lead-1', stage: 'lost' },
      }),
    ).rejects.toThrow(/lost reason is required/i)

    const lostRes = await (updateMyLead as any)({
      auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
      data: { bookingId: 'lead-1', stage: 'lost', lostReason: 'price', lostNote: 'Too high' },
    })
    expect(lostRes.lead.pipeline.stage).toBe('lost')
    expect(lostRes.lead.pipeline.lostReason).toBe('price')
    expect(store.get('bookings/lead-1')?.status).toBe('cancelled')
  })

  it('auto-stamps firstContactAt and moves new -> contacted when logging a call note', async () => {
    const res = await (addMyLeadNote as any)({
      auth: { uid: 'brenda-uid', token: { role: 'staff', email: 'brenda@freshnest.ca' } },
      data: { bookingId: 'lead-1', kind: 'call', body: 'Spoke with Travis, sending quote.' },
    })
    expect(res.success).toBe(true)
    const updated = store.get('bookings/lead-1') as { pipeline: Record<string, unknown>; lastChange: Record<string, unknown> }
    expect(updated.pipeline.stage).toBe('contacted')
    expect(updated.pipeline.firstContactAt).toBeTruthy()
    expect(updated.lastChange.source).toBe('staff_app')
  })

  it('renders bilingual EN/FR lead assignment & digest templates', () => {
    const emailData = {
      bookingId: 'abcdef1234',
      clientName: 'Diane Lafleur',
      clientPhone: '613-555-0142',
      clientEmail: 'diane@example.com',
      clientLanguage: 'fr' as const,
      serviceType: 'standard',
      frequency: 'biweekly',
      preferredDate: '2026-12-01',
      locationDisplay: 'Cornwall, ON',
      needsSiteVisit: false,
      assignedBy: 'lauren@freshnest.ca',
      isNewLead: false,
    }
    expect(leadAssignedSubject(emailData, 'fr')).toContain('Prospect assigné')
    expect(leadAssignedHtml(emailData, 'fr')).toContain('Objectif premier contact : 2 heures')
    expect(leadAssignedSms({ ...emailData, needsSiteVisit: true }, 'fr')).toContain('1 h (visite sur place)')
    expect(leadDigestSubject(3, 'fr')).toContain('3 prospect(s)')
    expect(
      leadDigestHtml(
        [{ bookingId: 'abcdef1234', clientName: 'Diane', serviceType: 'standard', stage: 'new', statusLabel: 'En retard', nextFollowUpDate: null, needsSiteVisit: false }],
        '2026-11-23',
        'fr',
      ),
    ).toContain('En retard')
  })

  it('plans pipeline backfill safely: skips renewals & existing pipelines, maps pending/confirmed/cancelled', () => {
    expect(planPipelineBackfill({ createdBy: 'system:recurring-renewal', status: 'pending' }, 'lauren@freshnest.ca')).toBeNull()
    expect(planPipelineBackfill({ status: 'pending', pipeline: { stage: 'contacted' } }, 'lauren@freshnest.ca')).toBeNull()

    const pending = planPipelineBackfill({ status: 'pending', serviceType: 'commercial' }, 'lauren@freshnest.ca')
    expect(pending?.stage).toBe('new')
    expect(pending?.ownerEmail).toBe('lauren@freshnest.ca')
    expect(pending?.needsSiteVisit).toBe(true)

    const confirmed = planPipelineBackfill({ status: 'confirmed', serviceType: 'standard' }, 'lauren@freshnest.ca')
    expect(confirmed?.stage).toBe('won')

    const cancelled = planPipelineBackfill({ status: 'cancelled', serviceType: 'standard' }, 'lauren@freshnest.ca')
    expect(cancelled?.stage).toBe('lost')
    expect(cancelled?.lostReason).toBe('other')
    expect(cancelled?.lostNote).toBe('legacy')
  })
})
