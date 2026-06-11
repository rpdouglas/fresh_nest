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
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

type FrequencyOption = 'weekly' | 'biweekly' | 'monthly'

interface FrequencyCard {
  freq: FrequencyOption
  discountPct: number
  inverted: boolean
  badgeKey: string
  bgImage: string
}

const FREQUENCY_CARDS: FrequencyCard[] = [
  { freq: 'weekly',   discountPct: 20, inverted: false, badgeKey: '', bgImage: '/images/weekly-recurring.png' },
  { freq: 'biweekly', discountPct: 15, inverted: true,  badgeKey: 'recurring.mostPopular', bgImage: '/images/biweekly-recurring.png' },
  { freq: 'monthly',  discountPct: 10, inverted: false, badgeKey: '', bgImage: '/images/monthly-recurring.png' },
]

export default function RecurringCTA() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('recurring.ariaLabel')}
      className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('recurring.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold">
            {t('recurring.sectionSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {FREQUENCY_CARDS.map((card) => {
            const freqLabel = t(`quote.frequency.${card.freq}`)
            return (
              <motion.div key={card.freq} variants={fadeUp} className="flex">
                <article
                  className={cn(
                    'relative overflow-hidden rounded border p-6 flex flex-col gap-4 w-full',
                    card.inverted
                      ? 'bg-slate-brand border-slate-brand'
                      : 'bg-white border-sand shadow-sm',
                  )}
                >
                  {/* Background Image decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <img
                      src={card.bgImage}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.15 }}
                    />
                  </div>

                  {/* Relative z-10 wrapper to ensure text stays legible over background image */}
                  <div className="relative z-10 flex flex-col gap-4 flex-1">
                    <div
                      className={cn(
                        'inline-flex items-center self-start font-body font-medium text-base rounded px-3 py-1',
                        card.inverted
                          ? 'bg-white text-slate-brand'
                          : 'bg-slate-pale text-slate-brand',
                      )}
                    >
                      {t('recurring.discountBadge', { pct: card.discountPct })}
                    </div>

                    {card.badgeKey && (
                      <span className="font-body text-sm text-white opacity-75">
                        {t(card.badgeKey)}
                      </span>
                    )}

                    <h3
                      className={cn(
                        'font-sub text-2xl',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      {freqLabel}
                    </h3>

                    <p
                      className={cn(
                        'font-body text-lg flex-1 font-bold',
                        card.inverted ? 'text-white/95' : 'text-charcoal',
                      )}
                    >
                      {t(`recurring.tagline.${card.freq}`)}
                    </p>

                    <Link
                      to={`/booking?freq=${card.freq}`}
                      aria-label={t('recurring.bookAriaLabel', { freq: freqLabel })}
                      className={cn(
                        'inline-flex items-center font-body font-medium text-base rounded',
                        'min-h-[48px] px-4 py-2 self-start transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        card.inverted
                          ? 'bg-cream text-slate-brand hover:bg-warm-white hover:text-slate-dark focus:ring-white'
                          : 'bg-slate-brand text-white hover:bg-slate-dark focus:ring-slate-brand',
                      )}
                    >
                      {t('recurring.bookCta', { freq: freqLabel })} →
                    </Link>
                  </div>
                </article>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
