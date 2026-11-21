import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatAgreementRate,
  toMillis,
  type AgreementRecord,
  type Booking,
} from '@freshnest/shared'
import { listAgreements } from '@/lib/firebase/agreements'
import { usePolicySettings } from '@/components/admin/hooks/usePolicySettings'
import { NewAgreementModal } from './NewAgreementModal'
import { AgreementDetailPanel } from './AgreementDetailPanel'

interface AgreementsTabProps {
  isAuthorized: boolean
  isOwner: boolean
  bookings: Booking[]
}

const STATUS_CHIP_CLASSES: Record<string, string> = {
  sent: 'bg-slate-pale text-slate-dark',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-amber-100 text-amber-900',
  cancelled: 'bg-red-100 text-red-800',
  draft: 'bg-cream text-charcoal',
}

export function AgreementsTab({ isAuthorized, isOwner, bookings }: AgreementsTabProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const { policy } = usePolicySettings(isAuthorized)

  const [agreements, setAgreements] = useState<Array<AgreementRecord & { id: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isAuthorized) return
    setLoading(true)
    setError(null)
    try {
      const list = await listAgreements()
      setAgreements(list)
    } catch {
      setError(t('admin.agreements.loadError'))
    } finally {
      setLoading(false)
    }
  }, [isAuthorized, t])

  useEffect(() => {
    if (!isAuthorized) return
    let active = true
    void listAgreements()
      .then((list) => {
        if (!active) return
        setAgreements(list)
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(t('admin.agreements.loadError'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAuthorized, t])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agreements.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (q) {
        const hay = `${a.party.name} ${a.party.email} ${a.party.address}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [agreements, statusFilter, typeFilter, search])

  const selectedAgreement = useMemo(
    () => agreements.find((a) => a.id === selectedId) ?? null,
    [agreements, selectedId],
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-charcoal">
            {t('admin.agreements.title')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('admin.agreements.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalKey((k) => k + 1)
            setModalOpen(true)
          }}
          className="min-h-[48px] px-5 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {t('admin.agreements.newButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-sand rounded p-4">
        <input
          type="search"
          aria-label={t('admin.agreements.searchPlaceholder')}
          placeholder={t('admin.agreements.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] min-h-[48px] px-3 bg-warm-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
        />

        <select
          aria-label={t('admin.agreements.filterStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[48px] px-3 bg-warm-white border border-sand rounded font-body text-base text-charcoal"
        >
          <option value="all">{t('admin.agreements.allStatuses')}</option>
          <option value="sent">{t('admin.agreements.statuses.sent')}</option>
          <option value="signed">{t('admin.agreements.statuses.signed')}</option>
          <option value="expired">{t('admin.agreements.statuses.expired')}</option>
        </select>

        <select
          aria-label={t('admin.agreements.filterType')}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="min-h-[48px] px-3 bg-warm-white border border-sand rounded font-body text-base text-charcoal"
        >
          <option value="all">{t('admin.agreements.allTypes')}</option>
          <option value="residential">{t('admin.agreements.types.residential')}</option>
          <option value="commercial">{t('admin.agreements.types.commercial')}</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-800">
          {error}
        </p>
      )}

      {selectedAgreement && (
        <AgreementDetailPanel
          key={selectedAgreement.id}
          agreement={selectedAgreement}
          isOwner={isOwner}
          onClose={() => setSelectedId(null)}
          onUpdated={() => { void reload() }}
        />
      )}

      {loading ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('admin.agreements.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('admin.agreements.empty')}
        </div>
      ) : (
        <div className="bg-white border border-sand rounded overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-cream font-body text-sm text-text-muted">
                <th className="py-3 px-4">{t('admin.agreements.table.client')}</th>
                <th className="py-3 px-4">{t('admin.agreements.table.type')}</th>
                <th className="py-3 px-4">{t('admin.agreements.table.rate')}</th>
                <th className="py-3 px-4">{t('admin.agreements.table.status')}</th>
                <th className="py-3 px-4">{t('admin.agreements.table.created')}</th>
                <th className="py-3 px-4">{t('admin.agreements.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand font-body text-base text-charcoal">
              {filtered.map((item) => {
                const createdMs = toMillis(item.createdAt)
                const createdStr = createdMs
                  ? new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                      dateStyle: 'medium',
                      timeZone: 'America/Toronto',
                    }).format(new Date(createdMs))
                  : '—'
                return (
                  <tr key={item.id} className="hover:bg-warm-white">
                    <td className="py-3 px-4">
                      <div className="font-medium">{item.party.name}</div>
                      <div className="text-sm text-text-muted">{item.party.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {t(`admin.agreements.types.${item.type}`)} · {item.language.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      {formatAgreementRate(item.terms.rateCents, item.terms.rateType, lang)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${
                          STATUS_CHIP_CLASSES[item.status] ?? 'bg-cream text-charcoal'
                        }`}
                      >
                        {t(`admin.agreements.statuses.${item.status}`)}
                      </span>
                      {item.status === 'sent' && item.viewedAt ? (
                        <span className="ml-2 text-sm text-text-muted">
                          ({t('admin.agreements.detail.viewedBadge')})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">{createdStr}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="min-h-[48px] px-4 border border-sand rounded text-slate-brand hover:bg-slate-pale font-medium"
                      >
                        {t('admin.agreements.actions.viewDetails')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewAgreementModal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { void reload() }}
        bookings={bookings}
        policy={policy}
      />
    </section>
  )
}
