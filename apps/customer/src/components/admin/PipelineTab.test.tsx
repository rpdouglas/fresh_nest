import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_POLICY_SETTINGS, type Booking } from '@freshnest/shared'
import { PipelineTab } from './PipelineTab'
import * as firestoreApi from '@/lib/firebase/firestore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/firebase/firestore', () => ({
  updateLeadPipeline: vi.fn().mockResolvedValue(undefined),
  addLeadNote: vi.fn().mockResolvedValue(undefined),
  subscribeToLeadNotes: vi.fn(() => () => {}),
}))

vi.mock('@/lib/firebase/agreements', () => ({
  createClientAgreement: vi.fn(),
}))

vi.mock('./hooks/usePolicySettings', () => ({
  usePolicySettings: () => ({ policy: DEFAULT_POLICY_SETTINGS }),
}))

vi.mock('./hooks/useAssignableOwners', () => ({
  useAssignableOwners: () => ({
    loading: false,
    owners: [
      { email: 'lauren@freshnest.ca', displayName: 'Lauren Arsenault', role: 'owner', phone: '613-555-0100', language: 'en' },
      { email: 'ryan@freshnest.ca', displayName: 'Ryan Manager', role: 'manager', phone: '613-555-0101', language: 'en' },
      { email: 'brenda@freshnest.ca', displayName: 'Brenda Côté', role: 'lead', phone: '613-555-0102', language: 'fr' },
    ],
  }),
}))

const mockLeads: Booking[] = [
  {
    id: 'lead-1',
    firstName: 'Travis',
    lastName: 'McLeod',
    email: 'travis@example.com',
    phone: '613-555-0199',
    language: 'en',
    propertyType: '3-4bed',
    bedrooms: 3,
    bathrooms: 2,
    frequency: 'biweekly',
    pets: false,
    address: '123 Pitt St, Cornwall, ON',
    serviceType: 'standard',
    addOns: [],
    preferredDate: '2026-12-02',
    leadSource: 'google',
    status: 'pending',
    assignedTo: null,
    isAirbnb: false,
    photoConfirmation: false,
    createdAt: new Date('2026-11-23T10:00:00.000Z'),
    pipeline: {
      stage: 'new',
      ownerEmail: 'lauren@freshnest.ca',
      ownerRole: 'owner',
      needsSiteVisit: false,
    },
  },
]

vi.mock('./hooks/usePipeline', () => ({
  usePipeline: () => ({
    leads: mockLeads,
    allLeads: mockLeads,
    counts: { myOpen: 1, unassignedOpen: 0, allOpen: 1 },
    loading: false,
    error: null,
    ownerFilter: 'my',
    setOwnerFilter: vi.fn(),
    stageFilter: 'open',
    setStageFilter: vi.fn(),
    airbnbOnly: false,
    setAirbnbOnly: vi.fn(),
    siteVisitOnly: false,
    setSiteVisitOnly: vi.fn(),
    search: '',
    setSearch: vi.fn(),
  }),
}))

vi.mock('./audit/RecordHistory', () => ({
  RecordHistory: () => <div data-testid="record-history" />,
}))

describe('PipelineTab (P3-E40)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Priority List and lets Lauren reassign a lead to Ryan in 2 clicks', async () => {
    render(<PipelineTab isAuthorized adminEmail="lauren@freshnest.ca" bookings={mockLeads} />)

    expect(screen.getByText('Travis McLeod')).toBeInTheDocument()
    const reassignSelect = screen.getByLabelText('admin.pipeline.table.reassignAria')
    expect(reassignSelect).toHaveValue('lauren@freshnest.ca')

    fireEvent.change(reassignSelect, { target: { value: 'ryan@freshnest.ca' } })

    await waitFor(() => {
      expect(firestoreApi.updateLeadPipeline).toHaveBeenCalledWith(
        'lead-1',
        { ownerEmail: 'ryan@freshnest.ca', ownerRole: 'manager' },
        mockLeads[0],
        'Reassigned to ryan@freshnest.ca',
      )
    })
  })

  it('switches to Board View with keyboard-accessible stage dropdown', async () => {
    render(<PipelineTab isAuthorized adminEmail="lauren@freshnest.ca" bookings={mockLeads} />)

    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.viewModes.board' }))
    const stageSelect = screen.getByLabelText('admin.pipeline.detail.stageLabel')
    fireEvent.change(stageSelect, { target: { value: 'contacted' } })

    await waitFor(() => {
      expect(firestoreApi.updateLeadPipeline).toHaveBeenCalledWith(
        'lead-1',
        { stage: 'contacted' },
        mockLeads[0],
      )
    })
  })

  it('opens LeadDetailPanel and requires lostReason before saving Lost', async () => {
    render(<PipelineTab isAuthorized adminEmail="lauren@freshnest.ca" bookings={mockLeads} />)

    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.actions.open' }))
    fireEvent.change(screen.getByLabelText('admin.pipeline.detail.stageLabel'), {
      target: { value: 'lost' },
    })

    const lostReasonSelect = screen.getByLabelText('admin.pipeline.detail.lostReasonLabel *')
    expect(lostReasonSelect).toBeInTheDocument()
    fireEvent.change(lostReasonSelect, { target: { value: 'price' } })
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.detail.saveButton' }))

    await waitFor(() => {
      expect(firestoreApi.updateLeadPipeline).toHaveBeenCalledTimes(1)
    })
    const call = vi.mocked(firestoreApi.updateLeadPipeline).mock.calls[0]
    expect(call?.[0]).toBe('lead-1')
    expect(call?.[1].stage).toBe('lost')
    expect(call?.[1].lostReason).toBe('price')
  })
})
