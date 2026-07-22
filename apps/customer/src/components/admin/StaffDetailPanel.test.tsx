import { render, screen, fireEvent, act, within } from '@testing-library/react'
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
    adminEmail: 'lauren@freshnestco.ca',
    updateBackgroundCheckStatus: vi.fn().mockResolvedValue({ success: true }),
    updateChecklistItem: vi.fn().mockResolvedValue(undefined),
    activateEmployee: vi.fn().mockResolvedValue(undefined),
    completeCheckIn: vi.fn().mockResolvedValue(undefined),
    setProbationOutcome: vi.fn().mockResolvedValue(undefined),
    extendProbation: vi.fn().mockResolvedValue(undefined),
    updateOffboardingChecklist: vi.fn().mockResolvedValue(undefined),
    setDepartureReason: vi.fn().mockResolvedValue(undefined),
    setFinalNotes: vi.fn().mockResolvedValue(undefined),
    reactivateStaff: vi.fn().mockResolvedValue({ success: true }),
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
  probation: null,
  offboarding: null,
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

  describe('Probation tracking (P3-E27-D2)', () => {
    const probationStaff: Staff = {
      ...baseStaff,
      status: 'active',
      probation: {
        startDate: '2026-01-01',
        endDate: '2026-04-01',
        probationOutcome: 'pending',
        checkIns: [
          { id: 'ci-30', dayOffset: 30, scheduledDate: '2026-01-31', completedDate: null, notes: null, rating: null, completedBy: null },
          { id: 'ci-60', dayOffset: 60, scheduledDate: '2026-03-02', completedDate: null, notes: null, rating: null, completedBy: null },
          { id: 'ci-90', dayOffset: 90, scheduledDate: '2026-04-01', completedDate: null, notes: null, rating: null, completedBy: null },
        ],
      },
    }

    it('shows a not-started message when probation is null', () => {
      renderPanel(baseStaff)
      expect(screen.getByText('Probation tracking begins once this employee is activated.')).toBeInTheDocument()
    })

    it('completes a check-in and calls completeCheckIn with the updated array', async () => {
      const { props } = renderPanel(probationStaff)

      const [completeBtn] = screen.getAllByText('Complete Check-In')
      fireEvent.click(completeBtn)

      await act(async () => {
        fireEvent.click(screen.getByText('Save'))
        await Promise.resolve()
      })

      const today = new Date().toISOString().slice(0, 10)
      expect(props.completeCheckIn).toHaveBeenCalledWith(
        'staff123',
        expect.arrayContaining([expect.objectContaining({ id: 'ci-30', completedDate: today, rating: 5, completedBy: 'lauren@freshnestco.ca' })])
      )
    })

    it('disables outcome buttons until all check-ins are complete', () => {
      renderPanel(probationStaff)
      expect(screen.getByText('Mark Passed')).toBeDisabled()
      expect(screen.getByText('Extend 90 Days')).toBeDisabled()
      expect(screen.getByText('Terminate')).toBeDisabled()
    })

    it('enables and calls setProbationOutcome once all check-ins are complete', async () => {
      const completedStaff: Staff = {
        ...probationStaff,
        probation: {
          ...probationStaff.probation!,
          checkIns: probationStaff.probation!.checkIns.map((c) => ({ ...c, completedDate: '2026-01-31', rating: 5 })),
        },
      }
      const { props } = renderPanel(completedStaff)

      const passedBtn = screen.getByText('Mark Passed')
      expect(passedBtn).not.toBeDisabled()

      await act(async () => {
        fireEvent.click(passedBtn)
        await Promise.resolve()
      })

      expect(props.setProbationOutcome).toHaveBeenCalledWith('staff123', 'passed')
    })
  })

  describe('Offboarding (P3-E27-D3)', () => {
    const inactiveStaff: Staff = {
      ...baseStaff,
      status: 'inactive',
      offboarding: {
        deactivatedAt: new Date('2026-07-20'),
        checklist: {
          authRevoked: true,
          keysReturned: false,
          accessCodesChanged: false,
          finalPayCalculated: false,
          recordArchived: false,
        },
        finalNotes: null,
        departureReason: null,
      },
    }

    it('does not render the Offboarding section for active/onboarding staff', () => {
      renderPanel(baseStaff)
      expect(screen.queryByText('Offboarding')).not.toBeInTheDocument()
    })

    it('replaces the plain Activate button with a pointer to Reactivate for inactive staff', () => {
      renderPanel(inactiveStaff)
      expect(screen.queryByRole('button', { name: 'Activate Employee' })).not.toBeInTheDocument()
      expect(screen.getByText('This employee is deactivated. Use Reactivate in the Offboarding section below to restore access.')).toBeInTheDocument()
    })

    it('shows authRevoked as read-only, with no toggle button', () => {
      renderPanel(inactiveStaff)
      const authRevokedRow = screen.getByText('Auth Access Revoked').closest('.flex.items-center.justify-between') as HTMLElement
      expect(within(authRevokedRow).queryByRole('button')).not.toBeInTheDocument()
    })

    it('toggles an offboarding checklist item and calls updateOffboardingChecklist', async () => {
      const { props } = renderPanel(inactiveStaff)

      // Scope to the Offboarding section — the D1 admin checklist toggles also render
      // "Mark Complete" buttons, so an unscoped query would hit the wrong one.
      const offboardingSection = screen.getByText('Offboarding').closest('div') as HTMLElement
      const [keysReturnedBtn] = within(offboardingSection).getAllByText('Mark Complete')
      await act(async () => {
        fireEvent.click(keysReturnedBtn)
        await Promise.resolve()
      })

      expect(props.updateOffboardingChecklist).toHaveBeenCalledWith('staff123', 'keysReturned', true)
    })

    it('saves departure reason and final notes', async () => {
      const { props } = renderPanel(inactiveStaff)

      fireEvent.change(screen.getByLabelText('Departure Reason'), { target: { value: 'voluntary' } })
      fireEvent.change(screen.getByLabelText('Final Notes'), { target: { value: 'Moved out of province.' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await Promise.resolve()
      })

      expect(props.setDepartureReason).toHaveBeenCalledWith('staff123', 'voluntary')
      expect(props.setFinalNotes).toHaveBeenCalledWith('staff123', 'Moved out of province.')
    })

    it('calls reactivateStaff when Reactivate is clicked', async () => {
      const { props } = renderPanel(inactiveStaff)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }))
        await Promise.resolve()
      })

      expect(props.reactivateStaff).toHaveBeenCalledWith('staff123')
    })
  })
})
