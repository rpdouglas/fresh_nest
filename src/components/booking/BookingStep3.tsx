import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { BookingFormData } from '@/lib/bookingSchema'

export default function BookingStep3() {
  const { t } = useTranslation()
  const { register, formState: { errors } } = useFormContext<BookingFormData>()

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step3Title')}</h2>

        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block font-body text-base font-medium text-charcoal mb-1">
              {t('booking.fields.firstName.label')}
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register('firstName')}
              aria-required="true"
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              placeholder={t('booking.fields.firstName.placeholder')}
              className={cn(
                'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
                errors.firstName ? 'border-red-500' : 'border-sand'
              )}
            />
            {errors.firstName && (
              <p id="firstName-error" role="alert" className="font-body text-base text-red-600 mt-1">
                {t('booking.errors.required')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block font-body text-base font-medium text-charcoal mb-1">
              {t('booking.fields.lastName.label')}
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register('lastName')}
              aria-required="true"
              aria-invalid={errors.lastName ? 'true' : 'false'}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              placeholder={t('booking.fields.lastName.placeholder')}
              className={cn(
                'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
                errors.lastName ? 'border-red-500' : 'border-sand'
              )}
            />
            {errors.lastName && (
              <p id="lastName-error" role="alert" className="font-body text-base text-red-600 mt-1">
                {t('booking.errors.required')}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.email.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder={t('booking.fields.email.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.email ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.email')}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.phone.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            aria-required="true"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            placeholder={t('booking.fields.phone.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.phone ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.phone && (
            <p id="phone-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.phone')}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.address.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            {...register('address')}
            aria-required="true"
            aria-invalid={errors.address ? 'true' : 'false'}
            aria-describedby={errors.address ? 'address-error' : 'address-hint'}
            placeholder={t('booking.fields.address.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.address ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.address ? (
            <p id="address-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.required')}
            </p>
          ) : (
            <p id="address-hint" className="font-body text-lg text-text-muted font-semibold mt-1">
              {t('booking.fields.address.hint')}
            </p>
          )}
        </div>

        {/* Preferred cleaner (optional) */}
        <div>
          <label htmlFor="preferredCleaner" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.preferredCleaner.label')}
          </label>
          <input
            id="preferredCleaner"
            type="text"
            {...register('preferredCleaner')}
            placeholder={t('booking.fields.preferredCleaner.placeholder')}
            className="w-full border border-sand rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label htmlFor="notes" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.notes.label')}
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            placeholder={t('booking.fields.notes.placeholder')}
            className="w-full border border-sand rounded px-4 py-3 font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand resize-y"
          />
        </div>
      </div>

      </div>
  )
}
