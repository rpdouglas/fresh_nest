import type { Group } from '../lib/schedule'
import { formatTime, positionOf, staffOn } from '../lib/schedule'
import { TZ } from '../lib/week'
import type { Person, Shift, View } from '../types'
import VisitPhotos from './VisitPhotos'

const names = (people: Person[]) => people.map((p) => p.name || 'Unnamed staff').join(', ')

function ShiftRow({ shift: s, view, person }: { shift: Shift; view: View; person: Person | null }) {
  const tz = s.timezone || TZ
  const staff = staffOn(s)
  // By-staff cards lead with the client; by-client cards lead with who is working.
  const lead = view === 'staff' ? person : s.assignee
  const others = staff.filter((p) => p.id !== lead?.id)

  const meta: string[] = []
  const site = [s.jobSite?.name, s.jobSite?.address].filter(Boolean).join(', ')
  if (site) meta.push(site)
  if (s.title) meta.push(s.title)
  if (s.breakDuration) meta.push(`${s.breakDuration} min break`)
  if (s.schedule?.name) meta.push(`schedule: ${s.schedule.name}`)
  for (const ca of s.checklistAssignments ?? []) {
    if (!ca.checklist?.name) continue
    meta.push(`checklist: ${ca.checklist.name}` + (ca.completionPercentage != null ? ` (${ca.completionPercentage}%)` : ''))
  }

  const notes: string[] = []
  if (s.jobSite?.note) notes.push(`Site note: ${s.jobSite.note}`)
  if (s.note) notes.push(s.note)
  if (s.systemNote) notes.push(`System: ${s.systemNote}`)

  return (
    <div className="grid gap-x-3 gap-y-1 border-b border-hairline px-4 py-2.5 last:border-b-0 sm:grid-cols-[9.5rem_1fr]">
      <div className="font-semibold tabular-nums">
        {formatTime(s.startTime, tz)} – {formatTime(s.endTime, tz)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {view === 'staff' ? (
            <span className="font-semibold">{s.client?.name || 'No client attached'}</span>
          ) : s.assignee ? (
            <span className="font-semibold">{s.assignee.name || 'Unnamed staff'}</span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 text-sm font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Unassigned
            </span>
          )}
          {others.length > 0 && <span className="text-sm text-ink-muted">with {names(others)}</span>}
          {positionOf(s) && <span className="rounded-full bg-ink/10 px-2 text-xs font-medium text-ink">{positionOf(s)}</span>}
          {s.state && (
            <span className="rounded-full border border-hairline px-2 text-xs text-ink-muted dark:border-outline">
              {s.state.replace(/_/g, ' ').toLowerCase()}
            </span>
          )}
        </div>
        {meta.length > 0 && <div className="text-sm text-ink-muted">{meta.join(' · ')}</div>}
        {notes.map((n, i) => (
          <div key={i} className="mt-0.5 text-sm whitespace-pre-wrap">
            {n}
          </div>
        ))}
        <VisitPhotos visitId={s.id} />
      </div>
    </div>
  )
}

export default function GroupCard({ group, view }: { group: Group; view: View }) {
  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-hairline bg-surface-raised print:break-inside-avoid print:border-slate-300">
      <header className="flex flex-wrap items-baseline gap-x-3 border-b border-hairline px-4 py-3">
        <h2 className="text-[17px] font-semibold text-accent dark:text-accent-dark">{group.title}</h2>
        {group.subtitle.length > 0 && <div className="text-sm text-ink-muted">{group.subtitle.join(' · ')}</div>}
        <div className="ml-auto text-sm text-ink-muted">
          {group.count} {group.count === 1 ? 'shift' : 'shifts'}
        </div>
      </header>
      {group.days.map((day) => (
        <div key={day.key}>
          <div className="border-b border-hairline bg-surface-sunken/40 px-4 py-1.5 text-sm font-semibold dark:bg-surface-sunken/50">
            {day.label}
          </div>
          {day.shifts.map((s) => (
            <ShiftRow key={s.id} shift={s} view={view} person={group.person} />
          ))}
        </div>
      ))}
    </section>
  )
}
