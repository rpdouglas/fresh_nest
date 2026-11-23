import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_POLICY_SETTINGS, type Booking } from '@freshnest/shared'
import { NewAgreementModal } from './NewAgreementModal'
import * as agreementsApi from '@/lib/firebase/agreements'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/lib/firebase/agreements', () => ({
  createClientAgreement: vi.fn(),
}))

const sampleBooking: Booking = {
  id: 'bk-1',
  firstName: 'Diane',
  lastName: 'Lafleur',
  email: 'diane@example.com',
  phone: '613-555-0142',
  language: 'fr',
  propertyType: '3-4bed',
  bedrooms: 3,
  bathrooms: 2,
  estimatedPriceCents: 18000,
  frequency: 'biweekly',
  pets: false,
  address: '12 rue Riverdale, Cornwall ON',
  serviceType: 'standard',
  addOns: [],
  preferredDate: '2026-12-01',
  leadSource: 'phone',
  status: 'confirmed',
  assignedTo: null,
  isAirbnb: false,
  photoConfirmation: false,
  createdAt: new Date(),
}

function renderModal(bookings: Booking[] = [sampleBooking]) {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(
    <NewAgreementModal
      open
      onClose={onClose}
      onCreated={onCreated}
      bookings={bookings}
      policy={DEFAULT_POLICY_SETTINGS}
    />,
  )
  return { onClose, onCreated }
}

describe('NewAgreementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(agreementsApi.createClientAgreement).mockResolvedValue({
      agreementId: 'agr-1',
      signingUrl: 'https://www.freshnestco.ca/agreement/test-token',
      expiresAtIso: '2026-12-23T00:00:00.000Z',
      emailSent: false,
    })
  })

  it('defaults to hourly at $75.00/hr with biweekly frequency', () => {
    renderModal()

    expect(screen.getByLabelText('admin.agreements.modal.typeLabel')).toHaveValue('residential')
    expect(screen.getByLabelText('admin.agreements.modal.frequencyLabel')).toHaveValue('biweekly')
    expect(screen.getByLabelText('admin.agreements.modal.rateTypeLabel')).toHaveValue('hourly')
    expect(screen.getByLabelText('admin.agreements.modal.rateDollarsLabel *')).toHaveValue(75)
  })

  it('keeps hourly at $75.00/hr when switching agreement type to commercial', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('admin.agreements.modal.typeLabel'), {
      target: { value: 'commercial' },
    })

    expect(screen.getByLabelText('admin.agreements.modal.serviceTypeLabel')).toHaveValue('commercial')
    expect(screen.getByLabelText('admin.agreements.modal.rateTypeLabel')).toHaveValue('hourly')
    expect(screen.getByLabelText('admin.agreements.modal.rateDollarsLabel *')).toHaveValue(75)
  })

  it('keeps hourly at $75.00/hr when prefilling from a booking with estimatedPriceCents', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('admin.agreements.modal.prefillBookingLabel'), {
      target: { value: 'bk-1' },
    })

    expect(screen.getByLabelText('admin.agreements.modal.clientNameLabel *')).toHaveValue('Diane Lafleur')
    expect(screen.getByLabelText('admin.agreements.modal.languageLabel')).toHaveValue('fr')
    expect(screen.getByLabelText('admin.agreements.modal.rateTypeLabel')).toHaveValue('hourly')
    expect(screen.getByLabelText('admin.agreements.modal.rateDollarsLabel *')).toHaveValue(75)
  })

  it('leaves the agreed rate value untouched when switching rate basis', () => {
    renderModal()

    const rateTypeSelect = screen.getByLabelText('admin.agreements.modal.rateTypeLabel')
    const rateInput = screen.getByLabelText('admin.agreements.modal.rateDollarsLabel *')

    fireEvent.change(rateTypeSelect, { target: { value: 'flat' } })
    expect(rateTypeSelect).toHaveValue('flat')
    expect(rateInput).toHaveValue(75)

    fireEvent.change(rateTypeSelect, { target: { value: 'monthly' } })
    expect(rateTypeSelect).toHaveValue('monthly')
    expect(rateInput).toHaveValue(75)
  })

  it('submits hourly and 7500 cents by default', async () => {
    const { onCreated } = renderModal()

    fireEvent.change(screen.getByLabelText('admin.agreements.modal.prefillBookingLabel'), {
      target: { value: 'bk-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'admin.agreements.modal.createButton' }))

    await waitFor(() => {
      expect(agreementsApi.createClientAgreement).toHaveBeenCalledTimes(1)
    })

    const payload = vi.mocked(agreementsApi.createClientAgreement).mock.calls[0]?.[0]
    expect(payload?.party.bookingId).toBe('bk-1')
    expect(payload?.party.name).toBe('Diane Lafleur')
    expect(payload?.terms.rateType).toBe('hourly')
    expect(payload?.terms.rateCents).toBe(7500)
    expect(payload?.terms.frequency).toBe('biweekly')
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it('allows overriding rate basis and amount before submitting', async () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('admin.agreements.modal.prefillBookingLabel'), {
      target: { value: 'bk-1' },
    })
    fireEvent.change(screen.getByLabelText('admin.agreements.modal.rateTypeLabel'), {
      target: { value: 'flat' },
    })
    fireEvent.change(screen.getByLabelText('admin.agreements.modal.rateDollarsLabel *'), {
      target: { value: '210.50' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'admin.agreements.modal.createButton' }))

    await waitFor(() => {
      expect(agreementsApi.createClientAgreement).toHaveBeenCalledTimes(1)
    })

    const payload = vi.mocked(agreementsApi.createClientAgreement).mock.calls[0]?.[0]
    expect(payload?.terms.rateType).toBe('flat')
    expect(payload?.terms.rateCents).toBe(21050)
  })
})
