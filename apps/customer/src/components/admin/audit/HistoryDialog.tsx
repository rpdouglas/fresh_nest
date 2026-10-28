import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminDialog } from '../ui/AdminDialog'
import { RecordHistory } from './RecordHistory'
import type { HistoryRecord } from '../hooks/useRecordHistory'

interface HistoryDialogProps {
  open: boolean
  onClose: () => void
  /** Who/what the history is about, e.g. the client name or the staff member. */
  title: string
  records: HistoryRecord[]
}

/** P3-E37: a record's audit history in a dialog (Dispatch cards, Staff Registry). */
export function HistoryDialog({ open, onClose, title, records }: HistoryDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="fixed inset-0 z-50 flex items-start justify-center bg-charcoal/50 p-4 overflow-y-auto"
      panelClassName="w-full max-w-2xl bg-white rounded border border-sand shadow-lg my-8 p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="font-sub text-2xl text-charcoal">
          {t('admin.audit.history.title', { name: title })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="max-md:hidden min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal hover:bg-cream focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {t('admin.audit.history.close')}
        </button>
      </div>
      {open && <RecordHistory records={records} defaultOpen bare />}
    </AdminDialog>
  )
}
