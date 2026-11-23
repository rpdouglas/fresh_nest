import type { Client, Person, Shift } from '../types'
import { TZ } from './week'

export interface Filters {
  query: string
  clientId: string
  staffId: string
  scheduleId: string
  /** Position name; Camelo calls a position a group and gives it no id here. */
  position: string
  unassignedOnly: boolean
}

export const NO_FILTERS: Filters = { query: '', clientId: '', staffId: '', scheduleId: '', position: '', unassignedOnly: false }

export interface DayGroup {
  key: string
  label: string
  shifts: Shift[]
}

export interface Group {
  key: string
  title: string
  subtitle: string[]
  /** Set in the by-staff view: the person this card is about. */
  person: Person | null
  count: number
  days: DayGroup[]
}

export interface Option {
  id: string
  name: string
}

const tzOf = (s: Shift) => s.timezone || TZ

/**
 * Everyone on a visit: the assignee plus any shift partners. Camelo gives each
 * partner their own shift record too, so count and group by assignee only and
 * use this just for display and search.
 */
export function staffOn(s: Shift): Person[] {
  const people = [s.assignee, ...(s.shiftPartners ?? []).map((p) => p.assignee)]
  const seen = new Set<string>()
  return people.filter((p): p is Person => {
    if (!p || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

/** A shift's position, e.g. Cleaning or On Call. Camelo's field for it is `group`. */
export function positionOf(s: Shift): string | null {
  return s.group?.name?.trim() || null
}

export function isOnCall(position: string | null): boolean {
  return position?.replace(/[\s_-]+/g, '').toLowerCase() === 'oncall'
}

/**
 * On Call shifts only say who is on call that day: nobody clocks in and there is no
 * client or address. Daily teams lists them; every other report leaves them out.
 */
export const notOnCall = (x: { group: { name: string | null } | null }) => !isOnCall(x.group?.name?.trim() || null)

export function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function dayOf(s: Shift): { key: string; label: string } {
  const d = new Date(s.startTime)
  return {
    key: new Intl.DateTimeFormat('en-CA', { timeZone: tzOf(s) }).format(d),
    label: new Intl.DateTimeFormat('en-US', { timeZone: tzOf(s), weekday: 'long', month: 'short', day: 'numeric' }).format(d),
  }
}

function byDay(shifts: Shift[]): DayGroup[] {
  const days = new Map<string, DayGroup>()
  for (const s of [...shifts].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))) {
    const { key, label } = dayOf(s)
    if (!days.has(key)) days.set(key, { key, label, shifts: [] })
    days.get(key)!.shifts.push(s)
  }
  return [...days.values()].sort((a, b) => a.key.localeCompare(b.key))
}

const byTitle = (a: Group, b: Group) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })

export function groupByClient(shifts: Shift[]): Group[] {
  const buckets = new Map<string, { client: Client | null; shifts: Shift[] }>()
  for (const s of shifts) {
    const key = s.client?.id ?? ''
    if (!buckets.has(key)) buckets.set(key, { client: s.client, shifts: [] })
    buckets.get(key)!.shifts.push(s)
  }
  const groups = [...buckets.entries()].map(([key, { client, shifts }]): Group => ({
    key: key || '__none__',
    title: client?.name || (client ? 'Unnamed client' : 'No client attached'),
    subtitle: client
      ? [client.clientNumber && `#${client.clientNumber}`, client.phoneNumber, client.email].filter((x): x is string => !!x)
      : [],
    person: null,
    count: shifts.length,
    days: byDay(shifts),
  }))
  return [...groups.filter((g) => g.key !== '__none__').sort(byTitle), ...groups.filter((g) => g.key === '__none__')]
}

export function groupByStaff(shifts: Shift[]): Group[] {
  const buckets = new Map<string, { person: Person | null; shifts: Shift[] }>()
  for (const s of shifts) {
    const key = s.assignee?.id ?? ''
    if (!buckets.has(key)) buckets.set(key, { person: s.assignee, shifts: [] })
    buckets.get(key)!.shifts.push(s)
  }
  const groups = [...buckets.entries()].map(([key, { person, shifts }]): Group => ({
    key: key || '__none__',
    title: person ? person.name || 'Unnamed staff' : 'Unassigned',
    subtitle: person?.phoneNumber ? [person.phoneNumber] : [],
    person,
    count: shifts.length,
    days: byDay(shifts),
  }))
  return [...groups.filter((g) => g.key !== '__none__').sort(byTitle), ...groups.filter((g) => g.key === '__none__')]
}

export function filterShifts(shifts: Shift[], f: Filters): Shift[] {
  const q = f.query.trim().toLowerCase()
  return shifts.filter((s) => {
    if (f.clientId && s.client?.id !== f.clientId) return false
    if (f.scheduleId && s.schedule?.id !== f.scheduleId) return false
    if (f.position && positionOf(s) !== f.position) return false
    if (f.unassignedOnly && s.assignee) return false
    if (f.staffId && s.assignee?.id !== f.staffId) return false
    if (!q) return true
    const haystack = [
      s.client?.name,
      s.client?.clientNumber,
      ...staffOn(s).map((p) => p.name),
      s.jobSite?.name,
      s.jobSite?.address,
      s.title,
      s.note,
      positionOf(s),
    ]
    return haystack.some((x) => x?.toLowerCase().includes(q))
  })
}

function uniqueOptions(items: ({ id: string; name: string | null } | null | undefined)[]): Option[] {
  const map = new Map<string, string>()
  for (const i of items) if (i) map.set(i.id, i.name || '(unnamed)')
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

export function filterOptions(shifts: Shift[]) {
  return {
    clients: uniqueOptions(shifts.map((s) => s.client)),
    staff: uniqueOptions(shifts.map((s) => s.assignee)),
    schedules: uniqueOptions(shifts.map((s) => s.schedule)),
    positions: uniqueOptions(shifts.map(positionOf).map((name) => (name ? { id: name, name } : null))),
  }
}

export function stats(shifts: Shift[]) {
  return {
    shifts: shifts.length,
    clients: new Set(shifts.map((s) => s.client?.id).filter(Boolean)).size,
    staff: new Set(shifts.map((s) => s.assignee?.id).filter(Boolean)).size,
    unassigned: shifts.filter((s) => !s.assignee).length,
  }
}
