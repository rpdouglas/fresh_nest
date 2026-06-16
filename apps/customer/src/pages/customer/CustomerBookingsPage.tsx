import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import type { Booking } from '@/types'

export default function CustomerBookingsPage() {
  const { t } = useTranslation()
  const { user } = useCustomerAuthContext()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return

    const fetchBookings = async () => {
      try {
        const q = query(
          collection(db, 'bookings'),
          where('email', '==', user.email?.trim().toLowerCase()),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        const loaded: Booking[] = []
        snap.forEach((docSnap) => {
          const data = docSnap.data()
          loaded.push({
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(),
          } as Booking)
        })
        setBookings(loaded)
      } catch (err) {
        console.error('Error fetching bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchBookings()
  }, [user])

  const handleRebook = (booking: Booking) => {
    // Navigate to /booking and pass the booking data to pre-fill the form
    void navigate('/booking', { state: { prefill: booking } })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-slate-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-4xl text-charcoal mb-6">
        {t('customerPortal.bookings.title')}
      </h2>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-warm-white rounded border border-sand">
          <p className="font-body text-charcoal text-base">
            {t('customerPortal.bookings.noBookings')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-sand rounded p-5 hover:border-slate-brand transition-colors duration-150 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-sub text-2xl text-charcoal capitalize">
                    {booking.serviceType.replace('-', ' ')}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded ${
                      booking.status === 'confirmed'
                        ? 'bg-slate-pale text-slate-dark'
                        : booking.status === 'cancelled'
                        ? 'bg-sand text-charcoal'
                        : 'bg-cream text-charcoal'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-body text-charcoal text-base">
                  <p>
                    <span className="font-semibold">{t('customerPortal.bookings.dateLabel', 'Date:')}</span> {booking.preferredDate}
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
                  {booking.assignedTo && (
                    <p className="sm:col-span-2 text-slate-brand font-medium">
                      {t('customerPortal.bookings.cleanerAssignedLabel', 'Cleaner assigned: {{cleaner}}', {
                        cleaner: booking.assignedTo,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => handleRebook(booking)}
                  className="bg-slate-brand text-white font-body font-medium text-base rounded px-4 py-2 min-h-[48px] inline-flex items-center justify-center hover:bg-slate-dark transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  {t('customerPortal.bookings.rebookBtn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
