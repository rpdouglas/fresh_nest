import type { Client, Person, Shift } from '../types'
import { parseFieldAlerts, type FieldAlerts } from './fieldNotes'
import { isOnCall, positionOf, staffOn } from './schedule'
import { TZ, addDays } from './week'

/** One job done together. Camelo stores it as one shift per cleaner. */
export interface Visit {
  key: string
  start: string
  end: string
  tz: string
  client: Client | null
  jobSite: Shift['jobSite']
  title: string
  /** Sorted by name, so a pair always reads the same way round. */
  staff: Person[]
  siteNote: string | null
  shiftNotes: string[]
  /** Usually one; more only if partners were booked under different positions. */
  positions: string[]
  /** Set only when the cleaners' own times differ from each other. */
  ownTimes: { person: Person; start: string; end: string }[] | null
  /** Security and hazard badges parsed from notes (Sprint 1.5, decision 0025). */
  alerts?: FieldAlerts
  /** Checklists assigned to this visit (Sprint 1.5, decision 0025). */
  checklists?: VisitChecklist[]
}

export interface VisitChecklist {
  name: string
  completionPercentage: number | null
}

export interface Team {
  key: string
  cleaners: Person[]
  visits: Visit[]
  start: string
  end: string
}

/** A shift with no client or job site: a cleaner booked for a block of time. */
export interface Block {
  key: string
  person: Person | null
  start: string
  end: string
  tz: string
  note: string | null
  position: string | null
}

export interface TeamDay {
  /** YYYY-MM-DD */
  key: string
  teams: Team[]
  /** Cleaners on call that day. */
  onCall: Block[]
  /** Other shifts with no client or job site. */
  blocks: Block[]
  visitCount: number
}

const byName = (a: Person, b: Person) =>
  (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id)

const unique = (xs: (string | null | undefined)[]) => [...new Set(xs.map((x) => x?.trim()).filter((x): x is string => !!x))]

const squash = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))

/** Shifts that name each other as partners become one visit. */
export function mergeVisits(shifts: Shift[]): { visits: Visit[]; blocks: Block[] } {
  const byId = new Map(shifts.map((s) => [s.id, s]))
  const parent = new Map(shifts.map((s) => [s.id, s.id]))
  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root)!
    parent.set(id, root)
    return root
  }
  for (const s of shifts) {
    // a shift partner's id is the id of that partner's own shift
    for (const p of s.shiftPartners ?? []) if (byId.has(p.id)) parent.set(find(p.id), find(s.id))
  }
  const groups = new Map<string, Shift[]>()
  for (const s of shifts) {
    const root = find(s.id)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(s)
  }

  const visits: Visit[] = []
  const blocks: Block[] = []
  for (const group of groups.values()) {
    group.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime) || a.id.localeCompare(b.id))
    const first = group[0]
    const tz = first.timezone || TZ
    const client = group.find((s) => s.client)?.client ?? null
    const jobSite = group.find((s) => s.jobSite)?.jobSite ?? null
    if (!client && !jobSite) {
      for (const s of group) {
        blocks.push({ key: s.id, person: s.assignee, start: s.startTime, end: s.endTime, tz: s.timezone || TZ, note: s.note, position: positionOf(s) })
      }
      continue
    }
    const siteNote = jobSite?.note?.trim() || null
    // staff often paste the site note into the shift note; show it once
    const shiftNotes = unique(group.map((s) => s.note)).filter((n) => squash(n) !== squash(siteNote ?? ''))
    const staff = new Map<string, Person>()
    for (const s of group) for (const p of staffOn(s)) staff.set(p.id, p)
    const end = group.reduce((latest, s) => (Date.parse(s.endTime) > Date.parse(latest) ? s.endTime : latest), first.endTime)
    const sameTimes = group.every(
      (s) => Date.parse(s.startTime) === Date.parse(first.startTime) && Date.parse(s.endTime) === Date.parse(end),
    )
    const checklistsMap = new Map<string, number | null>()
    for (const s of group) {
      for (const ca of s.checklistAssignments ?? []) {
        const name = ca.checklist?.name?.trim()
        if (!name) continue
        const existing = checklistsMap.get(name)
        const pct = ca.completionPercentage
        if (existing === undefined) {
          checklistsMap.set(name, pct)
        } else if (pct != null && (existing == null || pct > existing)) {
          checklistsMap.set(name, pct)
        }
      }
    }
    const checklists: VisitChecklist[] = [...checklistsMap.entries()].map(([name, completionPercentage]) => ({
      name,
      completionPercentage,
    }))
    visits.push({
      key: group.map((s) => s.id).sort().join('+'),
      start: first.startTime,
      end,
      tz,
      client,
      jobSite,
      title: client?.name || jobSite?.name || 'No client attached',
      staff: [...staff.values()].sort(byName),
      siteNote,
      shiftNotes,
      positions: unique(group.map(positionOf)),
      ownTimes: sameTimes
        ? null
        : group.filter((s) => s.assignee).map((s) => ({ person: s.assignee!, start: s.startTime, end: s.endTime })),
      alerts: parseFieldAlerts(siteNote, shiftNotes),
      checklists: checklists.length > 0 ? checklists : undefined,
    })
  }
  return { visits, blocks }
}

