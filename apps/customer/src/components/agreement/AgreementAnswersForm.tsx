import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { AGREEMENT_ENTRY_METHODS } from '@freshnest/shared'
import type { AgreementSignFormData } from '@/lib/schemas/agreementSchema'

const INPUT_CLASS =
  'w-full min-h-[48px] px-4 py-2.5 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

export function AgreementAnswersForm() {
  const { t } = useTranslation()
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AgreementSignFormData>()

  const hasAlarm = watch('hasAlarm')
  const entryMethod = watch('entryMethod')
  const showAccessFields = entryMethod !== 'present' || hasAlarm

  return (
    <section
      aria-labelledby="agreement-answers-heading"
      className="bg-white border border-sand rounded p-5 md:p-8 space-y-6"
    >
      <div className="border-b border-sand pb-3 space-y-1">
        <h2 id="agreement-answers-heading" className="font-sub text-2xl text-charcoal">
          {t('agreement.answers.heading')}
        </h2>
        <p className="font-body text-base text-text-muted">
          {t('agreement.answers.subheading')}
        </p>
      </div>

      {/* Contact confirmation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="agreement-phone" className="block font-body text-base font-medium text-charcoal">
            {t('agreement.answers.phoneLabel')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="agreement-phone"
            type="tel"
            autoComplete="tel"
            aria-required="true"
            aria-invalid={Boolean(errors.phone)}
            className={INPUT_CLASS}
            {...register('phone')}
          />
          {errors.phone?.message && (
            <p role="alert" className="font-body text-base text-red-700">
              {t(errors.phone.message)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="agreement-email" className="block font-body text-base font-medium text-charcoal">
            {t('agreement.answers.emailLabel')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="agreement-email"
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            className={INPUT_CLASS}
            {...register('email')}
          />
          {errors.email?.message && (
            <p role="alert" className="font-body text-base text-red-700">
              {t(errors.email.message)}
            </p>
          )}
        </div>
      </div>

      {/* Entry method */}
      <div className="space-y-1.5">
        <label htmlFor="agreement-entry-method" className="block font-body text-base font-medium text-charcoal">
          {t('agreement.answers.entryMethodLabel')} <span aria-hidden="true">*</span>
        </label>
        <select
          id="agreement-entry-method"
          aria-required="true"
          className={INPUT_CLASS}
          {...register('entryMethod')}
        >
          {AGREEMENT_ENTRY_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(`agreement.entryMethods.${method}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Alarm yes/no */}
      <fieldset className="space-y-2">
        <legend className="font-body text-base font-medium text-charcoal">
          {t('agreement.answers.alarmLabel')}
        </legend>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-pressed={!hasAlarm}
            onClick={() => setValue('hasAlarm', false, { shouldDirty: true })}
            className={`min-h-[48px] px-5 py-2.5 rounded border font-body text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand ${
              !hasAlarm
                ? 'bg-slate-brand text-white border-slate-brand'
                : 'bg-white text-charcoal border-sand hover:bg-cream'
            }`}
          >
            {t('agreement.answers.no')}
          </button>
          <button
            type="button"
            aria-pressed={hasAlarm}
            onClick={() => setValue('hasAlarm', true, { shouldDirty: true })}
            className={`min-h-[48px] px-5 py-2.5 rounded border font-body text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand ${
              hasAlarm
                ? 'bg-slate-brand text-white border-slate-brand'
                : 'bg-white text-charcoal border-sand hover:bg-cream'
            }`}
          >
            {t('agreement.answers.yes')}
          </button>
        </div>
      </fieldset>

      {/* Restricted write-only access record block */}
      {showAccessFields && (
        <div className="bg-cream border border-sand-dark rounded p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-sub text-xl text-charcoal">
              {t('agreement.access.heading')}
            </h3>
            <p className="font-body text-base text-text-muted">
              {t('agreement.access.privacyNote')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agreement-door-code" className="block font-body text-base font-medium text-charcoal">
                {t('agreement.access.doorCodeLabel')}
              </label>
              <input
                id="agreement-door-code"
                type="text"
                autoComplete="off"
                className={INPUT_CLASS}
                {...register('doorCode')}
              />
            </div>

            {hasAlarm && (
              <div className="space-y-1.5">
                <label htmlFor="agreement-alarm-code" className="block font-body text-base font-medium text-charcoal">
                  {t('agreement.access.alarmCodeLabel')}
                </label>
                <input
                  id="agreement-alarm-code"
                  type="text"
                  autoComplete="off"
                  className={INPUT_CLASS}
                  {...register('alarmCode')}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="agreement-key-location" className="block font-body text-base font-medium text-charcoal">
                {t('agreement.access.keyLocationLabel')}
              </label>
              <input
                id="agreement-key-location"
                type="text"
                autoComplete="off"
                className={INPUT_CLASS}
                {...register('keyLocation')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agreement-access-notes" className="block font-body text-base font-medium text-charcoal">
                {t('agreement.access.accessNotesLabel')}
              </label>
              <input
                id="agreement-access-notes"
                type="text"
                autoComplete="off"
                className={INPUT_CLASS}
                {...register('accessNotes')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pets, instructions, valuables */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="agreement-pets" className="block font-body text-base font-medium text-charcoal">
            {t('agreement.answers.petsLabel')}
          </label>
          <input
            id="agreement-pets"
            type="text"
            className={INPUT_CLASS}
            placeholder={t('agreement.answers.petsPlaceholder')}
            {...register('pets')}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="agreement-instructions" className="block font-body text-base font-medium text-charcoal">
            {t('agreement.answers.instructionsLabel')}
          </label>
          <textarea
            id="agreement-instructions"
            rows={3}
            className="w-full min-h-[96px] px-4 py-3 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
            placeholder={t('agreement.answers.instructionsPlaceholder')}
            {...register('specialInstructions')}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="agreement-valuables" className="block font-body text-base font-medium text-charcoal">
            {t('agreement.answers.valuablesLabel')}
          </label>
          <textarea
            id="agreement-valuables"
            rows={2}
            className="w-full min-h-[76px] px-4 py-3 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
            placeholder={t('agreement.answers.valuablesPlaceholder')}
            {...register('valuables')}
          />
        </div>
      </div>

      {/* Hidden honeypot field (bot deterrent — never visible to human signers) */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="agreement-website">{t('agreement.honeypotLabel')}</label>
        <input
          id="agreement-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>
    </section>
  )
}
