import React from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { LanguageSelectionOverlay } from './LanguageSelectionOverlay'
import { EmploymentAgreementScreen } from './EmploymentAgreementScreen'
import { BackgroundCheckConsentScreen } from './BackgroundCheckConsentScreen'
import { TermsConsentOverlay } from './TermsConsentOverlay'
import { EmergencyContactScreen } from './EmergencyContactScreen'

const CURRENT_TERMS_VERSION = (import.meta.env.VITE_CURRENT_TERMS_VERSION as string | undefined) || '2.1'

// P3-E27-C1: renders exactly one first-login step at a time, in a fixed priority
// order, instead of the previous independently-mounted overlays stacked by
// hardcoded z-index (which could show BackgroundCheckConsentScreen — z-60 —
// on top of LanguageSelectionOverlay — z-50 — before a language was ever chosen).
export const OnboardingSequenceGuard: React.FC = () => {
  const { t } = useTranslation()
  const { staffProfile, loading } = useStaffAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  // ProtectedRoute already redirects to /login when staffProfile is null —
  // this is unreachable in practice, kept only so the render below is type-safe.
  if (!staffProfile) return null

  if (!staffProfile.preferences?.language) {
    return <LanguageSelectionOverlay />
  }

  if (staffProfile.employmentAgreement == null) {
    return <EmploymentAgreementScreen stepLabel={t('fsm.compliance.onboarding.stepLabel', { current: 1, total: 4 })} />
  }

  if (staffProfile.backgroundCheck?.consentGiven !== true) {
    return <BackgroundCheckConsentScreen stepLabel={t('fsm.compliance.onboarding.stepLabel', { current: 2, total: 4 })} />
  }

  const termsOutdated = staffProfile.compliance?.acceptedTermsVersion == null
    || staffProfile.compliance.acceptedTermsVersion !== CURRENT_TERMS_VERSION

  if (termsOutdated) {
    // emergencyContact is only ever null while an employee is still working through
    // this sequence for the first time (it's the last step) — if it's already set,
    // this Terms prompt is a version-bump re-prompt for an otherwise-onboarded
    // returning employee, so no "Step X of 4" label is shown.
    const stepLabel = staffProfile.emergencyContact == null
      ? t('fsm.compliance.onboarding.stepLabel', { current: 3, total: 4 })
      : undefined
    return <TermsConsentOverlay stepLabel={stepLabel} />
  }

  if (staffProfile.emergencyContact == null) {
    return <EmergencyContactScreen stepLabel={t('fsm.compliance.onboarding.stepLabel', { current: 4, total: 4 })} />
  }

  return <Outlet />
}
