import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import type { Booking } from '@/types'

export default function CustomerUpcomingPage() {
  const { t } = useTranslation()
  const { user } = useCustomerAuthContext()
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return

    const fetchUpcoming = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const q = query(
          collection(db, 'bookings'),
          where('email', '==', user.email?.trim().toLowerCase()),
          where('preferredDate', '>=', todayStr)
        )
        const snap = await getDocs(q)
        const loaded: Booking[] = []
        snap.forEach((docSnap) => {
          const data = docSnap.data()
          if (data['status'] !== 'cancelled') {
            loaded.push({
              id: docSnap.id,
              ...data,
              createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(),
            } as Booking)
          }
        })
        loaded.sort((a, b) => a.preferredDate.localeCompare(b.preferredDate))
        setUpcoming(loaded)
      } catch (err) {
        console.error('Error fetching upcoming bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchUpcoming()
  }, [user, successMsg])

  const handleCancelClick = (id: string) => {
    setCancellingId(id)
    setShowConfirm(true)
  }

  const confirmCancel = async () => {
    if (!cancellingId) return
    try {
      const docRef = doc(db, 'bookings', cancellingId)
      // Update status to cancelled. Security rules permit this specifically.
      await updateDoc(docRef, { status: 'cancelled' })
      setSuccessMsg(t('customerPortal.upcoming.cancelSuccess'))
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      console.error('Error cancelling booking:', err)
    } finally {
      setShowConfirm(false)
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-slate-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const cancellingBooking = upcoming.find((u) => u.id === cancellingId)

  return (
    <div>
      <h2 className="font-display text-4xl text-charcoal mb-6">
        {t('customerPortal.upcoming.title')}
      </h2>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded font-body text-sm animate-fade-in">
          {successMsg}
        </div>
      )}

      {upcoming.length === 0 ? (
        <div className="text-center py-12 bg-warm-white rounded border border-sand">
          <p className="font-body text-charcoal text-base">
            {t('customerPortal.upcoming.noUpcoming')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.map((booking) => (
            <div
              key={booking.id}
              className="border border-sand rounded p-5 hover:border-slate-brand transition-colors duration-150 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-sub text-2xl text-charcoal capitalize">
                    {booking.serviceType.replace('-', ' ')}
                  </span>
                  <span className="bg-slate-pale text-slate-dark text-xs font-semibold px-2.5 py-1 rounded">
                    {booking.frequency}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-body text-charcoal text-base">
                  <p>
                    <span className="font-semibold">{t('customerPortal.upcoming.scheduledDateLabel', 'Scheduled Date:')}</span> {booking.preferredDate}
                  </p>
                  <p>
                    <span className="font-semibold">{t('customerPortal.bookings.roomsLabel', 'Rooms:')}</span>{' '}
                    {t('customerPortal.bookings.roomsFormat', '{{bedrooms}} Bed / {{bathrooms}} Bath', {
                      bedrooms: booking.bedrooms,
                      bathrooms: booking.bathrooms,
                    })}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold">{t('customerPortal.bookings.addressLabel', 'Address:')}</span> {booking.address}
                  </p>
                  {booking.notes && (
                    <p className="sm:col-span-2 italic text-text-muted">
                      {t('customerPortal.upcoming.notesLabel', 'Notes:')} "{booking.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => booking.id && handleCancelClick(booking.id)}
                  className="border border-red-200 text-red-600 hover:bg-red-50 font-body font-medium text-base rounded px-4 py-2 min-h-[48px] inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {t('customerPortal.upcoming.cancelBtn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="bg-white rounded border border-sand max-w-md w-full p-6 shadow-lg"
          >
            <h3 id="confirm-modal-title" className="font-sub text-2xl text-charcoal mb-2">
              {t('customerPortal.upcoming.confirmCancelTitle')}
            </h3>
            <p className="font-body text-charcoal text-base mb-6">
              {t('customerPortal.upcoming.confirmCancelDesc', { date: cancellingBooking.preferredDate })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="border border-sand text-charcoal font-body font-medium text-base rounded px-4 py-2 min-h-[48px] hover:bg-cream transition-colors duration-150"
              >
                {t('customerPortal.upcoming.goBackBtn', 'Go Back')}
              </button>
              <button
                onClick={() => { void confirmCancel() }}
                className="bg-red-600 text-white font-body font-medium text-base rounded px-4 py-2 min-h-[48px] hover:bg-red-700 transition-colors duration-150"
              >
                {t('customerPortal.upcoming.confirmCancelBtn', 'Confirm Cancellation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
