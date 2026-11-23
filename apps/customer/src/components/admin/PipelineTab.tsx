import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  OPEN_PIPELINE_STAGES,
  PIPELINE_STAGES,
  computeLeadSlaStatus,
  formatCents,
  inferPipelineStageFromBooking,
  type Booking,
  type PipelineStage,
} from '@freshnest/shared'
import { updateLeadPipeline } from '@/lib/firebase/firestore'
import { usePolicySettings } from './hooks/usePolicySettings'
import { useAssignableOwners } from './hooks/useAssignableOwners'
import { usePipeline, type PipelineOwnerFilter } from './hooks/usePipeline'
import { LeadDetailPanel } from './LeadDetailPanel'
import { NewAgreementModal } from './agreements/NewAgreementModal'
import { cn } from '@/lib/utils/utils'

interface PipelineTabProps {
  isAuthorized: boolean
  adminEmail: string
  bookings: Booking[]
}

const STAGE_BADGE_CLASSES: Record<PipelineStage, string> = {
  new: 'bg-slate-pale text-slate-dark',
  contacted: 'bg-blue-50 text-blue-800',
  site_visit: 'bg-amber-100 text-amber-900',
  quoted: 'bg-purple-50 text-purple-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
}

export function PipelineTab({ isAuthorized, adminEmail, bookings }: PipelineTabProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const { policy } = usePolicySettings(isAuthorized)
  const { owners } = useAssignableOwners(isAuthorized)
  const pipeline = usePipeline(isAuthorized, adminEmail, policy)

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [agreementBookingId, setAgreementBookingId] = useState<string | null>(null)
  const [agreementModalKey, setAgreementModalKey] = useState(0)
  const [inlineBusyId, setInlineBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedLead = useMemo(
    () => pipeline.allLeads.find((b) => b.id === selectedId) ?? null,
    [pipeline.allLeads, selectedId],
  )

  const ownerNameOf = (email: string | null | undefined) => {
    if (!email) return t('admin.pipeline.unassigned')
    const norm = email.trim().toLowerCase()
    return owners.find((o) => o.email === norm)?.displayName ?? norm
  }

  const handleQuickReassign = async (lead: Booking, nextEmail: string) => {
    if (!lead.id) return
    setInlineBusyId(lead.id)
    setActionError(null)
    try {
      const matched = owners.find((o) => o.email === nextEmail)
      await updateLeadPipeline(
        lead.id,
        {
          ownerEmail: nextEmail || null,
          ownerRole: matched?.role ?? null,
        },
        lead,
        nextEmail ? `Reassigned to ${nextEmail}` : 'Unassigned lead',
      )
    } catch {
      setActionError(t('admin.pipeline.detail.saveError'))
    } finally {
      setInlineBusyId(null)
    }
  }

  const handleBoardStageChange = async (lead: Booking, nextStage: PipelineStage) => {
    if (!lead.id) return
    // Moving to 'lost' requires choosing a lost reason — open detail panel so reason is captured
    if (nextStage === 'lost') {
      setSelectedId(lead.id)
      return
    }
    setInlineBusyId(lead.id)
    setActionError(null)
    try {
      await updateLeadPipeline(lead.id, { stage: nextStage }, lead)
    } catch {
      setActionError(t('admin.pipeline.detail.saveError'))
    } finally {
      setInlineBusyId(null)
    }
  }

  const ownerTabs: Array<{ key: PipelineOwnerFilter; label: string; count: number }> = [
    { key: 'my', label: t('admin.pipeline.views.myLeads'), count: pipeline.counts.myOpen },
    { key: 'unassigned', label: t('admin.pipeline.views.unassigned'), count: pipeline.counts.unassignedOpen },
    { key: 'all', label: t('admin.pipeline.views.all'), count: pipeline.counts.allOpen },
  ]

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-charcoal">{t('admin.pipeline.title')}</h2>
          <p className="font-body text-base text-text-muted">{t('admin.pipeline.subtitle')}</p>
        </div>

        {/* View toggle (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white border border-sand rounded p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={cn(
              'min-h-[48px] px-4 rounded font-body text-base font-medium transition-colors',
              viewMode === 'list' ? 'bg-slate-brand text-white' : 'text-charcoal hover:bg-cream',
            )}
          >
            {t('admin.pipeline.viewModes.list')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            aria-pressed={viewMode === 'board'}
            className={cn(
              'min-h-[48px] px-4 rounded font-body text-base font-medium transition-colors',
              viewMode === 'board' ? 'bg-slate-brand text-white' : 'text-charcoal hover:bg-cream',
            )}
          >
            {t('admin.pipeline.viewModes.board')}
          </button>
        </div>
      </div>

      {/* Owner view switcher + filters */}
      <div className="bg-white border border-sand rounded p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {ownerTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => pipeline.setOwnerFilter(tab.key)}
              aria-pressed={pipeline.ownerFilter === tab.key}
              className={cn(
                'min-h-[48px] px-4 rounded font-body text-base font-medium border transition-colors',
                pipeline.ownerFilter === tab.key
                  ? 'bg-slate-brand text-white border-slate-brand'
                  : 'bg-warm-white text-charcoal border-sand hover:bg-cream',
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="search"
            aria-label={t('admin.pipeline.searchPlaceholder')}
            placeholder={t('admin.pipeline.searchPlaceholder')}
            value={pipeline.search}
            onChange={(e) => pipeline.setSearch(e.target.value)}
            className="flex-1 min-w-[200px] min-h-[48px] px-3 bg-warm-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />

          <select
            aria-label={t('admin.pipeline.filterStage')}
            value={pipeline.stageFilter}
            onChange={(e) => pipeline.setStageFilter(e.target.value as PipelineStage | 'open' | 'all')}
            className="min-h-[48px] px-3 bg-warm-white border border-sand rounded font-body text-base text-charcoal"
          >
            <option value="open">{t('admin.pipeline.stageFilters.open')}</option>
            <option value="all">{t('admin.pipeline.stageFilters.all')}</option>
            {PIPELINE_STAGES.map((st) => (
              <option key={st} value={st}>
                {t(`admin.pipeline.stages.${st}`)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => pipeline.setAirbnbOnly(!pipeline.airbnbOnly)}
            aria-pressed={pipeline.airbnbOnly}
            className={cn(
              'min-h-[48px] px-4 rounded border font-body text-base font-medium',
              pipeline.airbnbOnly
                ? 'bg-amber-100 border-amber-400 text-amber-900'
                : 'bg-warm-white border-sand text-charcoal hover:bg-cream',
            )}
          >
            {t('admin.pipeline.filters.airbnb')}
          </button>

          <button
            type="button"
            onClick={() => pipeline.setSiteVisitOnly(!pipeline.siteVisitOnly)}
            aria-pressed={pipeline.siteVisitOnly}
            className={cn(
              'min-h-[48px] px-4 rounded border font-body text-base font-medium',
              pipeline.siteVisitOnly
                ? 'bg-slate-pale border-slate-brand text-slate-dark'
                : 'bg-warm-white border-sand text-charcoal hover:bg-cream',
            )}
          >
            {t('admin.pipeline.filters.siteVisit')}
          </button>
        </div>
      </div>

      {(pipeline.error || actionError) && (
        <p role="alert" className="bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-800">
          {actionError || pipeline.error}
        </p>
      )}

      {selectedLead && (
        <LeadDetailPanel
          key={selectedLead.id}
          lead={selectedLead}
          owners={owners}
          policy={policy}
          onClose={() => setSelectedId(null)}
          onCreateAgreement={(id) => {
            setAgreementBookingId(id)
            setAgreementModalKey((k) => k + 1)
          }}
        />
      )}

      {pipeline.loading ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('admin.pipeline.loading')}
        </div>
      ) : pipeline.leads.length === 0 ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('admin.pipeline.empty')}
        </div>
      ) : viewMode === 'board' ? (
        /* Accessible Board View (keyboard stage dropdowns on every card — no drag-only actions) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {OPEN_PIPELINE_STAGES.map((colStage) => {
            const colLeads = pipeline.leads.filter((b) => inferPipelineStageFromBooking(b) === colStage)
            return (
              <div key={colStage} className="bg-cream border border-sand rounded p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-sand pb-2">
                  <h3 className="font-sub text-lg text-charcoal">
                    {t(`admin.pipeline.stages.${colStage}`)}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-white border border-sand font-body text-sm font-medium text-charcoal">
                    {colLeads.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colLeads.map((lead) => {
                    const sla = computeLeadSlaStatus({
                      stage: colStage,
                      createdAt: lead.createdAt,
                      firstContactAt: lead.pipeline?.firstContactAt ?? null,
                      needsSiteVisit: Boolean(lead.pipeline?.needsSiteVisit),
                      nextFollowUpDate: lead.pipeline?.nextFollowUpDate ?? null,
                      firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
                      siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
                    })
                    return (
                      <article
                        key={lead.id}
                        className="bg-white border border-sand rounded p-3.5 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedId(lead.id ?? null)}
                            className="text-left font-body text-base font-semibold text-charcoal hover:text-slate-brand min-h-[48px] flex items-center"
                          >
                            {lead.firstName} {lead.lastName}
                          </button>
                          <span className="px-2 py-0.5 rounded bg-slate-pale text-slate-dark text-sm font-medium uppercase">
                            {lead.language}
                          </span>
                        </div>

                        <p className="font-body text-base text-text-muted">
                          {t(`admin.agreements.serviceTypes.${lead.serviceType}`, { defaultValue: lead.serviceType })}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {sla.isOverdue && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-sm font-medium">
                              ! {t('admin.pipeline.badges.overdue')}
                            </span>
                          )}
                          {sla.isDueToday && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-sm font-medium">
                              {t('admin.pipeline.badges.dueToday')}
                            </span>
                          )}
                          {lead.pipeline?.needsSiteVisit && (
                            <span className="px-2 py-0.5 rounded bg-slate-pale text-slate-dark text-sm font-medium">
                              {t('admin.pipeline.badges.siteVisit')}
                            </span>
                          )}
                        </div>

                        <p className="font-body text-sm text-text-muted">
                          {ownerNameOf(lead.pipeline?.ownerEmail)}
                        </p>

                        <label className="sr-only" htmlFor={`board-stage-${lead.id}`}>
                          {t('admin.pipeline.detail.stageLabel')}
                        </label>
                        <select
                          id={`board-stage-${lead.id}`}
                          value={colStage}
                          disabled={inlineBusyId === lead.id}
                          onChange={(e) => { void handleBoardStageChange(lead, e.target.value as PipelineStage) }}
                          className="w-full min-h-[48px] px-2.5 bg-warm-white border border-sand rounded font-body text-base text-charcoal"
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {t(`admin.pipeline.stages.${st}`)}
                            </option>
                          ))}
                        </select>
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Priority List View (default on mobile & desktop) */
        <div className="bg-white border border-sand rounded overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-cream font-body text-sm text-text-muted">
                <th className="py-3 px-4">{t('admin.pipeline.table.client')}</th>
                <th className="py-3 px-4">{t('admin.pipeline.table.stage')}</th>
                <th className="py-3 px-4">{t('admin.pipeline.table.owner')}</th>
                <th className="py-3 px-4">{t('admin.pipeline.table.followUp')}</th>
                <th className="py-3 px-4">{t('admin.pipeline.table.quote')}</th>
                <th className="py-3 px-4">{t('admin.pipeline.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand font-body text-base text-charcoal">
              {pipeline.leads.map((lead) => {
                const stage = inferPipelineStageFromBooking(lead)
                const sla = computeLeadSlaStatus({
                  stage,
                  createdAt: lead.createdAt,
                  firstContactAt: lead.pipeline?.firstContactAt ?? null,
                  needsSiteVisit: Boolean(lead.pipeline?.needsSiteVisit),
                  nextFollowUpDate: lead.pipeline?.nextFollowUpDate ?? null,
                  firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
                  siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
                })
                const currentOwnerEmail = lead.pipeline?.ownerEmail?.trim().toLowerCase() ?? ''
                return (
                  <tr key={lead.id} className="hover:bg-warm-white">
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-pale text-slate-dark text-sm font-medium uppercase">
                          {lead.language}
                        </span>
                        {lead.isAirbnb && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-sm font-medium">
                            Airbnb
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-muted">
                        {t(`admin.agreements.serviceTypes.${lead.serviceType}`, { defaultValue: lead.serviceType })} · {lead.preferredDate}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded text-sm font-medium', STAGE_BADGE_CLASSES[stage])}>
                          {t(`admin.pipeline.stages.${stage}`)}
                        </span>
                        {sla.isOverdue && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 text-sm font-medium">
                            ! {t('admin.pipeline.badges.overdue')}
                          </span>
                        )}
                        {sla.isDueToday && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-sm font-medium">
                            {t('admin.pipeline.badges.dueToday')}
                          </span>
                        )}
                        {lead.pipeline?.needsSiteVisit && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-cream border border-sand text-charcoal text-sm">
                            {t('admin.pipeline.badges.siteVisit')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2-click inline owner reassignment (P12 Lauren acceptance criterion #1) */}
                    <td className="py-3 px-4">
                      <select
                        aria-label={t('admin.pipeline.table.reassignAria', { name: `${lead.firstName} ${lead.lastName}` })}
                        value={currentOwnerEmail}
                        disabled={inlineBusyId === lead.id}
                        onChange={(e) => { void handleQuickReassign(lead, e.target.value) }}
                        className="min-h-[48px] max-w-[220px] px-2.5 bg-warm-white border border-sand rounded font-body text-base text-charcoal"
                      >
                        <option value="">{t('admin.pipeline.unassigned')}</option>
                        {owners.map((o) => (
                          <option key={o.email} value={o.email}>
                            {o.displayName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      {lead.pipeline?.nextFollowUpDate ?? '—'}
                    </td>

                    <td className="py-3 px-4">
                      {typeof lead.pipeline?.quotedPriceCents === 'number'
                        ? formatCents(lead.pipeline.quotedPriceCents, lang)
                        : '—'}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(lead.id ?? null)}
                        className="min-h-[48px] px-4 border border-sand rounded text-slate-brand hover:bg-slate-pale font-medium"
                      >
                        {t('admin.pipeline.actions.open')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {agreementBookingId && (
        <NewAgreementModal
          key={agreementModalKey}
          open
          onClose={() => setAgreementBookingId(null)}
          onCreated={() => {}}
          bookings={bookings}
          policy={policy}
          initialBookingId={agreementBookingId}
        />
      )}
    </section>
  )
}
