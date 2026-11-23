import { useEffect, useRef, useState } from 'react'

interface Props {
  email: string
  /** When the report on screen was loaded from Camelo; null for a report that loads its own data. */
  loadedAt: Date | null
  busy: boolean
  onRefresh: () => void
  onSignOut: () => void
}

const ADMIN_PORTAL_URL = (import.meta.env.VITE_ADMIN_URL ?? '').trim() || 'https://lilypad-freshnest.web.app/admin'

/** Who is signed in, Admin Portal link, Refresh and Sign out (office users only). */
export default function AccountMenu(p: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const item =
    'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-ink/10 disabled:opacity-50'
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 flex-none items-center justify-center rounded-full border border-hairline bg-surface-raised text-ink hover:border-accent"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-12 right-0 z-40 flex w-64 flex-col gap-1 rounded-xl border border-hairline bg-surface-raised p-2 text-ink shadow-soft">
          <p className="px-3 pt-1 pb-2 text-xs break-all text-ink-muted">
            Signed in as {p.email}
            {p.loadedAt && (
              <>
                <br />
                Loaded {p.loadedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} from Camelo
              </>
            )}
          </p>
          <a
            href={ADMIN_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
            onClick={() => setOpen(false)}
          >
            Admin Portal ↗
          </a>
          <button
            type="button"
            className={item}
            disabled={p.busy}
            onClick={() => {
              p.onRefresh()
              setOpen(false)
            }}
          >
            {p.busy ? 'Loading…' : 'Refresh data'}
          </button>
          <button type="button" className={item} onClick={p.onSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
