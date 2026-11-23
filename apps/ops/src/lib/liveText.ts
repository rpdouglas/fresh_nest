// How a live visit is described in words, on the Live board and on the Dashboard (decision 0043).
import type { LiveVisit } from './live'
import { formatTime } from './schedule'
import { TZ } from './week'

export const dur = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}` : `${mins} min`)

export const fmtTime = (ms: number) => formatTime(new Date(ms).toISOString(), TZ)

/** Why a visit is where it is: what is late, when someone clocked in, what pushes it back. */
export function visitWhy(visit: LiveVisit, grace: number): string {
  const start = Date.parse(visit.shift.startTime)
  if (visit.status === 'late') return 'No clock-in yet.'
  if (visit.status === 'no-show') return 'Ended with no timesheet.'
  if (visit.status === 'done') {
    return `In ${fmtTime(visit.inAt!)} · out ${fmtTime(visit.outAt!)}`
  }
  if (visit.status === 'due') {
    return `Late after ${fmtTime(start + grace * 60_000)}.`
  }
  if (visit.status === 'on-site' || visit.status === 'wrong-place' || visit.status === 'running-over') {
    let t = `In ${fmtTime(visit.inAt!)}`
    if (visit.lateBy > 0) t += ` (${visit.lateBy} min late)`
    if (visit.wrongPlace) t += ` (at different client/site)`
    if (visit.status !== 'running-over') {
      t += `. Expected finish ${fmtTime(visit.expectedFinish)}.`
    }
    return t
  }
  if (visit.riskMinutes > 0 && visit.riskFrom) {
    return `Expected ${fmtTime(visit.expectedArrival)}: ${visit.riskFrom.clientName} finishes about ${fmtTime(visit.riskFrom.finishTime)}, then ${visit.riskFrom.driveMinutes} min drive.`
  }
  if (visit.expectedArrival > start) {
    return `Expected ${fmtTime(visit.expectedArrival)}, within the grace.`
  }
  return ''
}
