import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ServiceType } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

interface ServiceCard {
  key: ServiceType
  labelKey: string
  descKey: string
  route: string
  inverted: boolean
}

const SERVICE_CARDS: ServiceCard[] = [
  { key: 'standard',         labelKey: 'services.standard.title',         descKey: 'services.standard.description',         route: '/services/standard-cleaning',  inverted: false },
  { key: 'deep',             labelKey: 'services.deep.title',             descKey: 'services.deep.description',             route: '/services/deep-cleaning',       inverted: false },
  { key: 'moveout',          labelKey: 'services.moveout.title',          descKey: 'services.moveout.description',          route: '/services/move-out-cleaning',   inverted: false },
  { key: 'postconstruction', labelKey: 'services.postconstruction.title', descKey: 'services.postconstruction.description', route: '/services/post-construction',   inverted: false },
  { key: 'airbnb',           labelKey: 'services.airbnb.title',           descKey: 'services.airbnb.description',           route: '/services/airbnb-turnover',     inverted: false },
  { key: 'commercial',       labelKey: 'services.commercial.title',       descKey: 'services.commercial.description',       route: '/services/commercial-cleaning', inverted: true  },
]

function ServiceIcon({ serviceKey }: { serviceKey: ServiceType }) {
  const base = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (serviceKey) {
    case 'standard':
      return (
        <svg {...base}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'deep':
      return (
        <svg {...base}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    case 'moveout':
      return (
        <svg {...base}>
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x={1} y={3} width={22} height={5} />
          <line x1={10} y1={12} x2={14} y2={12} />
        </svg>
      )
    case 'postconstruction':
      return (
        <svg {...base}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
    case 'airbnb':
      return (
        <svg {...base}>
          <rect x={3} y={4} width={18} height={18} rx={2} />
          <line x1={16} y1={2} x2={16} y2={6} />
          <line x1={8} y1={2} x2={8} y2={6} />
          <line x1={3} y1={10} x2={21} y2={10} />
          <polyline points="12 14 12 17 14 17" />
        </svg>
      )
    case 'commercial':
      return (
        <svg {...base}>
          <rect x={3} y={3} width={7} height={7} />
          <rect x={14} y={3} width={7} height={7} />
          <rect x={14} y={14} width={7} height={7} />
          <rect x={3} y={14} width={7} height={7} />
        </svg>
      )
  }
}

export default function ServicesGrid() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('services.ariaLabel')}
      className="bg-cream py-12 px-4 md:py-20 md:px-6"
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
            {t('services.sectionHeading')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('services.sectionSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {SERVICE_CARDS.map((card) => {
            const serviceTitle = t(card.labelKey)
            return (
              <motion.div key={card.key} variants={fadeUp} className="flex">
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
                      src={`/images/${card.key}-hero.jpg`}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.15 }}
                    />
                    <div
                      className={cn(
                        'absolute inset-0 transition-colors duration-200',
                        card.inverted ? 'bg-slate-brand/90' : 'bg-white/90',
                      )}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col gap-4 flex-1">
                    <Link
                      to={card.route}
                      aria-label={t('services.viewDetailsAriaLabel', { service: serviceTitle })}
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                        card.inverted
                          ? 'text-white hover:text-slate-light focus:ring-white'
                          : 'text-slate-brand hover:text-slate-dark focus:ring-slate-brand',
                      )}
                    >
                      <ServiceIcon serviceKey={card.key} />
                    </Link>

                    <h3
                      className={cn(
                        'font-sub text-2xl',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      <Link
                        to={card.route}
                        className={cn(
                          'hover:underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2',
                          card.inverted ? 'focus:ring-white' : 'focus:ring-slate-brand',
                        )}
                      >
                        {serviceTitle}
                      </Link>
                    </h3>

                    <p
                      className={cn(
                        'font-body text-base flex-1',
                        card.inverted ? 'text-white' : 'text-text-muted',
                      )}
                    >
                      {t(card.descKey)}
                    </p>

                    <Link
                      to={`/booking?serviceType=${card.key}`}
                      aria-label={t('services.bookAriaLabel', { service: serviceTitle })}
                      className={cn(
                        'inline-flex items-center font-body font-medium text-base rounded',
                        'min-h-[48px] px-4 py-2 self-start transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        card.inverted
                          ? 'border border-white text-white hover:bg-white hover:text-slate-brand focus:ring-white'
                          : 'bg-slate-brand text-white hover:bg-slate-dark focus:ring-slate-brand',
                      )}
                    >
                      {t('services.bookNow')} →
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
