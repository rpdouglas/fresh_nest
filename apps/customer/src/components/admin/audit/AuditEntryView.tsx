import { useTranslation } from 'react-i18next'
import type { AuditEntry } from '@/types'
import { cn } from '@/lib/utils/utils'
import {
  actorLabel,
  collectionLabel,
  entryActor,
  entryChanges,
  fieldLabel,
  formatAuditValue,
  localeOf,
  sourceLabel,
} from './auditDisplay'

interface AuditEntryViewProps {
  entry: AuditEntry
  /** Audit Logs tab: also name the record (type + label/ID). History sections already know it. */
  showRecord?: boolean
}

/** P3-E37: one audit entry — who, when, from which app, and each field old → new. */
export function AuditEntryView({ entry, showRecord = false }: AuditEntryViewProps) {
  const { t, i18n } = useTranslation()
  const changes = entryChanges(entry)
  const source = sourceLabel(entry.source, t)
  const action = entry.action ?? 'update'
  const fmt = (v: unknown) => formatAuditValue(v, t, i18n.language)

  return (
    <article className="flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-body text-base font-semibold text-charcoal">
          {t(`admin.audit.actions.${action}`)}
          {showRecord && (
            <span className="font-normal text-text-muted">
              {' · '}
              {collectionLabel(entry.collection, t)}
              {' · '}
              {entry.recordLabel || entry.documentId}
            </span>
          )}
        </span>
        <time className="font-body text-base text-text-muted" dateTime={entry.changedAt.toISOString()}>
          {entry.changedAt.toLocaleString(localeOf(i18n.language), { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </div>

      <p className="font-body text-base text-charcoal break-words">
        {actorLabel(entryActor(entry), t)}
        {source && <span className="text-text-muted">{` · ${source}`}</span>}
      </p>

      {changes.length > 0 && (
        <dl className="flex flex-col gap-1">
          {changes.map((c) => (
            <div key={c.field} className="flex flex-col sm:flex-row sm:gap-2 font-body text-base">
              <dt className="text-text-muted sm:w-48 shrink-0">{fieldLabel(c.field, t)}</dt>
              <dd className="text-charcoal break-words">
                {action !== 'create' && (
                  <>
                    <span className="line-through text-text-muted">{fmt(c.before)}</span>
                    <span aria-hidden="true" className="mx-1 text-text-muted">→</span>
                    <span className="sr-only">{t('admin.audit.changedTo')}</span>
                  </>
                )}
                <span>{fmt(c.after)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {action === 'delete' && entry.snapshot && (
        <details className="font-body text-base">
          <summary className="cursor-pointer text-slate-brand min-h-[48px] flex items-center">{t('admin.audit.snapshot')}</summary>
          <dl className="flex flex-col gap-1 mt-1">
            {Object.entries(entry.snapshot).map(([field, value]) => (
              <div key={field} className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-text-muted sm:w-48 shrink-0">{fieldLabel(field, t)}</dt>
                <dd className="text-charcoal break-words">{fmt(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {(entry.reason || entry.overrideType) && (
        <div className="flex flex-wrap items-center gap-2">
          {entry.overrideType && (
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded text-base font-medium border border-sand bg-cream text-charcoal',
                entry.overrideType === 'earnings_cap_exceeded' && 'bg-red-50 text-red-700 border-red-200',
                entry.overrideType.includes('travel_conflict_exceeded') && 'bg-amber-50 text-amber-700 border-amber-200',
                entry.overrideType === 'blocked_window_overlap' && 'bg-blue-50 text-blue-700 border-blue-200',
              )}
            >
              {entry.overrideType
                .split(',')
                .map((type) => t(`admin.audit.types.${type}`, { defaultValue: type }))
                .join(', ')}
            </span>
          )}
          {entry.reason && (
            <q className="font-body text-base italic text-charcoal bg-cream border-l-4 border-slate-brand px-2 py-1 rounded-r">
              {entry.reason}
            </q>
          )}
        </div>
      )}
    </article>
  )
}
