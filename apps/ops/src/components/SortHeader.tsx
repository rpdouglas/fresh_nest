import type { ReactNode } from 'react'
import type { SortDir } from '../lib/sort'

/** A column header that sorts the table; aria-sort tells screen readers which column and which way. */
export default function SortHeader(p: {
  className: string
  active: boolean
  dir: SortDir
  onSort: () => void
  right?: boolean
  children: ReactNode
}) {
  return (
    <th className={p.className} aria-sort={p.active ? (p.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        onClick={p.onSort}
        className={`inline-flex items-center gap-1 rounded uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-accent print:pointer-events-none ${p.right ? 'flex-row-reverse' : ''} ${p.active ? 'text-ink' : ''}`}
      >
        {p.children}
        <span aria-hidden="true" className={`text-[10px] ${p.active ? '' : 'opacity-30'} print:hidden`}>
          {p.active ? (p.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}
