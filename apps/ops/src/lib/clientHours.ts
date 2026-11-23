// Hours per client and site from Camelo timesheets. The rules, in one place:
//  - a timesheet belongs to its client; one with no client takes the client its job
//    site is linked to on other timesheets, or failing that stands under the site's name;
//    one with a client but no job site joins the site its fellow cleaners were at;
//  - at one client-site, entries whose times overlap are one visit;
//  - a visit's time is the average of its cleaners' time, and it is approved
//    only when every one of its timesheets is approved;
//  - a visit counts on the local day it started;
//  - each client-site's day is summed, then rounded to the nearest quarter hour,
//    approved and unapproved separately; every total adds up those rounded figures;
//  - billing rounds each visit instead, and prices it at the client's price on its day
//    (see billing.ts), so billed hours can differ a little from the hours columns.
import type { ClientRate, Person, Timesheet } from '../types'
import { type Price, priceFor, visitAmount } from './billing'
import { LONG_ENTRY_MINUTES, dayLabel, hours, isApproved, roundQuarter } from './payroll'
import type { Filters, Option } from './schedule'
import { NO_FILTERS, notOnCall } from './schedule'
import { TZ, addDays } from './week'

/** Cleaners on one visit whose minutes differ by more than this are flagged. */
export const UNEVEN_MINUTES = 15

export type VisitFlag = 'uneven' | 'long'

export const VISIT_FLAG_TEXT: Record<VisitFlag, string> = {
  uneven: "The cleaners' times differ by more than 15 minutes",
  long: 'An entry is over 12 hours: check for a missed clock-out',
}

export interface VisitCleaner {
  person: Person | null
  name: string
  /** This cleaner's total at the visit (they may have more than one entry). */
  minutes: number
  entries: Timesheet[]
}

export interface Visit {
  key: string
  start: string
  end: string
  cleaners: VisitCleaner[]
  /** The average of the cleaners' minutes; can be a fraction. */
  minutes: number
  approved: boolean
  flags: VisitFlag[]
}

export interface HoursCell {
  date: string
  visits: Visit[]
  approvedExact: number
  unapprovedExact: number
  /** Rounded to the quarter hour. */
  approved: number
  unapproved: number
  /** The client's price on this day, and the dollars for the approved and the unapproved visits. */
  price: Price
  billed: number
  pending: number
  flagged: boolean
}

export interface SiteRow {
  key: string
  /** The client (or lone job site) this row belongs to; see `clientKey`. */
  clientKey: string
  clientName: string
  /** Null when the site is just named after the client. */
  siteName: string | null
  address: string | null
  /** False when the timesheets name a job site but no client. */
  linked: boolean
  cells: HoursCell[]
  approved: number
  unapproved: number
  /** Dollars billable for the approved visits, and waiting on the unapproved ones. */
  billed: number
  pending: number
  flagged: boolean
}

export interface ClientGroup {
  key: string
  name: string
  sites: SiteRow[]
}

export interface ClientHours {
  start: string
  days: string[]
  groups: ClientGroup[]
  dayApproved: number[]
  dayUnapproved: number[]
  approved: number
  unapproved: number
  billed: number
  pending: number
  visits: number
  unapprovedVisits: number
  flaggedVisits: number
  /** Timesheets with neither a client nor a job site, which cannot be placed. */
  leftOut: number
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const same = (a: string | null | undefined, b: string | null | undefined) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
const localDay = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))
const byName = (a: { name: string; key: string }, b: { name: string; key: string }) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.key.localeCompare(b.key)

/** The client a timesheet counts for: its client, else its job site. Null if it has neither. */
export function clientKey(t: Timesheet): string | null {
  if (t.client) return t.client.id
  if (t.jobSite) return `site:${t.jobSite.id ?? t.jobSite.name ?? ''}`
  return null
}
const clientName = (t: Timesheet) => t.client?.name || t.jobSite?.name || 'Unnamed client'
const siteKey = (t: Timesheet) => t.jobSite?.id ?? t.jobSite?.name ?? ''
const endOf = (t: Timesheet) => (t.to ? Date.parse(t.to) : Date.parse(t.from) + (t.totalDuration ?? 0) * 60_000)

/**
 * Fills in what a timesheet leaves out, from the other loaded timesheets, so two
 * cleaners on the same visit cannot land in different rows and be added instead
 * of averaged:
 *  - one with a job site but no client takes the client that site belongs to,
 *    when the others agree on one;
 *  - one with a client but no job site takes the site of another cleaner's
 *    entry it overlaps at that client, or the client's only site if it has just one.
 */
