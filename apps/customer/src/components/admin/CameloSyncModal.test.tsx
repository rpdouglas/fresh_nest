import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_POLICY_SETTINGS, type Booking, type PrepareLeadForCameloResult } from '@freshnest/shared'
import { CameloSyncModal } from './CameloSyncModal'
import { LeadDetailPanel } from './LeadDetailPanel'
import * as cameloApi from '@/lib/firebase/camelo'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/firebase/firestore', () => ({
  updateLeadPipeline: vi.fn().mockResolvedValue(undefined),
  addLeadNote: vi.fn().mockResolvedValue(undefined),
  subscribeToLeadNotes: vi.fn(() => () => {}),
}))

vi.mock('@/lib/firebase/camelo', () => ({
  prepareLeadForCamelo: vi.fn(),
  pushLeadToCamelo: vi.fn(),
  addCameloClientNote: vi.fn(),
  updateCameloJobSiteNote: vi.fn(),
}))

vi.mock('./audit/RecordHistory', () => ({
  RecordHistory: () => <div data-testid="record-history" />,
}))

const wonLead: Booking = {
  id: 'won-lead-1',
  firstName: 'Kahnawà:ke',
  lastName: 'Baptiste',
  email: 'kbaptiste@example.com',
  phone: '613-555-0144',
  language: 'en',
  propertyType: '3-4bed',
  bedrooms: 3,
  bathrooms: 2,
  frequency: 'biweekly',
  pets: true,
  address: '45 Island Rd, Cornwall Island, ON',
  serviceType: 'standard',
  addOns: ['oven'],
  preferredDate: '2026-12-08',
  notes: 'Call at bridge if delayed.',
  leadSource: 'referral',
  status: 'confirmed',
  assignedTo: null,
  isAirbnb: false,
  photoConfirmation: false,
  createdAt: new Date('2026-11-24T12:00:00Z'),
  pipeline: {
    stage: 'won',
    ownerEmail: 'lauren@freshnest.ca',
    ownerRole: 'owner',
    needsSiteVisit: false,
    quotedPriceCents: 19500,
  },
}

const basePrepared: PrepareLeadForCameloResult = {
  bookingId: 'won-lead-1',
  alreadySynced: false,
  existingSync: null,
  isDevDryRun: false,
  matches: [],
  clients: [
    {
      id: 'cam-c-existing',
      name: 'Existing Client',
      email: 'existing@example.com',
      phoneNumber: '613-555-0100',
      clientNumber: null,
      billingAddress: null,
    },
  ],
  schedules: [
    { id: 'sch-clients', name: 'Clients' },
    { id: 'sch-internal', name: 'Internal' },
  ],
  defaultScheduleId: 'sch-clients',
  geocode: { found: true, lat: 45.0123, lon: -74.7311, source: 'nominatim' },
  defaults: {
    clientName: 'Kahnawà:ke Baptiste',
    email: 'kbaptiste@example.com',
    phoneNumber: '613-555-0144',
    billingAddress: '45 Island Rd, Cornwall Island, ON',
    jobSiteName: 'Kahnawà:ke Baptiste — 45 Island Rd',
    jobSiteAddress: '45 Island Rd, Cornwall Island, ON',
    jobSiteNote: 'Call at bridge if delayed.\nPets on site (use pet-safe products)',
    clientComment: 'Fresh Nest Sales Pipeline — Won Lead\nService: standard · Frequency: biweekly',
  },
  leadNotes: [
    {
      id: 'ln-1',
      kind: 'call',
      body: 'Confirmed bridge access',
      by: 'lauren@freshnest.ca',
      atIso: '2026-11-24T13:00:00Z',
    },
  ],
}

