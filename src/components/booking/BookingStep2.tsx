import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { BookingFormData } from '@/lib/bookingSchema'

type FrequencyValue = BookingFormData['frequency']
type AddOnValue = BookingFormData['addOns'][number]

interface FrequencyOption {
  value: FrequencyValue
  labelKey: string
  discountKey?: string
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'one-time',  labelKey: 'booking.fields.frequency.options.one-time' },
  { value: 'weekly',    labelKey: 'booking.fields.frequency.options.weekly',   discountKey: 'booking.fields.frequency.discounts.weekly'   },
  { value: 'biweekly',  labelKey: 'booking.fields.frequency.options.biweekly', discountKey: 'booking.fields.frequency.discounts.biweekly' },
  { value: 'monthly',   labelKey: 'booking.fields.frequency.options.monthly',  discountKey: 'booking.fields.frequency.discounts.monthly'  },
]

const ADD_ON_OPTIONS: { value: AddOnValue; labelKey: string }[] = [
  { value: 'oven',     labelKey: 'booking.fields.addOns.options.oven'     },
  { value: 'fridge',   labelKey: 'booking.fields.addOns.options.fridge'   },
  { value: 'windows',  labelKey: 'booking.fields.addOns.options.windows'  },
  { value: 'laundry',  labelKey: 'booking.fields.addOns.options.laundry'  },
  { value: 'petHair',  labelKey: 'booking.fields.addOns.options.petHair'  },
  { value: 'basement', labelKey: 'booking.fields.addOns.options.basement' },
]

export default function BookingStep2() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const MIN_DATE = tomorrow.toISOString().slice(0, 10)

  const maxDay = new Date()
  maxDay.setDate(maxDay.getDate() + 90)
  const MAX_DATE = maxDay.toISOString().slice(0, 10)

  const { t } = useTranslation()
  const { register, watch, setValue, formState: { errors } } = useFormContext<BookingFormData>()
  const currentFreq = watch('frequency')
  const currentAddOns = watch('addOns')

  const toggleAddOn = (addon: AddOnValue) => {
    const next = currentAddOns.includes(addon)
      ? currentAddOns.filter((a) => a !== addon)
      : [...currentAddOns, addon]
    setValue('addOns', next, { shouldValidate: true })
  }

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-8">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step2Title')}</h2>

        {/* Frequency */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.frequency.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center justify-between border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                  currentFreq === opt.value
                    ? 'border-slate-brand bg-slate-pale'
                    : 'border-sand bg-white hover:border-slate-light'
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('frequency')}
                    className="w-4 h-4 accent-slate-brand shrink-0"
                  />
                  <span className="font-body text-base text-charcoal">{t(opt.labelKey)}</span>
                </span>
                {opt.discountKey && (
                  <span className="font-body text-base font-medium text-slate-brand bg-slate-pale border border-slate-brand rounded px-2 py-0.5">
                    {t(opt.discountKey)}
                  </span>
                )}
              </label>
            ))}
          </div>
          {errors.frequency && (
            <p role="alert" className="font-body text-base text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Preferred date */}
        <div>
          <label htmlFor="preferredDate" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.preferredDate.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="preferredDate"
            type="date"
            min={MIN_DATE}
            max={MAX_DATE}
            {...register('preferredDate')}
            aria-required="true"
            aria-invalid={errors.preferredDate ? 'true' : 'false'}
            aria-describedby={errors.preferredDate ? 'preferredDate-error' : 'preferredDate-hint'}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.preferredDate ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.preferredDate ? (
            <p id="preferredDate-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.date')}
            </p>
          ) : (
            <p id="preferredDate-hint" className="font-body text-base text-text-muted mt-1">
              {t('booking.fields.preferredDate.hint')}
            </p>
          )}
        </div>

        {/* Add-ons */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.addOns.label')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADD_ON_OPTIONS.map((addon) => {
              const checked = currentAddOns.includes(addon.value)
              return (
                <label
                  key={addon.value}
                  className={cn(
                    'flex items-center gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                    checked
                      ? 'border-slate-brand bg-slate-pale'
                      : 'border-sand bg-white hover:border-slate-light'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAddOn(addon.value)}
                    className="w-4 h-4 accent-slate-brand shrink-0"
                  />
                  <span className="font-body text-base text-charcoal">{t(addon.labelKey)}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {/* Square footage (optional) */}
        <div>
          <label htmlFor="squareFootage" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.squareFootage.label')}
            <span className="font-body text-base text-text-muted ml-2">{t('booking.fields.squareFootage.optional')}</span>
          </label>
          <input
            id="squareFootage"
            type="number"
            min={0}
            max={100000}
            {...register('squareFootage', {
              setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)),
            })}
            className="w-full border border-sand rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand"
            placeholder={t('booking.fields.squareFootage.placeholder')}
          />
        </div>
      </div>

      </div>
  )
}
