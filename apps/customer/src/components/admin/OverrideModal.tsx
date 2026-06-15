import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'

interface OverrideModalProps {
  isOpen: boolean
  cleanerName: string
  warnings: string[]
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  cleanerName,
  warnings,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError(t('admin.override.reasonRequired', { defaultValue: 'Override reason is required.' }))
      return
    }

    onConfirm(trimmedReason)
    setReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-sand rounded shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand bg-warm-white">
          <h3 className="font-sub text-xl text-charcoal font-bold">
            {t('admin.override.modalTitle', { defaultValue: 'Administrator Override Required' })}
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('admin.override.modalMessage', {
              name: cleanerName,
              defaultValue: `Assigning this shift to ${cleanerName} requires an administrator override due to the following constraint violations:`,
            })}
          </p>

          {warnings.length > 0 && (
            <div className="flex flex-col gap-2 p-4 bg-red-50/50 border border-red-200 text-red-800 rounded">
              {warnings.map((warn, index) => (
                <div key={index} className="font-body text-sm font-semibold flex items-start gap-1.5">
                  <span className="shrink-0">⚠️</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5 mt-2">
            <label htmlFor="override-reason" className="font-body text-sm text-text-muted font-medium">
              {t('admin.override.reasonLabel', { defaultValue: 'Override Reason' })}
            </label>
            <textarea
              id="override-reason"
              rows={3}
              placeholder={t('admin.override.reasonPlaceholder', {
                defaultValue: 'e.g. Urgent replacement requested by client',
              })}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                'border rounded p-3 font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand resize-none',
                error ? 'border-red-500' : 'border-sand'
              )}
            />
            {error && <span className="text-red-700 text-xs font-semibold mt-1">{error}</span>}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'border border-sand text-charcoal font-body font-medium rounded',
                'min-h-[48px] px-5 py-2 hover:bg-cream transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand'
              )}
            >
              {t('admin.override.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              className={cn(
                'bg-red-700 hover:bg-red-800 text-white font-body font-medium rounded',
                'min-h-[48px] px-5 py-2 transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2'
              )}
            >
              {t('admin.override.confirm', { defaultValue: 'Override & Assign' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
