// Overtime warning for a pay period, which is taken to be the work week (Friday to
// Thursday). Ontario's Employment Standards Act pays overtime after 44 hours of work
// in a week. The rules, in one place:
//  - worked = every timesheet in the period except rejected ones and leave (leave is
//    not time worked), in exact minutes; an entry still clocked in counts up to now;
//  - still to come = the person's shifts that have not ended yet, On Call left out:
//    the whole shift (less its break) if it has not started, else the time left;
//  - projected = worked + still to come. Someone is "over" once worked passes 44 h,
//    "on course" when the projection passes it, and "near" from 40 h projected.
import type { ReviewSheet, ReviewShift } from '../types'
import { scheduledMinutes } from './review'
import { isOnCall } from './schedule'

export const OVERTIME_MINUTES = 44 * 60
export const NEAR_MINUTES = 40 * 60

export type OvertimeLevel = 'over' | 'on-course' | 'near'

export interface OvertimeRow {
  key: string
  name: string
  worked: number
  toCome: number
  projected: number
  level: OvertimeLevel
}

const ms = (iso: string) => Date.parse(iso)

/** Everyone at or past NEAR_MINUTES projected, most hours first. */
export function overtime(timesheets: ReviewSheet[], shifts: ReviewShift[], now: number): OvertimeRow[] {
  const people = new Map<string, { name: string; worked: number; toCome: number }>()
  const person = (id: string, name: string | null) => {
    if (!people.has(id)) people.set(id, { name: name || 'Unnamed employee', worked: 0, toCome: 0 })
    return people.get(id)!
  }
  for (const t of timesheets) {
    if (!t.employee || t.state === 'REJECTED' || t.referenceObject?.__typename === 'LeaveRequest') continue
    const minutes = t.to ? (t.totalDuration ?? 0) : Math.max(0, Math.round((now - ms(t.from)) / 60_000))
    person(t.employee.id, t.employee.name).worked += minutes
  }
  for (const s of shifts) {
    if (!s.assignee || ms(s.endTime) <= now || isOnCall(s.group?.name?.trim() || null)) continue
    const left = ms(s.startTime) >= now ? scheduledMinutes(s) : Math.round((ms(s.endTime) - now) / 60_000)
    person(s.assignee.id, s.assignee.name).toCome += left
  }
  return [...people.entries()]
    .map(([key, p]) => ({ key, name: p.name, worked: p.worked, toCome: p.toCome, projected: p.worked + p.toCome }))
    .filter((r) => r.projected >= NEAR_MINUTES)
    .map((r): OvertimeRow => ({ ...r, level: r.worked > OVERTIME_MINUTES ? 'over' : r.projected > OVERTIME_MINUTES ? 'on-course' : 'near' }))
    .sort((a, b) => b.projected - a.projected || a.name.localeCompare(b.name))
}
