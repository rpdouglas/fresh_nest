import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

interface Step {
  number: number
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  { number: 1, titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { number: 2, titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { number: 3, titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
  { number: 4, titleKey: 'howItWorks.step4Title', descKey: 'howItWorks.step4Desc' },
]

export default function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('howItWorks.ariaLabel')}
      className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('howItWorks.sectionHeading')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('howItWorks.sectionSubhead')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line — decorative, visible only at 4-col desktop layout */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-sand"
          />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {STEPS.map(step => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                className="flex flex-col items-center text-center"
              >
                <div
                  aria-hidden="true"
                  className="relative z-10 w-12 h-12 rounded-full bg-slate-brand text-white flex items-center justify-center font-sub text-xl mb-4 shrink-0"
                >
                  {step.number}
                </div>
                <h3 className="font-sub text-xl text-charcoal mb-2">
                  {t(step.titleKey)}
                </h3>
                <p className="font-body text-base text-text-muted">
                  {t(step.descKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-10 text-center"
        >
          <Link
            to="/faq"
            className="inline-flex items-center min-h-[48px] font-body text-base text-slate-brand hover:text-slate-dark underline underline-offset-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded px-1"
          >
            {t('howItWorks.faqLink')} →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
