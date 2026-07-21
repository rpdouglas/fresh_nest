import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc } from 'firebase/firestore'
import { staffCollection } from '@freshnest/shared'
import { db } from '../../lib/firebase/firebase'
import { useStaffAuth } from '../../hooks/useStaffAuth'

interface LanguageSelectionOverlayProps {
  onComplete?: () => void
  stepLabel?: string
}

export const LanguageSelectionOverlay: React.FC<LanguageSelectionOverlayProps> = ({ onComplete, stepLabel }) => {
  const { i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  // We show this modal if the staff member has no language set
  const showOverlay = staffProfile && !staffProfile.preferences?.language

  if (!showOverlay) return null

  const handleLanguageSelect = async (lang: 'en' | 'fr' | 'ar') => {
    if (!staffProfile) return
    setIsUpdating(true)
    try {
      // 1. Update i18n language instantly
      await i18n.changeLanguage(lang)

      // 2. Update Firestore preferences
      const staffRef = doc(staffCollection(db), staffProfile.id)
      await updateDoc(staffRef, {
        'preferences.language': lang,
      })

      if (onComplete) onComplete()
    } catch (err) {
      console.error('Failed to save language preference:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white border border-sand rounded shadow-xl p-8 space-y-6 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lang-select-title"
      >
        <div className="space-y-2">
          {stepLabel && (
            <p className="font-body text-base font-semibold text-slate-brand">{stepLabel}</p>
          )}
          <h2
            id="lang-select-title"
            className="font-display text-3xl font-bold text-charcoal"
          >
            Welcome to Fresh Nest
          </h2>
          <p className="font-body text-base text-text-muted">
            Please select your preferred language to continue.
          </p>
          <p className="font-body text-sm text-text-muted italic">
            Veuillez sélectionner votre langue. / الرجاء اختيار اللغة.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button
            type="button"
            onClick={() => { void handleLanguageSelect('en') }}
            disabled={isUpdating}
            className="w-full min-h-[48px] py-3 px-6 bg-warm-white hover:bg-cream border border-sand rounded font-body text-lg font-medium text-charcoal hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            English
          </button>
          
          <button
            type="button"
            onClick={() => { void handleLanguageSelect('fr') }}
            disabled={isUpdating}
            className="w-full min-h-[48px] py-3 px-6 bg-warm-white hover:bg-cream border border-sand rounded font-body text-lg font-medium text-charcoal hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            Français
          </button>

          <button
            type="button"
            onClick={() => { void handleLanguageSelect('ar') }}
            disabled={isUpdating}
            className="w-full min-h-[48px] py-3 px-6 bg-warm-white hover:bg-cream border border-sand rounded font-body text-lg font-medium text-charcoal hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
            dir="rtl"
          >
            العربية (Arabic)
          </button>
        </div>

        {isUpdating && (
          <div className="flex justify-center pt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-slate-brand"></div>
          </div>
        )}
      </div>
    </div>
  )
}
