import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_POLICY_SETTINGS } from '@freshnest/shared'
import { SettingsTab } from './SettingsTab'
import type { UsePolicySettingsResult } from './hooks/usePolicySettings'

const mockSaveSettings = vi.fn()
const mockUsePolicySettings = vi.fn<(...args: unknown[]) => UsePolicySettingsResult>()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'version' in opts ? `${key}:v${String(opts.version)}` : key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('./hooks/usePolicySettings', () => ({
  usePolicySettings: (...args: unknown[]) => mockUsePolicySettings(...args),
}))

describe('SettingsTab (P3-E36 / W0-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveSettings.mockResolvedValue({ version: 2, changesCount: 1 })
    mockUsePolicySettings.mockReturnValue({
      policy: DEFAULT_POLICY_SETTINGS,
      version: 1,
      updatedAt: new Date('2026-10-27T15:00:00Z'),
      updatedBy: 'freshnestcompany2023@gmail.com',
      lastChangeReason: 'Initial baseline',
      history: [
        {
          version: 1,
          changedAt: new Date('2026-10-27T15:00:00Z'),
          changedBy: 'freshnestcompany2023@gmail.com',
          reason: 'Initial baseline',
          changes: [{ field: 'defaultVehicleBufferMinutes', oldValue: 30, newValue: 45 }],
          snapshot: { ...DEFAULT_POLICY_SETTINGS, defaultVehicleBufferMinutes: 45 },
        },
      ],
      loading: false,
      error: null,
      saveSettings: mockSaveSettings,
    })
  })

  it('renders in read-only mode for Managers with all inputs disabled and no Save button', () => {
    render(<SettingsTab isAuthorized={true} isOwner={false} />)

    expect(screen.getByRole('status')).toHaveTextContent('admin.settings.readOnlyBanner')
    expect(screen.queryByRole('button', { name: 'admin.settings.saveButton' })).not.toBeInTheDocument()

    const vehicleBufferInput = screen.getByLabelText(
      'admin.settings.fields.defaultVehicleBufferMinutes.label',
    )
    expect(vehicleBufferInput).toBeDisabled()

    // Version history is visible to Managers
    expect(screen.getByText(/freshnestcompany2023@gmail\.com/)).toBeInTheDocument()
    expect(screen.getAllByText(/Initial baseline/).length).toBeGreaterThanOrEqual(1)
  })

  it('allows an Owner to edit policy settings, enter a reason, and save a new version', async () => {
    render(<SettingsTab isAuthorized={true} isOwner={true} />)

    expect(screen.queryByText('admin.settings.readOnlyBanner')).not.toBeInTheDocument()

    const vehicleBufferInput = screen.getByLabelText(
      'admin.settings.fields.defaultVehicleBufferMinutes.label',
    )
    expect(vehicleBufferInput).not.toBeDisabled()

    fireEvent.change(vehicleBufferInput, { target: { value: '45' } })

    const reasonInput = screen.getByLabelText('admin.settings.reasonLabel')
    fireEvent.change(reasonInput, { target: { value: 'Winter roads in Cornwall' } })

    const saveBtn = screen.getByRole('button', { name: 'admin.settings.saveButton' })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultVehicleBufferMinutes: 45,
          defaultTransitBufferMinutes: 60,
        }),
        'Winter roads in Cornwall',
      )
    })

    expect(await screen.findByText('admin.settings.saveSuccess:v2')).toBeInTheDocument()
  })
})
