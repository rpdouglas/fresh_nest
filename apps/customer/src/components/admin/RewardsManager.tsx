import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { useRewards } from './hooks/useRewards'
import type { Credit } from '@/types'

const manualCreditFormSchema = z.object({
  customerEmail: z.string().email(),
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'amountError' }
  ),
  notes: z.string().optional(),
})

type ManualCreditFormValues = z.infer<typeof manualCreditFormSchema>

interface RewardsManagerProps {
  isAuthorized: boolean
}

export const RewardsManager: React.FC<RewardsManagerProps> = ({ isAuthorized }) => {
  const { t } = useTranslation()
  const { credits, isLoading, error, revokeCredit, createManualCredit } = useRewards(isAuthorized)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ManualCreditFormValues>({
    resolver: zodResolver(manualCreditFormSchema),
    defaultValues: { customerEmail: '', amount: '', notes: '' },
  })

  const handleFormSubmit = async (values: ManualCreditFormValues) => {
    try {
      setSubmitError(null)
      await createManualCredit({
        customerEmail: values.customerEmail,
        amount: parseFloat(values.amount),
        notes: values.notes,
      })
      setSuccessMessage(t('admin.rewards.form.success'))
      reset()
      setIsFormOpen(false)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      console.error(err)
      setSubmitError(t('admin.rewards.form.errors.saveError'))
    }
  }

  const handleRevoke = async (creditId: string) => {
    setRevokingId(creditId)
    try {
      await revokeCredit(creditId)
      setSuccessMessage(t('admin.rewards.revokeSuccess'))
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      console.error(err)
      setSubmitError(t('admin.rewards.revokeError'))
    } finally {
      setRevokingId(null)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val)

  const getStatusBadge = (status: Credit['status']) => {
    switch (status) {
      case 'available':
        return { label: t('admin.rewards.status.available'), colorClass: 'bg-green-100 text-green-800 border-green-200' }
      case 'redeemed':
        return { label: t('admin.rewards.status.redeemed'), colorClass: 'bg-slate-100 text-text-muted border-slate-200' }
      default:
        return { label: t('admin.rewards.status.revoked'), colorClass: 'bg-red-100 text-red-800 border-red-200' }
    }
  }

  const getReasonLabel = (reason: Credit['reason']) =>
    reason === 'referral_reward' ? t('admin.rewards.reason.referralReward') : t('admin.rewards.reason.adminAdjustment')

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
        {t('admin.rewards.errorLoading')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.rewards.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.rewards.subtitle')}
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
          {isFormOpen ? t('admin.rewards.form.cancel') : t('admin.rewards.createBtn')}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded font-body text-base">
          {successMessage}
        </div>
      )}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
          {submitError}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white border border-sand rounded p-6 shadow-sm max-w-xl">
          <h3 className="font-sub text-2xl text-charcoal mb-4">
            {t('admin.rewards.form.title')}
          </h3>
          <form onSubmit={(e) => { void handleSubmit(handleFormSubmit)(e) }} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customerEmail" className="font-body text-base text-charcoal font-medium">
                {t('admin.rewards.form.customerEmail')}
              </label>
              <input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
              {errors.customerEmail && (
                <p className="text-red-600 font-body text-base mt-1">{t('admin.rewards.form.errors.customerEmail')}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="font-body text-base text-charcoal font-medium">
                {t('admin.rewards.form.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-base text-text-muted">$</span>
                <input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  {...register('amount')}
                  className="w-full border border-sand rounded pl-8 pr-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                />
              </div>
              {errors.amount && (
                <p className="text-red-600 font-body text-base mt-1">{t('admin.rewards.form.errors.amount')}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="font-body text-base text-charcoal font-medium">
                {t('admin.rewards.form.notes')}
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
            </div>

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
                {t('admin.rewards.form.submit')}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="border border-sand text-charcoal hover:bg-cream font-body font-medium rounded min-h-[48px] px-6 py-2 text-base transition-colors duration-200"
              >
                {t('admin.rewards.form.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-sand rounded overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-sand bg-cream">
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.customer')}</th>
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.amount')}</th>
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.reason')}</th>
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.status')}</th>
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.issuedAt')}</th>
              <th className="p-4 font-body text-base font-medium text-charcoal">{t('admin.rewards.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {credits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center font-body text-base text-text-muted">
                  {t('admin.rewards.table.empty')}
                </td>
              </tr>
            ) : (
              credits.map((credit) => {
                const status = getStatusBadge(credit.status)
                return (
                  <tr key={credit.id} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                    <td className="p-4 font-body text-base text-charcoal font-medium">{credit.customerEmail}</td>
                    <td className="p-4 font-body text-base text-charcoal">{formatCurrency(credit.amount)}</td>
                    <td className="p-4 font-body text-base text-charcoal">{getReasonLabel(credit.reason)}</td>
                    <td className="p-4">
                      <span className={cn('text-base font-body px-2.5 py-0.5 rounded border', status.colorClass)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 font-body text-base text-text-muted">{credit.issuedAt.toLocaleDateString()}</td>
                    <td className="p-4">
                      {credit.status === 'available' && (
                        <button
                          type="button"
                          disabled={revokingId === credit.id}
                          onClick={() => { void handleRevoke(credit.id) }}
                          className="min-h-[48px] px-4 border border-sand rounded font-body text-base font-medium text-red-700 hover:bg-red-50 transition-colors"
                        >
                          {revokingId === credit.id ? t('admin.rewards.revoking') : t('admin.rewards.revokeBtn')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