export function linkSites(timesheets: Timesheet[]): Timesheet[] {
  const owners = new Map<string, Map<string, NonNullable<Timesheet['client']>>>()
  for (const t of timesheets) {
    if (!t.client || !t.jobSite?.id) continue
    if (!owners.has(t.jobSite.id)) owners.set(t.jobSite.id, new Map())
    owners.get(t.jobSite.id)!.set(t.client.id, t.client)
  }
  const withClients = timesheets.map((t) => {
    const found = !t.client && t.jobSite?.id ? owners.get(t.jobSite.id) : undefined
    return found?.size === 1 ? { ...t, client: [...found.values()][0] } : t
  })

  const sited = new Map<string, Timesheet[]>()
  for (const t of withClients) {
    if (!t.client || !t.jobSite) continue
    if (!sited.has(t.client.id)) sited.set(t.client.id, [])
    sited.get(t.client.id)!.push(t)
  }
  return withClients.map((t) => {
    if (!t.client || t.jobSite) return t
    const others = sited.get(t.client.id) ?? []
    const [start, end] = [Date.parse(t.from), endOf(t)]
    const together = others.find((o) => Date.parse(o.from) < end && start < endOf(o))
    const sites = new Map(others.map((o) => [siteKey(o), o.jobSite]))
    const jobSite = together?.jobSite ?? (sites.size === 1 ? [...sites.values()][0] : null)
    return jobSite ? { ...t, jobSite } : t
  })
}

