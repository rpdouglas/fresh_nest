import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { groupVisitPhotos } from '../lib/photos'
import { visitPhotosQuery } from '../lib/queries'
import { type Filters, filterShifts, groupByClient, groupByStaff, notOnCall, stats } from '../lib/schedule'
import type { Shift, View } from '../types'
import GroupCard from './GroupCard'
import { type PhotosOnPage, PhotosContext } from './photosContext'
import TeamsView from './TeamsView'
import type { Editor } from './useEditor'

interface Props {
  /** Daily teams, By client or By staff. */
  view: View
  weekStart: string
  /** The week's shifts as loaded, On Call included. */
  shifts: Shift[]
  filters: Filters
  editor?: Editor | null
  onExpired?: (message: string) => void
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-raised px-3.5 py-2 print:border-slate-300">
      <b className="block text-xl">{value}</b>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  )
}

/** The three reports drawn from one week of shifts: all their working-out is here, inside the report's error boundary. */
export default function WeekReports({ view, weekStart, shifts: loaded, filters, editor, onExpired }: Props) {
  // On Call shifts only say who is on call: Daily teams lists them, nothing else does.
  const working = useMemo(() => loaded.filter(notOnCall), [loaded])
  const shifts = view === 'teams' ? loaded : working
  const visible = useMemo(() => filterShifts(shifts, filters), [shifts, filters])
  const groups = useMemo(() => (view === 'teams' ? [] : view === 'staff' ? groupByStaff(visible) : groupByClient(visible)), [visible, view])
  const totals = useMemo(() => stats(visible), [visible])

  const shiftIds = useMemo(() => working.map((s) => s.id).slice(0, 300), [working])
  const token = editor?.token ?? ''
  const photosQ = useQuery({ ...visitPhotosQuery(shiftIds, token), enabled: !!token && shiftIds.length > 0 })
  const photos = useMemo(
    (): PhotosOnPage => ({
      token,
      byVisit: groupVisitPhotos(working, photosQ.data ?? []),
      loading: photosQ.isLoading,
      onExpired: onExpired ?? (() => {}),
      canAdd: false,
    }),
    [token, working, photosQ.data, photosQ.isLoading, onExpired],
  )

  if (visible.length === 0) {
    return (
      <p className="py-8 text-center text-ink-muted">
        {shifts.length ? 'No shifts match these filters.' : 'No shifts scheduled this week.'}
      </p>
    )
  }
  return (
    <PhotosContext.Provider value={photos}>
      {view === 'teams' ? (
        <TeamsView weekStart={weekStart} shifts={visible} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2.5">
            <Stat value={totals.shifts} label={totals.shifts === 1 ? 'shift' : 'shifts'} />
            <Stat value={totals.clients} label={totals.clients === 1 ? 'client' : 'clients'} />
            <Stat value={totals.staff} label="staff scheduled" />
            <Stat value={totals.unassigned} label="unassigned" />
          </div>
          {groups.map((g) => (
            <GroupCard key={g.key} group={g} view={view} />
          ))}
        </>
      )}
    </PhotosContext.Provider>
  )
}
