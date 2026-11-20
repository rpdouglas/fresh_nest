import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '@/i18n'
import type { PublicAgreementView } from '@freshnest/shared'
import type { SignAgreementPayload, SignAgreementResult } from '@/lib/firebase/agreements'

const fetchAgreementMock = vi.fn<(token: string) => Promise<PublicAgreementView>>()
const submitAgreementMock = vi.fn<(payload: SignAgreementPayload) => Promise<SignAgreementResult>>()

vi.mock('@/lib/firebase/agreements', () => ({
  fetchAgreementForSigning: (token: string) => fetchAgreementMock(token),
  submitSignedAgreement: (payload: SignAgreementPayload) => submitAgreementMock(payload),
}))
vi.mock('@/components/seo/SEO', () => ({ default: () => null }))

const { default: AgreementPage } = await import('./AgreementPage')

const SAMPLE_EN_AGREEMENT: PublicAgreementView = {
  agreementId: 'agr-1',
  type: 'residential',
  language: 'en',
  status: 'sent',
  party: {
    name: 'Margaret Storey',
    email: 'margaret@example.com',
    phone: '613-555-0144',
    address: '45 Pitt St, Cornwall ON',
  },
  terms: {
    serviceType: 'standard',
    frequency: 'biweekly',
    startDate: '2026-12-01',
    rateType: 'flat',
    rateCents: 18000,
    taxExempt: false,
    cancelWindowHours: 24,
    lateCancellationFeeCents: 5000,
    lockoutFeeCents: 3500,
    latePaymentBasisPoints: 200,
    noticePeriodDays: 14,
  },
  templateName: 'Residential Service Agreement',
  versionId: 'v1',
  versionLabel: 'v1',
  bodyEn: '# Master Terms\n\n## Scope\n- Eco cleaning for Margaret Storey',
  bodyFr: '# Conditions générales\n\n## Portée\n- Entretien écologique pour Margaret Storey',
  signedAtIso: null,
  signedName: null,
}

function renderAgreementRoute(token = 'a'.repeat(43)) {
  return render(
    <MemoryRouter initialEntries={[`/agreement/${token}`]}>
      <Routes>
        <Route path="/agreement/:token" element={<AgreementPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AgreementPage (P3-E39)', () => {
  beforeEach(async () => {
    fetchAgreementMock.mockReset()
    submitAgreementMock.mockReset()
    await i18n.changeLanguage('en')
    window.scrollTo = vi.fn()
  })

  it('shows the neutral invalid-link panel with tappable phone number when token is refused', async () => {
    fetchAgreementMock.mockRejectedValue({ code: 'functions/not-found', message: 'Invalid' })
    renderAgreementRoute('bad-token')

    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument()
    const phoneLinks = screen.getAllByRole('link', { name: /\(613\) 861-8812/ })
    expect(phoneLinks.length).toBeGreaterThanOrEqual(1)
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+16138618812')
  })

  it('requires all three signing controls before submitting, then transitions to Signed thank-you', async () => {
    fetchAgreementMock.mockResolvedValue(SAMPLE_EN_AGREEMENT)
    submitAgreementMock.mockResolvedValue({
      ok: true,
      alreadySigned: false,
      agreementId: 'agr-1',
      signedAtIso: '2026-11-20T22:30:00.000Z',
    })

    const user = userEvent.setup()
    renderAgreementRoute()

    expect(await screen.findByRole('heading', { name: 'Residential Service Agreement' })).toBeInTheDocument()
    expect(screen.getByText(/45 Pitt St, Cornwall ON/)).toBeInTheDocument()

    // Try submitting without ticking consents or typing name
    await user.click(screen.getByRole('button', { name: 'Sign Agreement' }))
    expect(await screen.findByText(/confirm your consent to sign electronically/i)).toBeInTheDocument()
    expect(screen.getByText(/read and agree to the agreement terms/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    expect(submitAgreementMock).not.toHaveBeenCalled()

    // Choose door code entry and fill restricted access code
    await user.selectOptions(screen.getByLabelText(/How should our team enter/i), 'door_code')
    await user.type(await screen.findByLabelText(/Door \/ Keypad Code/i), '9876#')

    // Tick both consents & type full name
    await user.click(screen.getByLabelText(/I agree to sign this agreement electronically/i))
    await user.click(screen.getByLabelText(/I have read and agree to the service details/i))
    await user.type(screen.getByLabelText(/Type your full name/i), 'Margaret Storey')

    await user.click(screen.getByRole('button', { name: 'Sign Agreement' }))

    await waitFor(() => expect(submitAgreementMock).toHaveBeenCalledTimes(1))
    expect(submitAgreementMock.mock.calls[0][0].access.doorCode).toBe('9876#')
    expect(submitAgreementMock.mock.calls[0][0].signedName).toBe('Margaret Storey')

    expect(await screen.findByRole('heading', { name: /Signed — thank you!/i })).toBeInTheDocument()
  })

  it('opens a French agreement directly in French (P1 Diane / P5 Sophie)', async () => {
    fetchAgreementMock.mockResolvedValue({
      ...SAMPLE_EN_AGREEMENT,
      language: 'fr',
      party: { ...SAMPLE_EN_AGREEMENT.party, name: 'Sophie Tremblay-Gagnon' },
    })

    renderAgreementRoute()

    expect(
      await screen.findByRole('heading', { name: 'Contrat de services résidentiels' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Loi 25 du Québec/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Signer le contrat' })).toBeInTheDocument()
  })
})
