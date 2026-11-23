import { formatFieldAlertsExport } from './fieldNotes'
import { formatTime } from './schedule'
import type { Block, TeamDay, Visit } from './teams'
import { addDays } from './week'

// Plain ASCII punctuation and ordinary spaces only, so the text survives being
// pasted anywhere. Intl puts a narrow no-break space before AM/PM.
const time = (iso: string, tz: string) => formatTime(iso, tz).replace(/[  ]/g, ' ')
const span = (start: string, end: string, tz: string) => `${time(start, tz)} - ${time(end, tz)}`
const utc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const fmt = (key: string, o: Intl.DateTimeFormatOptions) => utc(key).toLocaleDateString('en-US', { timeZone: 'UTC', ...o })

const VISIT_INDENT = '  '
const DETAIL_INDENT = '      '
// wide enough for "10:30 AM - 12:00 PM"
const TIME_WIDTH = 19

/** "label: text", with any further lines of text lined up under the first. */
function labelled(indent: string, label: string, text: string): string[] {
  const head = `${indent}${label}: `
  const pad = ' '.repeat(head.length)
  return text.split(/\r?\n/).map((line, i) => (i ? pad : head) + line.trimEnd())
}

function visitLines(v: Visit): string[] {
  // The export deliberately leaves out the job site, address and position that the screen shows.
  const lines = [`${VISIT_INDENT}${span(v.start, v.end, v.tz).padEnd(TIME_WIDTH)}   ${v.title}`]
  if (v.ownTimes) {
    lines.push(`${DETAIL_INDENT}Times: ${v.ownTimes.map((t) => `${t.person.name || 'Unnamed'} ${span(t.start, t.end, v.tz)}`).join('; ')}`)
  }
  const alertsText = v.alerts ? formatFieldAlertsExport(v.alerts) : ''
  if (alertsText) lines.push(...labelled(DETAIL_INDENT, 'Alerts', alertsText))
  if (v.checklists && v.checklists.length > 0) {
    const text = v.checklists
      .map((c) => (c.completionPercentage != null ? `${c.name} (${c.completionPercentage}%)` : c.name))
      .join(', ')
    lines.push(...labelled(DETAIL_INDENT, 'Checklist', text))
  }
  if (v.siteNote) lines.push(...labelled(DETAIL_INDENT, 'Site note', v.siteNote))
  for (const n of v.shiftNotes) lines.push(...labelled(DETAIL_INDENT, 'Shift note', n))
  return lines
}

function blockList(label: string, blocks: Block[]): string[] {
  const text = blocks
    .map((b) => {
      const note = b.note ? ` (${b.note.replace(/\s+/g, ' ').trim()})` : ''
      return `${b.person?.name || 'Unassigned'} ${span(b.start, b.end, b.tz)}${note}`
    })
    .join('\n')
  return labelled('', label, text)
}

function dayLines(day: TeamDay): string[] {
  const lines = [fmt(day.key, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()]
  if (day.onCall.length) lines.push(...blockList('On call', day.onCall))
  for (const team of day.teams) {
    const names = team.cleaners.map((p) => p.name || 'Unnamed staff')
    lines.push('', names.length === 0 ? 'Unassigned' : names.length === 1 ? `${names[0]} (solo)` : names.join(' & '))
    for (const v of team.visits) lines.push(...visitLines(v))
  }
  if (day.blocks.length) lines.push('', ...blockList('Also booked', day.blocks))
  return lines
}

const range = (weekStart: string) => {
  const end = addDays(weekStart, 6)
  const a = fmt(weekStart, { month: 'short', day: 'numeric' })
  const sameMonth = weekStart.slice(0, 7) === end.slice(0, 7)
  const b = fmt(end, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${a}-${b}, ${end.slice(0, 4)}`
}

export const teamsDocTitle = (weekStart: string) => `Daily teams - ${range(weekStart)}`

/** The Daily teams report as plain text, one block per day. */
export function teamsText(weekStart: string, days: TeamDay[]): string {
  const long: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
  const header = [
    'DAILY TEAMS',
    `Week of ${fmt(weekStart, long)} - ${fmt(addDays(weekStart, 6), { ...long, year: 'numeric' })}`,
  ]
  const body = days.length ? days.flatMap((d) => ['', ...dayLines(d)]) : ['', 'No shifts scheduled.']
  return [...header, ...body].join('\n') + '\n'
}
