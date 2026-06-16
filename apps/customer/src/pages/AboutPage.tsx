import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'
import MeetTheTeam from '@/components/home/MeetTheTeam'
import { fadeUp } from '@/lib/utils/animations'

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('aboutPage.metaTitle')}
        description={t('aboutPage.metaDesc')}
      />

      <main id="main-content" className="min-h-screen bg-warm-white pb-20">
        {/* Hero Header */}
        <section className="bg-cream py-16 px-4 md:py-24 md:px-6 border-b border-sand text-center">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
                {t('aboutPage.title')}
              </h1>
              <p className="font-body text-lg text-text-muted max-w-xl mx-auto">
                {t('hero.subhead')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story & Mission Section */}
        <section className="py-12 px-4 md:py-20 md:px-6 max-w-content mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
            {/* Story Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="bg-white rounded border border-sand p-6 md:p-10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <h2 className="font-display text-3xl text-charcoal mb-4">
                  {t('aboutPage.story.title')}
                </h2>
                <p className="font-body text-base text-charcoal leading-relaxed whitespace-pre-line">
                  {t('aboutPage.story.content')}
                </p>
              </div>
            </motion.div>

            {/* Mission Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="bg-white rounded border border-sand p-6 md:p-10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <h2 className="font-display text-3xl text-charcoal mb-4">
                  {t('aboutPage.mission.title')}
                </h2>
                <p className="font-body text-base text-charcoal leading-relaxed whitespace-pre-line">
                  {t('aboutPage.mission.content')}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Commitment Callout */}
        <section className="bg-cream py-12 px-4 md:py-16 md:px-6 border-y border-sand">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="bg-slate-pale border border-sand rounded p-6 md:p-10 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                <div className="shrink-0 bg-white border border-sand rounded p-3 text-slate-brand" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-3xl text-charcoal mb-3">
                    {t('aboutPage.community.title')}
                  </h2>
                  <p className="font-body text-base text-charcoal leading-relaxed">
                    {t('aboutPage.community.content')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Eco-Friendly / Baby-Safe Info */}
        <section className="py-12 px-4 md:py-20 md:px-6 max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="bg-white border border-sand rounded p-6 md:p-10 shadow-sm"
          >
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              <div className="shrink-0 bg-slate-pale border border-sand rounded p-3 text-slate-brand" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-3xl text-charcoal mb-3">
                  {t('aboutPage.eco.title')}
                </h2>
                <p className="font-body text-base text-charcoal leading-relaxed">
                  {t('aboutPage.eco.content')}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Team Section */}
        <MeetTheTeam />
      </main>
    </>
  )
}
