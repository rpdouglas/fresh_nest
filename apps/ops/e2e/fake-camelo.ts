// A pretend Camelo for the browser tests: made-up cleaners, clients and addresses, a
// schedule laid out around today, and the GraphQL answers the real API handler asks for.
// It can also misbehave the way Camelo does: its list of timesheets can lag behind a
// change, and it can refuse requests (HTTP 429) for a while.
// Every name and address here is invented. Never put a real one in this file.
import { addDays, torontoMidnight } from '../../../functions-ops/src/core.ts'

const TZ = 'America/Toronto'
// each has a made-up address at example.com, which is how the site knows which cleaner has signed in
const person = (name: string) => ({
  id: `u-${name.split(' ')[0].toLowerCase()}`,
  name,
  phoneNumber: null,
  email: `${name.split(' ')[0].toLowerCase()}@example.com`,
})
export const PEOPLE = {
  avery: person('Avery Stone'),
  blake: person('Blake Rivers'),
  casey: person('Casey Lane'),
  devon: person('Devon Marsh'),
  emery: person('Emery Hart'),
  finley: person('Finley Cole'),
}
const place = (name: string, address: string, lat: number, lon: number, note: string | null = null) => ({
  client: { id: `c-${name.split(' ')[0].toLowerCase()}`, name, clientNumber: null, phoneNumber: null, email: null },
  jobSite: { id: `j-${name.split(' ')[0].toLowerCase()}`, name, address, note },
  point: { lat, lon },
})
export const PLACES = {
  maple: place('Maple Court', '12 Maple Court, Exampleton, ON', 45.02, -74.73, 'Lockbox 4321 on side porch. Dog in crate.'),
  birch: place('Birch House', '48 Birch Street, Exampleton, ON', 45.025, -74.725),
  cedar: place('Cedar Lodge', '7 Cedar Lane, Exampleton, ON', 45.015, -74.735),
  elm: place('Elm Street Flat', '301 Elm Street, Exampleton, ON', 45.02, -74.74),
  oak: place('Oak Villa', '9 Oak Avenue, Exampleton, ON', 45.03, -74.72),
  pine: place('Pine Cottage', '5 Pine Road, Exampleton, ON', 45.01, -74.71),
  // far from the rest, so the drive to it does not fit a short gap
  willow: place('Willow Farm', '880 Willow Line, Farfield, ON', 45.3, -74.3),
}
const CLEANING = { id: 'g-cleaning', name: 'Cleaning' }
const ON_CALL = { id: 'g-oncall', name: 'On Call' }

type Person = ReturnType<typeof person>
type Place = ReturnType<typeof place>
export interface FakeShift {
  id: string
  startTime: string
  endTime: string
  assignee: Person | null
  group: typeof CLEANING | null
  client: Place['client'] | null
  jobSite: Place['jobSite'] | null
  shiftPartners: { id: string; assignee: Person | null }[]
  [k: string]: unknown
}
export interface FakeSheet {
  id: string
  state: string
  from: string
  to: string | null
  totalDuration: number | null
  approvedAt: string | null
  employee: Person
  [k: string]: unknown
}

const today = (now: number) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(now))
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay()
const at = (date: string, hm: string) => `${date}T${hm}:00${torontoMidnight(date).slice(-6)}`
const minutes = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 60_000)

/** The first weekday on or after `date`. */
const weekdayFrom = (date: string) => {
  let d = date
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1)
  return d
}

