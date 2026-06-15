import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuditLogs } from './hooks/useAuditLogs'
import { cn } from '@/lib/utils/utils'

interface AuditLogsTableProps {
  isAuthorized: boolean
}

export function AuditLogsTable({ isAuthorized }: AuditLogsTableProps) {
  const { t } = useTranslation()
  const { logs, isLoading, error } = useAuditLogs(isAuthorized)

  // Filter States
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedOverride, setSelectedOverride] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Unique collections and override types for dropdown filters
  const collectionsList = useMemo(() => {
    const cols = new Set<string>()
    logs.forEach((log) => {
      if (log.collection) cols.add(log.collection)
    })
    return Array.from(cols)
  }, [logs])

  const overridesList = useMemo(() => {
    const types = new Set<string>()
    logs.forEach((log) => {
      if (log.overrideType) types.add(log.overrideType)
    })
    return Array.from(types)
  }, [logs])

  // Filter and Search Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCol =
        selectedCollection === 'all' || log.collection === selectedCollection
      const matchesOverride =
        selectedOverride === 'all' || log.overrideType === selectedOverride
      
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        log.changedBy.toLowerCase().includes(query) ||
        (log.reason && log.reason.toLowerCase().includes(query)) ||
        (log.documentId && log.documentId.toLowerCase().includes(query)) ||
        (log.field && log.field.toLowerCase().includes(query))

      return matchesCol && matchesOverride && matchesSearch
    })
  }, [logs, selectedCollection, selectedOverride, searchQuery])

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'null'
    if (typeof val === 'object') {
      return JSON.stringify(val)
    }
    if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
      return String(val)
    }
    return ''
  }

  // Helper to resolve human readable override names
  const getOverrideLabel = (type: string | null): string => {
    if (!type) return t('admin.audit.types.none', 'N/A')
    const key = `admin.audit.types.${type}`
    const defaultValue = type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return t(key, defaultValue)
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white border border-sand rounded text-center text-charcoal">
        {t('admin.accessDenied', 'Access Denied')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            {t('admin.audit.title', 'Override Audit Logs')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('admin.audit.subtitle', 'Trace operational overrides and system changes.')}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-cream border border-sand rounded p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-grow flex flex-col gap-1">
          <label htmlFor="search" className="font-body text-sm font-semibold text-charcoal">
            {t('admin.audit.filters.searchLabel', 'Search')}
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.audit.filters.search', 'Search by admin or reason...')}
            className="min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent"
          />
        </div>

        {/* Collection Filter */}
        <div className="w-full md:w-48 flex flex-col gap-1">
          <label htmlFor="collection-filter" className="font-body text-sm font-semibold text-charcoal">
            {t('admin.audit.filters.collection', 'Collection')}
          </label>
          <select
            id="collection-filter"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            <option value="all">{t('admin.audit.filters.all', 'All Collections')}</option>
            {collectionsList.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Override Type Filter */}
        <div className="w-full md:w-56 flex flex-col gap-1">
          <label htmlFor="override-filter" className="font-body text-sm font-semibold text-charcoal">
            {t('admin.audit.filters.overrideType', 'Override Type')}
          </label>
          <select
            id="override-filter"
            value={selectedOverride}
            onChange={(e) => setSelectedOverride(e.target.value)}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            <option value="all">{t('admin.audit.filters.all', 'All Overrides')}</option>
            {overridesList.map((type) => (
              <option key={type} value={type}>
                {getOverrideLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error / Loading State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center font-body text-base text-text-muted">
          {t('admin.audit.loading', 'Loading audit logs...')}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 text-center border border-sand border-dashed rounded bg-white font-body text-base text-text-muted">
          {t('admin.audit.noLogs', 'No audit log entries found.')}
        </div>
      ) : (
        /* Audit logs Table */
        <div className="bg-white border border-sand rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-body text-base">
              <thead>
                <tr className="bg-cream border-b border-sand text-charcoal font-semibold">
                  <th className="px-6 py-4">{t('admin.audit.table.changedAt', 'Date/Time')}</th>
                  <th className="px-6 py-4">{t('admin.audit.table.changedBy', 'Administrator')}</th>
                  <th className="px-6 py-4">{t('admin.audit.table.action', 'Action/Override')}</th>
                  <th className="px-6 py-4">{t('admin.audit.table.details', 'Details')}</th>
                  <th className="px-6 py-4">{t('admin.audit.table.reason', 'Reason')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand text-charcoal">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-warm-white transition-colors">
                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="block font-semibold">
                        {log.changedAt.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-text-muted text-xs">
                        {log.changedAt.toLocaleTimeString()}
                      </span>
                    </td>

                    {/* Changed By */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">
                      {log.changedBy}
                    </td>

                    {/* Override Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.overrideType ? (
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-semibold leading-none border',
                            log.overrideType === 'earnings_cap_exceeded' &&
                              'bg-red-50 text-red-700 border-red-200',
                            log.overrideType === 'travel_conflict_exceeded' &&
                              'bg-amber-50 text-amber-700 border-amber-200',
                            log.overrideType === 'blocked_window_overlap' &&
                              'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {getOverrideLabel(log.overrideType)}
                        </span>
                      ) : (
                        <span className="text-text-muted text-sm">—</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 max-w-xs text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                          {log.collection} · {log.field}
                        </span>
                        <div className="text-charcoal break-words">
                          <span className="font-mono bg-cream px-1 py-0.5 rounded text-xs text-red-600 line-through">
                            {formatValue(log.oldValue)}
                          </span>
                          <span className="mx-1 text-text-muted">→</span>
                          <span className="font-mono bg-slate-pale px-1 py-0.5 rounded text-xs text-slate-dark">
                            {formatValue(log.newValue)}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-text-muted">
                          ID: {log.documentId.substring(0, 8)}...
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 max-w-md text-sm">
                      {log.reason ? (
                        <div className="bg-cream border-l-4 border-slate-brand p-2 rounded-r italic text-charcoal">
                          "{log.reason}"
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
