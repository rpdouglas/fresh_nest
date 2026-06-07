import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface FaqItem {
  id: string
  qKey: string
  aKey: string
}

const FAQ_ITEMS: FaqItem[] = [
  { id: 'home',         qKey: 'faq.item1.q',  aKey: 'faq.item1.a'  },
  { id: 'eco',          qKey: 'faq.item2.q',  aKey: 'faq.item2.a'  },
  { id: 'same-cleaner', qKey: 'faq.item3.q',  aKey: 'faq.item3.a'  },
  { id: 'akwesasne',    qKey: 'faq.item4.q',  aKey: 'faq.item4.a'  },
  { id: 'snye',         qKey: 'faq.item5.q',  aKey: 'faq.item5.a'  },
  { id: 'airbnb',       qKey: 'faq.item6.q',  aKey: 'faq.item6.a'  },
  { id: 'reschedule',   qKey: 'faq.item7.q',  aKey: 'faq.item7.a'  },
  { id: 'insured',      qKey: 'faq.item8.q',  aKey: 'faq.item8.a'  },
  { id: 'guarantee',    qKey: 'faq.item9.q',  aKey: 'faq.item9.a'  },
  { id: 'payment',      qKey: 'faq.item10.q', aKey: 'faq.item10.a' },
]

export default function FaqPage() {
  const { t } = useTranslation()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  return (
    <>
      <title>{t('faq.pageTitle')}</title>
      <meta name="description" content={t('faq.metaDesc')} />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t('faq.heading')}
            </h1>
            <p className="font-body text-base text-text-muted">{t('faq.subhead')}</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-sand rounded shadow-sm divide-y divide-sand px-6">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openItems.has(i)
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 py-5
                               font-sub text-lg text-charcoal text-left
                               hover:text-slate-brand transition-colors
                               focus:outline-none focus:ring-2 focus:ring-slate-brand
                               focus:ring-inset min-h-[48px]"
                  >
                    <span>{t(item.qKey)}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                      className="shrink-0 text-slate-brand"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${item.id}`}
                        key={`answer-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="font-body text-base text-charcoal pb-5 pr-6 leading-relaxed">
                          {t(item.aKey)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto text-center">
          <h2 className="font-display text-3xl text-charcoal mb-2">{t('faq.ctaHeading')}</h2>
          <p className="font-body text-base text-text-muted mb-8">{t('faq.ctaSubhead')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+16139353555"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base text-slate-brand border border-slate-brand rounded
                         px-8 min-h-[48px] hover:bg-slate-brand hover:text-white
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              {t('phone')}
            </a>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base bg-slate-brand text-white hover:bg-slate-dark rounded
                         px-8 min-h-[48px] transition-colors
                         focus:outline-none focus:ring-2 focus:ring-slate-brand
                         focus:ring-offset-2"
            >
              {t('common.bookNow')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
