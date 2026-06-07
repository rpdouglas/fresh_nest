import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { BookingFormData } from '@/lib/bookingSchema'

type ServiceTypeValue = BookingFormData['serviceType']
type PropertyTypeValue = BookingFormData['propertyType']

const SERVICE_TYPES: ServiceTypeValue[] = [
  'standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial',
]

const PROPERTY_TYPES: { value: PropertyTypeValue; labelKey: string }[] = [
  { value: 'apartment',  labelKey: 'booking.fields.propertyType.options.apartment' },
  { value: '1-2bed',     labelKey: 'booking.fields.propertyType.options.1-2bed'    },
  { value: '3-4bed',     labelKey: 'booking.fields.propertyType.options.3-4bed'    },
  { value: '5+bed',      labelKey: 'booking.fields.propertyType.options.5+bed'     },
  { value: 'commercial', labelKey: 'booking.fields.propertyType.options.commercial'},
]

interface Props {
  onNext: () => void
}

export default function BookingStep1({ onNext }: Props) {
  const { t } = useTranslation()
  const { control, formState: { errors }, watch } = useFormContext<BookingFormData>()
  const serviceType = watch('serviceType')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-8">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step1Title')}</h2>

        {/* Service type */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.serviceType.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <Controller
            name="serviceType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICE_TYPES.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'flex items-start gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                      field.value === type
                        ? 'border-slate-brand bg-slate-pale'
                        : 'border-sand bg-white hover:border-slate-light'
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={type}
                      checked={field.value === type}
                      onChange={() => field.onChange(type)}
                      onBlur={field.onBlur}
                      className="mt-0.5 w-4 h-4 accent-slate-brand shrink-0"
                    />
                    <div>
                      <span className="font-body text-base text-charcoal block">
                        {t(`services.${type}.title`)}
                      </span>
                      <span className="font-body text-sm text-text-muted block leading-snug mt-0.5">
                        {t(`services.${type}.description`)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.serviceType && (
            <p role="alert" className="font-body text-sm text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Airbnb note */}
        {serviceType === 'airbnb' && (
          <div className="bg-slate-pale border border-sand rounded p-4">
            <p className="font-body text-base text-charcoal">{t('booking.airbnbNote')}</p>
          </div>
        )}

        {/* Property type */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.propertyType.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <Controller
            name="propertyType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <label
                    key={pt.value}
                    className={cn(
                      'flex items-center gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                      field.value === pt.value
                        ? 'border-slate-brand bg-slate-pale'
                        : 'border-sand bg-white hover:border-slate-light'
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={pt.value}
                      checked={field.value === pt.value}
                      onChange={() => field.onChange(pt.value)}
                      onBlur={field.onBlur}
                      className="w-4 h-4 accent-slate-brand shrink-0"
                    />
                    <span className="font-body text-base text-charcoal">
                      {t(pt.labelKey)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.propertyType && (
            <p role="alert" className="font-body text-sm text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Controller
            name="bedrooms"
            control={control}
            render={({ field }) => (
              <div>
                <span className="block font-body text-base font-medium text-charcoal mb-3">
                  {t('booking.fields.bedrooms.label')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={t('booking.fields.bedrooms.decrease')}
                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    −
                  </button>
                  <span className="font-body text-xl text-charcoal w-8 text-center" aria-live="polite">
                    {field.value}
                  </span>
                  <button
                    type="button"
                    aria-label={t('booking.fields.bedrooms.increase')}
                    onClick={() => field.onChange(Math.min(20, field.value + 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          />

          <Controller
            name="bathrooms"
            control={control}
            render={({ field }) => (
              <div>
                <span className="block font-body text-base font-medium text-charcoal mb-3">
                  {t('booking.fields.bathrooms.label')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={t('booking.fields.bathrooms.decrease')}
                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    −
                  </button>
                  <span className="font-body text-xl text-charcoal w-8 text-center" aria-live="polite">
                    {field.value}
                  </span>
                  <button
                    type="button"
                    aria-label={t('booking.fields.bathrooms.increase')}
                    onClick={() => field.onChange(Math.min(10, field.value + 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          />
        </div>

        {/* Pets */}
        <Controller
          name="pets"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-3 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                className="mt-0.5 w-5 h-5 accent-slate-brand shrink-0"
              />
              <div>
                <span className="font-body text-base text-charcoal block">
                  {t('booking.fields.pets.label')}
                </span>
                <span className="font-body text-sm text-text-muted block mt-0.5">
                  {t('booking.fields.pets.hint')}
                </span>
              </div>
            </label>
          )}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center font-body font-medium text-base
                     bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]
                     transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
        >
          {t('booking.next')}
        </button>
      </div>
    </motion.div>
  )
}
