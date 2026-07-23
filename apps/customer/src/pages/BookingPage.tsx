import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { bookingFormSchema, BookingFormData, STEP_FIELDS } from '@/lib/schemas/bookingSchema'
import { submitBooking, detectLeadSource, computeBookingEstimatedPrice } from '@/lib/firebase/firestore'
import { logBookingStarted, logBookingCompleted } from '@/lib/firebase/analytics'
import BookingStep1 from '@/components/booking/BookingStep1'
import BookingStep2 from '@/components/booking/BookingStep2'
import BookingStep3 from '@/components/booking/BookingStep3'
import BookingStep4, { type BookingStep4Handle } from '@/components/booking/BookingStep4'
import StepIndicator from '@/components/booking/StepIndicator'
import SEO from '@/components/seo/SEO'

// Initialized once at module level — avoids creating a new Promise on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

function buildDefaults(params: URLSearchParams): Partial<BookingFormData> {
  const defaults: Partial<BookingFormData> = {}

  const propertyTypeMap: Record<string, BookingFormData['propertyType']> = {
    apartment:   'apartment',
    '1-2bed':    '1-2bed',
    '3-4bed':    '3-4bed',
    '5plus':     '5+bed',
    '5+bed':     '5+bed',
    commercial:  'commercial',
  }
  const serviceTypeMap: Record<string, BookingFormData['serviceType']> = {
    standard:        'standard',
    deep:            'deep',
    moveout:         'moveout',
    postconstruction:'postconstruction',
    airbnb:          'airbnb',
    commercial:      'commercial',
  }
  const freqMap: Record<string, BookingFormData['frequency']> = {
    'one-time': 'one-time',
    weekly:     'weekly',
    biweekly:   'biweekly',
    monthly:    'monthly',
  }

  const size = params.get('size')
  if (size && propertyTypeMap[size]) defaults.propertyType = propertyTypeMap[size]

  const service = params.get('service')
  if (service && serviceTypeMap[service]) defaults.serviceType = serviceTypeMap[service]

  const serviceType = params.get('serviceType')
  if (serviceType && serviceTypeMap[serviceType]) defaults.serviceType = serviceTypeMap[serviceType]

  const freq = params.get('freq')
  if (freq && freqMap[freq]) defaults.frequency = freqMap[freq]

  if (params.get('commercial') === '1') {
    defaults.serviceType = 'commercial'
    defaults.propertyType = 'commercial'
  }

  return defaults
}

