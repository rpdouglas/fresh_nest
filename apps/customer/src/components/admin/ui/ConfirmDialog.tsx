import { useId } from 'react'
import { cn } from '@/lib/utils/utils'
import { AdminDialog } from './AdminDialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** `danger` styles the confirm button red (e.g. cancelling a booking). */
  tone?: 'default' | 'danger'
}

/** P3-E33: plain-language confirmation before a consequential admin action. */
export function ConfirmDialog({
  open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, tone = 'default',
}: ConfirmDialogProps) {
  const titleId = useId()
  return (
    <AdminDialog
      open={open}
      onClose={onCancel}
      labelledBy={titleId}
      phoneLayout="centered"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 overflow-y-auto"
      panelClassName="bg-white border border-sand rounded shadow-lg max-w-md w-full p-6 flex flex-col gap-4"
    >
      <h2 id={titleId} className="font-sub text-2xl text-charcoal">{title}</h2>
      <p className="font-body text-base text-charcoal">{body}</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium text-base rounded hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'min-h-[48px] px-6 py-2 text-white font-body font-medium text-base rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
            tone === 'danger' ? 'bg-red-700 hover:bg-red-800 focus:ring-red-700' : 'bg-slate-brand hover:bg-slate-dark focus:ring-slate-brand',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </AdminDialog>
  )
}
