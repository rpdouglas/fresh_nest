import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics'
import {
  initializeAnalytics,
  revokeAnalytics,
  logCustomEvent,
  logBookingStarted,
  logBookingCompleted,
  logQuoteCalculated,
  logPhoneClicked,
  logLanguageToggled,
  _resetForTesting,
} from './analytics'

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
}))

vi.mock('./firebase', () => ({
  default: {},
}))

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetForTesting()
  })

  it('initializeAnalytics initializes analytics', () => {
    initializeAnalytics()
    expect(getAnalytics).toHaveBeenCalled()
  })

  it('revokeAnalytics disables collection', () => {
    initializeAnalytics()
    revokeAnalytics()
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), false)
  })

  it('logCustomEvent logs event', () => {
    initializeAnalytics()
    logCustomEvent('test_event', { prop: 1 })
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'test_event', { prop: 1 })
  })

  it('logBookingStarted logs booking_started', () => {
    initializeAnalytics()
    logBookingStarted()
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'booking_started', undefined)
  })

  it('logBookingCompleted logs booking_completed', () => {
    initializeAnalytics()
    logBookingCompleted('Standard Cleaning', 100)
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'booking_completed', {
      service_type: 'Standard Cleaning',
      value: 100,
    })
  })

  it('logQuoteCalculated logs quote_calculated', () => {
    initializeAnalytics()
    logQuoteCalculated('Deep Cleaning', 200)
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'quote_calculated', {
      service_type: 'Deep Cleaning',
      value: 200,
    })
  })

  it('logPhoneClicked logs phone_clicked', () => {
    initializeAnalytics()
    logPhoneClicked('navbar')
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'phone_clicked', { location: 'navbar' })
  })

  it('logLanguageToggled logs language_toggled', () => {
    initializeAnalytics()
    logLanguageToggled('fr')
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'language_toggled', { language: 'fr' })
  })
})
