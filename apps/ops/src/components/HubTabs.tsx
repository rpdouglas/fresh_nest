import type { Hub } from '../lib/hubs'
import type { View } from '../types'

/**
 * A hub's pages as tabs along the top (decision 0042), left out for a hub with one page; and under them, for a page
 * that holds several reports, a small switch between them (items 2.3.5 to 2.3.7).
 */
export default function HubTabs({ hub, view, onView }: { hub: Hub; view: View; onView: (view: View) => void }) {
  const page = hub.pages.find((p) => p.views.includes(view))!
  return (
    <div className="mb-4 grid gap-3 print:hidden">
      {hub.pages.length > 1 && (
        <nav aria-label={`${hub.label} pages`} className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="flex w-max gap-2">
            {hub.pages.map((p) => {
              const active = p === page
              return (
                <button
                  key={p.tab}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onView(p.views[0])}
                  className={`min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-nowrap ${
                    active ? 'border-accent bg-accent text-on-nest-teal' : 'border-hairline bg-surface-raised text-ink hover:border-accent'
                  }`}
                >
                  {p.tab}
                </button>
              )
            })}
          </div>
        </nav>
      )}
      {page.choose && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div
            role="radiogroup"
            aria-label={page.choose.label}
            className="flex flex-wrap items-center gap-1 rounded-xl bg-surface-sunken p-1"
          >
            <span className="px-2 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">{page.choose.label}</span>
            {page.choose.choices.map((choice, i) => {
              const v = page.views[i]
              const on = v === view
              return (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onView(v)}
                  className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${on ? 'bg-surface-raised text-accent shadow-soft' : 'text-ink-muted hover:text-ink'}`}
                >
                  {choice}
                </button>
              )
            })}
          </div>
          {/* My week is on This week's page, reached from the cleaner grouping rather than the switch */}
          {view === 'staff' && (
            <button type="button" onClick={() => onView('myweek')} className="min-h-11 text-sm font-semibold text-accent hover:underline">
              See a cleaner's week as they see it →
            </button>
          )}
          {view === 'myweek' && (
            <button type="button" onClick={() => onView('staff')} className="min-h-11 text-sm font-semibold text-accent hover:underline">
              ← Back to the week by cleaner
            </button>
          )}
        </div>
      )}
    </div>
  )
}
