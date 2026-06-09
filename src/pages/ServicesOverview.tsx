import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ServicesGrid from '@/components/home/ServicesGrid'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08 },
  }),
}

export default function ServicesOverview() {
  const { t } = useTranslation()

  return (
    <main id="main-content">
      <title>{t('servicePage.overview.heading')} — Fresh Nest Co.</title>
      <meta name="description" content={t('servicePage.overview.subhead')} />

      <section className="bg-warm-white py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="font-display text-5xl text-charcoal mb-4"
          >
            {t('servicePage.overview.heading')}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-body text-base text-text-muted max-w-xl"
          >
            {t('servicePage.overview.subhead')}
          </motion.p>
        </div>
      </section>

      <ServicesGrid />
    </main>
  )
}
