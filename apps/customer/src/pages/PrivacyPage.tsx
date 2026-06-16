import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'
import { fadeUp } from '@/lib/utils/animations'

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('privacyPage.metaTitle')}
        description={t('privacyPage.metaDesc')}
      />

      <main id="main-content" className="min-h-screen bg-warm-white pb-20">
        {/* Hero Header */}
        <section className="bg-cream py-16 px-4 md:py-24 md:px-6 border-b border-sand">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
                {t('privacyPage.title')}
              </h1>
              <p className="font-body text-base text-text-muted">
                {t('privacyPage.lastUpdated')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-12 px-4 md:py-16 md:px-6">
          <article className="max-w-3xl mx-auto bg-white border border-sand rounded p-6 md:p-10 shadow-sm">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="space-y-8 font-body text-base text-charcoal leading-relaxed"
            >
              {/* Intro */}
              <p className="text-lg font-medium text-slate-brand">
                {t('privacyPage.intro')}
              </p>

              {/* Section 1 */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl text-charcoal border-b border-sand pb-2">
                  {t('privacyPage.sections.1.title')}
                </h2>
                <div className="whitespace-pre-line space-y-2">
                  {t('privacyPage.sections.1.content')}
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl text-charcoal border-b border-sand pb-2">
                  {t('privacyPage.sections.2.title')}
                </h2>
                <div className="whitespace-pre-line space-y-2">
                  {t('privacyPage.sections.2.content')}
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl text-charcoal border-b border-sand pb-2">
                  {t('privacyPage.sections.3.title')}
                </h2>
                <div className="whitespace-pre-line space-y-2">
                  {t('privacyPage.sections.3.content')}
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl text-charcoal border-b border-sand pb-2">
                  {t('privacyPage.sections.4.title')}
                </h2>
                <div className="whitespace-pre-line space-y-2">
                  {t('privacyPage.sections.4.content')}
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl text-charcoal border-b border-sand pb-2">
                  {t('privacyPage.sections.5.title')}
                </h2>
                <div className="whitespace-pre-line space-y-2">
                  {t('privacyPage.sections.5.content')}
                </div>
              </div>

            </motion.div>
          </article>
        </section>
      </main>
    </>
  )
}
