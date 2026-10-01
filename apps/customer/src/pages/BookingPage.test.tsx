import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const submitBookingMock = vi.fn((..._args: unknown[]) => Promise.resolve('booking-123'))

vi.mock('@/lib/firebase/firestore', () => ({
  submitBooking: (...args: unknown[]) => submitBookingMock(...args),
  detectLeadSource: () => 'organic',
}))
vi.mock('@/lib/firebase/analytics', () => ({
  logBookingStarted: vi.fn(),
  logBookingCompleted: vi.fn(),
}))
vi.mock('@/components/seo/SEO', () => ({ default: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

const { default: BookingPage } = await import('./BookingPage')

async function fillToStepFour(user: ReturnType<typeof userEvent.setup>) {
  // Step 1 — defaults are valid
  await user.click(screen.getByRole('button', { name: 'booking.next' }))
  // Step 2
  const date = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  await user.type(await screen.findByLabelText(/booking.fields.preferredDate.label/), date)
  await user.click(screen.getByRole('button', { name: 'booking.next' }))
  // Step 3
  await user.type(await screen.findByLabelText(/booking.fields.firstName.label/), 'Margaret')
  await user.type(screen.getByLabelText(/booking.fields.lastName.label/), 'Storey')
  await user.type(screen.getByLabelText(/booking.fields.email.label/), 'margaret@example.com')
  await user.type(screen.getByLabelText(/booking.fields.phone.label/), '6135550199')
  await user.type(screen.getByLabelText(/booking.fields.address.label/), '123 Pitt St, Cornwall ON')
  const step3Next = screen.getByRole('button', { name: 'booking.next' })
  await user.click(step3Next)
  return step3Next
}

describe('BookingPage — quote request flow (P3-E29)', () => {
  beforeEach(() => submitBookingMock.mockClear())

  // Regression: React reused the Next <button> and flipped it to type="submit" mid-click,
  // so "Next" on step 3 submitted the request and skipped Review + CASL consent.
  it('shows the Review step after step 3 without submitting', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><BookingPage /></MemoryRouter>)

    const step3Next = await fillToStepFour(user)

    expect(await screen.findByText('booking.step4Title')).toBeInTheDocument()
    // The clicked "Next" must never become the submit button. In a real browser a button whose
    // type flips to "submit" during its own click submits the form (jsdom does not emulate that).
    expect(step3Next.getAttribute('type')).toBe('button')
    expect(screen.getByRole('button', { name: 'booking.submit' })).not.toBe(step3Next)
    expect(screen.getByLabelText('booking.fields.marketingConsent.label')).toBeInTheDocument()
    expect(submitBookingMock).not.toHaveBeenCalled()
  })

  it('submits once, only when "Send Quote Request" is clicked', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><BookingPage /></MemoryRouter>)

    await fillToStepFour(user)
    await screen.findByText('booking.step4Title')
    await user.click(screen.getByRole('button', { name: 'booking.submit' }))

    await waitFor(() => expect(submitBookingMock).toHaveBeenCalledTimes(1))
    expect(submitBookingMock.mock.calls[0]?.[1]).toBe('en')
  })
})