/** The made-up schedule laid out around `now`: `daysBack` days before it (24 unless a test asks for more) and 10 after. */
export function makeWorld(now: number, daysBack = 24) {
  const shifts = new Map<string, FakeShift>()
  const sheets = new Map<string, FakeSheet>()
  const day0 = today(now)
  // the day the schedule's problems are planted on: tomorrow, or the Monday after a weekend
  const special = weekdayFrom(addDays(day0, 1))

  const visit = (
    date: string,
    slot: string,
    start: string,
    end: string,
    where: Place | null,
    team: (Person | null)[],
    group: typeof CLEANING | null = CLEANING,
    checklistAssignments: FakeShift['checklistAssignments'] = [],
  ) => {
    const ids = team.map((p, i) => `s-${date}-${slot}-${p ? p.id.slice(2) : `open${i}`}`)
    team.forEach((p, i) => {
      shifts.set(ids[i], {
        id: ids[i],
        title: null,
        state: 'PUBLISHED',
        startTime: at(date, start),
        endTime: at(date, end),
        timezone: TZ,
        breakDuration: 0,
        note: null,
        systemNote: null,
        client: where?.client ?? null,
        assignee: p,
        jobSite: where?.jobSite ?? null,
        schedule: { id: 'sch-1', name: 'Exampleton' },
        group,
        shiftPartners: ids.filter((_, j) => j !== i).map((id, j) => ({ id, assignee: team.filter((_, k) => k !== i)[j] })),
        checklistAssignments,
      })
    })
  }

  for (let offset = -daysBack; offset <= 10; offset++) {
    const date = addDays(day0, offset)
    // someone is on call every day; nobody clocks in for it
    visit(date, 'oncall', '00:00', '23:59', null, [PEOPLE.emery], ON_CALL)
    if (weekday(date) === 0 || weekday(date) === 6) continue
    visit(date, 'a1', '08:00', '10:00', PLACES.maple, [PEOPLE.avery, PEOPLE.blake])
    visit(date, 'a2', '10:30', '12:30', PLACES.birch, [PEOPLE.avery, PEOPLE.blake], CLEANING, [
      { completionPercentage: 100, checklist: { name: 'Turnover Checklist' } },
    ])
    visit(date, 'b1', '08:00', '10:30', PLACES.cedar, [PEOPLE.casey, PEOPLE.devon])
    visit(date, 'b2', '11:00', '13:00', PLACES.elm, [PEOPLE.casey, PEOPLE.devon], CLEANING, [
      { completionPercentage: 40, checklist: { name: 'Turnover Checklist' } },
    ])
  }
  // planted problems for the schedule check
  visit(special, 'solo', '09:00', '11:00', PLACES.oak, [PEOPLE.finley])
  visit(special, 'open', '14:00', '15:00', PLACES.pine, [null])
  visit(special, 'far', '13:10', '14:10', PLACES.willow, [PEOPLE.casey, PEOPLE.devon])
  // not a problem: an evening visit makes Avery and Blake's day 13 hours from first start
  // to last finish, but only 5.5 hours of work. Time between visits is not worked.
  visit(special, 'eve', '19:30', '21:00', PLACES.oak, [PEOPLE.avery, PEOPLE.blake])

  // timesheets for visits that have finished
  const finished = [...shifts.values()]
    .filter((s) => s.group === CLEANING && s.assignee && Date.parse(s.endTime) < now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const lastTwoDays = [...new Set(finished.map((s) => s.startTime.slice(0, 10)))].slice(-2)
  for (const s of finished) {
    const date = s.startTime.slice(0, 10)
    const who = s.assignee!
    // Devon never logs the second visit on a Wednesday: a visit with no timesheet
    if (who === PEOPLE.devon && weekday(date) === 3 && s.id.includes('-b2-')) continue
    // Blake clocks in 12 minutes late to the first visit on a Tuesday
    const late = who === PEOPLE.blake && weekday(date) === 2 && s.id.includes('-a1-') ? 12 : 0
    const from = new Date(Date.parse(s.startTime) + late * 60_000).toISOString()
    const waiting = lastTwoDays.includes(date) && (who === PEOPLE.casey || who === PEOPLE.devon)
    const id = `t-${s.id.slice(2)}`
    sheets.set(id, {
      id,
      state: waiting ? 'SUBMITTED' : 'APPROVED',
      from,
      to: s.endTime,
      totalDuration: minutes(from, s.endTime),
      timezone: TZ,
      approvedAt: waiting ? null : new Date(Date.parse(s.endTime) + 3_600_000).toISOString(),
      employee: who,
      group: CLEANING,
      client: s.client,
      jobSite: s.jobSite,
      comments: 0,
      referenceObject: { __typename: 'TimeCard', shiftId: s.id, note: null },
    })
  }

  // Live board scenarios planted on day0:
  if (weekday(day0) !== 0 && weekday(day0) !== 6) {
    const INSPECTION = { id: 'g-inspection', name: 'Inspection' }
    // 1. Finley on day0: visit 1 running over (ended at 11:40, still open at 12:00 -> Yellow running over)
    //    and visit 2 at risk (starts 12:15, expected arrival 12:35 from Willow Farm drive -> Yellow at risk)
    visit(day0, 'f1', '09:00', '11:40', PLACES.willow, [PEOPLE.finley], INSPECTION)
    visit(day0, 'f2', '12:15', '14:00', PLACES.oak, [PEOPLE.finley], INSPECTION)

    const finleyF1 = shifts.get(`s-${day0}-f1-finley`)
    if (finleyF1) {
      const id = `t-${finleyF1.id.slice(2)}`
      sheets.set(id, {
        id,
        state: 'APPROVED',
        from: at(day0, '09:00'),
        to: null,
        totalDuration: null,
        timezone: TZ,
        approvedAt: null,
        employee: PEOPLE.finley,
        group: INSPECTION,
        client: finleyF1.client,
        jobSite: finleyF1.jobSite,
        comments: 0,
        referenceObject: { __typename: 'TimeCard', shiftId: finleyF1.id, note: null },
      })
    }

    // 2. Avery on a2 (10:30-12:30, Birch House): on-site (open timesheet clocked in at 10:32)
    const averyA2 = shifts.get(`s-${day0}-a2-avery`)
    if (averyA2) {
      const id = `t-${averyA2.id.slice(2)}`
      sheets.set(id, {
        id,
        state: 'APPROVED',
        from: at(day0, '10:32'),
        to: null,
        totalDuration: null,
        timezone: TZ,
        approvedAt: null,
        employee: PEOPLE.avery,
        group: CLEANING,
        client: averyA2.client,
        jobSite: averyA2.jobSite,
        comments: 0,
        referenceObject: { __typename: 'TimeCard', shiftId: averyA2.id, note: null },
      })
    }

    // 3. Blake on a2 (10:30-12:30, Birch House): NO timesheet -> late > 30 min at noon -> RED!

    // 4. Casey and Devon on b2 (11:00-13:00, Elm Street Flat): on-site (open timesheet clocked in at 11:00)
    for (const p of [PEOPLE.casey, PEOPLE.devon]) {
      const b2Shift = shifts.get(`s-${day0}-b2-${p.id.slice(2)}`)
      if (b2Shift) {
        const id = `t-${b2Shift.id.slice(2)}`
        sheets.set(id, {
          id,
          state: 'SUBMITTED',
          from: at(day0, '11:00'),
          to: null,
          totalDuration: null,
          timezone: TZ,
          approvedAt: null,
          employee: p,
          group: CLEANING,
          client: b2Shift.client,
          jobSite: b2Shift.jobSite,
          comments: 0,
          referenceObject: { __typename: 'TimeCard', shiftId: b2Shift.id, note: null },
        })
      }
    }

    // Today's cleaning visits have a ready TimeCard so a connected cleaner can clock in and out (decision 0044).
    for (const s of shifts.values()) {
      if (s.group === CLEANING && s.assignee && s.startTime.slice(0, 10) === day0) {
        s.timeCard = { id: `tc-${s.id.slice(2)}`, state: 'READY', punches: [] }
      }
    }
  }

  return { shifts, sheets, special, day0, waitingDays: lastTwoDays }
}

export interface Fake {
  fetchImpl: typeof fetch
  world: ReturnType<typeof makeWorld>
  /** The list of timesheets answers with what it held before the last change, for this many reads. */
  lagListFor(reads: number): void
  /** The next `requests` requests are refused with HTTP 429. */
  refuseNext(requests: number): void
  /** Every request made, newest last: "shifts", "timesheets", "approveTimesheets", "nominatim" and so on. */
  log: string[]
}

export function fakeCamelo(now = Date.now(), daysBack?: number): Fake {
  const world = makeWorld(now, daysBack)
  const log: string[] = []
  const notes: {
    id: string
    commentableId: string
    commentableType: string
    content: string
    createdAt: string
    systemGenerated: boolean
    author: { name: string }
  }[] = []
  const extraClients: {
    id: string
    name: string
    clientNumber: string | null
    phoneNumber: string | null
    email: string | null
    billingAddress: string | null
  }[] = []
  const extraSites: {
    id: string
    name: string
    address: string
    note: string | null
    geoLat: number
    geoLong: number
    clients: { id: string }[]
    schedules: { id: string; name: string }[]
  }[] = []
  const SCHEDULES = [
    { id: 'sch-clients', name: 'Clients' },
    { id: 'sch-1', name: 'Exampleton' },
    { id: 'sch-oncall', name: 'On Call' },
  ]
  let listView = new Map([...world.sheets].map(([k, v]) => [k, { ...v }]))
  let lagReads = 0
  let lagOnNextChange = 0
  let refusals = 0
  const sessions = new Map<string, Person>()
  const page = (nodes: unknown[]) => ({ pageInfo: { hasNextPage: false, endCursor: null }, nodes })
  const within = (iso: string, f: { fromTime: string; toTime: string }) =>
    Date.parse(iso) >= Date.parse(f.fromTime) && Date.parse(iso) <= Date.parse(f.toTime)
  const changed = () => {
    lagReads = lagOnNextChange
    lagOnNextChange = 0
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  const fetchImpl = (async (url: string | URL, init?: { body?: string; headers?: Record<string, string> }) => {
    const href = String(url)
    if (href.includes('nominatim')) {
      log.push('nominatim')
      const q = (new URL(href).searchParams.get('q') ?? '').toLowerCase()
      const hit = Object.values(PLACES).find((p) => p.jobSite.address.toLowerCase() === q)
      return json(hit ? [{ lat: String(hit.point.lat), lon: String(hit.point.lon) }] : [])
    }
    if (href.startsWith('https://s3.example.com/')) {
      log.push('s3Upload')
      return new Response('', { status: 200 })
    }
    if (refusals > 0) {
      refusals--
      log.push('429')
      return json({ error: 'rate limited' }, 429)
    }
    const { query, variables } = JSON.parse(init?.body ?? '{}') as { query: string; variables: Record<string, any> }
    const answer = (name: string, data: unknown) => (log.push(name), json({ data }))

    if (/requestLoginSession/.test(query)) {
      const email = String(variables.input?.authenticationValue ?? variables.input?.email ?? '').toLowerCase()
      const who = Object.values(PEOPLE).find((p) => p.email.toLowerCase() === email)
      if (!who) {
        return answer('requestLoginSession', {
          requestLoginSession: {
            errors: [{ attribute: 'email', fullMessage: 'No Camelo account for that email', type: 'not_found' }],
            result: null,
          },
        })
      }
      const sessionToken = `sess-${who.id}`
      sessions.set(sessionToken, who)
      return answer('requestLoginSession', {
        requestLoginSession: {
          errors: [],
          result: { id: sessionToken, sessionToken, expiresAt: new Date(now + 10 * 60_000).toISOString() },
        },
      })
    }
    if (/verifyOtp/.test(query)) {
      const sid = String(variables.input?.loginSessionId ?? variables.input?.sessionToken ?? '')
      const otp = String(variables.input?.otpCode ?? variables.input?.otp ?? '')
      const who = sessions.get(sid)
      if (!who || otp !== '123456') {
        return answer('verifyOtp', {
          verifyOtp: {
            errors: [{ attribute: 'otp', fullMessage: 'Invalid or expired code', type: 'invalid' }],
            result: null,
          },
        })
      }
      const tok = `camelo-tok-${who.id}`
      const exp = new Date(now + 30 * 86_400_000).toISOString()
      return answer('verifyOtp', {
        verifyOtp: {
          errors: [],
          result: {
            jwtToken: tok,
            accessToken: tok,
            expiredAt: exp,
            expiresAt: exp,
            whoami: { id: who.id, email: who.email },
          },
        },
      })
    }
    if (/generateUploadUrl/.test(query)) {
      const key = `uploads/photo-${log.length + 1}.jpg`
      return answer('generateUploadUrl', {
        generateUploadUrl: {
          errors: [],
          result: {
            acl: 'private',
            key,
            policy: 'fake-policy',
            uri: 'https://s3.example.com/upload',
            xAmzAlgorithm: 'AWS4-HMAC-SHA256',
            xAmzCredential: 'fake-cred',
            xAmzDate: '20261017T000000Z',
            xAmzSignature: 'fake-sig',
          },
        },
      })
    }
    if (/syncTimeCardPunches/.test(query)) {
      const incoming = (variables.input?.punches ?? []) as {
        timeCardId: string
        punchType: string
        atTime: string
        attachment?: { geoLat?: number; geoLong?: number; photoToken?: string | null }
      }[]
      const tcId = incoming[0]?.timeCardId
      const shift = [...world.shifts.values()].find((s) => (s.timeCard as { id?: string } | undefined)?.id === tcId)
      if (!shift || !shift.assignee) {
        return answer('syncTimeCardPunches', {
          syncTimeCardPunches: {
            errors: [{ attribute: 'timeCardId', fullMessage: 'TimeCard not found', type: 'not_found' }],
            result: null,
          },
        })
      }
      const auth = init?.headers?.Authorization ?? ''
      if (auth !== `Bearer camelo-tok-${shift.assignee.id}`) {
        return answer('syncTimeCardPunches', {
          syncTimeCardPunches: {
            errors: [{ attribute: 'base', fullMessage: 'Not authorized for this TimeCard', type: 'forbidden' }],
            result: null,
          },
        })
      }
      const prevPunches =
        (shift.timeCard as { punches?: { punchType: string; atTime: string; attachment: { photo: string | null } | null }[] })?.punches ??
        []
      const punches = incoming.map((p, idx) => {
        const existing = prevPunches.find((old) => old.punchType === p.punchType && Date.parse(old.atTime) === Date.parse(p.atTime))
        return {
          id: `tp-${tcId}-${idx + 1}`,
          punchType: p.punchType,
          atTime: p.atTime,
          attachment: existing?.attachment ?? null,
        }
      })
      const finished = punches.some((p) => p.punchType === 'FINISH' || p.punchType === 'CLOCK_OUT')
      const working = punches.some((p) => p.punchType === 'CLOCK_IN')
      const state = finished ? 'FINISHED' : working ? 'WORKING' : 'READY'
      shift.timeCard = { id: tcId, state, punches }

      const inP = punches.find((p) => p.punchType === 'CLOCK_IN')
      const outP = punches.find((p) => p.punchType === 'CLOCK_OUT')
      if (inP && outP) {
        const sheetId = `t-${shift.id.slice(2)}`
        world.sheets.set(sheetId, {
          id: sheetId,
          state: 'SUBMITTED',
          from: inP.atTime,
          to: outP.atTime,
          totalDuration: Math.max(60, minutes(inP.atTime, outP.atTime)),
          timezone: TZ,
          approvedAt: null,
          employee: shift.assignee,
          group: CLEANING,
          client: shift.client,
          jobSite: shift.jobSite,
          comments: 0,
          referenceObject: { __typename: 'TimeCard', shiftId: shift.id, note: null },
        })
        changed()
      }
      return answer('syncTimeCardPunches', { syncTimeCardPunches: { errors: [], result: punches } })
    }
    if (/syncTimeCardPunchAttachment/.test(query)) {
      const { timeCardId, atTime, photoKey } = variables.input ?? {}
      const shift = [...world.shifts.values()].find((s) => (s.timeCard as { id?: string } | undefined)?.id === timeCardId)
      const tc = shift?.timeCard as {
        id: string
        state: string
        punches: { id?: string; punchType: string; atTime: string; attachment: { photo: string | null } | null }[]
      } | null
      const punch = tc?.punches.find((p) => Date.parse(p.atTime) === Date.parse(String(atTime)))
      if (!punch) {
        return answer('syncTimeCardPunchAttachment', {
          syncTimeCardPunchAttachment: {
            errors: [{ attribute: 'atTime', fullMessage: 'Punch not found', type: 'not_found' }],
            result: null,
          },
        })
      }
      const photoUrl = `https://s3.example.com/${photoKey}`
      punch.attachment = { photo: photoUrl }
      return answer('syncTimeCardPunchAttachment', {
        syncTimeCardPunchAttachment: {
          errors: [],
          result: { id: punch.id ?? punch.punchType, photo: photoUrl },
        },
      })
    }
    if (/approveTimesheets/.test(query)) {
      const result = (variables.input.timesheetIds as string[]).map((id) =>
        Object.assign(world.sheets.get(id)!, { state: 'APPROVED', approvedAt: new Date().toISOString() }),
      )
      changed()
      return answer('approveTimesheets', { approveTimesheets: { errors: [], result } })
    }
    if (/rejectTimesheet/.test(query)) {
      const result = Object.assign(world.sheets.get(variables.input.timesheetId)!, { state: 'REJECTED' })
      changed()
      return answer('rejectTimesheet', { rejectTimesheet: { errors: [], result } })
    }
    if (/updateTimesheet/.test(query)) {
      const { timesheetId, from, to } = variables.input
      const result = Object.assign(world.sheets.get(timesheetId)!, { from, to, totalDuration: minutes(from, to) })
      changed()
      return answer('updateTimesheet', { updateTimesheet: { errors: [], result } })
    }
    if (/draftTimesheet/.test(query)) {
      const { employeeId, from, to, clientId, jobSiteId } = variables.input
      const employee = Object.values(PEOPLE).find((p) => p.id === employeeId)!
      const places = Object.values(PLACES)
      const result: FakeSheet = {
        id: `t-new-${world.sheets.size}`,
        state: 'DRAFT',
        from,
        to,
        totalDuration: minutes(from, to),
        timezone: TZ,
        approvedAt: null,
        employee,
        group: CLEANING,
        client: places.find((p) => p.client.id === clientId)?.client ?? null,
        jobSite: places.find((p) => p.jobSite.id === jobSiteId)?.jobSite ?? null,
        comments: 0,
        referenceObject: null,
      }
      world.sheets.set(result.id, result)
      changed()
      return answer('draftTimesheet', { draftTimesheet: { errors: [], result } })
    }
    if (/createClient\(/.test(query)) {
      const inp = variables.input ?? {}
      const client = {
        id: `c-new-${extraClients.length + 1}`,
        name: String(inp.name ?? ''),
        clientNumber: inp.clientNumber ?? null,
        phoneNumber: inp.phoneNumber ?? null,
        email: inp.email ?? null,
        billingAddress: inp.billingAddress ?? null,
      }
      extraClients.push(client)
      return answer('createClient', { createClient: { errors: [], result: client } })
    }
    if (/updateClient\(/.test(query)) {
      const inp = variables.input ?? {}
      const hit = extraClients.find((c) => c.id === inp.clientId)
      if (!hit) {
        return answer('updateClient', {
          updateClient: { errors: [{ attribute: 'clientId', fullMessage: 'Client not found', type: 'not_found' }], result: null },
        })
      }
      if (inp.name !== undefined) hit.name = String(inp.name)
      if (inp.email !== undefined) hit.email = inp.email
      if (inp.phoneNumber !== undefined) hit.phoneNumber = inp.phoneNumber
      if (inp.billingAddress !== undefined) hit.billingAddress = inp.billingAddress
      if (inp.clientNumber !== undefined) hit.clientNumber = inp.clientNumber
      return answer('updateClient', { updateClient: { errors: [], result: hit } })
    }
    if (/destroyClient\(/.test(query)) {
      const idx = extraClients.findIndex((c) => c.id === variables.input?.clientId)
      if (idx >= 0) extraClients.splice(idx, 1)
      return answer('destroyClient', { destroyClient: { errors: [] } })
    }
    if (/createJobSite\(/.test(query)) {
      const inp = variables.input ?? {}
      const site = {
        id: `j-new-${extraSites.length + 1}`,
        name: String(inp.name ?? ''),
        address: String(inp.address ?? ''),
        note: inp.note ?? null,
        geoLat: Number(inp.geoLat ?? 0),
        geoLong: Number(inp.geoLong ?? 0),
        clients: ((inp.clientIds as string[] | undefined) ?? []).map((id) => ({ id })),
        schedules: ((inp.scheduleIds as string[] | undefined) ?? []).map(
          (id) => SCHEDULES.find((s) => s.id === id) ?? { id, name: 'Clients' },
        ),
      }
      extraSites.push(site)
      return answer('createJobSite', { createJobSite: { errors: [], result: site } })
    }
    if (/updateJobSite\(/.test(query)) {
      const inp = variables.input ?? {}
      const hit =
        extraSites.find((s) => s.id === inp.jobSiteId) ??
        Object.values(PLACES).find((p) => p.jobSite.id === inp.jobSiteId)?.jobSite
      if (!hit) {
        return answer('updateJobSite', {
          updateJobSite: { errors: [{ attribute: 'jobSiteId', fullMessage: 'Job site not found', type: 'not_found' }], result: null },
        })
      }
      if (inp.note !== undefined) hit.note = inp.note
      if (inp.name !== undefined) hit.name = String(inp.name)
      if (inp.address !== undefined) hit.address = String(inp.address)
      return answer('updateJobSite', { updateJobSite: { errors: [], result: hit } })
    }
    if (/destroyJobSite\(/.test(query)) {
      const idx = extraSites.findIndex((s) => s.id === variables.input?.jobSiteId)
      if (idx >= 0) extraSites.splice(idx, 1)
      return answer('destroyJobSite', { destroyJobSite: { errors: [] } })
    }
    if (/createComment/.test(query)) {
      // kept, and counted on the timesheet, as Camelo does: the page only asks for the notes of a timesheet that has some
      const { commentableId, commentableType, content } = variables.input
      const note = {
        id: `cm-${notes.length + 1}`,
        commentableId,
        commentableType: String(commentableType ?? 'TIMESHEET'),
        content,
        createdAt: new Date().toISOString(),
        systemGenerated: false,
        author: { name: 'Reports account' },
      }
      notes.push(note)
      if (note.commentableType === 'TIMESHEET') {
        const sheet = world.sheets.get(commentableId)
        if (sheet) sheet.comments = Number(sheet.comments ?? 0) + 1
        changed()
      }
      return answer('createComment', { createComment: { errors: [], result: { id: note.id } } })
    }
    if (/\bcomments\(/.test(query)) {
      const typeMatch = query.match(/commentableType:\s*([A-Z_]+)/)
      const wantType = typeMatch?.[1] ?? variables.commentableType
      return answer('comments', {
        comments: {
          nodes: notes.filter((n) => n.commentableId === variables.id && (!wantType || n.commentableType === wantType)),
        },
      })
    }
    if (/\bschedules\(/.test(query)) return answer('schedules', { schedules: page(SCHEDULES) })
    if (/\busers\(/.test(query))
      return answer('users', {
        users: page(Object.values(PEOPLE).map((p) => ({ id: p.id, name: p.name, email: p.email, state: 'ACTIVE' }))),
      })
    if (/\bclients\(first/.test(query))
      return answer('clients', {
        clients: page([...Object.values(PLACES).map((p) => ({ ...p.client, billingAddress: p.jobSite.address })), ...extraClients]),
      })
    if (/\bjobSites\(first/.test(query))
      return answer('jobSites', {
        jobSites: page([
          ...Object.values(PLACES).map((p) => ({ ...p.jobSite, clients: [{ id: p.client.id }], schedules: [SCHEDULES[0]] })),
          ...extraSites,
        ]),
      })
    if (/\btimesheet\(id/.test(query)) return answer('timesheet', { timesheet: world.sheets.get(variables.id) ?? null })
    if (/\bshift\(id/.test(query)) return answer('shift', { shift: world.shifts.get(variables.id) ?? null })
    if (/\btimesheets\(/.test(query)) {
      // the list can trail a change; a read of one timesheet never does
      if (lagReads > 0) lagReads--
      else listView = new Map([...world.sheets].map(([k, v]) => [k, { ...v }]))
      // filtered by person when asked, as Camelo does
      const whose = variables.filter.employeeIds as string[] | undefined
      return answer('timesheets', {
        timesheets: page(
          [...listView.values()].filter((t) => within(t.from, variables.filter) && (!whose || whose.includes(t.employee.id))),
        ),
      })
    }
    if (/\bshifts\(/.test(query)) {
      const whose = variables.filter.userIds as string[] | undefined
      return answer('shifts', {
        shifts: page(
          [...world.shifts.values()].filter(
            (s) => within(s.startTime, variables.filter) && (!whose || whose.includes(s.assignee?.id ?? '')),
          ),
        ),
      })
    }
    return answer('unknown', {})
  }) as unknown as typeof fetch

  return { fetchImpl, world, log, lagListFor: (reads) => (lagOnNextChange = reads), refuseNext: (n) => (refusals = n) }
}
