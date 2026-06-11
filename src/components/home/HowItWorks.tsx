import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
          <p className="font-body text-lg text-charcoal font-bold">
            {t('howItWorks.sectionSubhead')}
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {STEPS.map((step) => {
              const inverted = step.number % 2 === 0
              return (
                <motion.div key={step.number} variants={fadeUp} className="flex">
                  <article
                    className={cn(
                      'relative overflow-hidden rounded border p-6 flex flex-col items-start text-left gap-4 w-full',
                      inverted
                        ? 'bg-slate-brand border-slate-brand'
                        : 'bg-white border-sand shadow-sm',
                    )}
                  >
                    {/* Background Image decoration */}
                    <div className="absolute inset-0 pointer-events-none">
                      <img
                        src={`/images/howitworks-step${step.number}.png`}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.15 }}
                      />
                    </div>

                    {/* Content wrapper to float above background image */}
                    <div className="relative z-10 flex flex-col items-start gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center font-sub text-lg shrink-0 transition-colors duration-200',
                            inverted
                              ? 'bg-white text-slate-brand'
                              : 'bg-slate-brand text-white',
                          )}
                        >
                          {step.number}
                        </div>

                        <h3
                          className={cn(
                            'font-sub text-xl',
                            inverted ? 'text-white' : 'text-charcoal',
                          )}
                        >
                          {t(step.titleKey)}
                        </h3>
                      </div>

                      <p
                        className={cn(
                          'font-body text-lg flex-1 font-bold',
                          inverted ? 'text-white' : 'text-charcoal',
                        )}
                      >
                        {t(step.descKey)}
                      </p>
                    </div>
                  </article>
                </motion.div>
              )
            })}
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
