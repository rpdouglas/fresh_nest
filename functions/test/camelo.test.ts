import { describe, it, expect, beforeEach } from 'vitest'
import {
  runAddCameloClientNote,
  runPrepareLeadForCamelo,
  runPushLeadToCamelo,
  runUpdateCameloJobSiteNote,
} from '../src/callable/camelo'

// ── In-memory Firestore mock ─────────────────────────────────────────────────

function createMemoryDb() {
  const store = new Map<string, Record<string, unknown>>()
  let autoId = 0

  function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let cur = obj
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i]
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return
      if (!Object.prototype.hasOwnProperty.call(cur, k) || !cur[k] || typeof cur[k] !== 'object') {
        cur[k] = {}
      }
      cur = cur[k] as Record<string, unknown>
    }
    const last = parts[parts.length - 1]
    if (last === '__proto__' || last === 'constructor' || last === 'prototype') return
    cur[last] = value
  }

  function docRef(path: string): any {
    return {
      id: path.split('/').pop()!,
      path,
      collection: (sub: string) => colRef(`${path}/${sub}`),
      get: async () => ({
        id: path.split('/').pop()!,
        exists: store.has(path),
        data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined),
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

  function colRef(colPath: string): any {
    const q: any = {
      doc: (id?: string) => docRef(`${colPath}/${id ?? `auto-${++autoId}`}`),
      orderBy: () => q,
      limit: () => q,
      get: async () => {
        const prefix = `${colPath}/`
        const docs: any[] = []
        for (const [k, v] of store.entries()) {
          if (!k.startsWith(prefix)) continue
          const rest = k.slice(prefix.length)
          if (rest.includes('/')) continue
          docs.push({ id: rest, exists: true, data: () => structuredClone(v) })
        }
        return { empty: docs.length === 0, size: docs.length, docs }
      },
    }
    return q
  }

  return {
    store,
    db: { collection: (name: string) => colRef(name) } as any,
  }
}

// ── Pretend Camelo + Nominatim fetch stub ────────────────────────────────────

function createPretendServices(opts: { failCreateJobSite?: boolean; nominatimHit?: { lat: string; lon: string } | null } = {}) {
  const calls: string[] = []
  const clients: Array<{
    id: string
    name: string
    email: string | null
    phoneNumber: string | null
    clientNumber: string | null
    billingAddress: string | null
  }> = [
    {
      id: 'cam-c-existing',
      name: 'Diane Lafleur',
      email: 'diane@example.com',
      phoneNumber: '613-555-0101',
      clientNumber: null,
      billingAddress: '100 Pitt St, Cornwall, ON',
    },
  ]
  const jobSites: Array<{
    id: string
    name: string
    address: string
    note: string | null
    geoLat: number
    geoLong: number
    clientIds: string[]
    scheduleIds: string[]
  }> = []
  const comments: Array<{ id: string; commentableId: string; commentableType: string; content: string }> = []

  const fetchImpl = (async (url: string | URL, init?: { body?: string }) => {
    const parsedUrl = url instanceof URL ? url : new URL(url)
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

    if (parsedUrl.hostname === 'nominatim.openstreetmap.org') {
      calls.push('nominatim')
      if (opts.nominatimHit === null) return json([])
      return json([opts.nominatimHit ?? { lat: '45.0251', lon: '-74.7289' }])
    }

    const { query, variables } = JSON.parse(init?.body ?? '{}') as { query: string; variables: Record<string, any> }

    if (/\bclients\(first/.test(query)) {
      calls.push('clients')
      return json({
        data: { clients: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: clients } },
      })
    }
    if (/\bschedules\(first/.test(query)) {
      calls.push('schedules')
      return json({
        data: {
          schedules: {
            nodes: [
              { id: 'sch-internal', name: 'Internal' },
              { id: 'sch-clients', name: 'Clients' },
            ],
          },
        },
      })
    }
    if (/createClient\(/.test(query)) {
      calls.push('createClient')
      const c = {
        id: `cam-c-${clients.length + 1}`,
        name: variables.input.name,
        email: variables.input.email ?? null,
        phoneNumber: variables.input.phoneNumber ?? null,
        clientNumber: variables.input.clientNumber ?? null,
        billingAddress: variables.input.billingAddress ?? null,
      }
      clients.push(c)
      return json({ data: { createClient: { errors: [], result: c } } })
    }
    if (/createJobSite\(/.test(query)) {
      calls.push('createJobSite')
      if (opts.failCreateJobSite) {
        return json({
          data: {
            createJobSite: {
              errors: [{ attribute: 'address', fullMessage: 'Address invalid', type: 'invalid' }],
              result: null,
            },
          },
        })
      }
      const s = {
        id: `cam-j-${jobSites.length + 1}`,
        name: variables.input.name,
        address: variables.input.address,
        note: variables.input.note ?? null,
        geoLat: variables.input.geoLat,
        geoLong: variables.input.geoLong,
        clientIds: variables.input.clientIds,
        scheduleIds: variables.input.scheduleIds,
      }
      jobSites.push(s)
      return json({
        data: {
          createJobSite: {
            errors: [],
            result: {
              ...s,
              clients: s.clientIds.map((id) => ({ id })),
              schedules: s.scheduleIds.map((id) => ({ id, name: id === 'sch-clients' ? 'Clients' : 'Internal' })),
            },
          },
        },
      })
    }
    if (/updateJobSite\(/.test(query)) {
      calls.push('updateJobSite')
      const hit = jobSites.find((s) => s.id === variables.input.jobSiteId)
      if (!hit) {
        return json({
          data: { updateJobSite: { errors: [{ attribute: 'jobSiteId', fullMessage: 'Not found', type: 'not_found' }], result: null } },
        })
      }
      hit.note = variables.input.note
      return json({ data: { updateJobSite: { errors: [], result: { id: hit.id, note: hit.note } } } })
    }
    if (/createComment\(/.test(query)) {
      calls.push('createComment')
      const cm = {
        id: `cam-cm-${comments.length + 1}`,
        commentableId: variables.input.commentableId,
        commentableType: variables.input.commentableType,
        content: variables.input.content,
      }
      comments.push(cm)
      return json({ data: { createComment: { errors: [], result: { id: cm.id } } } })
    }
    return json({ data: {} })
  }) as unknown as typeof fetch

  return { fetchImpl, calls, clients, jobSites, comments }
}

describe('P3-E42 Won Lead -> Camelo callables', () => {
  let mem: ReturnType<typeof createMemoryDb>

  beforeEach(() => {
    mem = createMemoryDb()
    mem.store.set('bookings/won-1', {
      firstName: 'Travis',
      lastName: 'McLeod',
      email: 'travis@example.com',
      phone: '613-555-0199',
      language: 'en',
      propertyType: '3-4bed',
      bedrooms: 3,
      bathrooms: 2,
      serviceType: 'standard',
      frequency: 'biweekly',
      preferredDate: '2026-12-02',
      pets: true,
      isAirbnb: false,
      addOns: ['oven'],
      address: '123 Pitt St, Cornwall, ON',
      notes: 'Side door lockbox 4321.',
      leadSource: 'google',
      status: 'confirmed',
      pipeline: { stage: 'won', quotedPriceCents: 18500 },
    })
    mem.store.set('bookings/won-1/leadNotes/n-1', {
      kind: 'call',
      body: 'Confirmed biweekly Tuesdays',
      by: 'lauren@freshnest.ca',
      at: new Date('2026-11-24T15:00:00Z'),
    })
    mem.store.set('bookings/open-1', {
      firstName: 'Open',
      lastName: 'Lead',
      email: 'open@example.com',
      phone: '613-555-0188',
      address: '50 Second St, Cornwall, ON',
      status: 'pending',
      pipeline: { stage: 'quoted' },
    })
  })

  it('rejects non-won leads in prepareLeadForCamelo', async () => {
    const pretend = createPretendServices()
    await expect(
      runPrepareLeadForCamelo(
        { bookingId: 'open-1' },
        { db: mem.db, databaseId: '(default)', actorEmail: 'lauren@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
      ),
    ).rejects.toThrow(/Only Won leads/)
  })

  it('prepares a Won lead with geocoded coords, Clients default schedule, and matched existing client', async () => {
    mem.store.set('bookings/won-returning', {
      firstName: 'Diane',
      lastName: 'Lafleur',
      email: 'diane@example.com',
      phone: '613-555-0101',
      language: 'fr',
      propertyType: '3-4bed',
      bedrooms: 3,
      bathrooms: 1,
      serviceType: 'deep',
      frequency: 'monthly',
      preferredDate: '2026-12-10',
      pets: true,
      isAirbnb: false,
      address: '200 Riverdale Ave, Cornwall, ON',
      notes: 'Chat amical.',
      leadSource: 'referral',
      status: 'confirmed',
      pipeline: { stage: 'won', quotedPriceCents: 24000 },
    })

    const pretend = createPretendServices()
    const res = await runPrepareLeadForCamelo(
      { bookingId: 'won-returning' },
      { db: mem.db, databaseId: '(default)', actorEmail: 'ryan@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
    )

    expect(res.alreadySynced).toBe(false)
    expect(res.isDevDryRun).toBe(false)
    expect(res.defaultScheduleId).toBe('sch-clients')
    expect(res.matches).toHaveLength(1)
    expect(res.matches[0].client.id).toBe('cam-c-existing')
    expect(res.matches[0].reasons).toEqual(['email', 'phone', 'name'])
    expect(res.geocode).toEqual({ found: true, lat: 45.0251, lon: -74.7289, source: 'nominatim' })
    expect(res.defaults.jobSiteNote).toContain('Chat amical.')
    expect(res.defaults.clientComment).toContain('$240.00 CAD')
  })

  it('handles rural geocoding misses cleanly without blocking prepareLeadForCamelo (P4/P5)', async () => {
    const pretend = createPretendServices({ nominatimHit: null })
    const res = await runPrepareLeadForCamelo(
      { bookingId: 'won-1', addressOverride: 'Island Rd, Snye, QC' },
      { db: mem.db, databaseId: '(default)', actorEmail: 'lauren@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
    )
    expect(res.geocode).toEqual({ found: false, lat: null, lon: null, source: null })
    expect(res.defaults.jobSiteAddress).toBe('Island Rd, Snye, QC')
  })

  it('pushes new Client + Job Site + CLIENT comment, persists booking.camelo with audit stamp, and blocks duplicate push', async () => {
    const pretend = createPretendServices()
    const deps = {
      db: mem.db,
      databaseId: '(default)' as const,
      actorEmail: 'lauren@freshnest.ca',
      cameloToken: 'tok',
      fetchImpl: pretend.fetchImpl,
    }

    const pushed = await runPushLeadToCamelo(
      {
        bookingId: 'won-1',
        clientName: 'Travis McLeod',
        email: 'travis@example.com',
        phoneNumber: '613-555-0199',
        billingAddress: '123 Pitt St, Cornwall, ON',
        jobSiteName: 'Travis McLeod — 123 Pitt St',
        jobSiteAddress: '123 Pitt St, Cornwall, ON',
        jobSiteNote: 'Side door lockbox 4321.',
        scheduleId: 'sch-clients',
        geoLat: 45.0251,
        geoLong: -74.7289,
        geoSource: 'nominatim',
        clientComment: 'Won biweekly standard clean.',
      },
      deps,
    )

    expect(pushed.dryRun).toBe(false)
    expect(pushed.clientCreated).toBe(true)
    expect(pushed.clientId).toBe('cam-c-2')
    expect(pushed.jobSiteId).toBe('cam-j-1')
    expect(pushed.initialCommentId).toBe('cam-cm-1')
    expect(pretend.jobSites[0].clientIds).toEqual(['cam-c-2'])
    expect(pretend.jobSites[0].scheduleIds).toEqual(['sch-clients'])
    expect(pretend.comments[0].commentableType).toBe('CLIENT')
    expect(pretend.comments[0].content).toContain('(lauren@freshnest.ca, via Fresh Nest)')

    const saved = mem.store.get('bookings/won-1') as Record<string, any>
    expect(saved.camelo.clientId).toBe('cam-c-2')
    expect(saved.camelo.jobSiteId).toBe('cam-j-1')
    expect(saved.lastChange.by).toBe('lauren@freshnest.ca')
    expect(saved.lastChange.source).toBe('admin')

    // Second push blocked (idempotency)
    await expect(
      runPushLeadToCamelo(
        {
          bookingId: 'won-1',
          clientName: 'Travis McLeod',
          jobSiteName: 'Travis McLeod — 123 Pitt St',
          jobSiteAddress: '123 Pitt St, Cornwall, ON',
          scheduleId: 'sch-clients',
          geoLat: 45.0251,
          geoLong: -74.7289,
          geoSource: 'nominatim',
        },
        deps,
      ),
    ).rejects.toThrow(/already synced/i)

    // Post-sync actions: addCameloClientNote & updateCameloJobSiteNote
    const noteRes = await runAddCameloClientNote({ bookingId: 'won-1', content: 'Client asked for eco spray.' }, deps)
    expect(noteRes.commentId).toBe('cam-cm-2')
    expect(pretend.comments[1].content).toContain('Client asked for eco spray.')

    const siteRes = await runUpdateCameloJobSiteNote({ bookingId: 'won-1', note: 'New lockbox 9999.' }, deps)
    expect(siteRes.note).toBe('New lockbox 9999.')
    expect((mem.store.get('bookings/won-1') as Record<string, any>).camelo.jobSiteNote).toBe('New lockbox 9999.')
  })

  it('links to an existing Camelo client without calling createClient', async () => {
    const pretend = createPretendServices()
    const pushed = await runPushLeadToCamelo(
      {
        bookingId: 'won-1',
        existingClientId: 'cam-c-existing',
        clientName: 'Diane Lafleur',
        jobSiteName: 'Diane Lafleur — Cottage',
        jobSiteAddress: '99 River Rd, Cornwall, ON',
        jobSiteNote: 'Key under mat',
        scheduleId: 'sch-clients',
        geoLat: 45.02,
        geoLong: -74.73,
        geoSource: 'fallback',
      },
      { db: mem.db, databaseId: '(default)', actorEmail: 'ryan@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
    )

    expect(pushed.clientCreated).toBe(false)
    expect(pushed.clientId).toBe('cam-c-existing')
    expect(pretend.calls).not.toContain('createClient')
    expect(pretend.calls).toContain('createJobSite')
    expect(pretend.jobSites[0].clientIds).toEqual(['cam-c-existing'])
  })

  it('returns partialClientId in error details if createClient succeeds but createJobSite fails', async () => {
    const pretend = createPretendServices({ failCreateJobSite: true })
    try {
      await runPushLeadToCamelo(
        {
          bookingId: 'won-1',
          clientName: 'Travis McLeod',
          jobSiteName: 'Travis — Home',
          jobSiteAddress: '123 Pitt St, Cornwall, ON',
          scheduleId: 'sch-clients',
          geoLat: 45.02,
          geoLong: -74.73,
          geoSource: 'manual',
        },
        { db: mem.db, databaseId: '(default)', actorEmail: 'lauren@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
      )
      expect.fail('Expected createJobSite failure')
    } catch (err: any) {
      expect(err.details).toEqual({ partialClientId: 'cam-c-2', partialClientName: 'Travis McLeod' })
    }
  })

  it('blocks live Camelo writes when databaseId is freshnest-dev (dry-run mode)', async () => {
    const pretend = createPretendServices()
    const res = await runPushLeadToCamelo(
      {
        bookingId: 'won-1',
        clientName: 'Travis McLeod',
        jobSiteName: 'Travis — Home',
        jobSiteAddress: '123 Pitt St, Cornwall, ON',
        scheduleId: 'sch-clients',
        geoLat: 45.02,
        geoLong: -74.73,
        geoSource: 'fallback',
        clientComment: 'Staging test',
      },
      { db: mem.db, databaseId: 'freshnest-dev', actorEmail: 'lauren@freshnest.ca', cameloToken: 'tok', fetchImpl: pretend.fetchImpl },
    )

    expect(res.dryRun).toBe(true)
    expect(pretend.calls).toEqual([])
    expect((mem.store.get('bookings/won-1') as Record<string, any>).camelo).toBeUndefined()
  })
})
