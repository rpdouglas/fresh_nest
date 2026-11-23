import { useMemo } from 'react'
import { clientHoursOptions } from '../lib/clientHours'
import { type Filters, filterOptions, notOnCall } from '../lib/schedule'
import type { Shift, Timesheet, View } from '../types'
import Toolbar from './Toolbar'

interface Props {
  view: View
  /** Client hours filters timesheets; the week reports filter shifts. */
  clientHours: boolean
  shifts: Shift[]
  timesheets: Timesheet[]
  filters: Filters
  onFilters: (filters: Filters) => void
}

/** The filter bar with its choices worked out from what is loaded. App draws it inside a quiet error boundary. */
export default function FilterBar({ view, clientHours, shifts, timesheets, filters, onFilters }: Props) {
  const options = useMemo(
    // On Call is offered as a choice only on Daily teams, the one report that lists it
    () => (clientHours ? clientHoursOptions(timesheets) : filterOptions(view === 'teams' ? shifts : shifts.filter(notOnCall))),
    [clientHours, timesheets, shifts, view],
  )
  return (
    <Toolbar
      filters={filters}
      options={options}
      onFilters={onFilters}
      hideUnassigned={clientHours}
      searchHint={clientHours ? 'Search client, site, address, cleaner' : undefined}
    />
  )
}
