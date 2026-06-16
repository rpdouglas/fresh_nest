import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { getJobForReview, getBookingForReview, submitReview } from '@/lib/firebase/firestore'
import { GOOGLE_BUSINESS_PROFILE_URL } from '@/lib/config'
import SEO from '@/components/seo/SEO'
import { fadeUp } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'
import type { Booking } from '@/types'

export default function LeaveReviewPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const jobId = searchParams.get('jobId')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  
  const [rating, setRating] = useState<number>(0)
  const [ratingHover, setRatingHover] = useState<number>(0)
  const [comments, setComments] = useState('')
  const [formErrors, setFormErrors] = useState<{ rating?: string; comments?: string }>({})
  const [showGoogleModal, setShowGoogleModal] = useState(false)

  useEffect(() => {
    async function loadJobAndBooking() {
      if (!jobId) {
        setErrorKey('leaveReview.errorJobNotFound')
        setLoading(false)
        return
      }
      
      try {
        const job = await getJobForReview(jobId)
        if (!job) {
          setErrorKey('leaveReview.errorJobNotFound')
          setLoading(false)
          return
        }
        
        if (job.status !== 'completed') {
          setErrorKey('leaveReview.errorJobNotFound')
          setLoading(false)
          return
        }
        
        if (job.reviewSubmitted) {
          setErrorKey('leaveReview.errorAlreadySubmitted')
          setLoading(false)
          return
        }
        
        const booking = await getBookingForReview(job.bookingId)
        if (booking) {
          setBookingData(booking)
          // Automatically set page language to client booking language preference
          if (booking.language && booking.language !== i18n.language) {
            void i18n.changeLanguage(booking.language)
          }
        }
      } catch (err) {
        console.error('Error loading job/booking details:', err)
        setErrorKey('leaveReview.errorJobNotFound')
      } finally {
        setLoading(false)
      }
    }
    
    void loadJobAndBooking()
  }, [jobId, i18n])

  const validate = () => {
    const errors: { rating?: string; comments?: string } = {}
    if (rating === 0) {
      errors.rating = t('leaveReview.ratingRequired')
    }
    if (!comments.trim()) {
      errors.comments = t('leaveReview.commentsRequired')
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setSubmitting(true)
    
    try {
      // Format name as First Name + Last Initial (e.g. "Travis M.")
      const clientFirstName = bookingData?.firstName || 'Client'
      const clientLastInitial = bookingData?.lastName ? ` ${bookingData.lastName.charAt(0)}.` : ''
      const reviewerName = `${clientFirstName}${clientLastInitial}`
      
      // Format location from booking address (e.g. "Cornwall, ON" or matching location page labels)
      // If we don't have locationData, default to "Cornwall, ON"
      let reviewerLocation = 'Cornwall, ON'
      if (bookingData?.address) {
        const addr = bookingData.address.toLowerCase()
        if (addr.includes('akwesasne')) {
          reviewerLocation = 'Akwesasne'
        } else if (addr.includes('snye')) {
          reviewerLocation = 'Snye, QC'
        } else if (addr.includes('long sault')) {
          reviewerLocation = 'Long Sault, ON'
        } else if (addr.includes('morrisburg')) {
          reviewerLocation = 'Morrisburg, ON'
        }
      }

      await submitReview({
        name: reviewerName,
        location: reviewerLocation,
        language: (i18n.language === 'fr' ? 'fr' : 'en'),
        rating: rating as 1 | 2 | 3 | 4 | 5,
        text: comments,
        approved: false,
        rejected: false,
        jobId: jobId!,
      })
      
      setSuccess(true)
      
      // If 4 or 5 stars, prompt copy to Google
      if (rating >= 4) {
        setShowGoogleModal(true)
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setErrorKey('leaveReview.errorGeneric')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleRedirect = () => {
    // Copy review text to clipboard before redirecting
    void navigator.clipboard.writeText(comments).catch((err) => {
      console.warn('Could not copy text to clipboard:', err)
    })
    window.open(GOOGLE_BUSINESS_PROFILE_URL, '_blank', 'noopener,noreferrer')
    setShowGoogleModal(false)
    void navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-warm-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[80vh] bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO title={t('leaveReview.pageTitle')} description={t('leaveReview.metaDesc')} />
      
      <div className="max-w-xl mx-auto bg-white border border-sand rounded p-6 md:p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {errorKey ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="font-display text-4xl text-charcoal mb-4">
                {t('leaveReview.heading')}
              </h1>
              <p className="font-body text-base text-text-muted mb-8">
                {t(errorKey)}
              </p>
              <button
                onClick={() => { void navigate('/') }}
                className="bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
              >
                {t('admin.login.backToHome')}
              </button>
            </motion.div>
          ) : success && !showGoogleModal ? (
            <motion.div
              key="success-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-4xl text-charcoal mb-4">
                {t('leaveReview.heading')}
              </h1>
              <p className="font-body text-base text-text-muted mb-8">
                {t('leaveReview.successMessage')}
              </p>
              <button
                onClick={() => { void navigate('/') }}
                className="bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
              >
                {t('admin.login.backToHome')}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form-state"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              onSubmit={(e) => { void handleSubmit(e) }}
              className="flex flex-col gap-6"
            >
              <div className="border-b border-sand pb-4">
                <h1 className="font-display text-4xl text-charcoal mb-2">
                  {t('leaveReview.heading')}
                </h1>
                <p className="font-body text-base text-text-muted">
                  {t('leaveReview.subhead')}
                </p>
              </div>
              
              {/* Prepopulated Name & Location details (Read-only per P2/P3 decision) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-base text-charcoal mb-1" htmlFor="client-name">
                    {t('leaveReview.labelName')}
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    readOnly
                    className="w-full border border-sand bg-cream rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal cursor-not-allowed focus:outline-none"
                    value={bookingData ? `${bookingData.firstName} ${bookingData.lastName ? bookingData.lastName.charAt(0) + '.' : ''}` : ''}
                  />
                </div>
                <div>
                  <label className="block font-body text-base text-charcoal mb-1" htmlFor="client-location">
                    {t('leaveReview.labelLocation')}
                  </label>
                  <input
                    id="client-location"
                    type="text"
                    readOnly
                    className="w-full border border-sand bg-cream rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal cursor-not-allowed focus:outline-none"
                    value={bookingData?.address ? (
                      bookingData.address.toLowerCase().includes('akwesasne') ? 'Akwesasne' :
                      bookingData.address.toLowerCase().includes('snye') ? 'Snye, QC' :
                      bookingData.address.toLowerCase().includes('long sault') ? 'Long Sault, ON' :
                      bookingData.address.toLowerCase().includes('morrisburg') ? 'Morrisburg, ON' : 'Cornwall, ON'
                    ) : 'Cornwall, ON'}
                  />
                </div>
              </div>
              
              {/* Star Rating Selectors (Margaret P3: 48px targets) */}
              <div>
                <span className="block font-body text-base text-charcoal mb-2">
                  {t('leaveReview.labelRating')} <span className="text-red-500" aria-hidden="true">*</span>
                </span>
                
                <div className="flex items-center gap-2" role="group" aria-label={t('reviews.ariaLabel')}>
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isActive = ratingHover >= starValue || (!ratingHover && rating >= starValue)
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => {
                          setRating(starValue)
                          setFormErrors((prev) => ({ ...prev, rating: undefined }))
                        }}
                        onMouseEnter={() => setRatingHover(starValue)}
                        onMouseLeave={() => setRatingHover(0)}
                        aria-label={t('reviews.starAriaLabel', { rating: starValue, max: 5 })}
                        className={cn(
                          'w-12 h-12 flex items-center justify-center rounded transition-all duration-150',
                          'min-h-[48px] min-w-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
                          isActive ? 'text-amber-500' : 'text-slate-200 hover:text-slate-300'
                        )}
                      >
                        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
                {formErrors.rating && (
                  <p className="text-red-500 font-body text-base mt-1" role="alert">
                    {formErrors.rating}
                  </p>
                )}
              </div>
              
              {/* Comments Textarea */}
              <div>
                <label className="block font-body text-base text-charcoal mb-1" htmlFor="comments">
                  {t('leaveReview.labelComments')} <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="comments"
                  required
                  rows={4}
                  value={comments}
                  onChange={(e) => {
                    setComments(e.target.value)
                    setFormErrors((prev) => ({ ...prev, comments: undefined }))
                  }}
                  className={cn(
                    'w-full border border-sand rounded px-4 py-3 font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand',
                    formErrors.comments ? 'border-red-500 focus:ring-red-500' : ''
                  )}
                  placeholder={t('leaveReview.placeholderComments')}
                />
                {formErrors.comments && (
                  <p className="text-red-500 font-body text-base mt-1" role="alert">
                    {formErrors.comments}
                  </p>
                )}
              </div>
              
              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'w-full bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px]',
                  'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                )}
              >
                {submitting ? t('leaveReview.submitting') : t('leaveReview.submit')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Google Business Profile Redirect Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded border border-sand shadow-lg max-w-md w-full p-6 md:p-8 relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <h2 id="modal-title" className="font-sub text-2xl text-charcoal mb-4">
                {t('leaveReview.googlePromptTitle')}
              </h2>
              <p className="font-body text-base text-text-muted mb-6 leading-relaxed">
                {t('leaveReview.googlePromptBody')}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleRedirect}
                  className="bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                >
                  {t('leaveReview.googlePromptCta')}
                </button>
                <button
                  onClick={() => {
                    setShowGoogleModal(false)
                    void navigate('/')
                  }}
                  className="border border-sand text-charcoal font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-cream transition-colors duration-200"
                >
                  {t('leaveReview.googlePromptCancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
