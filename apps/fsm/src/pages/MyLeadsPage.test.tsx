import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StaffLeadDetail, StaffLeadSummary } from '@freshnest/shared'
import { MyLeadsPage } from './MyLeadsPage'
import { LeadPage } from './LeadPage'
import * as leadsApi from '../lib/firebase/leads'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

vi.mock('../hooks/useStaffAuth', () => ({
  useStaffAuth: () => ({
    staffProfile: {
      uid: 'brenda-uid',
      email: 'brenda@freshnest.ca',
      role: 'lead',
      firstName: 'Brenda',
      lastName: 'Côté',
    },
  }),
}))

vi.mock('../lib/firebase/leads', () => ({
  listMyLeads: vi.fn(),
  getMyLead: vi.fn(),
  updateMyLead: vi.fn(),
  addMyLeadNote: vi.fn(),
}))

const sampleLead: StaffLeadSummary = {
  bookingId: 'lead-1',
  firstName: 'Diane',
  lastName: 'Lafleur',
  phone: '613-555-0142',
  email: 'diane@example.com',
  language: 'fr',
  serviceType: 'standard',
  frequency: 'biweekly',
  propertyType: '3-4bed',
  bedrooms: 3,
  bathrooms: 2,
  preferredDate: '2026-12-01',
  locationDisplay: 'Cornwall, ON K6H',
  hasFullAddress: false,
  notes: 'Sonner',
  isAirbnb: false,
  createdAtIso: '2026-11-23T14:00:00.000Z',
  pipeline: {
    stage: 'new',
    ownerEmail: 'brenda@freshnest.ca',
    ownerRole: 'lead',
    needsSiteVisit: false,
    nextFollowUpDate: '2026-11-24',
    firstContactAtIso: null,
    quotedPriceCents: null,
    quoteSentAtIso: null,
    closedAtIso: null,
    lostReason: null,
    lostNote: null,
  },
}

const sampleDetail: StaffLeadDetail = {
  ...sampleLead,
  leadNotes: [],
}

describe('FSM MyLeadsPage & LeadPage (P3-E40)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(leadsApi.listMyLeads).mockResolvedValue({ leads: [sampleLead], openCount: 1 })
    vi.mocked(leadsApi.getMyLead).mockResolvedValue(sampleDetail)
    vi.mocked(leadsApi.updateMyLead).mockResolvedValue({
      ...sampleLead,
      pipeline: { ...sampleLead.pipeline, stage: 'quoted', quotedPriceCents: 15000 },
    })
    vi.mocked(leadsApi.addMyLeadNote).mockResolvedValue({
      id: 'n-1',
      kind: 'call',
      body: 'Appel complété',
      by: 'brenda@freshnest.ca',
      atIso: '2026-11-23T15:00:00.000Z',
    })
  })

  it('renders assigned leads with minimized area and tappable call link', async () => {
    render(
      <MemoryRouter initialEntries={['/leads']}>
        <Routes>
          <Route path="/leads" element={<MyLeadsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Diane Lafleur')).toBeInTheDocument()
    expect(screen.getByText('Cornwall, ON K6H')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'fsm.myLeads.callClient' })).toHaveAttribute('href', 'tel:613-555-0142')
  })

  it('updates stage & quote (without exposing Won) and logs contact notes in LeadPage', async () => {
    render(
      <MemoryRouter initialEntries={['/leads/lead-1']}>
        <Routes>
          <Route path="/leads/:id" element={<LeadPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Diane Lafleur')).toBeInTheDocument()
    const stageSelect = screen.getByLabelText('fsm.myLeads.stageLabel')
    expect(screen.queryByRole('option', { name: 'fsm.myLeads.stages.won' })).not.toBeInTheDocument()

    fireEvent.change(stageSelect, { target: { value: 'quoted' } })
    fireEvent.change(screen.getByLabelText('fsm.myLeads.quotedPriceLabel'), { target: { value: '150.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'fsm.myLeads.saveButton' }))

    await waitFor(() => {
      expect(leadsApi.updateMyLead).toHaveBeenCalledTimes(1)
    })
    const updateCall = vi.mocked(leadsApi.updateMyLead).mock.calls[0]?.[0]
    expect(updateCall?.bookingId).toBe('lead-1')
    expect(updateCall?.stage).toBe('quoted')
    expect(updateCall?.quotedPriceCents).toBe(15000)

    fireEvent.change(screen.getByLabelText('fsm.myLeads.noteBodyLabel'), {
      target: { value: 'Appel complété' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'fsm.myLeads.addNoteButton' }))

    await waitFor(() => {
      expect(leadsApi.addMyLeadNote).toHaveBeenCalledWith('lead-1', 'call', 'Appel complété')
    })
    expect(await screen.findByText('Appel complété')).toBeInTheDocument()
  })
})
