import type { Person, ReviewSheet, ReviewShift } from '../types'
import { localDay } from './review'
import { notOnCall } from './schedule'
import { addressKey, driveEstimate, straightKm, type Point } from './scheduleCheck'
import { TARGETS } from './targets'
import { TZ, todayIn } from './week'

export type LiveStatus = 'not-started' | 'due' | 'on-site' | 'late' | 'running-over' | 'wrong-place' | 'no-show' | 'done'

export type LiveLevel = 'grey' | 'yellow' | 'red'

export interface LiveVisit {
  shift: ReviewShift
  sheets: ReviewSheet[]
  status: LiveStatus
  level: LiveLevel
  inAt: number | null
  outAt: number | null
  /** Minutes late after scheduled start if late, or arrived late if done. */
  lateBy: number
  /** Minutes running over scheduled end. */
  overBy: number
  /** Expected arrival timestamp (ms) at this visit. */
  expectedArrival: number
  /** Expected finish timestamp (ms) of this visit. */
  expectedFinish: number
  /** If at risk: minutes expected arrival exceeds start + grace. */
  riskMinutes: number
  /** If at risk: preceding visit causing the risk. */
  riskFrom: { clientName: string; finishTime: number; driveMinutes: number } | null
  /** Whether cleaner clocked in at unexpected client/site. */
  wrongPlace: boolean
  /** Whether a partner assigned to this shift is currently late. */
  partnerLate: boolean
  /** Whether marked handled by an editor. */
  handled: boolean
  /** Whether time was entered by hand (no TimeCard). */
  unmeasured: boolean
  /** Estimated drive from previous visit in minutes (0 if missing coordinates). */
  driveFromPrevMinutes: number
  hasDriveEstimate: boolean
}

export interface LiveCleanerCard {
  cleaner: { id: string; name: string }
  level: LiveLevel
  visits: LiveVisit[]
  currentVisit: LiveVisit | null
  nextVisit: LiveVisit | null
  riskyVisit: LiveVisit | null
  finished: boolean
  noShows: number
  /** Sorting rank (0 = red, 1 = yellow, 2 = grey). */
  rank: number
}

export interface LiveClientGroup {
  clientKey: string
  clientName: string
  level: LiveLevel
  visits: LiveVisit[]
}

export interface LiveBoard {
  cleaners: LiveCleanerCard[]
  clients: LiveClientGroup[]
  next30Minutes: LiveVisit[]
  counts: { total: number; red: number; yellow: number; grey: number }
}

export interface BuildLiveBoardOptions {
  shifts: ReviewShift[]
  timesheets: ReviewSheet[]
  now: number
  graceMinutes?: number
  places?: ReadonlyMap<string, Point | null>
  handledShiftIds?: ReadonlySet<string>
  /** YYYY-MM-DD to filter shifts; pass null to skip day filtering. Defaults to today in Toronto. */
  today?: string | null
}