export default function BookingPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const source = detectLeadSource(searchParams)

  // Declare methods first so the useEffect below can reference it without
  // triggering "accessed before declaration" lint errors.
  const methods = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType:      'standard',
      propertyType:     '3-4bed',
      bedrooms:         3,
      bathrooms:        1,
      pets:             false,
      frequency:        'one-time',
      preferredDate:    '',
      addOns:           [],
      squareFootage:    undefined,
      firstName:        '',
      lastName:         '',
      email:            '',
      phone:            '',
      address:          '',
      preferredCleaner: null,
      notes:            '',
      marketingConsent: false,
      ...buildDefaults(searchParams),
    },
    mode: 'onTouched',
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null)
  const step4Ref = useRef<BookingStep4Handle>(null)

  // isLoadingPayment is derived: we're loading when on step 4, no clientSecret yet, no error yet.
  const isLoadingPayment = currentStep === 3 && !clientSecret && !paymentInitError

  useEffect(() => {
    logBookingStarted()
  }, [])

  // Fetch PaymentIntent client_secret when the user reaches Step 4.
  // Re-fires only if clientSecret is null (prevents duplicate intents on back-nav).
  useEffect(() => {
    if (currentStep !== 3 || clientSecret !== null) return

    void (async () => {
      const values = methods.getValues()
      const estimatedPrice = computeBookingEstimatedPrice(
        values.propertyType,
        values.serviceType,
        values.frequency,
      )

      const createPaymentIntentFn = httpsCallable<
        { estimatedPrice: number; email?: string; referredBy?: string | null },
        { clientSecret: string }
      >(getFunctions(), 'createPaymentIntent')

      try {
        // P3-E10: referredBy is only known here if pre-filled via a ?ref= URL param
        // that resolved before this effect ran — the common case (manually typing a
        // code once Step 4 has already rendered) is handled by BookingStep4's own
        // applyReferralDiscount call after verification succeeds.
        const result = await createPaymentIntentFn({
          estimatedPrice,
          email: values.email,
          referredBy: values.referredBy,
        })
        setClientSecret(result.data.clientSecret)
      } catch (err) {
        console.error('[BookingPage] createPaymentIntent failed:', err)
        setPaymentInitError(t('booking.errors.payment'))
      }
    })()
  }, [currentStep, clientSecret, methods, t])

  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (node) node.focus()
  }, [])

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep]
    if (fieldsToValidate) {
      const isValid = await methods.trigger(fieldsToValidate)
      if (isValid) {
        setCurrentStep((prev) => Math.min(3, prev + 1))
      }
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    setSubmitError(null)
    try {
      const lang = i18n.language === 'fr' ? 'fr' : 'en'

      // On Step 4, confirm Stripe payment before writing to Firestore.
      let paymentIntentId: string | null = null
      if (currentStep === 3) {
        if (!step4Ref.current) return
        paymentIntentId = await step4Ref.current.submitPayment()
        if (!paymentIntentId) return // Error displayed inside BookingStep4
      }

      const bookingId = await submitBooking(data, lang, source, paymentIntentId)
      logBookingCompleted(data.serviceType)
      void navigate('/thank-you', {
        state: {
          firstName:     data.firstName,
          email:         data.email,
          serviceType:   data.serviceType,
          preferredDate: data.preferredDate,
          frequency:     data.frequency,
          bookingId,
        },
      })
    } catch (e) {
      console.error('[BookingPage] submitBooking failed:', e)
      setSubmitError(t('booking.errors.submit'))
    }
  }

  const isSubmitDisabled =
    methods.formState.isSubmitting || (currentStep === 3 && isLoadingPayment)

  const stripeLocale = i18n.language === 'fr' ? 'fr' : 'en'

  return (
    <>
      <SEO
        title={t('booking.pageTitle')}
        description={t('booking.metaDesc')}
      />

      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-2">
            {t('booking.heading')}
          </h1>
          <p className="font-body text-base text-text-muted">{t('booking.subhead')}</p>
        </div>
      </section>

      <section className="bg-cream py-10 px-4 md:py-14 md:px-6">
        <div className="max-w-2xl mx-auto">
          <StepIndicator currentStep={currentStep} totalSteps={4} />
          <FormProvider {...methods}>
            <form onSubmit={(e) => { void methods.handleSubmit(onSubmit)(e) }} noValidate className="space-y-8">
              {currentStep === 0 && <BookingStep1 stepHeaderRef={focusHeading} />}
              {currentStep === 1 && <BookingStep2 stepHeaderRef={focusHeading} />}
              {currentStep === 2 && <BookingStep3 stepHeaderRef={focusHeading} />}

              {currentStep === 3 && isLoadingPayment && (
                <div className="bg-white border border-sand rounded shadow-sm p-8 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-brand border-t-transparent animate-spin" />
                  <p className="font-body text-base text-text-muted">{t('booking.payment.loading')}</p>
                </div>
              )}

              {currentStep === 3 && paymentInitError && (
                <div role="alert" className="bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700">
                  {paymentInitError}
                </div>
              )}

              {currentStep === 3 && !isLoadingPayment && clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, locale: stripeLocale }}
                >
                  <BookingStep4
                    ref={step4Ref}
                    submitError={submitError}
                    stepHeaderRef={focusHeading}
                    paymentIntentClientSecret={clientSecret}
                  />
                </Elements>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-sand">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="border border-slate-brand text-slate-brand font-body font-medium text-base rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  >
                    {t('booking.back')}
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => { void handleNext() }}
                    className="bg-slate-brand text-white font-body font-medium text-base rounded px-8 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  >
                    {t('booking.next')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="bg-slate-brand text-white font-body font-medium text-base rounded px-8 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {methods.formState.isSubmitting ? t('booking.submitting') : t('booking.submit')}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </section>
    </>
  )
}
