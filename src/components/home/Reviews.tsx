import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { STATIC_REVIEWS, type Review } from '@/lib/reviewsData'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

function StarRating({ rating }: { rating: number }) {
  const { t } = useTranslation()
  return (
    <div
      role="img"
      aria-label={t('reviews.starAriaLabel', { rating, max: 5 })}
      className="flex gap-0.5"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-4 h-4 ${i < rating ? 'text-sand-dark' : 'text-slate-pale'}`}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <motion.article
      variants={fadeUp}
      className="snap-start shrink-0 w-[min(18rem,85vw)]
                 md:w-auto md:shrink
                 bg-white border border-sand rounded shadow-sm p-6
                 flex flex-col gap-3"
    >
      <StarRating rating={review.rating} />
      <p className="font-body text-lg text-charcoal flex-1 font-bold leading-relaxed">{review.text}</p>
      <div className="pt-2 border-t border-sand">
        <p className="font-sub text-base text-charcoal">{review.name}</p>
        <p className="font-body text-sm text-text-muted">{review.location}</p>
      </div>
    </motion.article>
  )
}

export default function Reviews() {
  const { t, i18n } = useTranslation()

  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const sorted = [...STATIC_REVIEWS].sort((a, b) => {
    if (a.language === lang && b.language !== lang) return -1
    if (b.language === lang && a.language !== lang) return 1
    return 0
  })

  return (
    <section aria-label={t('reviews.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">

        {/* Heading row */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="font-display text-4xl text-charcoal mb-2">{t('reviews.sectionHeading')}</h2>
            <p className="font-body text-lg text-charcoal font-bold">{t('reviews.sectionSubhead')}</p>
          </div>
          {/* Rating aggregate */}
          <div
            role="img"
            aria-label={t('reviews.ratingAriaLabel')}
            className="shrink-0 sm:text-right"
          >
            <p aria-hidden="true" className="font-display text-3xl text-charcoal">{t('reviews.ratingHeading')}</p>
            <p aria-hidden="true" className="font-body text-sm text-sand-dark">{t('reviews.ratingStars')}</p>
            <p aria-hidden="true" className="font-body text-sm text-text-muted">{t('reviews.ratingBasis')}</p>
          </div>
        </motion.div>

        {/* Review cards — horizontal scroll on mobile, grid on md+ */}
        <motion.div
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4
                     md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                     lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {sorted.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </motion.div>

      </div>
    </section>
  )
}
