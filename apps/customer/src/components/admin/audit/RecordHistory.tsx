import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecordHistory, HISTORY_LIMIT, type HistoryRecord } from '../hooks/useRecordHistory'
import { AuditEntryView } from './AuditEntryView'

interface RecordHistoryProps {
  /** The record(s) whose changes are listed together — e.g. a booking and its job. */
  records: HistoryRecord[]
  /** Open on mount (History dialogs); sections in panels start collapsed. */
  defaultOpen?: boolean
  /** Hide the heading/toggle (the dialog provides its own title). */
  bare?: boolean
}

/** P3-E37: "who changed this, and when" for a record, loaded only when opened. Office only. */
export function RecordHistory({ records, defaultOpen = false, bare = false }: RecordHistoryProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  const regionId = useId()
  const { entries, loading, error, atLimit } = useRecordHistory(records, open)

  const body = (
    <div id={regionId} className="divide-y divide-sand">
      {loading && entries.length === 0 ? (
        <p className="font-body text-base text-text-muted py-4">{t('admin.audit.history.loading')}</p>
      ) : error ? (
        <p role="alert" className="font-body text-base text-red-700 py-4">{t('admin.audit.history.error')}</p>
      ) : entries.length === 0 ? (
        <p className="font-body text-base text-text-muted py-4">{t('admin.audit.history.empty')}</p>
      ) : (
        <>
          {entries.map((entry) => <AuditEntryView key={entry.id} entry={entry} />)}
          {atLimit && (
            <p className="font-body text-base text-text-muted py-4">{t('admin.audit.history.limitNote', { count: HISTORY_LIMIT })}</p>
          )}
        </>
      )}
    </div>
  )

  if (bare) return body

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="self-start min-h-[48px] px-4 border border-sand rounded font-body text-base font-medium text-slate-brand bg-white hover:bg-slate-pale focus:outline-none focus:ring-2 focus:ring-slate-brand"
      >
        {t(open ? 'admin.audit.history.hide' : 'admin.audit.history.show')}
      </button>
      {open && body}
    </section>
  )
}
