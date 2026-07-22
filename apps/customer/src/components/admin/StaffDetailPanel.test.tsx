import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { StaffDetailPanel } from './StaffDetailPanel'
import type { Staff } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; name?: string }) => options?.defaultValue ?? options?.name ?? key,
    i18n: { language: 'en' },
  }),
}))

function renderPanel(staff: Staff, overrides: Partial<Parameters<typeof StaffDetailPanel>[0]> = {}) {
  const props = {
    staff,
    updateBackgroundCheckStatus: vi.fn().mockResolvedValue({ success: true }),
    updateChecklistItem: vi.fn().mockResolvedValue(undefined),
    activateEmployee: vi.fn().mockResolvedValue(undefined),
    onResendInvite: vi.fn(),
    onExport: vi.fn(),
    resendingId: null,
    ...overrides,
  }
  return {
    ...render(
      <table>
        <tbody>
          <StaffDetailPanel {...props} />
        </tbody>
      </table>
    ),
    props,
  }
}

const baseStaff: Staff = {
  id: 'staff123',
  firstName: 'Jasmine',
  lastName: 'Beausoleil',
  email: 'jasmine@freshnest.ca',
  phone: '6135559999',
  role: 'cleaner',
  status: 'onboarding',
  preferences: { language: 'en' },
  constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 60, blockedWindows: [] },
  financials: { monthlyEarningsLimit: null, currentMonthEarnings: 0, earningsHistory: [] },
  compliance: { acceptedTermsVersion: '2.1', termsHistory: [] },
  onboardingChecklist: {},
  backgroundCheck: { consentGiven: true, consentGivenAt: new Date(), consentIpAddress: '1.2.3.4', status: 'not_started', completedAt: null },
  employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Jasmine Beausoleil', ipAddress: '1.2.3.4' },
  emergencyContact: { name: 'Sam', phone: '6135551111', relationship: 'Sibling' },
  corrections: [],
  createdAt: new Date(),
}

describe('StaffDetailPanel (P3-E27-D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows read-only checklist items as complete/incomplete based on staff data', () => {
    renderPanel(baseStaff)
    // employmentAgreement is set -> Complete; module4Whmis/platformTrainingCompleted absent -> Incomplete
    const completeBadges = screen.getAllByText('Complete')
    const incompleteBadges = screen.getAllByText('Incomplete')
    expect(completeBadges.length).toBeGreaterThan(0)
    expect(incompleteBadges.length).toBeGreaterThan(0)
  })

  it('toggles an admin checklist item and calls updateChecklistItem with the flipped value', async () => {
    const { props } = renderPanel(baseStaff)

    // All four admin toggles render "Mark Complete" when unset; idVerified is first in DOM order.
    const [idVerifiedBtn] = screen.getAllByText('Mark Complete')
    await act(async () => {
      fireEvent.click(idVerifiedBtn)
      await Promise.resolve()
    })

    expect(props.updateChecklistItem).toHaveBeenCalledWith('staff123', 'idVerified', true)
  })

  it('disables Activate Employee until all four conditions are met', () => {
    renderPanel(baseStaff) // backgroundCheck not cleared, idVerified false, training incomplete
    const activateBtn = screen.getByRole('button', { name: 'Activate Employee' })
    expect(activateBtn).toBeDisabled()
  })

  it('enables Activate Employee once background check, ID, agreement, and training are all complete', async () => {
    const qualifiedStaff: Staff = {
      ...baseStaff,
      backgroundCheck: { ...baseStaff.backgroundCheck, status: 'cleared' },
      onboardingChecklist: { idVerified: true, platformTrainingCompleted: true },
    }
    const { props } = renderPanel(qualifiedStaff)

    const activateBtn = screen.getByRole('button', { name: 'Activate Employee' })
    expect(activateBtn).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(activateBtn)
      await Promise.resolve()
    })

    expect(props.activateEmployee).toHaveBeenCalledWith('staff123')
  })

  it('opens the relocated background-check editor and saves via updateBackgroundCheckStatus', async () => {
    const { props } = renderPanel(baseStaff)

    fireEvent.click(screen.getByText('Update'))
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: 'cleared' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Save'))
      await Promise.resolve()
    })

    expect(props.updateBackgroundCheckStatus).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'staff123', status: 'cleared' })
    )
  })

  it('calls onResendInvite and onExport from Quick Actions', () => {
    const { props } = renderPanel(baseStaff)

    fireEvent.click(screen.getByText('Resend Invite'))
    expect(props.onResendInvite).toHaveBeenCalledWith('staff123')

    fireEvent.click(screen.getByText('Export'))
    expect(props.onExport).toHaveBeenCalledWith(baseStaff)
  })
})
