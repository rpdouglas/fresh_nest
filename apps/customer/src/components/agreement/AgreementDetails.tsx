import { useTranslation } from 'react-i18next'
import {
  formatAgreementRate,
  formatBasisPointsPercent,
  formatCents,
  getAgreementFrequencyLabel,
  getAgreementServiceLabel,
  type AgreementLanguage,
  type PublicAgreementView,
} from '@freshnest/shared'

interface AgreementDetailsProps {
  agreement: PublicAgreementView
  displayLang: AgreementLanguage
}

export function AgreementDetails({ agreement, displayLang }: AgreementDetailsProps) {
  const { t } = useTranslation()
  const { party, terms } = agreement

  const rows: Array<{ label: string; value: string }> = [
    { label: t('agreement.details.clientName'), value: party.name },
    { label: t('agreement.details.serviceAddress'), value: party.address },
    {
      label: t('agreement.details.service'),
      value: getAgreementServiceLabel(terms.serviceType, displayLang),
    },
    {
      label: t('agreement.details.frequency'),
      value: getAgreementFrequencyLabel(terms.frequency, displayLang),
    },
    { label: t('agreement.details.startDate'), value: terms.startDate },
    {
      label: t('agreement.details.agreedRate'),
      value: `${formatAgreementRate(terms.rateCents, terms.rateType, displayLang)} (${
        terms.taxExempt ? t('agreement.details.taxExempt') : t('agreement.details.plusTaxes')
      })`,
    },
    {
      label: t('agreement.details.cancelNotice'),
      value: t('agreement.details.hoursValue', { count: terms.cancelWindowHours }),
    },
    {
      label: t('agreement.details.lateCancelFee'),
      value: formatCents(terms.lateCancellationFeeCents, displayLang),
    },
    {
      label: t('agreement.details.lockoutFee'),
      value: formatCents(terms.lockoutFeeCents, displayLang),
    },
    {
      label: t('agreement.details.latePaymentRate'),
      value: t('agreement.details.perMonthValue', {
        rate: formatBasisPointsPercent(terms.latePaymentBasisPoints, displayLang),
      }),
    },
    {
      label: t('agreement.details.terminationNotice'),
      value: t('agreement.details.daysValue', { count: terms.noticePeriodDays }),
    },
  ]

  return (
    <section
      aria-labelledby="agreement-details-heading"
      className="bg-white border border-sand rounded p-5 md:p-8 space-y-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-sand pb-3">
        <h2 id="agreement-details-heading" className="font-sub text-2xl text-charcoal">
          {t('agreement.details.heading')}
        </h2>
        <span className="font-body text-base text-text-muted">
          {t('agreement.details.versionBadge', { version: agreement.versionLabel })}
        </span>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((row) => (
          <div key={row.label} className="bg-cream border border-sand rounded p-3.5">
            <dt className="font-body text-sm font-medium text-text-muted">{row.label}</dt>
            <dd className="font-body text-base text-charcoal font-medium mt-1 break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {terms.scopeNotes && (
        <div className="bg-cream border border-sand rounded p-4">
          <p className="font-body text-sm font-medium text-text-muted">
            {t('agreement.details.scopeNotes')}
          </p>
          <p className="font-body text-base text-charcoal mt-1 whitespace-pre-line">
            {terms.scopeNotes}
          </p>
        </div>
      )}
    </section>
  )
}
