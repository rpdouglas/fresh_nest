import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { StaffRole } from '@/types'
import { usePayRates } from './hooks/usePayRates'

const payRateFormSchema = z.object({
  role: z.enum(['cleaner', 'lead', 'supervisor']),
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'amountError' }
  ),
  effectiveImmediately: z.boolean(),
  effectiveDate: z.string().optional(),
})

type PayRateFormValues = z.infer<typeof payRateFormSchema>

interface PayRatesManagerProps {
  isAuthorized: boolean
}

export const PayRatesManager: React.FC<PayRatesManagerProps> = ({ isAuthorized }) => {
  const { t } = useTranslation()
  const { payRates, activeRates, isLoading, error, createRate } = usePayRates(isAuthorized)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PayRateFormValues>({
    resolver: zodResolver(payRateFormSchema),
    defaultValues: {
      role: 'cleaner',
      amount: '',
      effectiveImmediately: true,
      effectiveDate: '',
    },
  })

  const effectiveImmediately = watch('effectiveImmediately')

  const onSubmit = (values: PayRateFormValues) => {
    void handleFormSubmit(values)
  }

  const handleFormSubmitWrapper = (e: React.FormEvent) => {
    void handleSubmit(onSubmit)(e)
  }

  const handleFormSubmit = async (values: PayRateFormValues) => {
    try {
      setSubmitError(null)
      const amountNum = parseFloat(values.amount)
      let effectiveFrom = new Date()

      if (!values.effectiveImmediately) {
        if (!values.effectiveDate) {
          setSubmitError(t('admin.payRates.form.errors.date'))
          return
        }
        effectiveFrom = new Date(values.effectiveDate)
        if (isNaN(effectiveFrom.getTime())) {
          setSubmitError(t('admin.payRates.form.errors.date'))
          return
        }
      }

      await createRate({
        role: values.role,
        amount: amountNum,
        effectiveFrom,
      })

      setSuccessMessage(t('admin.payRates.form.success'))
      reset()
      setIsFormOpen(false)
      setTimeout(() => {
        setSuccessMessage(null)
      }, 4000)
    } catch (err) {
      console.error(err)
      setSubmitError(t('admin.payRates.form.errors.saveError', { defaultValue: 'Failed to save pay rate.' }))
    }
  }

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'cleaner':
        return t('admin.staff.modal.roleOption.cleaner', { defaultValue: 'Cleaner' })
      case 'lead':
        return t('admin.staff.modal.roleOption.lead', { defaultValue: 'Lead Cleaner' })
      case 'supervisor':
        return t('admin.staff.modal.roleOption.supervisor', { defaultValue: 'Supervisor' })
      default:
        return role
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(val)
  }

  // Calculate rate status for historical log list
  const getRateStatus = (rate: typeof payRates[0]) => {
    const now = new Date()
    if (rate.effectiveFrom > now) {
      return { label: t('admin.payRates.scheduled'), colorClass: 'bg-amber-100 text-amber-800' }
    }

    // Is it active? Compare it to the active rate resolved for this role
    const activeRate = activeRates[rate.role]
    if (activeRate && activeRate.id === rate.id) {
      return { label: t('admin.payRates.active'), colorClass: 'bg-green-100 text-green-800 border-green-200' }
    }

    return { label: t('admin.payRates.historical'), colorClass: 'bg-slate-100 text-text-muted border-slate-200' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
        {t('admin.payRates.errorLoading', { defaultValue: 'Error loading pay rates.' })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.payRates.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.payRates.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={cn(
            'bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded',
            'min-h-[48px] px-6 py-2 text-base self-start sm:self-auto transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
          )}
        >
          {isFormOpen ? t('admin.payRates.form.cancel') : t('admin.payRates.createBtn')}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded font-body text-base">
          {successMessage}
        </div>
      )}

      {/* Form Container (Accordion/Dropdown style) */}
      {isFormOpen && (
        <div className="bg-white border border-sand rounded p-6 shadow-sm max-w-xl">
          <h3 className="font-sub text-2xl text-charcoal mb-4">
            {t('admin.payRates.form.title')}
          </h3>
          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
              {submitError}
            </div>
          )}
          <form onSubmit={handleFormSubmitWrapper} className="flex flex-col gap-6">
            {/* Role selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="font-body text-base text-charcoal font-medium">
                {t('admin.payRates.role')}
              </label>
              <select
                id="role"
                {...register('role')}
                className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="cleaner">{getRoleLabel('cleaner')}</option>
                <option value="lead">{getRoleLabel('lead')}</option>
                <option value="supervisor">{getRoleLabel('supervisor')}</option>
              </select>
              {errors.role && (
                <p className="text-red-600 font-body text-sm mt-1">{t('admin.payRates.form.errors.role')}</p>
              )}
            </div>

            {/* Rate Amount */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="font-body text-base text-charcoal font-medium">
                {t('admin.payRates.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-base text-text-muted">
                  $
                </span>
                <input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  {...register('amount')}
                  className="w-full border border-sand rounded pl-8 pr-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                />
              </div>
              {errors.amount && (
                <p className="text-red-600 font-body text-sm mt-1">{t('admin.payRates.form.errors.amount')}</p>
              )}
            </div>

            {/* Effective Immediately Switch */}
            <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
              <input
                type="checkbox"
                id="effectiveImmediately"
                className="w-5 h-5 accent-slate-brand rounded"
                {...register('effectiveImmediately')}
              />
              <span className="font-body text-base text-charcoal">
                {t('admin.payRates.effectiveImmediately')}
              </span>
            </label>

            {/* Custom Effective Date */}
            {!effectiveImmediately && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effectiveDate" className="font-body text-base text-charcoal font-medium">
                  {t('admin.payRates.effectiveFrom')}
                </label>
                <input
                  id="effectiveDate"
                  type="datetime-local"
                  {...register('effectiveDate')}
                  className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                />
              </div>
            )}

            {/* Submit button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded',
                  'min-h-[48px] px-6 py-2 text-base transition-colors duration-200',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                )}
              >
                {isSubmitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('admin.payRates.form.submit')}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="border border-sand text-charcoal hover:bg-cream font-body font-medium rounded min-h-[48px] px-6 py-2 text-base transition-colors duration-200"
              >
                {t('admin.payRates.form.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active rates Summary Cards */}
      <div>
        <h3 className="font-sub text-2xl text-charcoal mb-4">
          {t('admin.payRates.activeHeader')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(['cleaner', 'lead', 'supervisor'] as StaffRole[]).map((role) => {
            const activeRate = activeRates[role]
            return (
              <div key={role} className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-2">
                <span className="font-body text-base font-medium text-text-muted leading-none">
                  {getRoleLabel(role)}
                </span>
                <span className="font-display text-4xl text-charcoal font-bold mt-1">
                  {activeRate ? formatCurrency(activeRate.amount) : formatCurrency(0)}
                  <span className="font-body text-base text-text-muted font-normal ml-1">/ hr</span>
                </span>
                <div className="mt-2 flex items-center justify-between">
                  {activeRate ? (
                    <span className="text-xs bg-green-100 text-green-800 font-body px-2.5 py-0.5 rounded border border-green-200">
                      {t('admin.payRates.active')}
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 text-text-muted font-body px-2.5 py-0.5 rounded border border-sand">
                      {t('admin.payRates.form.errors.rolePlaceholder', { defaultValue: 'Not configured' })}
                    </span>
                  )}
                  {activeRate && (
                    <span className="font-body text-xs text-text-muted">
                      {t('admin.payRates.createdAt', { date: activeRate.effectiveFrom.toLocaleDateString() })}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chronological History Log */}
      <div>
        <h3 className="font-sub text-2xl text-charcoal mb-4">
          {t('admin.payRates.historyHeader')}
        </h3>
        <div className="bg-white border border-sand rounded overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-cream">
                <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.payRates.role')}</th>
                <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.payRates.amount')}</th>
                <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.payRates.effectiveFrom')}</th>
                <th className="p-4 font-body text-base font-medium text-charcoal">Status</th>
                <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.payRates.createdBy', { email: 'Created By' }).replace(': {{email}}', '')}</th>
              </tr>
            </thead>
            <tbody>
              {payRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center font-body text-base text-text-muted">
                    {t('admin.payRates.historyEmpty', { defaultValue: 'No pay rates recorded yet.' })}
                  </td>
                </tr>
              ) : (
                payRates.map((rate) => {
                  const status = getRateStatus(rate)
                  return (
                    <tr key={rate.id} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                      <td className="p-4 font-body text-base text-charcoal font-medium">
                        {getRoleLabel(rate.role)}
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {formatCurrency(rate.amount)}
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {rate.effectiveFrom.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={cn('text-xs font-body px-2.5 py-0.5 rounded border', status.colorClass)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 font-body text-base text-text-muted">
                        {rate.createdBy}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
