import { useTranslation } from 'react-i18next'

/**
 * Home page — placeholder for E04 Hero Section.
 * Content will be built in E04 (Hero), E05 (Trust Bar), E06 (Quote Calculator),
 * E07 (Services Grid), E09 (Gallery), E10 (How It Works), E11 (Team), E12 (Reviews).
 */
export default function Home() {
  const { t } = useTranslation()
  return (
    <div className="py-20 px-6 text-center">
      <h1 className="font-display text-5xl text-charcoal mb-4">
        {t('welcome')}
      </h1>
      <p className="font-body text-base text-text-muted">
        {t('tagline')}
      </p>
    </div>
  )
}
