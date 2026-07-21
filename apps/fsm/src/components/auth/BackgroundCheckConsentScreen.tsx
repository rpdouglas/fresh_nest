import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { httpsCallable } from 'firebase/functions'
import { cn } from '@freshnest/shared'
import { functions } from '../../lib/firebase/firebase'
import { useStaffAuth } from '../../hooks/useStaffAuth'

export const BackgroundCheckConsentScreen: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { staffProfile, logout } = useStaffAuth()
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Screen 2 of the eventual P3-E27-C1 sequence — shown standalone ahead of
  // TermsConsentOverlay until OnboardingSequenceGuard formalizes the ordering.
  const showOverlay = staffProfile && staffProfile.backgroundCheck?.consentGiven !== true

  if (!showOverlay) return null

  const handleConsent = async () => {
    if (!isChecked || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const submitConsent = httpsCallable(functions, 'submitBackgroundCheckConsent')
      await submitConsent()
    } catch (err) {
      console.error('Failed to submit background check consent:', err)
      setError(t('fsm.compliance.backgroundCheck.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (isDeclining) return
    setIsDeclining(true)
    try {
      await logout()
    } catch (err) {
      console.error('Failed to sign out after declining background check consent:', err)
    } finally {
      setIsDeclining(false)
    }
  }

  const isRtl = i18n.language === 'ar'

  return (
    // z-[60]: must stack above TermsConsentOverlay (z-50) so background check consent
    // (Screen 2 of the eventual P3-E27-C1 sequence) is always resolved before Terms (Screen 3).
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-2xl bg-white border border-sand rounded shadow-xl p-6 md:p-8 flex flex-col max-h-[90vh]',
          isRtl ? 'text-right' : 'text-left'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="background-check-modal-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="mb-4">
          <h2
            id="background-check-modal-title"
            className="font-display text-3xl font-bold text-charcoal leading-tight"
          >
            {t('fsm.compliance.backgroundCheck.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.compliance.backgroundCheck.subtitle')}
          </p>
        </div>

        <div className="flex-grow overflow-y-auto border border-sand rounded bg-warm-white p-4 mb-6 space-y-4">
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('fsm.compliance.backgroundCheck.explanation')}
          </p>
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('fsm.compliance.backgroundCheck.rights')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none group min-h-[48px] py-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            disabled={isSubmitting || isDeclining}
            className="w-6 h-6 mt-0.5 rounded border-sand text-slate-brand focus:ring-slate-brand transition-colors cursor-pointer"
          />
          <span className="font-body text-base text-charcoal leading-snug group-hover:text-slate-brand transition-colors">
            {t('fsm.compliance.backgroundCheck.checkbox')}
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sand pt-4">
          <button
            type="button"
            onClick={() => { void handleDecline() }}
            disabled={isSubmitting || isDeclining}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 font-body font-medium text-slate-brand hover:text-slate-dark hover:bg-slate-pale rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand order-2 sm:order-1 disabled:opacity-50"
          >
            {isDeclining ? t('fsm.compliance.backgroundCheck.declining') : t('fsm.compliance.backgroundCheck.declineBtn')}
          </button>

          <button
            type="button"
            onClick={() => { void handleConsent() }}
            disabled={!isChecked || isSubmitting || isDeclining}
            className={cn(
              'w-full sm:w-auto min-h-[48px] px-8 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2',
              isSubmitting && 'bg-slate-dark'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('fsm.compliance.backgroundCheck.submitting')}</span>
              </>
            ) : (
              <span>{t('fsm.compliance.backgroundCheck.consentBtn')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
