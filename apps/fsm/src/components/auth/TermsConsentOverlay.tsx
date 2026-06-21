import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { cn } from '@freshnest/shared'

export const TermsConsentOverlay: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const [isChecked, setIsChecked] = useState(false)
  const [ipAddress, setIpAddress] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  const CURRENT_TERMS_VERSION = (import.meta.env.VITE_CURRENT_TERMS_VERSION as string | undefined) || '2.1'

  // Show if: staff is logged in AND (has never accepted terms, OR accepted version is outdated)
  const showOverlay = staffProfile &&
    (staffProfile.compliance?.acceptedTermsVersion == null ||
      staffProfile.compliance.acceptedTermsVersion !== CURRENT_TERMS_VERSION)

  useEffect(() => {
    if (!showOverlay) return

    let isMounted = true
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
        if (!res.ok) throw new Error('IP service error')
        const data = await res.json() as { ip: string }
        if (isMounted) {
          setIpAddress(data.ip)
        }
      } catch (err) {
        console.warn('Failed to fetch IP address (offline or blocked):', err)
        if (isMounted) {
          setIpAddress('offline')
        }
      }
    }
    void fetchIp()

    return () => {
      isMounted = false
    }
  }, [showOverlay])

  if (!showOverlay) return null

  const handleAccept = async () => {
    if (!staffProfile || !isChecked || isAccepting) return
    setIsAccepting(true)
    try {
      const staffRef = doc(db, 'staff', staffProfile.id)
      await updateDoc(staffRef, {
        'compliance.acceptedTermsVersion': CURRENT_TERMS_VERSION,
        'compliance.termsHistory': arrayUnion({
          version: CURRENT_TERMS_VERSION,
          acceptedAt: new Date(),
          ipAddress: ipAddress || 'offline',
        }),
      })
    } catch (err) {
      console.error('Failed to accept Terms of Service:', err)
    } finally {
      setIsAccepting(false)
    }
  }

  // Determine LTR/RTL for UI shell, but terms body text itself stays LTR
  const isRtl = i18n.language === 'ar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-2xl bg-white border border-sand rounded shadow-xl p-6 md:p-8 flex flex-col max-h-[90vh]",
          isRtl ? "text-right" : "text-left"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="mb-4">
          <h2
            id="terms-modal-title"
            className="font-display text-3xl font-bold text-charcoal leading-tight"
          >
            {t('fsm.compliance.terms.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.compliance.terms.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-slate-pale text-slate-brand font-medium text-sm">
            {t('fsm.compliance.terms.versionLabel', { version: CURRENT_TERMS_VERSION })}
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div 
          className="flex-grow overflow-y-auto border border-sand rounded bg-warm-white p-4 mb-6 space-y-4"
          dir="ltr" // terms text is only LTR (EN/FR)
        >
          <div className="text-left font-body text-base text-charcoal leading-relaxed space-y-4">
            <div>
              <h3 className="font-sub text-lg font-semibold text-charcoal">
                {t('fsm.compliance.terms.sec1Title')}
              </h3>
              <p className="mt-1 font-body text-base text-charcoal">
                {t('fsm.compliance.terms.sec1Text')}
              </p>
            </div>

            <div>
              <h3 className="font-sub text-lg font-semibold text-charcoal">
                {t('fsm.compliance.terms.sec2Title')}
              </h3>
              <p className="mt-1 font-body text-base text-charcoal">
                {t('fsm.compliance.terms.sec2Text')}
              </p>
            </div>

            <div>
              <h3 className="font-sub text-lg font-semibold text-charcoal">
                {t('fsm.compliance.terms.sec3Title')}
              </h3>
              <p className="mt-1 font-body text-base text-charcoal">
                {t('fsm.compliance.terms.sec3Text')}
              </p>
            </div>

            <div>
              <h3 className="font-sub text-lg font-semibold text-charcoal">
                {t('fsm.compliance.terms.sec4Title')}
              </h3>
              <p className="mt-1 font-body text-base text-charcoal">
                {t('fsm.compliance.terms.sec4Text')}
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox Agreement */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none group min-h-[48px] py-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            disabled={isAccepting}
            className="w-6 h-6 mt-0.5 rounded border-sand text-slate-brand focus:ring-slate-brand transition-colors cursor-pointer"
          />
          <span className="font-body text-base text-charcoal leading-snug group-hover:text-slate-brand transition-colors">
            {t('fsm.compliance.terms.checkbox')}
          </span>
        </label>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sand pt-4">
          <span className="font-body text-sm text-text-muted order-2 sm:order-1 self-start sm:self-auto">
            {ipAddress && t('fsm.compliance.terms.ipLabel', { ip: ipAddress })}
          </span>

          <button
            type="button"
            onClick={() => { void handleAccept() }}
            disabled={!isChecked || isAccepting}
            className={cn(
              "w-full sm:w-auto min-h-[48px] px-8 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2",
              isAccepting && "bg-slate-dark"
            )}
          >
            {isAccepting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('fsm.compliance.terms.accepting')}</span>
              </>
            ) : (
              <span>{t('fsm.compliance.terms.acceptBtn')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