const ms = (iso: string) => Date.parse(iso)
const clockedIn = (t: ReviewSheet) => t.referenceObject?.__typename === 'TimeCard'
const squash = (str: string | null | undefined) => (str ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * End timestamp of a timesheet: clock-out time if closed, or now/start+1 if open.
 */
function sheetEndOrNow(t: ReviewSheet, now: number): number {
  if (t.to) return ms(t.to)
  if (t.totalDuration && t.totalDuration > 0) return ms(t.from) + t.totalDuration * 60_000
  return Math.max(ms(t.from) + 1, now)
}

/**
 * Checks whether a timesheet overlaps a scheduled shift window.
 */
function sheetOverlapsShift(t: ReviewSheet, s: ReviewShift, now: number): boolean {
  const shiftStart = ms(s.startTime)
  const shiftEnd = ms(s.endTime)
  const tFrom = ms(t.from)
  const tEnd = sheetEndOrNow(t, now)

  // Open timesheet starting shortly before shift start counts as active for that shift
  if (!t.to && tFrom >= shiftStart - 60 * 60_000 && tFrom < shiftEnd) {
    return true
  }

  return Math.min(tEnd, shiftEnd) > Math.max(tFrom, shiftStart)
}

/**
 * Checks whether a clock-in was at an unexpected client or job site.
 */
export function isWrongPlace(shift: ReviewShift, sheet: ReviewSheet): boolean {
  if (!sheet.client && !sheet.jobSite) return false

  if (sheet.client?.id && shift.client?.id) {
    if (sheet.client.id !== shift.client.id) return true
  }

  if (sheet.client?.name && shift.client?.name) {
    if (squash(sheet.client.name) !== squash(shift.client.name)) return true
  }

  if (!shift.client && sheet.jobSite?.name && shift.jobSite?.name) {
    if (squash(sheet.jobSite.name) !== squash(shift.jobSite.name)) return true
  }

  if (shift.client && sheet.client) return false

  if (shift.client && !sheet.client && sheet.jobSite?.name) {
    const sheetSite = squash(sheet.jobSite.name)
    const shiftClient = squash(shift.client.name)
    const shiftSite = squash(shift.jobSite?.name)
    if (sheetSite !== shiftClient && sheetSite !== shiftSite) return true
  }

  return false
}

/**
 * Estimates drive distance and duration in minutes between two shifts.
 */
export function estimateDriveBetween(
  fromShift: ReviewShift | null | undefined,
  toShift: ReviewShift | null | undefined,
  places?: ReadonlyMap<string, Point | null>,
): { minutes: number; km: number; hasDrive: boolean } {
  if (!fromShift || !toShift || !places) {
    return { minutes: 0, km: 0, hasDrive: false }
  }
  const addrA = addressKey(fromShift.jobSite?.address)
  const addrB = addressKey(toShift.jobSite?.address)
  if (addrA && addrA === addrB) {
    return { minutes: 0, km: 0, hasDrive: true }
  }
  const pointA = addrA ? places.get(addrA) : null
  const pointB = addrB ? places.get(addrB) : null
  if (!pointA || !pointB) {
    return { minutes: 0, km: 0, hasDrive: false }
  }
  const km = straightKm(pointA, pointB)
  const est = driveEstimate(km)
  return { minutes: est.minutes, km: est.km, hasDrive: true }
}

/**
 * Matches timesheets to shifts:
 * 1. Exact match on referenceObject.shiftId for the shift assignee.
 * 2. Overlapping timesheets for the same cleaner not linked to another of their own shifts.
 */
export function matchSheetsToShifts(shifts: ReviewShift[], timesheets: ReviewSheet[], now: number): Map<string, ReviewSheet[]> {
  const validSheets = timesheets.filter((t) => t.employee && t.state !== 'REJECTED' && t.referenceObject?.__typename !== 'LeaveRequest')
  const byShift = new Map<string, ReviewSheet[]>()
  const byPerson = new Map<string, ReviewSheet[]>()

  for (const t of validSheets) {
    const id = t.referenceObject?.shiftId
    if (id) byShift.set(id, [...(byShift.get(id) ?? []), t])
    byPerson.set(t.employee!.id, [...(byPerson.get(t.employee!.id) ?? []), t])
  }

  const ownShifts = new Map<string, Set<string>>()
  for (const s of shifts) {
    if (!s.assignee) continue
    if (!ownShifts.has(s.assignee.id)) ownShifts.set(s.assignee.id, new Set())
    ownShifts.get(s.assignee.id)!.add(s.id)
  }

  const matches = new Map<string, ReviewSheet[]>()
  for (const s of shifts) {
    if (!s.assignee) {
      matches.set(s.id, [])
      continue
    }
    const who = s.assignee.id
    const linked = (byShift.get(s.id) ?? []).filter((t) => t.employee!.id === who)
    if (linked.length > 0) {
      matches.set(s.id, linked)
      continue
    }
    const mine = ownShifts.get(who) ?? new Set()
    const loose = (byPerson.get(who) ?? []).filter(
      (t) => sheetOverlapsShift(t, s, now) && !(t.referenceObject?.shiftId && mine.has(t.referenceObject.shiftId)),
    )
    matches.set(s.id, loose)
  }

  return matches
}

function cleanerUrgency(c: LiveCleanerCard): number {
  if (c.visits.some((v) => v.status === 'late')) return 0
  if (c.riskyVisit) return 1
  if (c.visits.some((v) => v.status === 'running-over')) return 2
  if (c.visits.some((v) => v.status === 'wrong-place')) return 3
  if (c.visits.some((v) => v.status === 'due')) return 4
  if (c.visits.some((v) => v.status === 'on-site')) return 5
  if (c.nextVisit) return 6
  return 7
}

/**
 * Builds the complete live board data from shifts and timesheets.
 */
export function buildLiveBoard(
  shiftsOrOptions: ReviewShift[] | BuildLiveBoardOptions,
  timesheetsArg?: ReviewSheet[],
  nowArg?: number,
  graceMinutesArg?: number,
  placesArg?: ReadonlyMap<string, Point | null>,
  handledShiftIdsArg?: ReadonlySet<string>,
): LiveBoard {
  const options: BuildLiveBoardOptions = Array.isArray(shiftsOrOptions)
    ? {
        shifts: shiftsOrOptions,
        timesheets: timesheetsArg ?? [],
        now: nowArg ?? Date.now(),
        graceMinutes: graceMinutesArg,
        places: placesArg,
        handledShiftIds: handledShiftIdsArg,
      }
    : shiftsOrOptions

  const {
    now,
    graceMinutes = TARGETS.graceMinutes,
    places = new Map(),
    handledShiftIds = new Set(),
    today = todayIn(TZ, new Date(now)),
  } = options

  const graceMs = graceMinutes * 60_000

  // Filter to valid visits: assigned, non-On-Call, with client or jobSite, and for `today` if given
  let eligibleShifts = options.shifts.filter((s) => s.assignee && (s.client || s.jobSite) && notOnCall(s))
  if (today !== null && today !== undefined) {
    eligibleShifts = eligibleShifts.filter((s) => localDay(s.startTime, s.timezone || TZ) === today)
  }

  const sheetsByShift = matchSheetsToShifts(eligibleShifts, options.timesheets, now)

  // Map partner shifts
  const partnerShiftIds = new Map<string, Set<string>>()
  for (const s of eligibleShifts) {
    partnerShiftIds.set(s.id, new Set())
  }
  for (const s of eligibleShifts) {
    for (const p of s.shiftPartners ?? []) {
      if (partnerShiftIds.has(p.id)) {
        partnerShiftIds.get(s.id)!.add(p.id)
        partnerShiftIds.get(p.id)!.add(s.id)
      }
    }
  }
  // Also link concurrent shifts at same client for different cleaners
  for (let i = 0; i < eligibleShifts.length; i++) {
    const a = eligibleShifts[i]
    for (let j = i + 1; j < eligibleShifts.length; j++) {
      const b = eligibleShifts[j]
      if (a.assignee?.id === b.assignee?.id) continue
      const sameClient =
        (a.client?.id && b.client?.id && a.client.id === b.client.id) ||
        (a.client?.name && b.client?.name && squash(a.client.name) === squash(b.client.name))
      if (sameClient) {
        const overlap = Math.min(ms(a.endTime), ms(b.endTime)) > Math.max(ms(a.startTime), ms(b.startTime))
        if (overlap) {
          partnerShiftIds.get(a.id)!.add(b.id)
          partnerShiftIds.get(b.id)!.add(a.id)
        }
      }
    }
  }

  // Pre-calculate initial status of all visits
  const initialVisitMap = new Map<
    string,
    {
      shift: ReviewShift
      sheets: ReviewSheet[]
      status: LiveStatus
      inAt: number | null
      outAt: number | null
      lateBy: number
      overBy: number
      wrongPlace: boolean
      unmeasured: boolean
    }
  >()

  for (const shift of eligibleShifts) {
    const sheets = sheetsByShift.get(shift.id) ?? []
    const clocks = sheets.filter(clockedIn)
    const isUnmeasured = sheets.length > 0 && clocks.length === 0

    let inAt: number | null = null
    let outAt: number | null = null

    if (isUnmeasured) {
      inAt = ms(sheets[0].from)
      outAt = sheets[0].to ? ms(sheets[0].to) : null
    } else if (clocks.length > 0) {
      inAt = Math.min(...clocks.map((t) => ms(t.from)))
      const hasOpen = clocks.some((t) => !t.to)
      outAt = hasOpen ? null : Math.max(...clocks.map((t) => ms(t.to!)))
    }

    const start = ms(shift.startTime)
    const end = ms(shift.endTime)
    const wrong = sheets.some((t) => isWrongPlace(shift, t))

    let status: LiveStatus
    let lateBy = 0
    let overBy = 0

    if (isUnmeasured) {
      status = outAt != null ? 'done' : 'on-site'
    } else if (inAt != null && inAt <= now) {
      const arrivedLate = inAt - start > graceMs ? Math.max(0, Math.round((inAt - start) / 60_000)) : 0
      lateBy = arrivedLate

      if (outAt != null && outAt <= now) {
        status = 'done'
      } else {
        if (wrong) {
          status = 'wrong-place'
        } else if (now > end + graceMs) {
          status = 'running-over'
          overBy = Math.max(0, Math.round((now - end) / 60_000))
        } else {
          status = 'on-site'
        }
      }
    } else {
      if (now < start) {
        status = 'not-started'
      } else if (now <= start + graceMs) {
        status = 'due'
      } else if (now < end) {
        status = 'late'
        lateBy = Math.max(0, Math.round((now - start) / 60_000))
      } else {
        status = 'no-show'
      }
    }

    initialVisitMap.set(shift.id, {
      shift,
      sheets,
      status,
      inAt,
      outAt,
      lateBy,
      overBy,
      wrongPlace: wrong,
      unmeasured: isUnmeasured,
    })
  }

  // Group by cleaner
  const byCleaner = new Map<string, { cleaner: Person; shifts: ReviewShift[] }>()
  for (const s of eligibleShifts) {
    const person = s.assignee!
    if (!byCleaner.has(person.id)) {
      byCleaner.set(person.id, { cleaner: person, shifts: [] })
    }
    byCleaner.get(person.id)!.shifts.push(s)
  }

  const allProcessedVisits: LiveVisit[] = []
  const cleanerCards: LiveCleanerCard[] = []

  for (const { cleaner, shifts } of byCleaner.values()) {
    // Sort visits chronologically
    shifts.sort((a, b) => ms(a.startTime) - ms(b.startTime) || a.id.localeCompare(b.id))

    let prevFinish: number | null = null
    let prevClientName: string | null = null
    let prevShift: ReviewShift | null = null

    const cleanerVisits: LiveVisit[] = []

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i]
      const init = initialVisitMap.get(shift.id)!
      const start = ms(shift.startTime)
      const end = ms(shift.endTime)
      const duration = end - start
      const isHandled = handledShiftIds.has(shift.id)

      // Partner late check: partner shift is currently 'late'
      const partnerIds = partnerShiftIds.get(shift.id) ?? new Set()
      const hasLatePartner = [...partnerIds].some((pid) => initialVisitMap.get(pid)?.status === 'late')
      const partnerLate = hasLatePartner && ['on-site', 'wrong-place', 'due', 'running-over'].includes(init.status)

      let driveFromPrevMinutes = 0
      let hasDriveEstimate = false
      let expectedArrival = init.inAt != null ? init.inAt : start
      let expectedFinish = end
      let riskMinutes = 0
      let riskFrom: LiveVisit['riskFrom'] = null

      if (prevShift) {
        const drive = estimateDriveBetween(prevShift, shift, places)
        driveFromPrevMinutes = drive.minutes
        hasDriveEstimate = drive.hasDrive
      }

      if (init.inAt != null) {
        // Cleaner has already clocked in
        expectedArrival = init.inAt
        if (init.status === 'done') {
          expectedFinish = init.outAt ?? end
        } else if (init.status === 'running-over') {
          expectedFinish = now
        } else {
          // on-site or wrong-place
          expectedFinish = Math.max(end, init.inAt + duration, now)
        }
      } else {
        // Cleaner has not clocked in yet: arrival depends on previous visit finish + drive
        if (prevFinish != null) {
          const driveMs = driveFromPrevMinutes * 60_000
          const arrive = Math.max(start, prevFinish + driveMs)
          expectedArrival = arrive
          expectedFinish = arrive + duration

          if (arrive > start + graceMs) {
            riskMinutes = Math.round((arrive - start) / 60_000)
            riskFrom = {
              clientName: prevClientName || 'Previous visit',
              finishTime: prevFinish,
              driveMinutes: driveFromPrevMinutes,
            }
          }
        } else {
          expectedArrival = start
          expectedFinish = init.status === 'no-show' ? end : Math.max(end, now + duration)
        }
      }

      // Initial level assignment
      let level: LiveLevel = 'grey'
      if (init.status === 'no-show' || init.status === 'running-over' || init.status === 'wrong-place') {
        level = 'yellow'
      } else if (init.status === 'late') {
        level = 'yellow' // late defaults to yellow unless escalated to red below
      } else if (riskMinutes > 0) {
        level = 'yellow'
      } else if (init.status === 'on-site' && expectedFinish > end + graceMs) {
        level = 'yellow'
      }

      if (partnerLate && level === 'grey') {
        level = 'yellow'
      }

      prevFinish = expectedFinish
      prevClientName = shift.client?.name || shift.jobSite?.name || 'Client'
      prevShift = shift

      cleanerVisits.push({
        shift,
        sheets: init.sheets,
        status: init.status,
        level,
        inAt: init.inAt,
        outAt: init.outAt,
        lateBy: init.lateBy,
        overBy: init.overBy,
        expectedArrival,
        expectedFinish,
        riskMinutes,
        riskFrom,
        wrongPlace: init.wrongPlace,
        partnerLate,
        handled: isHandled,
        unmeasured: init.unmeasured,
        driveFromPrevMinutes,
        hasDriveEstimate,
      })
    }

    // Severity escalation: Late visits escalate to Red if >= 2*grace OR if subsequent visit is at-risk
    for (let i = 0; i < cleanerVisits.length; i++) {
      const v = cleanerVisits[i]
      if (v.status === 'late') {
        const start = ms(v.shift.startTime)
        const pastTwiceGrace = now >= start + 2 * graceMs
        const hasSubsequentRisk = cleanerVisits.slice(i + 1).some((sub) => sub.riskMinutes > 0)

        if ((pastTwiceGrace || hasSubsequentRisk) && !v.handled) {
          v.level = 'red'
        } else {
          v.level = 'yellow'
        }
      }

      // Handled red turns yellow
      if (v.handled && v.level === 'red') {
        v.level = 'yellow'
      }
    }

    // Determine cleaner card level and active visits
    const cardLevel: LiveLevel = cleanerVisits.some((v) => v.level === 'red')
      ? 'red'
      : cleanerVisits.some((v) => v.level === 'yellow')
        ? 'yellow'
        : 'grey'

    const rank = cardLevel === 'red' ? 0 : cardLevel === 'yellow' ? 1 : 2
    const currentVisit = cleanerVisits.find((v) => ['late', 'due', 'on-site', 'wrong-place', 'running-over'].includes(v.status)) ?? null
    const nextVisit = cleanerVisits.find((v) => v.status === 'not-started') ?? null
    const riskyVisit = cleanerVisits.find((v) => v.riskMinutes > 0) ?? null
    const finished = cleanerVisits.length > 0 && cleanerVisits.every((v) => v.status === 'done' || v.status === 'no-show')
    const noShows = cleanerVisits.filter((v) => v.status === 'no-show').length

    cleanerCards.push({
      cleaner: { id: cleaner.id, name: cleaner.name || 'Unnamed' },
      level: cardLevel,
      visits: cleanerVisits,
      currentVisit,
      nextVisit,
      riskyVisit,
      finished,
      noShows,
      rank,
    })

    allProcessedVisits.push(...cleanerVisits)
  }

  // Sort cleaner cards
  cleanerCards.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    const uA = cleanerUrgency(a)
    const uB = cleanerUrgency(b)
    if (uA !== uB) return uA - uB
    return a.cleaner.name.localeCompare(b.cleaner.name, undefined, { sensitivity: 'base' })
  })

  // Group by client
  const clientGroupsMap = new Map<string, { clientKey: string; clientName: string; visits: LiveVisit[] }>()
  for (const v of allProcessedVisits) {
    const key = v.shift.client?.id ?? `site:${v.shift.jobSite?.name || 'unknown'}`
    const name = v.shift.client?.name || v.shift.jobSite?.name || 'No client'
    if (!clientGroupsMap.has(key)) {
      clientGroupsMap.set(key, { clientKey: key, clientName: name, visits: [] })
    }
    clientGroupsMap.get(key)!.visits.push(v)
  }

  const clients: LiveClientGroup[] = [...clientGroupsMap.values()].map((g) => {
    g.visits.sort((a, b) => ms(a.shift.startTime) - ms(b.shift.startTime) || a.shift.id.localeCompare(b.shift.id))
    const level: LiveLevel = g.visits.some((v) => v.level === 'red')
      ? 'red'
      : g.visits.some((v) => v.level === 'yellow')
        ? 'yellow'
        : 'grey'
    return {
      clientKey: g.clientKey,
      clientName: g.clientName,
      level,
      visits: g.visits,
    }
  })

  const clientRank = (l: LiveLevel) => (l === 'red' ? 0 : l === 'yellow' ? 1 : 2)
  clients.sort((a, b) => clientRank(a.level) - clientRank(b.level) || a.clientName.localeCompare(b.clientName))

  // Next 30 minutes attention strip:
  // Non-grey visits starting in next 30 min at risk, OR ending in next 30 min (or ended recently) running over
  const NEXT_30_MS = 30 * 60_000
  const next30Minutes = allProcessedVisits
    .filter((v) => {
      if (v.level === 'grey') return false
      const start = ms(v.shift.startTime)
      const end = ms(v.shift.endTime)

      const startsSoonAtRisk = start >= now && start <= now + NEXT_30_MS && (v.riskMinutes > 0 || v.expectedArrival > start + graceMs)

      const endsSoonRunningOver =
        (end <= now + NEXT_30_MS && end >= now - NEXT_30_MS && v.status === 'running-over') ||
        (end >= now && end <= now + NEXT_30_MS && v.expectedFinish > end + graceMs)

      return startsSoonAtRisk || endsSoonRunningOver
    })
    .sort((a, b) => {
      const rank = (l: LiveLevel) => (l === 'red' ? 0 : l === 'yellow' ? 1 : 2)
      return rank(a.level) - rank(b.level) || ms(a.shift.startTime) - ms(b.shift.startTime) || a.shift.id.localeCompare(b.shift.id)
    })

  const counts = {
    total: cleanerCards.length,
    red: cleanerCards.filter((c) => c.level === 'red').length,
    yellow: cleanerCards.filter((c) => c.level === 'yellow').length,
    grey: cleanerCards.filter((c) => c.level === 'grey').length,
  }

  return {
    cleaners: cleanerCards,
    clients,
    next30Minutes,
    counts,
  }
}

