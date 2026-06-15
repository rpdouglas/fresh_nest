import twilio from 'twilio'
import { normalizePhone } from './sendSms'

export interface SmsConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

// Localized Template mappings
const templates = {
  shift_assigned: {
    en: {
      title: 'Shift Assigned',
      body: (date: string, start: string, end: string) =>
        `A new shift has been assigned to you on ${date} at ${start}-${end}. Please log in to review.`,
    },
    fr: {
      title: 'Quart Assigné',
      body: (date: string, start: string, end: string) =>
        `Un nouveau quart vous a été assigné le ${date} de ${start} à ${end}. Veuillez vous connecter pour le consulter.`,
    },
  },
  shift_unassigned: {
    en: {
      title: 'Shift Unassigned',
      body: (date: string, start: string, end: string) =>
        `You have been unassigned from the shift on ${date} at ${start}-${end}.`,
    },
    fr: {
      title: 'Quart Désassigné',
      body: (date: string, start: string, end: string) =>
        `Vous avez été désassigné du quart le ${date} de ${start} à ${end}.`,
    },
  },
  shift_cancelled: {
    en: {
      title: 'Shift Cancelled',
      body: (date: string, start: string, end: string) =>
        `Your shift on ${date} at ${start}-${end} has been cancelled by the administrator.`,
    },
    fr: {
      title: 'Quart Annulé',
      body: (date: string, start: string, end: string) =>
        `Votre quart le ${date} de ${start} à ${end} a été annulé par l'administrateur.`,
    },
  },
  new_shift_board_posting: {
    en: {
      title: 'New Shift Available',
      body: (date: string, start: string, end: string) =>
        `A new shift is available on the Shift Board for ${date} at ${start}-${end}. Log in to claim it!`,
    },
    fr: {
      title: 'Nouveau Quart Disponible',
      body: (date: string, start: string, end: string) =>
        `Un nouveau quart est disponible sur le tableau des quarts pour le ${date} de ${start} à ${end}. Connectez-vous pour le réclamer !`,
    },
  },
}

/**
 * Dispatches an in-app notification to the staff member's collection
 */
export async function sendInAppNotification(
  db: FirebaseFirestore.Firestore,
  staffId: string,
  type: keyof typeof templates,
  date: string,
  start: string,
  end: string,
  jobId: string | null,
  language: 'en' | 'fr'
): Promise<void> {
  const template = templates[type][language]
  const title = template.title
  const body = template.body(date, start, end)

  console.log(`[sendInAppNotification] Writing in-app notification to staff '${staffId}' (type: ${type})`)
  await db
    .collection('notifications')
    .doc(staffId)
    .collection('messages')
    .add({
      title,
      body,
      type,
      jobId,
      read: false,
      createdAt: new Date(),
    })
}

/**
 * Dispatches an SMS alert via Twilio to a single phone number if configuration is active
 */
export async function sendSmsNotification(
  phone: string,
  type: keyof typeof templates,
  date: string,
  start: string,
  end: string,
  language: 'en' | 'fr',
  smsConfig: SmsConfig
): Promise<void> {
  const to = normalizePhone(phone)
  if (!to) {
    console.warn(`[sendSmsNotification] Invalid phone number "${phone}" — skipping SMS.`)
    return
  }

  // Ensure Twilio keys are configured before calling API
  if (!smsConfig.accountSid || !smsConfig.authToken || !smsConfig.fromNumber) {
    console.warn('[sendSmsNotification] Twilio configuration missing. Skipping SMS send.')
    return
  }

  const template = templates[type][language]
  const body = template.body(date, start, end)

  try {
    const client = twilio(smsConfig.accountSid, smsConfig.authToken)
    await client.messages.create({
      body,
      from: smsConfig.fromNumber,
      to,
    })
    console.log(`[sendSmsNotification] SMS alert sent to ${to} (type: ${type})`)
  } catch (err) {
    console.error(`[sendSmsNotification] Failed to send SMS to ${to}:`, err)
  }
}

/**
 * Helper to dispatch both in-app and SMS notifications to a specific staff member
 */
export async function notifyStaffMember(
  db: FirebaseFirestore.Firestore,
  staffId: string,
  type: keyof typeof templates,
  date: string,
  start: string,
  end: string,
  jobId: string | null,
  smsConfig: SmsConfig
): Promise<void> {
  try {
    const staffSnap = await db.collection('staff').doc(staffId).get()
    if (!staffSnap.exists) {
      console.warn(`[notifyStaffMember] Staff profile '${staffId}' not found.`)
      return
    }

    const staffData = staffSnap.data()!
    if (staffData.status !== 'active') {
      console.log(`[notifyStaffMember] Staff member '${staffId}' is not active (${staffData.status}) — skipping notifications.`)
      return
    }

    const language: 'en' | 'fr' = staffData.preferences?.language === 'fr' ? 'fr' : 'en'

    // 1. Send In-App notification
    await sendInAppNotification(db, staffId, type, date, start, end, jobId, language)

    // 2. Send SMS if phone exists
    if (staffData.phone) {
      await sendSmsNotification(staffData.phone, type, date, start, end, language, smsConfig)
    }
  } catch (err) {
    console.error(`[notifyStaffMember] Error notifying staff member '${staffId}':`, err)
  }
}

/**
 * Helper to notify all active staff members when a new unassigned shift is created
 */
export async function notifyAllActiveStaff(
  db: FirebaseFirestore.Firestore,
  type: keyof typeof templates,
  date: string,
  start: string,
  end: string,
  jobId: string | null,
  smsConfig: SmsConfig
): Promise<void> {
  try {
    const staffSnap = await db.collection('staff').where('status', '==', 'active').get()
    if (staffSnap.empty) {
      console.log('[notifyAllActiveStaff] No active staff members to notify.')
      return
    }

    console.log(`[notifyAllActiveStaff] Dispatching notifications to ${staffSnap.size} active staff cleaner(s).`)

    const promises = staffSnap.docs.map(async (docSnap) => {
      const staffId = docSnap.id
      const staffData = docSnap.data()
      const language: 'en' | 'fr' = staffData.preferences?.language === 'fr' ? 'fr' : 'en'

      // In-app notification for everyone
      await sendInAppNotification(db, staffId, type, date, start, end, jobId, language)

      // SMS alert for everyone
      if (staffData.phone) {
        await sendSmsNotification(staffData.phone, type, date, start, end, language, smsConfig)
      }
    })

    await Promise.all(promises)
  } catch (err) {
    console.error('[notifyAllActiveStaff] Error dispatching global alerts:', err)
  }
}
