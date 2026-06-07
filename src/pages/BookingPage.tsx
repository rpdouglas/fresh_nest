import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { bookingFormSchema, BookingFormData, STEP_FIELDS } from '@/lib/bookingSchema'
import StepIndicator from '@/components/booking/StepIndicator'
import BookingStep1 from '@/components/booking/BookingStep1'
import BookingStep2 from '@/components/booking/BookingStep2'
import BookingStep3 from '@/components/booking/BookingStep3'
import BookingStep4 from '@/components/booking/BookingStep4'

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
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema) as Resolver<BookingFormData>,
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

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    const valid = await methods.trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const onSubmit = () => {
    // E16 replaces this stub with the Firestore addDoc write
    navigate('/thank-you')
  }

  return (
    <>
      <title>{t('booking.pageTitle')}</title>
      <meta name="description" content={t('booking.metaDesc')} />

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
          <StepIndicator currentStep={step} totalSteps={4} />
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
              {step === 0 && <BookingStep1 onNext={handleNext} />}
              {step === 1 && <BookingStep2 onNext={handleNext} onBack={handleBack} />}
              {step === 2 && <BookingStep3 onNext={handleNext} onBack={handleBack} />}
              {step === 3 && <BookingStep4 onBack={handleBack} onSetStep={setStep} />}
            </form>
          </FormProvider>
        </div>
      </section>
    </>
  )
}
