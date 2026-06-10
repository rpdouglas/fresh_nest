import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { BookingFormData } from '@/lib/bookingSchema'

interface Props {
  submitError?: string | null
}

export default function BookingStep4({ submitError }: Props) {
  const { t } = useTranslation()
  const { register, getValues, formState: { isSubmitting } } = useFormContext<BookingFormData>()
  const values = getValues()

  const frequencyLabel = t(`booking.fields.frequency.options.${values.frequency}`)
  const serviceLabel   = t(`services.${values.serviceType}.title`)
  const propertyLabel  = t(`booking.fields.propertyType.options.${values.propertyType}`)

  const addOnLabels = values.addOns.length > 0
    ? values.addOns.map((a) => t(`booking.fields.addOns.options.${a}`)).join(', ')
    : '—'

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step4Title')}</h2>

        {/* Review table */}
        <div className="divide-y divide-sand">
          {/* Service */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-base text-text-muted">{t('booking.review.service')}</p>
              <p className="font-body text-base text-charcoal mt-0.5">{serviceLabel}</p>
            </div>
          </div>

          {/* Property */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-base text-text-muted">{t('booking.review.property')}</p>
              <p className="font-body text-base text-charcoal mt-0.5">
                {propertyLabel} — {values.bedrooms} {t('booking.fields.bedrooms.label').toLowerCase()} / {values.bathrooms} {t('booking.fields.bathrooms.label').toLowerCase()}
                {values.pets && ` · ${t('booking.fields.pets.label')}`}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-base text-text-muted">{t('booking.review.schedule')}</p>
              <p className="font-body text-base text-charcoal mt-0.5">
                {frequencyLabel} · {values.preferredDate}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-base text-text-muted">{t('booking.review.addOns')}</p>
              <p className="font-body text-base text-charcoal mt-0.5">{addOnLabels}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-base text-text-muted">{t('booking.review.contact')}</p>
              <p className="font-body text-base text-charcoal mt-0.5">
                {values.firstName} {values.lastName} · {values.email} · {values.phone}
              </p>
              <p className="font-body text-base text-text-muted mt-0.5">{values.address}</p>
            </div>
          </div>

          {/* Notes */}
          {values.notes && (
            <div className="flex items-start justify-between py-3">
              <div>
                <p className="font-body text-base text-text-muted">{t('booking.review.notes')}</p>
                <p className="font-body text-base text-charcoal mt-0.5">{values.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* CASL marketing consent — unchecked by default (COMPLIANCE.md) */}
        <div className="pt-2 border-t border-sand">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="marketingConsent"
              {...register('marketingConsent')}
              className="mt-0.5 w-5 h-5 accent-slate-brand shrink-0"
            />
            <span className="font-body text-base text-charcoal">
              {t('booking.fields.marketingConsent.label')}
            </span>
          </label>
        </div>
      </div>

      {submitError && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700">
          {submitError}{' '}
          <a href="tel:+16139353555" className="font-medium underline text-red-700">
            {t('phone')}
          </a>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center font-body font-medium text-base
                     bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]
                     transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('booking.submitting') : t('booking.submit')}
        </button>
      </div>
    </div>
  )
}
