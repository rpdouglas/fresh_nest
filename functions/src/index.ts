import { initializeApp } from 'firebase-admin/app'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import { sendOwnerNotification, sendClientConfirmation } from './sendEmail'
import type { BookingData } from './emailTemplates'

initializeApp()

const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const OWNER_EMAIL    = defineSecret('OWNER_EMAIL')

export const onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets:  [RESEND_API_KEY, OWNER_EMAIL],
  },
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined
    if (!booking) return

    const config = {
      resendApiKey: RESEND_API_KEY.value(),
      ownerEmail:   OWNER_EMAIL.value(),
      fromEmail:    process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    }

    const results = await Promise.allSettled([
      sendOwnerNotification(booking, event.params['docId'], config),
      sendClientConfirmation(booking, config),
    ])

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const label = i === 0 ? 'owner' : 'client'
        console.error(`[onBookingCreated] ${label} email failed:`, result.reason)
      }
    })
  },
)
