import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-8">
      <div
        role="group"
        aria-label={t('booking.progress', { current: currentStep + 1, total: totalSteps })}
        className="flex items-center justify-between mb-3"
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div
              aria-current={i === currentStep ? 'step' : undefined}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-body text-base font-medium shrink-0 transition-colors',
                i < currentStep  && 'bg-slate-brand text-white',
                i === currentStep && 'bg-slate-brand text-white ring-2 ring-slate-brand ring-offset-2',
                i > currentStep  && 'bg-sand text-text-muted',
              )}
            >
              {i < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1 transition-colors', i < currentStep ? 'bg-slate-brand' : 'bg-sand')} />
            )}
          </div>
        ))}
      </div>
      <p aria-live="polite" aria-atomic="true" className="font-body text-base text-text-muted text-center">
        {t('booking.progress', { current: currentStep + 1, total: totalSteps })}
      </p>
    </div>
  )
}
