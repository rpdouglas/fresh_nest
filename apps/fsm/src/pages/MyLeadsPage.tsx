import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { computeLeadSlaStatus, formatCents, isOpenPipelineStage } from '@freshnest/shared'
import { useMyLeads } from '../hooks/useMyLeads'

export const MyLeadsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { leads, loading, error, reload } = useMyLeads()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal font-bold">
            {t('fsm.myLeads.title')}
          </h1>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.myLeads.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void reload() }}
          className="min-h-[48px] px-4 border border-sand bg-white hover:bg-cream text-charcoal rounded font-body text-base font-medium focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {t('fsm.myLeads.refresh')}
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-800">
          {t('fsm.myLeads.loadError')}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('fsm.myLeads.loading')}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white border border-sand rounded p-8 text-center font-body text-base text-text-muted">
          {t('fsm.myLeads.empty')}
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const sla = computeLeadSlaStatus({
              stage: lead.pipeline.stage,
              createdAt: new Date(lead.createdAtIso),
              firstContactAt: lead.pipeline.firstContactAtIso ? new Date(lead.pipeline.firstContactAtIso) : null,
              needsSiteVisit: lead.pipeline.needsSiteVisit,
              nextFollowUpDate: lead.pipeline.nextFollowUpDate,
            })
            const open = isOpenPipelineStage(lead.pipeline.stage)
            return (
              <article
                key={lead.bookingId}
                className="bg-white border border-sand rounded p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-sub text-xl text-charcoal font-semibold">
                      {lead.firstName} {lead.lastName}
                    </h2>
                    <p className="font-body text-base text-text-muted">
                      {t(`fsm.shifts.serviceTypes.${lead.serviceType}`, { defaultValue: lead.serviceType })} · {lead.preferredDate}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded bg-slate-pale text-slate-dark font-body text-sm font-medium uppercase">
                      {lead.language}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-cream border border-sand text-charcoal font-body text-sm font-medium">
                      {t(`fsm.myLeads.stages.${lead.pipeline.stage}`)}
                    </span>
                    {open && sla.isOverdue && (
                      <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 font-body text-sm font-medium">
                        ! {t('fsm.myLeads.overdue')}
                      </span>
                    )}
                    {open && sla.isDueToday && (
                      <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-body text-sm font-medium">
                        {t('fsm.myLeads.dueToday')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Icon-first metadata (P10 Ahmed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-base text-charcoal">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{lead.locationDisplay}</span>
                  </div>

                  {lead.pipeline.nextFollowUpDate && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{t('fsm.myLeads.followUpOn', { date: lead.pipeline.nextFollowUpDate })}</span>
                    </div>
                  )}

                  {typeof lead.pipeline.quotedPriceCents === 'number' && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1" />
                      </svg>
                      <span>{formatCents(lead.pipeline.quotedPriceCents, i18n.language)}</span>
                    </div>
                  )}
                </div>

                {/* Action row (48px targets) */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-sand">
                  <a
                    href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                    className="min-h-[48px] px-4 inline-flex items-center gap-2 border border-slate-brand text-slate-brand hover:bg-slate-pale rounded font-body text-base font-medium"
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {t('fsm.myLeads.callClient')}
                  </a>
                  <Link
                    to={`/leads/${lead.bookingId}`}
                    className="min-h-[48px] px-5 inline-flex items-center gap-2 bg-slate-brand hover:bg-slate-dark text-white rounded font-body text-base font-medium"
                  >
                    {t('fsm.myLeads.openLead')}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyLeadsPage
