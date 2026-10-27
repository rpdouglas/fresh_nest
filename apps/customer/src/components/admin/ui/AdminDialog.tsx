import { useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogBehavior } from './useDialogBehavior'

// Phone-only additions (P3-E33). Appended as plain strings — not merged — so the classes each
// dialog uses at md+ stay exactly as they were.
const PHONE_OVERLAY = {
  fullscreen: 'max-md:p-0 max-md:items-stretch',
  centered: '',
} as const
const PHONE_PANEL = {
  fullscreen: 'max-md:max-w-none max-md:min-h-full max-md:my-0 max-md:rounded-none max-md:border-0 max-md:shadow-none',
  centered: '',
} as const

interface AdminDialogProps {
  open: boolean
  onClose: () => void
  labelledBy: string
  /** The overlay classes the dialog uses today (unchanged at md+). */
  overlayClassName: string
  /** The panel classes the dialog uses today (unchanged at md+). */
  panelClassName: string
  /** Phones: full-screen sheet (forms) or the centred card (short confirmations). */
  phoneLayout?: keyof typeof PHONE_PANEL
  /** Phones: a sticky ✕ close button at the top of full-screen sheets. */
  showPhoneClose?: boolean
  children: ReactNode
}

export function AdminDialog({
  open,
  onClose,
  labelledBy,
  overlayClassName,
  panelClassName,
  phoneLayout = 'fullscreen',
  showPhoneClose = phoneLayout === 'fullscreen',
  children,
}: AdminDialogProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogBehavior(open, panelRef, onClose)

  if (!open) return null

  return (
    <div className={`${overlayClassName} ${PHONE_OVERLAY[phoneLayout]}`.trim()}>
      <div
        ref={panelRef}
        className={`${panelClassName} ${PHONE_PANEL[phoneLayout]}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {showPhoneClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('admin.dialog.close')}
            className="md:hidden sticky top-0 z-10 self-end -mb-4 min-h-[48px] min-w-[48px] flex items-center justify-center rounded border border-sand bg-white font-body text-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
