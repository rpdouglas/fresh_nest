import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '@/lib/firebase/firebase'
import { cn } from '@/lib/utils/utils'
import { computeBookingEstimatedPrice } from '@/lib/firebase/firestore'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

export interface BookingStep4Handle {
  submitPayment: () => Promise<string | null>
}

interface Props {
  submitError?: string | null
  stepHeaderRef?: React.Ref<HTMLHeadingElement>
  // P3-E10: needed to update the already-created PaymentIntent's amount once a
  // referral code is verified — the intent is created before this step's promo
  // field is ever touched.
  paymentIntentClientSecret?: string | null
}

const BookingStep4 = forwardRef<BookingStep4Handle, Props>(function BookingStep4(
  { submitError, stepHeaderRef, paymentIntentClientSecret },
  ref,
) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const { register, getValues, setValue } = useFormContext<BookingFormData>()
  const values = getValues()

  const [searchParams] = useSearchParams()
  const [promoCode, setPromoCode] = useState(() => searchParams.get('ref') || '')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoMessage, setPromoMessage] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  // P3-E10: mirrors referralConfig.refereeDiscountAmount so the price summary matches
  // what the Stripe PaymentElement actually charges — fetched once, public-read.
  const [refereeDiscountAmount, setRefereeDiscountAmount] = useState(20)

  useEffect(() => {
    void (async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'referralConfig'))
        const configData = configSnap.data()
        if (configSnap.exists() && typeof configData?.['refereeDiscountAmount'] === 'number') {
          setRefereeDiscountAmount(configData['refereeDiscountAmount'])
        }
      } catch (err) {
        console.error('[BookingStep4] Failed to load referralConfig, using default $20:', err)
      }
    })()
  }, [])

  useImperativeHandle(ref, () => ({
    submitPayment: async () => {
      setPaymentError(null)

      if (!stripe || !elements) {
        setPaymentError(t('booking.errors.paymentUnavailable'))
        return null
      }

      const { error: submitErr } = await elements.submit()
      if (submitErr) {
        setPaymentError(submitErr.message ?? t('booking.errors.payment'))
        return null
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/thank-you`,
        },
      })

      if (error) {
        setPaymentError(error.message ?? t('booking.errors.cardDeclined'))
        return null
      }

      return paymentIntent?.id ?? null
    },
  }))

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

        // P3-E10: the PaymentIntent was already created (with the full price) before
        // this step's promo field could ever be touched — update it now that a valid
        // code has been confirmed, rather than silently charging the full amount.
        if (paymentIntentClientSecret) {
          try {
            const currentValues = getValues()
            const estimatedPrice = computeBookingEstimatedPrice(
              currentValues.propertyType,
              currentValues.serviceType,
              currentValues.frequency,
            )
            const paymentIntentId = paymentIntentClientSecret.split('_secret_')[0]
            const applyDiscountFn = httpsCallable<
              { paymentIntentId: string; referralCode: string; estimatedPrice: number; email?: string },
              { success: boolean; newAmount: number }
            >(getFunctions(), 'applyReferralDiscount')
            await applyDiscountFn({
              paymentIntentId,
              referralCode: cleanCode,
              estimatedPrice,
              email: currentValues.email,
            })
          } catch (discountErr) {
            // The code is still recorded as valid on the booking (referredBy is set
            // above) even if the live amount update fails — surfacing a payment error
            // here would be confusing since the customer hasn't touched payment yet.
            console.error('[BookingStep4] Failed to apply referral discount to PaymentIntent:', discountErr)
          }
        }
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
  }, [setValue, t, paymentIntentClientSecret, getValues])

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

  const subtotal = computeBookingEstimatedPrice(values.propertyType, values.serviceType, values.frequency)
  // HST: 13% ON at launch. QC rate (14.975%) TBD — requires billing address province detection.
  const hstRate = 0.13
  const hstAmount = subtotal * hstRate
  const preDiscountTotal = subtotal + hstAmount
  const referralDiscountApplied = promoStatus === 'valid'
  const total = referralDiscountApplied ? Math.max(0, preDiscountTotal - refereeDiscountAmount) : preDiscountTotal

  const fmt = (n: number) =>
    n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 ref={stepHeaderRef} tabIndex={-1} className="font-display text-3xl text-charcoal focus:outline-none">{t('booking.step4Title')}</h2>

        {/* Review table */}
        <div className="divide-y divide-sand">
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.service')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{serviceLabel}</p>
            </div>
          </div>

          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.property')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {propertyLabel} — {values.bedrooms} {t('booking.fields.bedrooms.label').toLowerCase()} / {values.bathrooms} {t('booking.fields.bathrooms.label').toLowerCase()}
                {values.pets && ` · ${t('booking.fields.pets.label')}`}
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.schedule')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {frequencyLabel} · {values.preferredDate}
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.addOns')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{addOnLabels}</p>
            </div>
          </div>

          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.contact')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {values.firstName} {values.lastName} · {values.email} · {values.phone}
              </p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.address}</p>
            </div>
          </div>

          {values.notes && (
            <div className="flex items-start justify-between py-3">
              <div>
                <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.notes')}</p>
                <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price summary */}
        <div className="pt-4 border-t border-sand space-y-1">
          <div className="flex justify-between font-body text-base text-charcoal">
            <span>{t('booking.payment.subtotal')}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between font-body text-base text-text-muted">
            <span>{t('booking.payment.hst')}</span>
            <span>{fmt(hstAmount)}</span>
          </div>
          {referralDiscountApplied && (
            <div className="flex justify-between font-body text-base text-green-600">
              <span>{t('referrals.discountLineLabel')}</span>
              <span>-{fmt(refereeDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-body text-lg text-charcoal font-bold pt-2 border-t border-sand">
            <span>{t('booking.payment.total')}</span>
            <span>{fmt(total)}</span>
          </div>
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

        {/* CASL marketing consent */}
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

        {/* Stripe Payment Element */}
        <div className="pt-4 border-t border-sand space-y-3">
          <h3 className="font-body text-base font-bold text-charcoal">{t('booking.payment.heading')}</h3>
          <PaymentElement />
          <p className="font-body text-sm text-text-muted">{t('booking.payment.secure')}</p>
        </div>
      </div>

      {(submitError || paymentError) && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{paymentError ?? submitError}</span>
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
})

export default BookingStep4
