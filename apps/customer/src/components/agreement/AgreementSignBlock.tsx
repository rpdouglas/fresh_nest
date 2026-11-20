import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { AgreementSignFormData } from '@/lib/schemas/agreementSchema'

interface AgreementSignBlockProps {
  submitError: string | null
  isSubmitting: boolean
}

export function AgreementSignBlock({ submitError, isSubmitting }: AgreementSignBlockProps) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<AgreementSignFormData>()

  return (
    <section
      aria-labelledby="agreement-sign-heading"
      className="bg-white border-2 border-slate-brand rounded p-5 md:p-8 space-y-6"
    >
      <div className="border-b border-sand pb-3 space-y-1">
        <h2 id="agreement-sign-heading" className="font-sub text-2xl text-charcoal">
          {t('agreement.sign.heading')}
        </h2>
        <p className="font-body text-base text-text-muted">
          {t('agreement.sign.subheading')}
        </p>
      </div>

      {/* Control 1: E-signature & Law 25 evidence retention consent */}
      <div className="space-y-1.5">
        <label
          htmlFor="agreement-consent-esign"
          className="flex items-start gap-3.5 min-h-[48px] py-2 cursor-pointer"
        >
          <input
            id="agreement-consent-esign"
            type="checkbox"
            aria-required="true"
            aria-invalid={Boolean(errors.consentESign)}
            className="mt-1 h-6 w-6 shrink-0 rounded border-sand-dark text-slate-brand focus:ring-2 focus:ring-slate-brand"
            {...register('consentESign')}
          />
          <span className="font-body text-base text-charcoal leading-relaxed">
            {t('agreement.sign.consentESignLabel')} <span aria-hidden="true">*</span>
          </span>
        </label>
        {errors.consentESign?.message && (
          <p role="alert" className="font-body text-base text-red-700 pl-9">
            {t(errors.consentESign.message)}
          </p>
        )}
      </div>

      {/* Control 2: Read and agree to terms */}
      <div className="space-y-1.5">
        <label
          htmlFor="agreement-consent-terms"
          className="flex items-start gap-3.5 min-h-[48px] py-2 cursor-pointer"
        >
          <input
            id="agreement-consent-terms"
            type="checkbox"
            aria-required="true"
            aria-invalid={Boolean(errors.consentTerms)}
            className="mt-1 h-6 w-6 shrink-0 rounded border-sand-dark text-slate-brand focus:ring-2 focus:ring-slate-brand"
            {...register('consentTerms')}
          />
          <span className="font-body text-base text-charcoal leading-relaxed">
            {t('agreement.sign.consentTermsLabel')} <span aria-hidden="true">*</span>
          </span>
        </label>
        {errors.consentTerms?.message && (
          <p role="alert" className="font-body text-base text-red-700 pl-9">
            {t(errors.consentTerms.message)}
          </p>
        )}
      </div>

      {/* Control 3: Typed full name */}
      <div className="space-y-1.5">
        <label htmlFor="agreement-signed-name" className="block font-body text-base font-medium text-charcoal">
          {t('agreement.sign.typedNameLabel')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="agreement-signed-name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-invalid={Boolean(errors.signedName)}
          placeholder={t('agreement.sign.typedNamePlaceholder')}
          className="w-full min-h-[48px] px-4 py-2.5 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
          {...register('signedName')}
        />
        {errors.signedName?.message && (
          <p role="alert" className="font-body text-base text-red-700">
            {t(errors.signedName.message)}
          </p>
        )}
      </div>

      {submitError && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-800">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[52px] px-6 py-3 bg-slate-brand hover:bg-slate-dark disabled:opacity-60 text-white font-body font-medium text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
      >
        {isSubmitting ? t('agreement.sign.submitting') : t('agreement.sign.submitButton')}
      </button>
    </section>
  )
}
