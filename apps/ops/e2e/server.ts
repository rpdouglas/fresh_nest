// The API the browser tests run against: the real handler from functions/, with in-memory
// stores, in front of the pretend Camelo. Nothing here reaches Camelo, Google or Firestore.
// POST /__test/reset starts every test from the same made-up world, laid out around today, or around
// the day a test names: {today: "YYYY-MM-DD"} (noon that day in Toronto), with {daysBack} days of history;
// POST /__test/lag {reads} and /__test/refuse {requests} make the pretend Camelo misbehave;
// POST /__test/staff {staff: "off"} takes cleaners' access away, as changing the switch on the live site would;
// POST /__test/signins {accepted: false} makes every sign-in be refused as if it had run out, until turned back on;
// GET /__test/log lists the requests it has had.
// Workers in parallel browser tests pass their worker index in the "x-test-worker" header;
// each worker gets its own completely isolated in-memory stores and pretend Camelo world (decision 0039).
import { createServer } from 'node:http'
import {
  MemoryCleanerTokens,
  MemoryClientRates,
  MemoryFeedback,
  MemoryInvoices,
  MemoryLiveHandledStore,
  MemoryPhotoFiles,
  MemoryVisitPhotos,
  MemoryLog,
  MemoryPlaces,
  MemorySettingsStore,
  MemorySnapshots,
  MemorySoloOk,
  ReadCache,
  cameloRetry,
  handleApi,
  torontoMidnight,
} from '../../../functions-ops/src/core.ts'
import { type Fake, fakeCamelo } from './fake-camelo.ts'

export const TEST_EDITOR = 'dev@example.com'
const port = Number(process.env.PORT ?? 8787)
// a refused request is retried at once, so a test of the rate limit does not wait
cameloRetry.delaysMs = [10, 10]

interface WorkerState {
  fake: Fake
  deps: Parameters<typeof handleApi>[1]
  staffSwitch: string
  signInsAccepted: boolean
  pinned: number | null
}

const states = new Map<string, WorkerState>()

function createWorkerState(today?: unknown, daysBack?: unknown): WorkerState {
  const pinned = typeof today === 'string' ? Date.parse(torontoMidnight(today)) + 12 * 3_600_000 : null
  const fake = fakeCamelo(pinned ?? Date.now(), typeof daysBack === 'number' ? daysBack : undefined)
  const state: WorkerState = {
    fake,
    staffSwitch: '*',
    signInsAccepted: true,
    pinned,
    deps: {
      camelToken: 'not-a-real-token',
      verifyGoogle: async (token: string) => (state.signInsAccepted && token.startsWith('dev:') ? token.slice(4) : null),
      editors: [TEST_EDITOR],
      get staff() {
        return state.staffSwitch
      },
      changeLog: new MemoryLog(),
      feedback: new MemoryFeedback(),
      invoices: new MemoryInvoices(),
      clientRates: new MemoryClientRates(),
      soloOk: new MemorySoloOk(),
      liveHandled: new MemoryLiveHandledStore(),
      visitPhotos: new MemoryVisitPhotos(),
      photoFiles: new MemoryPhotoFiles(),
      cleanerTokens: new MemoryCleanerTokens(),
      places: new MemoryPlaces(),
      settings: new MemorySettingsStore(),
      snapshots: new MemorySnapshots(),
      geocodeGapMs: 0,
      readCache: process.env.READ_CACHE === 'off' ? undefined : new ReadCache(),
      fetchImpl: (url, init) => state.fake.fetchImpl(url, init),
      ...(pinned === null ? {} : { now: () => state.pinned! }),
    },
  }
  return state
}

function getWorkerState(workerId: string): WorkerState {
  let s = states.get(workerId)
  if (!s) {
    s = createWorkerState()
    states.set(workerId, s)
  }
  return s
}

// initialize default state
getWorkerState('default')

createServer(async (req, res) => {
  let raw = ''
  for await (const chunk of req) raw += chunk
  let body: Record<string, unknown> = {}
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    // an empty body is handled by the route
  }
  const send = (status: number, payload: unknown) =>
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(payload))
  const url = req.url ?? ''
  const workerId = (req.headers['x-test-worker'] as string) || 'default'

  if (url === '/api/health') return void send(200, { ok: true })

  if (url === '/__test/reset') {
    const s = createWorkerState(body.today, body.daysBack)
    states.set(workerId, s)
    return void send(200, {
      ok: true,
      special: s.fake.world.special,
      today: s.fake.world.day0,
      waitingDays: s.fake.world.waitingDays,
      now: s.pinned,
    })
  }

  if (url === '/__test/lag') {
    const s = getWorkerState(workerId)
    s.fake.lagListFor(Number(body.reads ?? 0))
    return void send(200, { ok: true })
  }

  if (url === '/__test/refuse') {
    const s = getWorkerState(workerId)
    s.fake.refuseNext(Number(body.requests ?? 0))
    return void send(200, { ok: true })
  }

  if (url === '/__test/log') {
    const s = getWorkerState(workerId)
    return void send(200, s.fake.log)
  }

  if (url === '/__test/staff') {
    const s = getWorkerState(workerId)
    s.staffSwitch = String(body.staff ?? 'off')
    return void send(200, { ok: true })
  }

  if (url === '/__test/signins') {
    const s = getWorkerState(workerId)
    s.signInsAccepted = body.accepted !== false
    return void send(200, { ok: true })
  }

  if (!url.startsWith('/api/')) return void send(404, { error: 'Not found' })

  const s = getWorkerState(workerId)
  const result = await handleApi(
    {
      method: req.method ?? 'GET',
      path: url,
      weekStart: body.weekStart,
      periodStart: body.periodStart,
      googleToken: req.headers['x-editor-token'] as string | undefined,
      action: body.action,
      timesheetIds: body.timesheetIds,
      timesheetId: body.timesheetId,
      from: body.from,
      to: body.to,
      employeeId: body.employeeId,
      groupId: body.groupId,
      clientId: body.clientId,
      jobSiteId: body.jobSiteId,
      content: body.content,
      payload: body,
      refresh: body.refresh,
    },
    s.deps,
  )
  send(result.status, result.body)
}).listen(port, () => console.log(`Test API with a pretend Camelo on http://localhost:${port}`))
