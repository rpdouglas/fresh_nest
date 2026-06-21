import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { adminBookingSchema } from '@/lib/schemas/bookingSchema'
import type { AdminBookingFormData } from '@/lib/schemas/bookingSchema'
import { useStaff } from './hooks/useStaff'

const ADD_ON_KEYS = ['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement'] as const

interface AdminBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AdminBookingFormData, adminEmail: string) => Promise<void>
  adminEmail: string
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  adminEmail,
}) => {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { staffList } = useStaff(true)
  const activeStaff = staffList.filter((s) => s.status === 'active')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<AdminBookingFormData>({
    resolver: zodResolver(adminBookingSchema),
    defaultValues: {
      serviceType:      'standard',
      propertyType:     '1-2bed',
      bedrooms:         2,
      bathrooms:        1,
      pets:             false,
      addOns:           [],
      frequency:        'one-time',
      preferredDate:    '',
      firstName:        '',
      lastName:         '',
      email:            '',
      phone:            '',
      address:          '',
      notes:            '',
      language:         'en',
      leadSource:       'phone',
      assignedTo:       null,
      status:           'pending',
      marketingConsent: false,
    },
  })

  if (!isOpen) return null

  const watchedStatus = watch('status')
  const watchedAssignedTo = watch('assignedTo')

  const handleFormSubmit = async (values: AdminBookingFormData) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(values, adminEmail)
      reset()
      onClose()
    } catch {
      setSubmitError(t('admin.bookings.modal.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
      hasError && 'border-red-500 focus:ring-red-500',
    )

  const selectClass = cn(
    'w-full min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent',
    'focus:outline-none focus:ring-2 focus:ring-slate-brand',
  )

  const labelClass = 'block font-body text-base text-charcoal font-medium mb-1'
  const errorClass = 'font-body text-base text-red-600 mt-1 block'
  const sectionHeadClass = 'font-sub text-xl text-charcoal border-b border-sand pb-2 mb-4'

  return (
    <div className="fixed inset-0 bg-charcoal/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="bg-white border border-sand rounded p-6 shadow-lg max-w-2xl w-full flex flex-col gap-6 my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-booking-modal-title"
      >
        <div>
          <h2 id="admin-booking-modal-title" className="font-display text-3xl text-charcoal">
            {t('admin.bookings.modal.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.bookings.modal.subtitle')}
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
            {submitError}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(handleFormSubmit)(e) }} className="flex flex-col gap-8">

          {/* ── Section 1: Service & Property ─────────────────────────── */}
          <section>
            <h3 className={sectionHeadClass}>{t('admin.bookings.modal.section.service')}</h3>
            <div className="flex flex-col gap-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service Type */}
                <div>
                  <label htmlFor="ab-serviceType" className={labelClass}>
                    {t('admin.bookings.modal.serviceType')}
                  </label>
                  <select id="ab-serviceType" {...register('serviceType')} className={selectClass}>
                    <option value="standard">{t('services.standard.title')}</option>
                    <option value="deep">{t('services.deep.title')}</option>
                    <option value="moveout">{t('services.moveout.title')}</option>
                    <option value="postconstruction">{t('services.postconstruction.title')}</option>
                    <option value="airbnb">{t('services.airbnb.title')}</option>
                    <option value="commercial">{t('services.commercial.title')}</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label htmlFor="ab-propertyType" className={labelClass}>
                    {t('admin.bookings.modal.propertyType')}
                  </label>
                  <select id="ab-propertyType" {...register('propertyType')} className={selectClass}>
                    <option value="apartment">{t('booking.fields.propertyType.options.apartment')}</option>
                    <option value="1-2bed">{t('booking.fields.propertyType.options.1-2bed')}</option>
                    <option value="3-4bed">{t('booking.fields.propertyType.options.3-4bed')}</option>
                    <option value="5+bed">{t('booking.fields.propertyType.options.5+bed')}</option>
                    <option value="commercial">{t('booking.fields.propertyType.options.commercial')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div>
                  <label htmlFor="ab-bedrooms" className={labelClass}>
                    {t('admin.bookings.modal.bedrooms')}
                  </label>
                  <input
                    id="ab-bedrooms"
                    type="number"
                    min={0}
                    max={20}
                    {...register('bedrooms', { valueAsNumber: true })}
                    className={inputClass(!!errors.bedrooms)}
                  />
                  {errors.bedrooms && <span className={errorClass}>{errors.bedrooms.message}</span>}
                </div>

                {/* Bathrooms */}
                <div>
                  <label htmlFor="ab-bathrooms" className={labelClass}>
                    {t('admin.bookings.modal.bathrooms')}
                  </label>
                  <input
                    id="ab-bathrooms"
                    type="number"
                    min={0}
                    max={10}
                    {...register('bathrooms', { valueAsNumber: true })}
                    className={inputClass(!!errors.bathrooms)}
                  />
                  {errors.bathrooms && <span className={errorClass}>{errors.bathrooms.message}</span>}
                </div>
              </div>

              {/* Square Footage */}
              <div>
                <label htmlFor="ab-squareFootage" className={labelClass}>
                  {t('admin.bookings.modal.squareFootage')}
                </label>
                <input
                  id="ab-squareFootage"
                  type="number"
                  min={0}
                  placeholder={t('admin.bookings.modal.squareFootagePlaceholder')}
                  {...register('squareFootage', { valueAsNumber: true })}
                  className={inputClass(!!errors.squareFootage)}
                />
              </div>

              {/* Pets */}
              <div className="flex items-center gap-3 min-h-[48px]">
                <input
                  id="ab-pets"
                  type="checkbox"
                  {...register('pets')}
                  className="w-5 h-5 accent-slate-brand"
                />
                <label htmlFor="ab-pets" className="font-body text-base text-charcoal">
                  {t('admin.bookings.modal.pets')}
                </label>
              </div>

              {/* Add-Ons */}
              <div>
                <p className={labelClass}>{t('admin.bookings.modal.addOns')}</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ADD_ON_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-3 min-h-[48px]">
                      <input
                        id={`ab-addon-${key}`}
                        type="checkbox"
                        value={key}
                        {...register('addOns')}
                        className="w-5 h-5 accent-slate-brand"
                      />
                      <label htmlFor={`ab-addon-${key}`} className="font-body text-base text-charcoal">
                        {t(`booking.fields.addOns.options.${key}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Schedule & Contact ─────────────────────────── */}
          <section>
            <h3 className={sectionHeadClass}>{t('admin.bookings.modal.section.schedule')}</h3>
            <div className="flex flex-col gap-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preferred Date */}
                <div>
                  <label htmlFor="ab-preferredDate" className={labelClass}>
                    {t('admin.bookings.modal.preferredDate')}
                  </label>
                  <input
                    id="ab-preferredDate"
                    type="date"
                    {...register('preferredDate')}
                    className={inputClass(!!errors.preferredDate)}
                  />
                  {errors.preferredDate && <span className={errorClass}>{errors.preferredDate.message}</span>}
                </div>

                {/* Frequency */}
                <div>
                  <label htmlFor="ab-frequency" className={labelClass}>
                    {t('admin.bookings.modal.frequency')}
                  </label>
                  <select id="ab-frequency" {...register('frequency')} className={selectClass}>
                    <option value="one-time">{t('booking.fields.frequency.options.one-time')}</option>
                    <option value="weekly">{t('booking.fields.frequency.options.weekly')}</option>
                    <option value="biweekly">{t('booking.fields.frequency.options.biweekly')}</option>
                    <option value="monthly">{t('booking.fields.frequency.options.monthly')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="ab-firstName" className={labelClass}>
                    {t('admin.bookings.modal.firstName')}
                  </label>
                  <input
                    id="ab-firstName"
                    type="text"
                    {...register('firstName')}
                    className={inputClass(!!errors.firstName)}
                  />
                  {errors.firstName && <span className={errorClass}>{errors.firstName.message}</span>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="ab-lastName" className={labelClass}>
                    {t('admin.bookings.modal.lastName')}
                  </label>
                  <input
                    id="ab-lastName"
                    type="text"
                    {...register('lastName')}
                    className={inputClass(!!errors.lastName)}
                  />
                  {errors.lastName && <span className={errorClass}>{errors.lastName.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="ab-email" className={labelClass}>
                    {t('admin.bookings.modal.email')}
                  </label>
                  <input
                    id="ab-email"
                    type="email"
                    {...register('email')}
                    className={inputClass(!!errors.email)}
                  />
                  {errors.email && <span className={errorClass}>{errors.email.message}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="ab-phone" className={labelClass}>
                    {t('admin.bookings.modal.phone')}
                  </label>
                  <input
                    id="ab-phone"
                    type="tel"
                    {...register('phone')}
                    className={inputClass(!!errors.phone)}
                  />
                  {errors.phone && <span className={errorClass}>{errors.phone.message}</span>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="ab-address" className={labelClass}>
                  {t('admin.bookings.modal.address')}
                </label>
                <input
                  id="ab-address"
                  type="text"
                  {...register('address')}
                  className={inputClass(!!errors.address)}
                />
                {errors.address && <span className={errorClass}>{errors.address.message}</span>}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="ab-notes" className={labelClass}>
                  {t('admin.bookings.modal.notes')}
                </label>
                <textarea
                  id="ab-notes"
                  rows={3}
                  {...register('notes')}
                  className={cn(inputClass(!!errors.notes), 'resize-y min-h-[80px]')}
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Admin Controls ──────────────────────────────── */}
          <section>
            <h3 className={sectionHeadClass}>{t('admin.bookings.modal.section.controls')}</h3>
            <div className="flex flex-col gap-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Language */}
                <div>
                  <label htmlFor="ab-language" className={labelClass}>
                    {t('admin.bookings.modal.language')}
                  </label>
                  <select id="ab-language" {...register('language')} className={selectClass}>
                    <option value="en">{t('admin.bookings.modal.languageOptions.en')}</option>
                    <option value="fr">{t('admin.bookings.modal.languageOptions.fr')}</option>
                  </select>
                </div>

                {/* Lead Source */}
                <div>
                  <label htmlFor="ab-leadSource" className={labelClass}>
                    {t('admin.bookings.modal.leadSource')}
                  </label>
                  <select id="ab-leadSource" {...register('leadSource')} className={selectClass}>
                    <option value="phone">{t('admin.bookings.modal.leadSourceOptions.phone')}</option>
                    <option value="walk-in">{t('admin.bookings.modal.leadSourceOptions.walk-in')}</option>
                    <option value="organic">{t('admin.bookings.modal.leadSourceOptions.organic')}</option>
                    <option value="google">{t('admin.bookings.modal.leadSourceOptions.google')}</option>
                    <option value="referral">{t('admin.bookings.modal.leadSourceOptions.referral')}</option>
                    <option value="facebook">{t('admin.bookings.modal.leadSourceOptions.facebook')}</option>
                    <option value="direct">{t('admin.bookings.modal.leadSourceOptions.direct')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assign Cleaner */}
                <div>
                  <label htmlFor="ab-assignedTo" className={labelClass}>
                    {t('admin.bookings.modal.assignedTo')}
                  </label>
                  <select id="ab-assignedTo" {...register('assignedTo')} className={selectClass}>
                    <option value="">{t('admin.bookings.modal.unassigned')}</option>
                    {activeStaff.map((s) => (
                      <option key={s.id} value={`${s.firstName} ${s.lastName}`}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="ab-status" className={labelClass}>
                    {t('admin.bookings.modal.status')}
                  </label>
                  <select id="ab-status" {...register('status')} className={selectClass}>
                    <option value="pending">{t('admin.bookings.modal.statusOptions.pending')}</option>
                    <option value="confirmed">{t('admin.bookings.modal.statusOptions.confirmed')}</option>
                  </select>
                </div>
              </div>

              {/* Confirmed warning */}
              {watchedStatus === 'confirmed' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded font-body text-base text-yellow-800">
                  {t('admin.bookings.modal.confirmedWarning')}
                  {!watchedAssignedTo && (
                    <div className="mt-1 font-medium">{t('admin.bookings.modal.noStaffWarning')}</div>
                  )}
                </div>
              )}

              {/* Marketing Consent */}
              <div className="flex items-center gap-3 min-h-[48px]">
                <input
                  id="ab-marketingConsent"
                  type="checkbox"
                  defaultChecked={false}
                  {...register('marketingConsent')}
                  className="w-5 h-5 accent-slate-brand"
                />
                <label htmlFor="ab-marketingConsent" className="font-body text-base text-charcoal">
                  {t('admin.bookings.modal.marketingConsent')}
                </label>
              </div>
            </div>
          </section>

          {/* ── Action Buttons ─────────────────────────────────────────── */}
          <div className="flex justify-end items-center gap-4 border-t border-sand pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                'min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium rounded',
                'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              {t('admin.bookings.modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body font-medium rounded',
                'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                'disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
              )}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('admin.bookings.modal.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
