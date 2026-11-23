import type { ReactNode } from 'react'
import { HUBS, type HubId } from '../lib/hubs'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** One small line drawing per hub. */
const ICONS: Record<HubId, ReactNode> = {
  home: <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" {...stroke} />,
  schedule: (
    <g {...stroke}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </g>
  ),
  pay: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </g>
  ),
  billing: (
    <g {...stroke}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </g>
  ),
  clients: <path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.6L12 16.8 7.1 19.3l.9-5.6-4-3.9 5.6-.8z" {...stroke} />,
}

/**
 * The five hubs (decision 0042): along the bottom of a phone, clear of the home indicator, and down the left side on
 * a laptop. Choosing a hub opens its first page.
 */
export default function TabBar({ hub, onHub }: { hub: HubId; onHub: (hub: HubId) => void }) {
  return (
    <nav
      aria-label="Hubs"
      className="fixed inset-x-0 bottom-0 z-30 flex rounded-t-2xl border-t border-hairline bg-surface-raised pb-[env(safe-area-inset-bottom)] shadow-soft lg:inset-y-0 lg:right-auto lg:w-24 lg:flex-col lg:gap-1 lg:rounded-none lg:border-t-0 lg:border-r lg:pt-4 lg:pb-4 print:hidden"
    >
      {HUBS.map((h) => {
        const active = h.id === hub
        return (
          <button
            key={h.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onHub(h.id)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight font-semibold lg:min-h-16 lg:flex-none ${
              active ? 'text-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {/* the current hub's icon in a teal pill (decision 0043) */}
            <span
              className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? 'bg-accent text-on-nest-teal shadow-soft' : ''}`}
            >
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
                {ICONS[h.id]}
              </svg>
            </span>
            {h.label}
          </button>
        )
      })}
    </nav>
  )
}
