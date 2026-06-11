import { getAnalytics, logEvent, Analytics, setAnalyticsCollectionEnabled } from 'firebase/analytics'
import app from './firebase'

let analyticsInstance: Analytics | null = null

export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && !analyticsInstance) {
    try {
      analyticsInstance = getAnalytics(app)
      console.log('Firebase Analytics initialized.')
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error)
    }
  }
}

export const revokeAnalytics = () => {
  if (analyticsInstance) {
    setAnalyticsCollectionEnabled(analyticsInstance, false)
    console.log('Firebase Analytics collection disabled.')
  }
}

export const logCustomEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (analyticsInstance) {
    logEvent(analyticsInstance, eventName, eventParams)
  }
}

export const logBookingStarted = () => {
  logCustomEvent('booking_started')
}

export const logBookingCompleted = (serviceType: string, totalValue?: number) => {
  logCustomEvent('booking_completed', { service_type: serviceType, value: totalValue })
}

export const logQuoteCalculated = (serviceType: string, estimatedPrice: number) => {
  logCustomEvent('quote_calculated', { service_type: serviceType, value: estimatedPrice })
}

export const logPhoneClicked = (location: 'navbar' | 'footer' | 'other') => {
  logCustomEvent('phone_clicked', { location })
}

export const logLanguageToggled = (newLanguage: string) => {
  logCustomEvent('language_toggled', { language: newLanguage })
}

export const _resetForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    analyticsInstance = null
  }
}
