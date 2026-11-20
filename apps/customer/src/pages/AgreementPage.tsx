import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  OFFICE_PHONE_DISPLAY,
  OFFICE_PHONE_HREF,
  type AgreementLanguage,
  type PublicAgreementView,
} from '@freshnest/shared'
import SEO from '@/components/seo/SEO'
import {
  fetchAgreementForSigning,
  submitSignedAgreement,
} from '@/lib/firebase/agreements'
import {
  agreementSignFormSchema,
  type AgreementSignFormData,
} from '@/lib/schemas/agreementSchema'
import { AgreementDetails } from '@/components/agreement/AgreementDetails'
import { AgreementTerms } from '@/components/agreement/AgreementTerms'
import { AgreementAnswersForm } from '@/components/agreement/AgreementAnswersForm'
import { AgreementSignBlock } from '@/components/agreement/AgreementSignBlock'
import { AgreementStatusPanel } from '@/components/agreement/AgreementStatusPanel'

type PageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'error' }
  | { kind: 'ready'; agreement: PublicAgreementView }
  | { kind: 'signed'; signedName: string; signedAtIso: string }

export default function AgreementPage() {
  const { token = '' } = useParams<{ token: string }>()
  const { t, i18n } = useTranslation()
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const initialLangApplied = useRef(false)

  const methods = useForm<AgreementSignFormData>({
    resolver: zodResolver(agreementSignFormSchema),
    defaultValues: {
      phone: '',
      email: '',
      entryMethod: 'present',
      pets: '',
      hasAlarm: false,
      specialInstructions: '',
      valuables: '',
      doorCode: '',
      alarmCode: '',
      keyLocation: '',
      accessNotes: '',
      consentESign: false,
      consentTerms: false,
      signedName: '',
      website: '',
    },
  })

  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = useCallback(() => {
    setState({ kind: 'loading' })
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    let active = true
    initialLangApplied.current = false

    const run = async () => {
      if (!token) {
        if (active) setState({ kind: 'invalid' })
        return
      }
      try {
        const data = await fetchAgreementForSigning(token)
        if (!active) return
        if (!initialLangApplied.current) {
          initialLangApplied.current = true
          if (!i18n.language.startsWith(data.language)) {
            await i18n.changeLanguage(data.language)
          }
        }
        if (!active) return
        methods.reset({
          phone: data.party.phone || '',
          email: data.party.email || '',
          entryMethod: 'present',
          pets: '',
          hasAlarm: false,
          specialInstructions: '',
          valuables: '',
          doorCode: '',
          alarmCode: '',
          keyLocation: '',
          accessNotes: '',
          consentESign: false,
          consentTerms: false,
          signedName: '',
          website: '',
        })
        setState({ kind: 'ready', agreement: data })
      } catch (err: unknown) {
        if (!active) return
        const code = (err as { code?: string })?.code ?? ''
        if (code.includes('not-found') || code.includes('invalid-argument')) {
          setState({ kind: 'invalid' })
        } else {
          setState({ kind: 'error' })
        }
      }
    }

    void run()
    return () => {
      active = false
    }
  }, [token, retryCount, i18n, methods])

  const displayLang: AgreementLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en'

  const onSubmit = async (values: AgreementSignFormData) => {
    setSubmitError(null)
    try {
      const result = await submitSignedAgreement({
        token,
        language: displayLang,
        answers: {
          phone: values.phone,
          email: values.email,
          entryMethod: values.entryMethod,
          pets: values.pets,
          hasAlarm: values.hasAlarm,
          specialInstructions: values.specialInstructions,
          valuables: values.valuables,
        },
        access: {
          doorCode: values.doorCode,
          alarmCode: values.alarmCode,
          keyLocation: values.keyLocation,
          accessNotes: values.accessNotes,
        },
        consentESign: true,
        consentTerms: true,
        signedName: values.signedName,
        website: values.website,
      })
      setState({
        kind: 'signed',
        signedName: values.signedName,
        signedAtIso: result.signedAtIso,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code.includes('not-found')) {
        setState({ kind: 'invalid' })
      } else {
        setSubmitError(t('agreement.sign.submitError'))
      }
    }
  }

  return (
    <div className="min-h-screen bg-warm-white py-8 md:py-12 px-4 md:px-6">
      <SEO
        title={t('agreement.meta.title')}
        description={t('agreement.meta.description')}
        noindex
      />

      {/* Top banner: office phone always visible without scrolling (P3 Margaret) */}
      <div className="max-w-3xl mx-auto mb-6 bg-cream border border-sand rounded px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-base text-charcoal">
          {t('agreement.headerHelp')}
        </p>
        <a
          href={OFFICE_PHONE_HREF}
          className="inline-flex items-center min-h-[48px] px-4 py-2 bg-white border border-slate-brand text-slate-brand hover:bg-slate-pale font-body font-medium text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {OFFICE_PHONE_DISPLAY}
        </a>
      </div>

      {state.kind === 'loading' && (
        <div
          className="max-w-3xl mx-auto bg-white border border-sand rounded p-10 text-center space-y-4"
          aria-busy="true"
        >
          <div className="w-10 h-10 mx-auto border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-base text-text-muted">{t('agreement.loading')}</p>
        </div>
      )}

      {state.kind === 'invalid' && <AgreementStatusPanel variant="invalid" />}

      {state.kind === 'error' && (
        <AgreementStatusPanel variant="error" onRetry={handleRetry} />
      )}

      {state.kind === 'signed' && (
        <AgreementStatusPanel
          variant="signed"
          signedName={state.signedName}
          signedAtIso={state.signedAtIso}
        />
      )}

      {state.kind === 'ready' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-5xl text-charcoal">
              {state.agreement.type === 'commercial'
                ? t('agreement.pageTitleCommercial')
                : t('agreement.pageTitleResidential')}
            </h1>
            <p className="font-body text-base text-text-muted">
              {t('agreement.pageSubtitle', { name: state.agreement.party.name })}
            </p>
          </header>

          <AgreementDetails agreement={state.agreement} displayLang={displayLang} />

          <AgreementTerms
            body={displayLang === 'fr' ? state.agreement.bodyFr : state.agreement.bodyEn}
          />

          <FormProvider {...methods}>
            <form
              onSubmit={(e) => { void methods.handleSubmit(onSubmit)(e) }}
              noValidate
              className="space-y-6"
            >
              <AgreementAnswersForm />
              <AgreementSignBlock
                submitError={submitError}
                isSubmitting={methods.formState.isSubmitting}
              />
            </form>
          </FormProvider>
        </div>
      )}
    </div>
  )
}
