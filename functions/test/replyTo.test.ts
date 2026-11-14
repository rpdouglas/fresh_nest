import { describe, it, expect, vi, beforeEach } from 'vitest'

// Replies to noreply@ bounce, so client and staff emails carry a Reply-To (human decision 2026-11-14).
const send = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

import {
  sendClientConfirmation,
  sendOwnerNotification,
  sendReviewRequestEmail,
  sendWelcomeEmail,
  type EmailConfig,
} from '../src/sendEmail'
import type { BookingData } from '../src/emailTemplates'

const config: EmailConfig = {
  resendApiKey: 're_test',
  fromEmail: 'Fresh Nest Co. <noreply@freshnestco.ca>',
  ownerEmail: 'a@example.com,b@example.com',
  replyTo: 'hr.freshnest@gmail.com',
}

const booking = {
  firstName: 'Diane',
  lastName: 'Lafleur',
  email: 'diane@example.com',
  phone: '6135550100',
  language: 'fr',
  serviceType: 'standard',
  preferredDate: '2026-10-15',
} as BookingData

describe('Reply-To on outgoing email', () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: 'x' }, error: null })
  })

  it('client confirmation replies go to the office inbox', async () => {
    await sendClientConfirmation(booking, config)
    expect(send.mock.calls[0][0]).toMatchObject({ to: 'diane@example.com', replyTo: 'hr.freshnest@gmail.com' })
  })

  it('review request and staff welcome emails carry the Reply-To', async () => {
    await sendReviewRequestEmail('Diane', 'diane@example.com', 'https://example.com/r', 'fr', config)
    await sendWelcomeEmail('Brenda', 'brenda@example.com', 'https://example.com/m', 'fr', config)
    expect(send.mock.calls[0][0].replyTo).toBe('hr.freshnest@gmail.com')
    expect(send.mock.calls[1][0].replyTo).toBe('hr.freshnest@gmail.com')
  })

  it('owner alert goes to every OWNER_EMAIL address and sets no Reply-To', async () => {
    await sendOwnerNotification(booking, 'abcd1234', config)
    expect(send.mock.calls[0][0].to).toEqual(['a@example.com', 'b@example.com'])
    expect(send.mock.calls[0][0].replyTo).toBeUndefined()
  })
})
