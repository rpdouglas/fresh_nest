import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import { RENEWAL_CREATED_BY, type BookingData } from '../emailTemplates'

export const onDailyRecurringRenewal = onSchedule(
  {
    schedule: '0 2 * * *', // Run at 2 AM every day
    timeZone: 'UTC',
  },
  async () => {
    const db = getFirestore('(default)')
    const today = new Date()
    const fourteenDaysOut = new Date()
    fourteenDaysOut.setUTCDate(fourteenDaysOut.getUTCDate() + 14)
    const fourteenDaysOutStr = fourteenDaysOut.toISOString().slice(0, 10)

    console.log(`[onDailyRecurringRenewal] Running check for date threshold: ${fourteenDaysOutStr}`)

    const snapshot = await db
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'completed'])
      .where('frequency', 'in', ['weekly', 'biweekly', 'monthly'])
      .get()

    if (snapshot.empty) {
      console.log('[onDailyRecurringRenewal] No active recurring bookings found.')
      return
    }

    for (const docSnap of snapshot.docs) {
      const booking = docSnap.data() as BookingData
      const preferredDateStr = booking.preferredDate
      if (!preferredDateStr) continue

      const preferredDate = new Date(preferredDateStr + 'T00:00:00Z')
      let daysToAdd = 7
      if (booking.frequency === 'biweekly') daysToAdd = 14
      if (booking.frequency === 'monthly') daysToAdd = 30

      const nextDate = new Date(preferredDate.getTime())
      nextDate.setUTCDate(nextDate.getUTCDate() + daysToAdd)
      const nextDateStr = nextDate.toISOString().slice(0, 10)

      const todayStr = today.toISOString().slice(0, 10)
      // Older bookings may hold a mixed-case email; renewals store it lowercased like new ones.
      const email = (booking.email ?? '').trim().toLowerCase()
      if (nextDateStr > todayStr && nextDateStr <= fourteenDaysOutStr) {
        // Check both spellings so a renewal stored before emails were lowercased isn't duplicated.
        const spellings = [...new Set([email, booking.email])]
        const existing = await Promise.all(
          spellings.map((value) =>
            db
              .collection('bookings')
              .where('email', '==', value)
              .where('preferredDate', '==', nextDateStr)
              .where('status', '!=', 'cancelled')
              .get(),
          ),
        )

        if (existing.every((snap) => snap.empty)) {
          console.log(`[onDailyRecurringRenewal] Auto-renewing booking for ${booking.email} on date ${nextDateStr}`)

          const newBookingData = {
            firstName: booking.firstName,
            lastName: booking.lastName,
            email,
            phone: booking.phone,
            language: booking.language,
            propertyType: booking.propertyType,
            bedrooms: booking.bedrooms,
            bathrooms: booking.bathrooms,
            squareFootage: booking.squareFootage || null,
            frequency: booking.frequency,
            pets: booking.pets ?? false,
            address: booking.address,
            serviceType: booking.serviceType,
            addOns: booking.addOns || [],
            preferredCleaner: booking.preferredCleaner || null,
            notes: booking.notes || '',
            leadSource: 'organic',
            status: 'pending',
            assignedTo: booking.assignedTo || null,
            isAirbnb: booking.isAirbnb || false,
            photoConfirmation: booking.photoConfirmation || false,
            // Same client, same referral code — and marked so onBookingCreated treats it as a
            // renewal rather than a new quote request.
            referralCode: booking.referralCode ?? null,
            createdBy: RENEWAL_CREATED_BY,
            createdAt: new Date(),
          }

          await db.collection('bookings').add(newBookingData)
        }
      }
    }
  },
)
