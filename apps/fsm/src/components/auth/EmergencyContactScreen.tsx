import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc } from 'firebase/firestore'
import { staffCollection, cn } from '@freshnest/shared'
import { db } from '../../lib/firebase/firebase'
import { useStaffAuth } from '../../hooks/useStaffAuth'

interface EmergencyContactScreenProps {
  stepLabel?: string
}

export const EmergencyContactScreen: React.FC<EmergencyContactScreenProps> = ({ stepLabel }) => {
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Step 4 of the P3-E27-C1 first-login sequence.
  const showOverlay = staffProfile && staffProfile.emergencyContact == null

  if (!showOverlay) return null

  const canSave = name.trim().length > 0 && phone.trim().length > 0 && relationship.trim().length > 0

  const handleSave = async () => {
    if (!staffProfile || !canSave || isSaving) return
    setIsSaving(true)
    try {
      const staffRef = doc(staffCollection(db), staffProfile.id)
      await updateDoc(staffRef, {
        emergencyContact: {
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship.trim(),
        },
      })
    } catch (err) {
      console.error('Failed to save emergency contact:', err)
    } finally {
      setIsSaving(false)
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
        aria-labelledby="emergency-contact-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="mb-6">
          {stepLabel && (
            <p className="font-body text-base font-semibold text-slate-brand mb-1">{stepLabel}</p>
          )}
          <h2
            id="emergency-contact-title"
            className="font-display text-3xl font-bold text-charcoal leading-tight"
          >
            {t('fsm.compliance.emergencyContact.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.compliance.emergencyContact.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label htmlFor="ec-name" className="font-body text-base text-charcoal font-medium block mb-1.5">
              {t('fsm.compliance.emergencyContact.nameLabel')}
            </label>
            <input
              id="ec-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              className="w-full min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          <div>
            <label htmlFor="ec-relationship" className="font-body text-base text-charcoal font-medium block mb-1.5">
              {t('fsm.compliance.emergencyContact.relationshipLabel')}
            </label>
            <input
              id="ec-relationship"
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              disabled={isSaving}
              className="w-full min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          <div>
            <label htmlFor="ec-phone" className="font-body text-base text-charcoal font-medium block mb-1.5">
              {t('fsm.compliance.emergencyContact.phoneLabel')}
            </label>
            <input
              id="ec-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSaving}
              className="w-full min-h-[48px] px-4 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-sand pt-4">
          <button
            type="button"
            onClick={() => { void handleSave() }}
            disabled={!canSave || isSaving}
            className={cn(
              'w-full sm:w-auto min-h-[48px] px-8 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
              isSaving && 'bg-slate-dark'
            )}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('fsm.compliance.emergencyContact.saving')}</span>
              </>
            ) : (
              <span>{t('fsm.compliance.emergencyContact.saveBtn')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
