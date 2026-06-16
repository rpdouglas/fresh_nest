import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'
import { fadeUp, stagger } from '@/lib/utils/animations'

export default function CareersPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('careersPage.metaTitle')}
        description={t('careersPage.metaDesc')}
      />

      <main id="main-content" className="min-h-screen bg-warm-white pb-20">
        {/* Hero Header */}
        <section className="bg-cream py-16 px-4 md:py-24 md:px-6 border-b border-sand text-center">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
                {t('careersPage.title')}
              </h1>
              <p className="font-body text-lg text-text-muted max-w-xl mx-auto">
                {t('careersPage.subhead')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 px-4 md:py-20 md:px-6 max-w-content mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-charcoal mb-4">
              {t('careersPage.benefits.title')}
            </h2>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {/* Benefit 1: Pay */}
            <motion.div variants={fadeUp} className="bg-white rounded border border-sand p-6 shadow-sm flex flex-col gap-4">
              <div className="text-slate-brand" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h3 className="font-sub text-xl text-charcoal">{t('careersPage.benefits.payTitle')}</h3>
              <p className="font-body text-base text-text-muted">{t('careersPage.benefits.payDesc')}</p>
            </motion.div>

            {/* Benefit 2: Eco */}
            <motion.div variants={fadeUp} className="bg-white rounded border border-sand p-6 shadow-sm flex flex-col gap-4">
              <div className="text-slate-brand" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="font-sub text-xl text-charcoal">{t('careersPage.benefits.ecoTitle')}</h3>
              <p className="font-body text-base text-text-muted">{t('careersPage.benefits.ecoDesc')}</p>
            </motion.div>

            {/* Benefit 3: Training */}
            <motion.div variants={fadeUp} className="bg-white rounded border border-sand p-6 shadow-sm flex flex-col gap-4">
              <div className="text-slate-brand" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <h3 className="font-sub text-xl text-charcoal">{t('careersPage.benefits.trainingTitle')}</h3>
              <p className="font-body text-base text-text-muted">{t('careersPage.benefits.trainingDesc')}</p>
            </motion.div>

            {/* Benefit 4: Hours */}
            <motion.div variants={fadeUp} className="bg-white rounded border border-sand p-6 shadow-sm flex flex-col gap-4">
              <div className="text-slate-brand" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="font-sub text-xl text-charcoal">{t('careersPage.benefits.hoursTitle')}</h3>
              <p className="font-body text-base text-text-muted">{t('careersPage.benefits.hoursDesc')}</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Job Openings Section */}
        <section className="py-12 px-4 md:py-16 md:px-6 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl text-charcoal mb-8 text-center">
            {t('careersPage.openings.title')}
          </h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="bg-white border border-sand rounded p-6 md:p-10 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-sand pb-6 mb-6">
              <div>
                <h3 className="font-sub text-2xl text-charcoal mb-1">
                  {t('careersPage.openings.roleTitle')}
                </h3>
                <p className="font-body text-base text-slate-brand font-medium">
                  {t('careersPage.openings.roleLocation')}
                </p>
              </div>
              <span className="inline-block bg-slate-pale text-slate-dark text-base font-body px-3 py-1 rounded font-medium">
                {t('careersPage.openings.roleType')}
              </span>
            </div>

            <div className="space-y-6">
              <p className="font-body text-base text-charcoal leading-relaxed">
                {t('careersPage.openings.roleDesc')}
              </p>

              <div>
                <h4 className="font-sub text-xl text-charcoal mb-3">
                  {t('careersPage.openings.reqTitle')}
                </h4>
                <ul className="list-disc pl-5 font-body text-base text-charcoal space-y-2">
                  <li>{t('careersPage.openings.req1')}</li>
                  <li>{t('careersPage.openings.req2')}</li>
                  <li>{t('careersPage.openings.req3')}</li>
                  <li>{t('careersPage.openings.req4')}</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How to Apply Section */}
        <section className="bg-cream py-12 px-4 md:py-16 md:px-6 border-t border-b border-sand text-center">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="flex flex-col items-center gap-6"
            >
              <h2 className="font-display text-3xl text-charcoal">
                {t('careersPage.apply.title')}
              </h2>
              <p className="font-body text-base text-charcoal leading-relaxed">
                {t('careersPage.apply.content')}
              </p>
              <a
                href={`mailto:hello@freshnestco.ca?subject=${encodeURIComponent(
                  t('careersPage.apply.emailSubject')
                )}`}
                className="bg-slate-brand text-white font-body font-medium rounded px-8 py-3 min-h-[48px] inline-flex items-center hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                {t('careersPage.apply.btnText')}
              </a>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  )
}
