import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import type { ServiceType } from '@/types'
import { fadeUp, stagger } from '@/lib/utils/animations'

interface ServiceCard {
  key: ServiceType
  labelKey: string
  descKey: string
  route: string
  inverted: boolean
}

const SERVICE_CARDS: ServiceCard[] = [
  { key: 'standard',         labelKey: 'services.standard.title',         descKey: 'services.standard.description',         route: '/services/standard-cleaning',  inverted: false },
  { key: 'deep',             labelKey: 'services.deep.title',             descKey: 'services.deep.description',             route: '/services/deep-cleaning',       inverted: true  },
  { key: 'moveout',          labelKey: 'services.moveout.title',          descKey: 'services.moveout.description',          route: '/services/move-out-cleaning',   inverted: false },
  { key: 'postconstruction', labelKey: 'services.postconstruction.title', descKey: 'services.postconstruction.description', route: '/services/post-construction',   inverted: true  },
  { key: 'airbnb',           labelKey: 'services.airbnb.title',           descKey: 'services.airbnb.description',           route: '/services/airbnb-turnover',     inverted: false },
  { key: 'commercial',       labelKey: 'services.commercial.title',       descKey: 'services.commercial.description',       route: '/services/commercial-cleaning', inverted: true  },
]

const ICON_PATHS: Record<ServiceType, React.ReactNode> = {
  standard: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  deep: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  moveout: (
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x={1} y={3} width={22} height={5} />
      <line x1={10} y1={12} x2={14} y2={12} />
    </>
  ),
  postconstruction: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  airbnb: (
    <>
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
      <polyline points="12 14 12 17 14 17" />
    </>
  ),
  commercial: (
    <>
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={14} y={14} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
    </>
  ),
}

function ServiceIcon({ serviceKey }: { serviceKey: ServiceType }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[serviceKey]}
    </svg>
  )
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
          <p className="font-body text-lg text-charcoal font-bold">
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
                  </div>

                  <div className="relative z-10 flex flex-col gap-4 flex-1">
                    <h3
                      className={cn(
                        'font-sub text-2xl',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      <Link
                        to={card.route}
                        className={cn(
                          'group flex items-center gap-3 hover:underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px]',
                          card.inverted ? 'focus:ring-white' : 'focus:ring-slate-brand',
                        )}
                      >
                        <span
                          className={cn(
                            'flex items-center justify-center transition-colors duration-200',
                            card.inverted
                              ? 'text-white group-hover:text-slate-pale'
                              : 'text-slate-brand group-hover:text-slate-dark',
                          )}
                        >
                          <ServiceIcon serviceKey={card.key} />
                        </span>
                        <span>{serviceTitle}</span>
                      </Link>
                    </h3>

                    <p
                      className={cn(
                        'font-body text-lg flex-1 font-bold',
                        card.inverted ? 'text-white' : 'text-charcoal',
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
                          ? 'bg-cream text-slate-brand hover:bg-warm-white hover:text-slate-dark focus:ring-white'
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
