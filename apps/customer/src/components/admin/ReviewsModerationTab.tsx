import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToPendingReviews, updateReviewStatus } from '@/lib/firebase/firestore'
import type { Review } from '@/types'
import { fadeUp } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

interface ReviewsModerationTabProps {
  isAuthorized: boolean
}

export function ReviewsModerationTab({ isAuthorized }: ReviewsModerationTabProps) {
  const { t } = useTranslation()
  const [pendingReviews, setPendingReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthorized) return
    const unsubscribe = subscribeToPendingReviews(isAuthorized, (reviews) => {
      setPendingReviews(reviews)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isAuthorized])

  const handleAction = async (reviewId: string, action: 'approved' | 'rejected') => {
    setProcessingId(reviewId)
    try {
      await updateReviewStatus(reviewId, action)
    } catch (err) {
      console.error(`Failed to execute moderation action (${action}) on review ${reviewId}:`, err)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sub text-2xl text-charcoal mb-2">
          {t('reviewsModeration.title')}
        </h2>
        <p className="font-body text-base text-text-muted">
          {t('reviewsModeration.subtitle')}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {pendingReviews.length === 0 ? (
          <motion.div
            key="empty-reviews"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="bg-white rounded border border-sand p-8 text-center"
          >
            <p className="font-body text-base text-text-muted">
              {t('reviewsModeration.table.noPending')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="reviews-table"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="bg-white rounded border border-sand shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-cream border-b border-sand">
                    <th className="p-4 font-body font-semibold text-charcoal text-base">
                      {t('reviewsModeration.table.name')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base">
                      {t('reviewsModeration.table.location')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base w-20">
                      {t('admin.dashboard.filters.language')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base w-36">
                      {t('reviewsModeration.table.rating')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base">
                      {t('reviewsModeration.table.text')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base w-44">
                      {t('reviewsModeration.table.date')}
                    </th>
                    <th className="p-4 font-body font-semibold text-charcoal text-base w-56 text-right">
                      {t('reviewsModeration.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {pendingReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-warm-white/55 transition-colors">
                      <td className="p-4 font-body text-base font-medium text-charcoal">
                        {review.name}
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {review.location}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          'inline-flex items-center justify-center font-body text-sm font-semibold px-2.5 py-0.5 rounded uppercase',
                          review.language === 'fr' ? 'bg-slate-pale text-slate-dark' : 'bg-cream text-charcoal'
                        )}>
                          {review.language}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                'w-4 h-4 fill-current',
                                i < review.rating ? 'text-amber-500' : 'text-slate-100'
                              )}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-body text-base text-charcoal max-w-xs break-words">
                        "{review.text}"
                      </td>
                      <td className="p-4 font-body text-base text-text-muted">
                        {review.createdAt.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { void handleAction(review.id!, 'approved') }}
                            disabled={processingId !== null}
                            className={cn(
                              'bg-slate-brand text-white font-body font-medium text-base rounded px-4 py-2 min-h-[40px]',
                              'hover:bg-slate-dark transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                              processingId !== null ? 'opacity-50 cursor-not-allowed' : ''
                            )}
                          >
                            {processingId === review.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : (
                              t('reviewsModeration.table.approve')
                            )}
                          </button>
                          <button
                            onClick={() => { void handleAction(review.id!, 'rejected') }}
                            disabled={processingId !== null}
                            className={cn(
                              'border border-sand text-charcoal font-body font-medium text-base rounded px-4 py-2 min-h-[40px]',
                              'hover:bg-cream transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                              processingId !== null ? 'opacity-50 cursor-not-allowed' : ''
                            )}
                          >
                            {processingId === review.id ? (
                              <div className="w-4 h-4 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : (
                              t('reviewsModeration.table.reject')
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
