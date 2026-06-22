import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import * as Sentry from '@sentry/node'

// Initialize Firebase Admin SDK
initializeApp()

// Initialize Sentry if DSN is set
if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['FUNCTIONS_EMULATOR'] ? 'development' : 'production',
    tracesSampleRate: 0,
  })
}

// Error logging helper
export function logError(label: string, err: unknown): void {
  logger.error(label, err)
  Sentry.captureException(err, { tags: { function: label } })
}

// Secret definitions
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
export const OWNER_EMAIL = defineSecret('OWNER_EMAIL')
export const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID')
export const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN')
export const TWILIO_PHONE_NUMBER = defineSecret('TWILIO_PHONE_NUMBER')

// Standard Firebase services
export const db = getFirestore()
export const auth = getAuth()

export { Sentry }