export function buildTeamDays(shifts: Shift[]): TeamDay[] {
  const { visits, blocks } = mergeVisits(shifts)
  const days = new Map<string, { teams: Map<string, Team>; blocks: Block[] }>()
  const day = (key: string) => {
    if (!days.has(key)) days.set(key, { teams: new Map(), blocks: [] })
    return days.get(key)!
  }
  for (const v of visits) {
    const teams = day(dayKey(v.start, v.tz)).teams
    const key = v.staff.map((p) => p.id).join('+')
    if (!teams.has(key)) teams.set(key, { key: key || '__none__', cleaners: v.staff, visits: [], start: v.start, end: v.end })
    teams.get(key)!.visits.push(v)
  }
  for (const b of blocks) day(dayKey(b.start, b.tz)).blocks.push(b)

  const time = (iso: string) => Date.parse(iso)
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => {
      const teams = [...d.teams.values()]
      for (const t of teams) {
        t.visits.sort((a, b) => time(a.start) - time(b.start) || a.title.localeCompare(b.title))
        t.start = t.visits[0].start
        t.end = t.visits.reduce((latest, v) => (time(v.end) > time(latest) ? v.end : latest), t.visits[0].end)
      }
      // unassigned last, otherwise by who starts first
      teams.sort(
        (a, b) =>
          Number(!a.cleaners.length) - Number(!b.cleaners.length) ||
          time(a.start) - time(b.start) ||
          a.key.localeCompare(b.key),
      )
      d.blocks.sort((a, b) => time(a.start) - time(b.start) || (a.person?.name ?? '').localeCompare(b.person?.name ?? ''))
      return {
        key,
        teams,
        onCall: d.blocks.filter((b) => isOnCall(b.position)),
        blocks: d.blocks.filter((b) => !isOnCall(b.position)),
        visitCount: teams.reduce((n, t) => n + t.visits.length, 0),
      }
    })
}

/** All seven days of the week, including ones with nothing scheduled. */
export function weekStrip(weekStart: string, days: TeamDay[]) {
  const byKey = new Map(days.map((d) => [d.key, d]))
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(weekStart, i)
    const d = byKey.get(key)
    return { key, teams: d?.teams.length ?? 0, visits: d?.visitCount ?? 0, onCall: d?.onCall.length ?? 0 }
  })
}

export function dateParts(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const fmt = (o: Intl.DateTimeFormatOptions) => date.toLocaleDateString('en-US', { timeZone: 'UTC', ...o })
  return {
    day: String(d).padStart(2, '0'),
    weekday: fmt({ weekday: 'long' }),
    short: `${fmt({ weekday: 'short' })} ${d}`,
    month: fmt({ month: 'long', year: 'numeric' }),
  }
}

/** Where a visit is: the job site name (unless it just repeats the client) and address. */
export function siteLine(v: Visit, separator: string): string {
  const name = v.jobSite?.name?.trim()
  const siteName = name && name.toLowerCase() !== v.title.trim().toLowerCase() ? name : null
  return [siteName, v.jobSite?.address?.trim()].filter(Boolean).join(separator)
}

export function initials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}