/** Groups one client-site's timesheets into visits: runs of entries that overlap in time. */
function visitsOf(sheets: Timesheet[]): Visit[] {
  const sorted = [...sheets].sort((a, b) => Date.parse(a.from) - Date.parse(b.from) || a.id.localeCompare(b.id))
  const clusters: { end: number; sheets: Timesheet[] }[] = []
  for (const t of sorted) {
    const last = clusters[clusters.length - 1]
    if (last && Date.parse(t.from) < last.end) {
      last.sheets.push(t)
      last.end = Math.max(last.end, endOf(t))
    } else clusters.push({ end: endOf(t), sheets: [t] })
  }
  return clusters.map(({ end, sheets: group }): Visit => {
    const people = new Map<string, VisitCleaner>()
    for (const t of group) {
      const key = t.employee?.id ?? ''
      if (!people.has(key)) people.set(key, { person: t.employee, name: t.employee?.name || 'Unknown cleaner', minutes: 0, entries: [] })
      const c = people.get(key)!
      c.minutes += t.totalDuration ?? 0
      c.entries.push(t)
    }
    const cleaners = [...people.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    const each = cleaners.map((c) => c.minutes)
    const flags: VisitFlag[] = []
    if (Math.max(...each) - Math.min(...each) > UNEVEN_MINUTES) flags.push('uneven')
    if (group.some((t) => (t.totalDuration ?? 0) > LONG_ENTRY_MINUTES)) flags.push('long')
    return {
      key: group.map((t) => t.id).join('+'),
      start: group[0].from,
      end: new Date(end).toISOString(),
      cleaners,
      minutes: sum(each) / cleaners.length,
      approved: group.every(isApproved),
      flags,
    }
  })
}

function matches(visit: Visit, sample: Timesheet, f: Filters): boolean {
  if (f.staffId && !visit.cleaners.some((c) => c.person?.id === f.staffId)) return false
  const q = f.query.trim().toLowerCase()
  if (!q) return true
  const haystack = [sample.client?.name, sample.jobSite?.name, sample.jobSite?.address, ...visit.cleaners.map((c) => c.name)]
  return haystack.some((x) => x?.toLowerCase().includes(q))
}

/** Dollars for some visits at one price, each visit priced on its own. */
const bill = (visits: Visit[], price: Price) => sum(visits.map((v) => visitAmount(v.minutes, price)))

/**
 * Client hours for the seven days from `start`, billed at the clients' prices (`rates`:
 * every client's, as loaded; none means the default for all). Filters narrow what is shown
 * (client, position, cleaner, search) without changing how a visit is averaged.
 */
export function buildClientHours(start: string, loaded: Timesheet[], rates: ClientRate[], f: Filters = NO_FILTERS): ClientHours {
  // On Call is not a visit: nothing to bill or invoice
  const timesheets = linkSites(loaded.filter(notOnCall))
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const placed = timesheets.filter((t) => clientKey(t) !== null)
  const wanted = placed.filter(
    (t) => (!f.clientId || clientKey(t) === f.clientId) && (!f.position || t.group?.name?.trim() === f.position),
  )

  const sites = new Map<string, Timesheet[]>()
  for (const t of wanted) {
    const key = `${clientKey(t)}|${siteKey(t)}`
    if (!sites.has(key)) sites.set(key, [])
    sites.get(key)!.push(t)
  }

  const groups = new Map<string, ClientGroup>()
  for (const [key, sheets] of sites) {
    const sample = sheets[0]
    const visits = visitsOf(sheets).filter((v) => matches(v, sample, f))
    if (!visits.length) continue
    const cells = days.map((date): HoursCell => {
      const mine = visits.filter((v) => localDay(v.start, sample.timezone || TZ) === date)
      const approvedExact = sum(mine.filter((v) => v.approved).map((v) => v.minutes))
      const unapprovedExact = sum(mine.filter((v) => !v.approved).map((v) => v.minutes))
      const price = priceFor(rates, clientKey(sample)!, date)
      return {
        date,
        visits: mine,
        approvedExact,
        unapprovedExact,
        approved: roundQuarter(approvedExact),
        unapproved: roundQuarter(unapprovedExact),
        price,
        billed: bill(mine.filter((v) => v.approved), price),
        pending: bill(mine.filter((v) => !v.approved), price),
        flagged: mine.some((v) => v.flags.length > 0),
      }
    })
    if (!cells.some((c) => c.visits.length)) continue
    const name = clientName(sample)
    const row: SiteRow = {
      key,
      clientKey: clientKey(sample)!,
      clientName: name,
      siteName: sample.jobSite?.name && !same(sample.jobSite.name, name) ? sample.jobSite.name : null,
      address: sample.jobSite?.address?.trim() || null,
      linked: !!sample.client,
      cells,
      approved: sum(cells.map((c) => c.approved)),
      unapproved: sum(cells.map((c) => c.unapproved)),
      billed: sum(cells.map((c) => c.billed)),
      pending: sum(cells.map((c) => c.pending)),
      flagged: cells.some((c) => c.flagged),
    }
    const groupKey = clientKey(sample)!
    if (!groups.has(groupKey)) groups.set(groupKey, { key: groupKey, name, sites: [] })
    groups.get(groupKey)!.sites.push(row)
  }

  const ordered = [...groups.values()].sort(byName)
  for (const g of ordered) g.sites.sort((a, b) => byName({ name: a.siteName ?? '', key: a.key }, { name: b.siteName ?? '', key: b.key }))
  const rows = ordered.flatMap((g) => g.sites)
  const shown = rows.flatMap((r) => r.cells.flatMap((c) => c.visits))
  return {
    start,
    days,
    groups: ordered,
    dayApproved: days.map((_, i) => sum(rows.map((r) => r.cells[i].approved))),
    dayUnapproved: days.map((_, i) => sum(rows.map((r) => r.cells[i].unapproved))),
    approved: sum(rows.map((r) => r.approved)),
    unapproved: sum(rows.map((r) => r.unapproved)),
    billed: sum(rows.map((r) => r.billed)),
    pending: sum(rows.map((r) => r.pending)),
    visits: shown.length,
    unapprovedVisits: shown.filter((v) => !v.approved).length,
    flaggedVisits: shown.filter((v) => v.flags.length > 0).length,
    leftOut: timesheets.length - placed.length,
  }
}

/** Choices for the filter dropdowns, from everything loaded (not just what is filtered in). */
export function clientHoursOptions(loaded: Timesheet[]): { clients: Option[]; staff: Option[]; schedules: Option[]; positions: Option[] } {
  const timesheets = linkSites(loaded.filter(notOnCall))
  const unique = (pairs: ([string, string] | null)[]) =>
    [...new Map(pairs.filter((p): p is [string, string] => !!p)).entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return {
    clients: unique(timesheets.map((t) => (clientKey(t) ? [clientKey(t)!, clientName(t)] : null))),
    staff: unique(timesheets.map((t) => (t.employee ? [t.employee.id, t.employee.name || 'Unnamed'] : null))),
    positions: unique(timesheets.map((t) => (t.group?.name?.trim() ? [t.group.name.trim(), t.group.name.trim()] : null))),
    schedules: [],
  }
}

/** One cell of a CSV, quoted; a value a spreadsheet would run as a formula is made plain text. */
export const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

/** One approved line per client-site, plus an unapproved line where there is any. */
export function clientHoursCsv(h: ClientHours): string {
  const line = (client: string, site: string, type: string, perDay: number[], total: number, dollars: number) =>
    [csvCell(client), csvCell(site), csvCell(type), ...perDay.map(hours), hours(total), dollars.toFixed(2)].join(',')
  const out = [['Client', 'Site', 'Hours', ...h.days.map(dayLabel), 'Total', 'Amount ($)'].map(csvCell).join(',')]
  for (const r of h.groups.flatMap((g) => g.sites)) {
    out.push(line(r.clientName, r.siteName ?? '', 'Approved', r.cells.map((c) => c.approved), r.approved, r.billed))
    if (r.unapproved > 0) out.push(line(r.clientName, r.siteName ?? '', 'Unapproved', r.cells.map((c) => c.unapproved), r.unapproved, r.pending))
  }
  out.push(line('Total', '', 'Approved', h.dayApproved, h.approved, h.billed))
  if (h.unapproved > 0) out.push(line('Total', '', 'Unapproved', h.dayUnapproved, h.unapproved, h.pending))
  return out.join('\r\n') + '\r\n'
}
