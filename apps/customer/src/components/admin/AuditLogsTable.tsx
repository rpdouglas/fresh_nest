import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuditLogs } from './hooks/useAuditLogs'
import { AuditEntryView } from './audit/AuditEntryView'
import { actorLabel, collectionLabel, dayOf, entryActor, matchesSearch, sourceLabel } from './audit/auditDisplay'

interface AuditLogsTableProps {
  isAuthorized: boolean
}

const fieldClass =
  'min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand'

const uniqueSorted = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort()

// P3-E37: the whole audit log — every audited change, newest first — with filters.
export function AuditLogsTable({ isAuthorized }: AuditLogsTableProps) {
  const { t } = useTranslation()
  const { logs, isLoading, error } = useAuditLogs(isAuthorized)

  const [collectionFilter, setCollectionFilter] = useState('all')
  const [overrideFilter, setOverrideFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const collections = useMemo(() => uniqueSorted(logs.map((l) => l.collection)), [logs])
  const overrides = useMemo(() => uniqueSorted(logs.flatMap((l) => (l.overrideType ?? '').split(','))), [logs])
  const people = useMemo(() => uniqueSorted(logs.map(entryActor)), [logs])
  const sources = useMemo(() => uniqueSorted(logs.map((l) => l.source)), [logs])

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const day = dayOf(log.changedAt)
        return (
          (collectionFilter === 'all' || log.collection === collectionFilter) &&
          (overrideFilter === 'all' || (log.overrideType ?? '').split(',').includes(overrideFilter)) &&
          (personFilter === 'all' || entryActor(log) === personFilter) &&
          (sourceFilter === 'all' || log.source === sourceFilter) &&
          (!from || day >= from) &&
          (!to || day <= to) &&
          matchesSearch(log, searchQuery)
        )
      }),
    [logs, collectionFilter, overrideFilter, personFilter, sourceFilter, from, to, searchQuery],
  )

  const filtersActive =
    collectionFilter !== 'all' || overrideFilter !== 'all' || personFilter !== 'all' || sourceFilter !== 'all' ||
    Boolean(from || to || searchQuery)
  const clearFilters = () => {
    setCollectionFilter('all')
    setOverrideFilter('all')
    setPersonFilter('all')
    setSourceFilter('all')
    setFrom('')
    setTo('')
    setSearchQuery('')
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white border border-sand rounded text-center text-charcoal">
        {t('admin.login.errorTitle')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">{t('admin.audit.title')}</h2>
        <p className="font-body text-base text-text-muted">{t('admin.audit.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-cream border border-sand rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="audit-search" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.searchLabel')}
          </label>
          <input
            id="audit-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.audit.filters.search')}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-collection" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.collection')}
          </label>
          <select id="audit-collection" value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className={fieldClass}>
            <option value="all">{t('admin.audit.filters.all')}</option>
            {collections.map((c) => <option key={c} value={c}>{collectionLabel(c, t)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-person" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.person')}
          </label>
          <select id="audit-person" value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} className={fieldClass}>
            <option value="all">{t('admin.audit.filters.all')}</option>
            {people.map((p) => <option key={p} value={p}>{actorLabel(p, t)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-source" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.source')}
          </label>
          <select id="audit-source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={fieldClass}>
            <option value="all">{t('admin.audit.filters.all')}</option>
            {sources.map((s) => <option key={s} value={s}>{sourceLabel(s, t)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-override" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.overrideType')}
          </label>
          <select id="audit-override" value={overrideFilter} onChange={(e) => setOverrideFilter(e.target.value)} className={fieldClass}>
            <option value="all">{t('admin.audit.filters.all')}</option>
            {overrides.map((o) => <option key={o} value={o}>{t(`admin.audit.types.${o}`, { defaultValue: o })}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-from" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.from')}
          </label>
          <input id="audit-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-to" className="font-body text-base font-semibold text-charcoal">
            {t('admin.audit.filters.to')}
          </label>
          <input id="audit-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex items-end justify-between gap-4 sm:col-span-2 lg:col-span-4">
          <p className="font-body text-base text-text-muted" aria-live="polite">
            {t('admin.audit.filters.count', { count: filteredLogs.length })}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[48px] px-4 border border-slate-brand text-slate-brand font-body text-base font-medium rounded hover:bg-slate-pale focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              {t('admin.audit.filters.clear')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center font-body text-base text-text-muted">{t('admin.audit.loading')}</div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 text-center border border-sand border-dashed rounded bg-white font-body text-base text-text-muted">
          {t('admin.audit.noLogs')}
        </div>
      ) : (
        <div className="bg-white border border-sand rounded shadow-sm px-4 sm:px-6 divide-y divide-sand">
          {filteredLogs.map((log) => <AuditEntryView key={log.id} entry={log} showRecord />)}
        </div>
      )}
    </div>
  )
}
