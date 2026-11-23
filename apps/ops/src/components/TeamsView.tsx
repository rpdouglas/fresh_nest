import { useMemo } from 'react'
import { formatBadgeLabel } from '../lib/fieldNotes'
import { formatTime } from '../lib/schedule'
import type { Block, Team, TeamDay, Visit } from '../lib/teams'
import { buildTeamDays, dateParts, initials, siteLine, weekStrip } from '../lib/teams'
import type { Shift } from '../types'
import VisitPhotos from './VisitPhotos'

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
const muted = 'text-ink-muted'
const tag = 'flex-none rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] uppercase'

function Note({ kind, text }: { kind: 'Site' | 'Shift'; text: string }) {
  const tone =
    kind === 'Site'
      ? 'bg-[#eaf2f5] text-[#234d62] dark:bg-sky-900/50 dark:text-sky-200'
      : 'bg-[#fdf0e3] text-[#8a4208] dark:bg-amber-900/40 dark:text-amber-200'
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${tag} ${tone}`}>{kind}</span>
      <span className="min-w-0 whitespace-pre-wrap">{text}</span>
    </div>
  )
}

function VisitRow({ visit: v }: { visit: Visit }) {
  const site = siteLine(v, ' · ')
  const hasAlerts = !!v.alerts && v.alerts.badges.length > 0
  const hasNotes = !!v.siteNote || v.shiftNotes.length > 0 || !!v.ownTimes || hasAlerts
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-hairline px-4 py-3.5 last:border-b-0 print:break-inside-avoid print:py-2">
      <div className="flex flex-none basis-24 flex-col tabular-nums">
        <span className="font-bold">{formatTime(v.start, v.tz)}</span>
        <span className={`text-sm ${muted}`}>to {formatTime(v.end, v.tz)}</span>
      </div>
      <div className="flex min-w-0 flex-1 basis-44 flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold">{v.title}</span>
          {v.positions.map((p) => (
            <span key={p} className={`${tag} bg-ink/10 text-ink`}>
              {p}
            </span>
          ))}
        </span>
        {site && <span className={`text-sm ${muted}`}>{site}</span>}
        {v.checklists && v.checklists.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5" aria-label="Assigned checklists">
            {v.checklists.map((c) => {
              const isComplete = c.completionPercentage === 100
              const tone = isComplete
                ? 'border border-sage-deep/25 bg-sage/40 text-ink dark:border-sage/40 dark:bg-sage/20'
                : 'border border-hairline bg-surface-sunken/60 text-ink'
              return (
                <span
                  key={c.name}
                  data-testid="checklist-badge"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
                >
                  <span aria-hidden="true" className={isComplete ? 'font-bold text-positive' : 'text-ink-muted'}>
                    {isComplete ? '✓' : '📋'}
                  </span>
                  <span>{c.name}</span>
                  {c.completionPercentage != null && <span className="text-ink-muted tabular-nums"> ({c.completionPercentage}%)</span>}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 basis-52 flex-col gap-1.5 text-sm">
        {hasAlerts && (
          <div className="flex flex-wrap gap-1.5" aria-label="Field alerts">
            {v.alerts!.badges.map((b, i) => (
              <span
                key={`${b.kind}-${i}`}
                data-testid={`badge-${b.kind}`}
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-[0.04em] uppercase ${
                  b.category === 'security'
                    ? 'border-clay/40 bg-clay/15 text-clay-text dark:border-clay/50 dark:bg-clay/25'
                    : 'border-amber-300 bg-[#fdf0e3] text-[#8a4208] dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                }`}
              >
                {formatBadgeLabel(b)}
              </span>
            ))}
          </div>
        )}
        {v.siteNote && <Note kind="Site" text={v.siteNote} />}
        {v.shiftNotes.map((n) => (
          <Note key={n} kind="Shift" text={n} />
        ))}
        {v.ownTimes && (
          <span className={muted}>
            {v.ownTimes.map((t) => `${t.person.name || 'Unnamed'} ${formatTime(t.start, v.tz)} – ${formatTime(t.end, v.tz)}`).join(' · ')}
          </span>
        )}
        {!hasNotes && <span className={muted}>No notes</span>}
        <VisitPhotos visitId={v.key} />
      </div>
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  const unassigned = team.cleaners.length === 0
  const tz = team.visits[0].tz
  // Always show a Cleaner 2 slot so a solo day is obvious at a glance.
  const slots = team.cleaners.length === 1 ? [team.cleaners[0], null] : team.cleaners
  const shell = unassigned ? 'border-[#f0c9a0] dark:border-amber-800' : 'border-hairline print:border-slate-400'
  const head = unassigned
    ? 'border-[#f0c9a0] bg-[#fdf0e3] text-[#8a4208] dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
    : 'border-hairline bg-sage print:border-slate-400'
  return (
    <article className={`min-w-0 flex-1 basis-[460px] overflow-hidden rounded-[14px] border bg-surface-raised ${shell}`}>
      <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b px-4 py-3.5 print:py-2 ${head}`}>
        <div aria-hidden="true" className="flex print:hidden">
          {unassigned ? (
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-current font-bold">?</span>
          ) : (
            slots.map((p, i) => (
              <span
                key={p?.id ?? 'solo'}
                className={`flex size-10 items-center justify-center rounded-full border-2 border-sage text-sm font-bold ${
                  i ? '-ml-2.5' : ''
                } ${p ? (i % 2 ? 'bg-band text-white' : 'bg-accent text-on-nest-teal') : 'border-dashed !border-outline bg-surface-raised text-ink-muted'}`}
              >
                {p ? initials(p.name) : '–'}
              </span>
            ))
          )}
        </div>
        <div className="flex flex-1 basis-56 flex-wrap gap-x-5 gap-y-1">
          {unassigned ? (
            <div className="flex flex-col">
              <span className="text-[11px] tracking-[0.08em] uppercase">Needs a team</span>
              <span className="text-base font-bold">Unassigned</span>
            </div>
          ) : (
            slots.map((p, i) => (
              <div key={p?.id ?? 'solo'} className="flex flex-col">
                <span className="text-[11px] tracking-[0.08em] text-ink-muted uppercase">Cleaner {i + 1}</span>
                {p ? (
                  <span className="text-base font-bold">{p.name || 'Unnamed staff'}</span>
                ) : (
                  <span className={`text-base font-semibold ${muted}`}>Working solo</span>
                )}
              </div>
            ))
          )}
        </div>
        <span className={`text-[13px] ${unassigned ? '' : 'text-ink-muted'}`}>
          {plural(team.visits.length, 'visit')} · {formatTime(team.start, tz)} – {formatTime(team.end, tz)}
        </span>
      </div>
      {team.visits.map((v) => (
        <VisitRow key={v.key} visit={v} />
      ))}
    </article>
  )
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <p className={`text-sm ${muted}`}>
      <span className="font-semibold text-ink">Also booked, no client or job site: </span>
      {blocks
        .map((b) => {
          const extra = [b.position, b.note].filter(Boolean).join(', ')
          return `${b.person?.name || 'Unassigned'} ${formatTime(b.start, b.tz)} – ${formatTime(b.end, b.tz)}${extra ? ` (${extra})` : ''}`
        })
        .join(' · ')}
    </p>
  )
}

function OnCall({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 rounded-[14px] border border-accent/40 bg-surface-raised px-4 py-3 dark:border-accent-dark/40 print:break-inside-avoid print:border-slate-400 print:py-2">
      <span className="font-display text-base font-bold text-accent dark:text-accent-dark">On call</span>
      <ul className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-1.5">
        {blocks.map((b) => (
          <li key={b.key} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">{b.person?.name || 'Unassigned'}</span>
            <span className={`text-sm tabular-nums ${muted}`}>
              {formatTime(b.start, b.tz)} – {formatTime(b.end, b.tz)}
            </span>
            {b.note && <span className="text-sm">{b.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Day({ day, first }: { day: TeamDay; first: boolean }) {
  const d = dateParts(day.key)
  const starts = day.teams[0]?.visits[0]
  return (
    <section id={`day-${day.key}`} className={`flex scroll-mt-4 flex-col gap-4 ${first ? '' : 'print:break-before-page'}`}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-2.5">
        <span className="font-display text-[56px] leading-[0.9] font-bold text-accent tabular-nums dark:text-accent-dark">{d.day}</span>
        <div className="flex flex-1 basis-40 flex-col">
          <h2 className="font-display text-2xl leading-tight font-bold">{d.weekday}</h2>
          <span className={`text-sm ${muted}`}>{d.month}</span>
        </div>
        <span className={`text-sm ${muted}`}>
          {plural(day.teams.length, 'team')} · {plural(day.visitCount, 'visit')}
          {day.onCall.length > 0 && ` · ${day.onCall.length} on call`}
          {starts && ` · first start ${formatTime(starts.start, starts.tz)}`}
        </span>
      </div>
      {day.onCall.length > 0 && <OnCall blocks={day.onCall} />}
      {day.teams.length > 0 && (
        <div className="flex flex-wrap items-start gap-4 print:block print:space-y-3">
          {day.teams.map((t) => (
            <TeamCard key={t.key} team={t} />
          ))}
        </div>
      )}
      {day.blocks.length > 0 && <Blocks blocks={day.blocks} />}
    </section>
  )
}

export default function TeamsView({ weekStart, shifts }: { weekStart: string; shifts: Shift[] }) {
  const days = useMemo(() => buildTeamDays(shifts), [shifts])
  const strip = useMemo(() => weekStrip(weekStart, days), [weekStart, days])
  return (
    <>
      <nav aria-label="Jump to a day" className="mb-7 flex flex-wrap gap-2 print:hidden">
        {strip.map((s) => {
          const label = dateParts(s.key).short
          const box = 'flex min-h-11 flex-1 basis-24 flex-col rounded-[10px] border px-3 py-1.5'
          return s.visits || s.onCall ? (
            <a key={s.key} href={`#day-${s.key}`} className={`${box} border-hairline bg-surface-raised hover:border-accent`}>
              <span className="font-bold">{label}</span>
              <span className={`text-xs ${muted}`}>
                {s.visits ? `${plural(s.teams, 'team')} · ${plural(s.visits, 'visit')}` : 'No visits'}
                {s.onCall > 0 && ` · ${s.onCall} on call`}
              </span>
            </a>
          ) : (
            <div key={s.key} className={`${box} border-dashed border-outline ${muted}`}>
              <span className="font-bold">{label}</span>
              <span className="text-xs">No visits</span>
            </div>
          )
        })}
      </nav>
      <div className="flex flex-col gap-10">
        {days.map((d, i) => (
          <Day key={d.key} day={d} first={i === 0} />
        ))}
      </div>
    </>
  )
}
