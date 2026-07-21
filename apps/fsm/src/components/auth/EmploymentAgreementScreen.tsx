import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc } from 'firebase/firestore'
import { staffCollection, cn } from '@freshnest/shared'
import { db } from '../../lib/firebase/firebase'
import { useStaffAuth } from '../../hooks/useStaffAuth'

const CURRENT_AGREEMENT_VERSION = '1.0'

interface EmploymentAgreementScreenProps {
  stepLabel?: string
}

export const EmploymentAgreementScreen: React.FC<EmploymentAgreementScreenProps> = ({ stepLabel }) => {
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const [signedByName, setSignedByName] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const [ipAddress, setIpAddress] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  // Step 1 of the P3-E27-C1 first-login sequence.
  const showOverlay = staffProfile && staffProfile.employmentAgreement == null

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

  const canSign = isChecked && signedByName.trim().length > 0

  const handleSign = async () => {
    if (!staffProfile || !canSign || isAccepting) return
    setIsAccepting(true)
    try {
      const staffRef = doc(staffCollection(db), staffProfile.id)
      await updateDoc(staffRef, {
        employmentAgreement: {
          version: CURRENT_AGREEMENT_VERSION,
          acceptedAt: new Date(),
          signedByName: signedByName.trim(),
          ipAddress: ipAddress || 'offline',
        },
      })
    } catch (err) {
      console.error('Failed to sign employment agreement:', err)
    } finally {
      setIsAccepting(false)
    }
  }

  const isRtl = i18n.language === 'ar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-2xl bg-white border border-sand rounded shadow-xl p-6 md:p-8 flex flex-col max-h-[90vh]',
          isRtl ? 'text-right' : 'text-left'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employment-agreement-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="mb-4">
          {stepLabel && (
            <p className="font-body text-base font-semibold text-slate-brand mb-1">{stepLabel}</p>
          )}
          <h2
            id="employment-agreement-title"
            className="font-display text-3xl font-bold text-charcoal leading-tight"
          >
            {t('fsm.compliance.employmentAgreement.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.compliance.employmentAgreement.subtitle')}
          </p>
        </div>

        <div
          className="flex-grow overflow-y-auto border border-sand rounded bg-warm-white p-4 mb-6 space-y-4"
          dir="ltr"
        >
          <p className="text-left font-body text-base text-charcoal leading-relaxed">
            {t('fsm.compliance.employmentAgreement.text')}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="signed-by-name" className="font-body text-base text-charcoal font-medium block mb-1.5">
            {t('fsm.compliance.employmentAgreement.signLabel')}
          </label>
          <input
            id="signed-by-name"
            type="text"
            value={signedByName}
            onChange={(e) => setSignedByName(e.target.value)}
            disabled={isAccepting}
            placeholder={t('fsm.compliance.employmentAgreement.signPlaceholder')}
            className="w-full min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none group min-h-[48px] py-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            disabled={isAccepting}
            className="w-6 h-6 mt-0.5 rounded border-sand text-slate-brand focus:ring-slate-brand transition-colors cursor-pointer"
          />
          <span className="font-body text-base text-charcoal leading-snug group-hover:text-slate-brand transition-colors">
            {t('fsm.compliance.employmentAgreement.checkbox')}
          </span>
        </label>

        <div className="flex items-center justify-between gap-4 border-t border-sand pt-4">
          <span className="font-body text-base text-text-muted">
            {ipAddress && t('fsm.compliance.employmentAgreement.ipLabel', { ip: ipAddress })}
          </span>

          <button
            type="button"
            onClick={() => { void handleSign() }}
            disabled={!canSign || isAccepting}
            className={cn(
              'min-h-[48px] px-8 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
              isAccepting && 'bg-slate-dark'
            )}
          >
            {isAccepting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('fsm.compliance.employmentAgreement.signing')}</span>
              </>
            ) : (
              <span>{t('fsm.compliance.employmentAgreement.signBtn')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
