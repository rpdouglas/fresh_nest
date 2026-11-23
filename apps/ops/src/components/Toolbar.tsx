import type { Filters, Option } from '../lib/schedule'
import { NO_FILTERS } from '../lib/schedule'

interface Props {
  filters: Filters
  options: { clients: Option[]; staff: Option[]; schedules: Option[]; positions: Option[] }
  onFilters: (filters: Filters) => void
  /** Client hours has no notion of an unassigned shift, and searches different things. */
  hideUnassigned?: boolean
  searchHint?: string
}

const control = 'rounded-lg border border-outline bg-surface-raised px-3 py-1.5 text-sm disabled:opacity-50'

function Select(props: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <select
      aria-label={props.label}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className={`${control} max-w-full min-w-0 flex-1 basis-36 sm:flex-none sm:basis-auto`}
    >
      <option value="">{props.label}</option>
      {props.options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}

export default function Toolbar(p: Props) {
  const set = (patch: Partial<Filters>) => p.onFilters({ ...p.filters, ...patch })
  const filtered = JSON.stringify(p.filters) !== JSON.stringify(NO_FILTERS)

  return (
    <div className="mb-4 space-y-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder={p.searchHint ?? 'Search client, staff, address, notes'}
          aria-label="Search"
          value={p.filters.query}
          onChange={(e) => set({ query: e.target.value })}
          className={`${control} min-w-0 flex-1 basis-full sm:basis-56`}
        />
        <Select label="All clients" value={p.filters.clientId} options={p.options.clients} onChange={(clientId) => set({ clientId })} />
        <Select label="All staff" value={p.filters.staffId} options={p.options.staff} onChange={(staffId) => set({ staffId })} />
        {p.options.positions.length > 1 && (
          <Select
            label="All positions"
            value={p.filters.position}
            options={p.options.positions}
            onChange={(position) => set({ position })}
          />
        )}
        {p.options.schedules.length > 1 && (
          <Select
            label="All schedules"
            value={p.filters.scheduleId}
            options={p.options.schedules}
            onChange={(scheduleId) => set({ scheduleId })}
          />
        )}
        {!p.hideUnassigned && (
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={p.filters.unassignedOnly} onChange={(e) => set({ unassignedOnly: e.target.checked })} />
            Unassigned only
          </label>
        )}
        {filtered && (
          <button className="text-sm text-accent underline dark:text-accent-dark" onClick={() => p.onFilters(NO_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