describe('CameloSyncModal & LeadDetailPanel (P3-E42)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('P12 Lauren: creates new Camelo Client + Job Site + Client comment from review modal', async () => {
    vi.mocked(cameloApi.prepareLeadForCamelo).mockResolvedValue(basePrepared)
    vi.mocked(cameloApi.pushLeadToCamelo).mockResolvedValue({
      ok: true,
      dryRun: false,
      clientId: 'cam-c-new',
      clientName: 'Kahnawà:ke Baptiste',
      clientCreated: true,
      jobSiteId: 'cam-j-new',
      jobSiteName: 'Kahnawà:ke Baptiste — 45 Island Rd',
      jobSiteAddress: '45 Island Rd, Cornwall Island, ON',
      jobSiteNote: 'Call at bridge if delayed.\nPets on site (use pet-safe products)',
      scheduleId: 'sch-clients',
      scheduleName: 'Clients',
      initialCommentId: 'cam-cm-1',
      syncedAtIso: '2026-11-25T22:00:00Z',
      syncedBy: 'lauren@freshnest.ca',
    })

    const onSynced = vi.fn()
    render(<CameloSyncModal lead={wonLead} onClose={vi.fn()} onSynced={onSynced} />)

    await waitFor(() => {
      expect(screen.getByLabelText('admin.pipeline.camelo.clientNameLabel *')).toHaveValue('Kahnawà:ke Baptiste')
    })

    expect(screen.getByLabelText('admin.pipeline.camelo.scheduleLabel *')).toHaveValue('sch-clients')
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.confirmSendButton' }))

    await waitFor(() => {
      expect(cameloApi.pushLeadToCamelo).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'won-lead-1',
          existingClientId: null,
          clientName: 'Kahnawà:ke Baptiste',
          scheduleId: 'sch-clients',
          geoLat: 45.0123,
          geoLong: -74.7311,
          geoSource: 'nominatim',
        }),
      )
    })
    expect(onSynced).toHaveBeenCalledTimes(1)
  })

  it('P16 Ryan: pre-selects matched returning Camelo client to prevent duplicates', async () => {
    vi.mocked(cameloApi.prepareLeadForCamelo).mockResolvedValue({
      ...basePrepared,
      matches: [
        {
          client: basePrepared.clients[0],
          reasons: ['email'],
          score: 100,
        },
      ],
    })
    vi.mocked(cameloApi.pushLeadToCamelo).mockResolvedValue({
      ok: true,
      dryRun: false,
      clientId: 'cam-c-existing',
      clientName: 'Existing Client',
      clientCreated: false,
      jobSiteId: 'cam-j-2',
      jobSiteName: 'Kahnawà:ke Baptiste — 45 Island Rd',
      jobSiteAddress: '45 Island Rd, Cornwall Island, ON',
      jobSiteNote: 'Call at bridge if delayed.',
      scheduleId: 'sch-clients',
      scheduleName: 'Clients',
      initialCommentId: null,
      syncedAtIso: '2026-11-25T22:00:00Z',
      syncedBy: 'ryan@freshnest.ca',
    })

    render(<CameloSyncModal lead={wonLead} onClose={vi.fn()} onSynced={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('admin.pipeline.camelo.matchesFound')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('admin.pipeline.camelo.existingClientLabel')).toHaveValue('cam-c-existing')

    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.confirmSendButton' }))
    await waitFor(() => {
      expect(cameloApi.pushLeadToCamelo).toHaveBeenCalledWith(
        expect.objectContaining({ existingClientId: 'cam-c-existing' }),
      )
    })
  })

  it('P4/P5 rural address: shows fallback pin button when Nominatim misses and allows submission', async () => {
    vi.mocked(cameloApi.prepareLeadForCamelo).mockResolvedValue({
      ...basePrepared,
      geocode: { found: false, lat: null, lon: null, source: null },
    })
    vi.mocked(cameloApi.pushLeadToCamelo).mockResolvedValue({
      ok: true,
      dryRun: false,
      clientId: 'cam-c-new',
      clientName: 'Kahnawà:ke Baptiste',
      clientCreated: true,
      jobSiteId: 'cam-j-rural',
      jobSiteName: 'Kahnawà:ke Baptiste — 45 Island Rd',
      jobSiteAddress: '45 Island Rd, Cornwall Island, ON',
      jobSiteNote: null,
      scheduleId: 'sch-clients',
      scheduleName: 'Clients',
      initialCommentId: null,
      syncedAtIso: '2026-11-25T22:00:00Z',
      syncedBy: 'lauren@freshnest.ca',
    })

    render(<CameloSyncModal lead={wonLead} onClose={vi.fn()} onSynced={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'admin.pipeline.camelo.useFallbackPin' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.useFallbackPin' }))
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.confirmSendButton' }))

    await waitFor(() => {
      expect(cameloApi.pushLeadToCamelo).toHaveBeenCalledWith(
        expect.objectContaining({
          geoLat: 45.0213,
          geoLong: -74.7303,
          geoSource: 'fallback',
        }),
      )
    })
  })

  it('LeadDetailPanel: shows synced Camelo card and supports post-sync site note update & client comment', async () => {
    vi.mocked(cameloApi.updateCameloJobSiteNote).mockResolvedValue({
      ok: true,
      dryRun: false,
      jobSiteId: 'cam-j-1',
      note: 'Updated lockbox 7777',
      syncedAtIso: '2026-11-25T22:05:00Z',
    })
    vi.mocked(cameloApi.addCameloClientNote).mockResolvedValue({
      ok: true,
      dryRun: false,
      commentId: 'cam-cm-2',
      syncedAtIso: '2026-11-25T22:06:00Z',
    })

    const syncedLead: Booking = {
      ...wonLead,
      camelo: {
        clientId: 'cam-c-1',
        clientName: 'Kahnawà:ke Baptiste',
        clientCreated: true,
        jobSiteId: 'cam-j-1',
        jobSiteName: 'Kahnawà:ke Baptiste — 45 Island Rd',
        jobSiteAddress: '45 Island Rd, Cornwall Island, ON',
        jobSiteNote: 'Initial site note',
        scheduleId: 'sch-clients',
        scheduleName: 'Clients',
        geoLat: 45.01,
        geoLong: -74.73,
        geoSource: 'nominatim',
        initialCommentId: 'cam-cm-1',
        syncedAt: new Date('2026-11-25T22:00:00Z'),
        syncedBy: 'lauren@freshnest.ca',
      },
    }

    render(
      <LeadDetailPanel
        lead={syncedLead}
        owners={[]}
        policy={DEFAULT_POLICY_SETTINGS}
        onClose={vi.fn()}
        onCreateAgreement={vi.fn()}
      />,
    )

    expect(screen.getByText('admin.pipeline.camelo.syncedHeading')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'admin.pipeline.camelo.sendButton' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('admin.pipeline.camelo.postSiteNoteLabel'), {
      target: { value: 'Updated lockbox 7777' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.updateSiteNoteButton' }))
    await waitFor(() => {
      expect(cameloApi.updateCameloJobSiteNote).toHaveBeenCalledWith({
        bookingId: 'won-lead-1',
        note: 'Updated lockbox 7777',
      })
    })

    fireEvent.change(screen.getByLabelText('admin.pipeline.camelo.postClientNoteLabel'), {
      target: { value: 'Prefers Friday mornings' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'admin.pipeline.camelo.addClientNoteButton' }))
    await waitFor(() => {
      expect(cameloApi.addCameloClientNote).toHaveBeenCalledWith({
        bookingId: 'won-lead-1',
        content: 'Prefers Friday mornings',
      })
    })
  })
})
