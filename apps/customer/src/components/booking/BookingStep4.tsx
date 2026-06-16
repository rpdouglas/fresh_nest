import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { cn } from '@/lib/utils/utils'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

interface Props {
  submitError?: string | null
  stepHeaderRef?: React.Ref<HTMLHeadingElement>
}

export default function BookingStep4({ submitError, stepHeaderRef }: Props) {
  const { t } = useTranslation()
  const { register, getValues, setValue } = useFormContext<BookingFormData>()
  const values = getValues()

  const [searchParams] = useSearchParams()
  const [promoCode, setPromoCode] = useState(() => searchParams.get('ref') || '')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoMessage, setPromoMessage] = useState('')

  const verifyPromo = useCallback(async (code: string) => {
    if (!code.trim()) return
    setPromoStatus('checking')
    try {
      const cleanCode = code.trim().toUpperCase()
      const docRef = doc(db, 'referrals', cleanCode)
      const docSnap = await getDoc(docRef)
      const data = docSnap.data()
      if (docSnap.exists() && data && data['active'] === true) {
        setPromoStatus('valid')
        setValue('referredBy', cleanCode)
        const owner = (data['ownerName'] as string) || ''
        setPromoMessage(t('referrals.promoValid') + (owner ? ` (${t('referrals.referredBy', { name: owner })})` : ''))
      } else {
        setPromoStatus('invalid')
        setValue('referredBy', null)
        setPromoMessage(t('referrals.promoInvalid'))
      }
    } catch (err) {
      console.error(err)
      setPromoStatus('invalid')
      setValue('referredBy', null)
      setPromoMessage(t('referrals.promoInvalid'))
    }
  }, [setValue, t])

  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam) {
      const timer = setTimeout(() => {
        void verifyPromo(refParam)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [searchParams, verifyPromo])

  const frequencyLabel = t(`booking.fields.frequency.options.${values.frequency}`)
  const serviceLabel   = t(`services.${values.serviceType}.title`)
  const propertyLabel  = t(`booking.fields.propertyType.options.${values.propertyType}`)

  const addOnLabels = values.addOns.length > 0
    ? values.addOns.map((a) => t(`booking.fields.addOns.options.${a}`)).join(', ')
    : '—'

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 ref={stepHeaderRef} tabIndex={-1} className="font-display text-3xl text-charcoal focus:outline-none">{t('booking.step4Title')}</h2>

        {/* Review table */}
        <div className="divide-y divide-sand">
          {/* Service */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.service')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{serviceLabel}</p>
            </div>
          </div>

          {/* Property */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.property')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {propertyLabel} — {values.bedrooms} {t('booking.fields.bedrooms.label').toLowerCase()} / {values.bathrooms} {t('booking.fields.bathrooms.label').toLowerCase()}
                {values.pets && ` · ${t('booking.fields.pets.label')}`}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.schedule')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {frequencyLabel} · {values.preferredDate}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.addOns')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{addOnLabels}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.contact')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {values.firstName} {values.lastName} · {values.email} · {values.phone}
              </p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.address}</p>
            </div>
          </div>

          {/* Notes */}
          {values.notes && (
            <div className="flex items-start justify-between py-3">
              <div>
                <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.notes')}</p>
                <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Referral / Promo Code */}
        <div className="pt-4 border-t border-sand">
          <label htmlFor="referralCodeInput" className="block font-body text-base text-charcoal mb-1">
            {t('referrals.promoCodeLabel')}
          </label>
          <div className="flex gap-2">
            <input
              id="referralCodeInput"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder={t('referrals.promoPlaceholder')}
              className={cn(
                'flex-grow border rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand',
                promoStatus === 'valid' ? 'border-green-500 bg-green-50/20' : 'border-sand'
              )}
            />
            <button
              type="button"
              onClick={() => void verifyPromo(promoCode)}
              disabled={promoStatus === 'checking' || !promoCode.trim()}
              className="bg-slate-brand text-white font-body font-medium text-base rounded px-6 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 disabled:opacity-60"
            >
              {promoStatus === 'checking' ? t('referrals.promoChecking') : t('common.verify')}
            </button>
          </div>
          {promoStatus !== 'idle' && (
            <p
              className={cn(
                'font-body text-base mt-2',
                promoStatus === 'valid' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {promoMessage}
            </p>
          )}
        </div>

        {/* CASL marketing consent — unchecked by default (COMPLIANCE.md) */}
        <div className="pt-2 border-t border-sand">
          <label className="min-h-[48px] flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="marketingConsent"
              {...register('marketingConsent')}
              className="w-5 h-5 accent-slate-brand shrink-0"
            />
            <span className="font-body text-base text-charcoal">
              {t('booking.fields.marketingConsent.label')}
            </span>
          </label>
        </div>
      </div>

      {submitError && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{submitError}</span>
          <a
            href="tel:+16139353555"
            className="inline-flex items-center justify-center font-medium border border-red-300 rounded px-4 py-2 min-h-[48px] text-red-700 hover:bg-red-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 shrink-0"
          >
            {t('phone')}
          </a>
        </div>
      )}
    </div>
  )
}
