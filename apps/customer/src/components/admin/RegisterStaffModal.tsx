import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { RegisterStaffInput } from './hooks/useStaff'

const registerStaffSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  role: z.enum(['cleaner', 'lead', 'supervisor']),
  status: z.enum(['onboarding', 'active', 'inactive']),
  language: z.enum(['en', 'fr']),
  transportMode: z.enum(['personal_vehicle', 'transit', 'rideshare', 'walk']),
  transitBufferMinutes: z.number().min(0, { message: 'Transit buffer must be positive' }),
  monthlyEarningsLimit: z.string().optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Monthly earnings limit must be a positive number',
    }),
})

type RegisterStaffFormValues = z.infer<typeof registerStaffSchema>

interface RegisterStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onRegister: (data: RegisterStaffInput) => Promise<void>
}

export const RegisterStaffModal: React.FC<RegisterStaffModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterStaffFormValues>({
    resolver: zodResolver(registerStaffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'cleaner',
      status: 'onboarding',
      language: 'en',
      transportMode: 'personal_vehicle',
      transitBufferMinutes: 60,
      monthlyEarningsLimit: '',
    },
  })

  if (!isOpen) return null

  const onSubmitForm = async (values: RegisterStaffFormValues) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const limitVal = values.monthlyEarningsLimit?.trim()
      const monthlyEarningsLimit = limitVal ? Number(limitVal) : null

      await onRegister({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        status: values.status,
        language: values.language,
        transportMode: values.transportMode,
        transitBufferMinutes: values.transitBufferMinutes,
        monthlyEarningsLimit,
      })
      reset()
      onClose()
    } catch (err) {
      console.error(err)
      setSubmitError(t('admin.staff.modal.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-charcoal/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white border border-sand rounded p-6 shadow-lg max-w-2xl w-full flex flex-col gap-6 my-8"
        role="dialog"
        aria-modal="true"
      >
        <div>
          <h2 className="font-display text-3xl text-charcoal">
            {t('admin.staff.modal.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.staff.subtitle')}
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
            {submitError}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(onSubmitForm)(e) }} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="firstName" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.firstName')}
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className={cn(
                  'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                  errors.firstName && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.firstName && (
                <span className="font-body text-base text-red-600 mt-1 block">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="lastName" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.lastName')}
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className={cn(
                  'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                  errors.lastName && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.lastName && (
                <span className="font-body text-base text-red-600 mt-1 block">
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.email')}
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={cn(
                  'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                  errors.email && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.email && (
                <span className="font-body text-base text-red-600 mt-1 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.phone')}
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className={cn(
                  'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                  errors.phone && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.phone && (
                <span className="font-body text-base text-red-600 mt-1 block">
                  {errors.phone.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role */}
            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.role')}
              </label>
              <select
                id="role"
                {...register('role')}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="cleaner">{t('admin.staff.modal.roleOption.cleaner', { defaultValue: 'Cleaner' })}</option>
                <option value="lead">{t('admin.staff.modal.roleOption.lead', { defaultValue: 'Lead Cleaner' })}</option>
                <option value="supervisor">{t('admin.staff.modal.roleOption.supervisor', { defaultValue: 'Supervisor' })}</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label htmlFor="status" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.status')}
              </label>
              <select
                id="status"
                {...register('status')}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="onboarding">{t('admin.staff.modal.statusOption.onboarding', { defaultValue: 'Onboarding' })}</option>
                <option value="active">{t('admin.staff.modal.statusOption.active', { defaultValue: 'Active' })}</option>
                <option value="inactive">{t('admin.staff.modal.statusOption.inactive', { defaultValue: 'Inactive' })}</option>
              </select>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1">
              <label htmlFor="language" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.language')}
              </label>
              <select
                id="language"
                {...register('language')}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transport Mode */}
            <div className="flex flex-col gap-1">
              <label htmlFor="transportMode" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.transport')}
              </label>
              <select
                id="transportMode"
                {...register('transportMode')}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="personal_vehicle">{t('admin.staff.modal.transportOption.personal_vehicle', { defaultValue: 'Personal Vehicle' })}</option>
                <option value="transit">{t('admin.staff.modal.transportOption.transit', { defaultValue: 'Public Transit' })}</option>
                <option value="rideshare">{t('admin.staff.modal.transportOption.rideshare', { defaultValue: 'Rideshare' })}</option>
                <option value="walk">{t('admin.staff.modal.transportOption.walk', { defaultValue: 'Walking' })}</option>
              </select>
            </div>

            {/* Transit Buffer */}
            <div className="flex flex-col gap-1">
              <label htmlFor="transitBufferMinutes" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.modal.buffer')}
              </label>
              <input
                id="transitBufferMinutes"
                type="number"
                {...register('transitBufferMinutes', { valueAsNumber: true })}
                className={cn(
                  'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                  errors.transitBufferMinutes && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.transitBufferMinutes && (
                <span className="font-body text-base text-red-600 mt-1 block">
                  {errors.transitBufferMinutes.message}
                </span>
              )}
            </div>
          </div>

          {/* Monthly Earnings Limit */}
          <div className="flex flex-col gap-1">
            <label htmlFor="monthlyEarningsLimit" className="font-body text-base text-charcoal font-medium">
              {t('admin.staff.modal.earningsLimit')}
            </label>
            <input
              id="monthlyEarningsLimit"
              type="number"
              placeholder="e.g. 1000"
              {...register('monthlyEarningsLimit')}
              className={cn(
                'min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:border-transparent',
                errors.monthlyEarningsLimit && 'border-red-500 focus:ring-red-500'
              )}
            />
            {errors.monthlyEarningsLimit && (
              <span className="font-body text-base text-red-600 mt-1 block">
                {errors.monthlyEarningsLimit.message}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end items-center gap-4 mt-4 border-t border-sand pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                'min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium rounded',
                'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              {t('admin.staff.modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body font-medium rounded',
                'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                'disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center'
              )}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('admin.staff.modal.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
