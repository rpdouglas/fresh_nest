import { useTranslation } from 'react-i18next'
import { OFFICE_PHONE_DISPLAY, OFFICE_PHONE_HREF } from '@freshnest/shared'

interface AgreementStatusPanelProps {
  variant: 'invalid' | 'signed' | 'error'
  signedName?: string | null
  signedAtIso?: string | null
  onRetry?: () => void
}

export function AgreementStatusPanel({
  variant,
  signedName,
  signedAtIso,
  onRetry,
}: AgreementStatusPanelProps) {
  const { t, i18n } = useTranslation()
  const isFr = i18n.language.startsWith('fr')

  const formattedDate = signedAtIso
    ? new Intl.DateTimeFormat(isFr ? 'fr-CA' : 'en-CA', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Toronto',
      }).format(new Date(signedAtIso))
    : null

  return (
    <section
      className="max-w-2xl mx-auto bg-white border border-sand rounded p-6 md:p-10 shadow-sm text-center space-y-6"
      aria-live="polite"
    >
      {variant === 'signed' ? (
        <>
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-pale text-slate-dark flex items-center justify-center text-2xl font-bold" aria-hidden="true">
            ✓
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-charcoal">
            {t('agreement.signed.title')}
          </h1>
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('agreement.signed.body')}
          </p>
          {(signedName || formattedDate) && (
            <div className="bg-cream border border-sand rounded p-4 text-left font-body text-base text-charcoal space-y-1">
              {signedName && (
                <p>
                  <span className="font-medium">{t('agreement.signed.signedByLabel')}:</span> {signedName}
                </p>
              )}
              {formattedDate && (
                <p>
                  <span className="font-medium">{t('agreement.signed.signedAtLabel')}:</span> {formattedDate}
                </p>
              )}
            </div>
          )}
          <p className="font-body text-base text-text-muted">
            {t('agreement.signed.securityNote')}
          </p>
        </>
      ) : variant === 'error' ? (
        <>
          <h1 className="font-display text-3xl md:text-4xl text-charcoal">
            {t('agreement.error.title')}
          </h1>
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('agreement.error.body')}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[48px] px-6 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
            >
              {t('agreement.error.retry')}
            </button>
          )}
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl md:text-4xl text-charcoal">
            {t('agreement.invalid.title')}
          </h1>
          <p className="font-body text-base text-charcoal leading-relaxed">
            {t('agreement.invalid.body')}
          </p>
        </>
      )}

      <div className="pt-4 border-t border-sand space-y-2">
        <p className="font-body text-base text-text-muted">
          {t('agreement.needHelp')}
        </p>
        <a
          href={OFFICE_PHONE_HREF}
          className="inline-flex items-center justify-center min-h-[48px] px-5 py-2 border border-slate-brand text-slate-brand hover:bg-slate-pale font-body font-medium text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {t('agreement.callOffice', { phone: OFFICE_PHONE_DISPLAY })}
        </a>
      </div>
    </section>
  )
}