/** Cleaners who work the same visits today, as one row on the Dashboard (decision 0043): "Avery & Jo". */
export interface LivePair {
  names: string[]
  visits: LiveVisit[]
  level: LiveLevel
}

const RANK: Record<LiveLevel, number> = { red: 0, yellow: 1, grey: 2 }

/**
 * Groups the cleaners whose visits today are the same (same clients at the same times) into one row, keeping the
 * visits of the first and the worst level of any. Partners are each their own shift, so this joins them by what
 * they do, not by a team id Camelo does not have. Worst first, then by name.
 */
export function pairsOf(cleaners: readonly LiveCleanerCard[]): LivePair[] {
  const rows = new Map<string, LivePair>()
  for (const c of cleaners) {
    const key = c.visits.map((v) => `${v.shift.client?.id ?? v.shift.jobSite?.id ?? ''}@${v.shift.startTime}-${v.shift.endTime}`).join('|')
    const row = rows.get(key)
    if (!row) rows.set(key, { names: [c.cleaner.name], visits: c.visits, level: c.level })
    else {
      row.names.push(c.cleaner.name)
      // the worse of the two: a partner can be late while the other is on time
      if (RANK[c.level] < RANK[row.level]) Object.assign(row, { level: c.level, visits: c.visits })
    }
  }
  return [...rows.values()].sort((a, b) => RANK[a.level] - RANK[b.level] || a.names[0].localeCompare(b.names[0]))
}
