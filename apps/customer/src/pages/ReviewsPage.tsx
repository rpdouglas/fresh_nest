import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import SEO from '@/components/seo/SEO'
import { subscribeToApprovedReviews } from '@/lib/firebase/firestore'
import type { Review } from '@/types'
import { STATIC_REVIEWS } from '@/lib/data/reviewsData'
import { fadeUp } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

export default function ReviewsPage() {
  const { t, i18n } = useTranslation()
  const [dbReviews, setDbReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to approved reviews from Firestore
    const unsubscribe = subscribeToApprovedReviews((reviews) => {
      setDbReviews(reviews)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Format static reviews to match the Review interface and filter by current locale
  const mappedStaticReviews: Review[] = STATIC_REVIEWS.map((rev) => ({
    ...rev,
    rating: rev.rating as 1 | 2 | 3 | 4 | 5,
    approved: true,
    rejected: false,
    jobId: 'static',
    createdAt: new Date('2025-06-06T12:00:00Z'), // static baseline date
  }))

  // Combine static and dynamic reviews
  const allReviews = [...dbReviews, ...mappedStaticReviews]
    .filter((rev) => rev.language === i18n.language)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-[85vh] bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO title={t('reviewsPage.pageTitle')} description={t('reviewsPage.metaDesc')} />

      <div className="max-w-content mx-auto flex flex-col gap-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display text-5xl text-charcoal mb-4">
            {t('reviewsPage.heading')}
          </h1>
          <p className="font-body text-base text-text-muted">
            {t('reviewsPage.subhead')}
          </p>
        </div>

        {/* Rating Overview Widget */}
        <div className="bg-white rounded border border-sand p-6 max-w-md mx-auto text-center shadow-sm">
          <h2 className="font-sub text-2xl text-charcoal mb-2">
            {t('reviews.ratingBasis')}
          </h2>
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <p className="font-body text-base font-medium text-slate-dark">
            {t('reviews.ratingAriaLabel')}
          </p>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded border border-sand p-8">
            <p className="font-body text-base text-text-muted">
              {t('reviewsPage.empty')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReviews.map((review, idx) => (
              <motion.div
                key={review.id || idx}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={idx}
                className="bg-white rounded border border-sand shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
              >
                <div>
                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1 text-amber-500 mb-4" aria-label={t('reviews.starAriaLabel', { rating: review.rating, max: 5 })}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          'w-5 h-5 fill-current',
                          i < review.rating ? 'text-amber-500' : 'text-slate-100'
                        )}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="font-body text-base text-charcoal italic leading-relaxed mb-6">
                    "{review.text}"
                  </p>
                </div>

                {/* Reviewer Details */}
                <div className="border-t border-sand pt-4 flex justify-between items-end">
                  <div>
                    <h3 className="font-body text-base font-semibold text-charcoal leading-none">
                      {review.name}
                    </h3>
                    <p className="font-body text-sm text-text-muted mt-1 leading-none">
                      {review.location}
                    </p>
                  </div>
                  <span className="font-body text-sm text-text-muted leading-none">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
