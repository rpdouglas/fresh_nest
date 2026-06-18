import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { bookingFormSchema, BookingFormData, STEP_FIELDS } from '@/lib/schemas/bookingSchema'
import { submitBooking, detectLeadSource } from '@/lib/firebase/firestore'
import { logBookingStarted, logBookingCompleted } from '@/lib/firebase/analytics'
import BookingStep1 from '@/components/booking/BookingStep1'
import BookingStep2 from '@/components/booking/BookingStep2'
import BookingStep3 from '@/components/booking/BookingStep3'
import BookingStep4 from '@/components/booking/BookingStep4'
import StepIndicator from '@/components/booking/StepIndicator'
import SEO from '@/components/seo/SEO'

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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const source = detectLeadSource(searchParams)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    logBookingStarted()
  }, [])

  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (node) {
      node.focus()
    }
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

  const onSubmit = async (data: BookingFormData) => {
    setSubmitError(null)
    try {
      const lang = i18n.language === 'fr' ? 'fr' : 'en'
      const bookingId = await submitBooking(data, lang, source)
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
            <form onSubmit={(e) => { void methods.handleSubmit(onSubmit)(e); }} noValidate className="space-y-8">
              {currentStep === 0 && <BookingStep1 stepHeaderRef={focusHeading} />}
              {currentStep === 1 && <BookingStep2 stepHeaderRef={focusHeading} />}
              {currentStep === 2 && <BookingStep3 stepHeaderRef={focusHeading} />}
              {currentStep === 3 && <BookingStep4 submitError={submitError} stepHeaderRef={focusHeading} />}

              {/* Navigation buttons */}
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
                    disabled={methods.formState.isSubmitting}
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
