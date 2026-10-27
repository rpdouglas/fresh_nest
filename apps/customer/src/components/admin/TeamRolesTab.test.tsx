import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TeamRolesTab } from './TeamRolesTab'
import { visibleAdminTabs, parseAdminTab } from './adminTabs'

// P3-E35: Owners manage who has office access.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (typeof opts?.email === 'string' ? `${key}:${opts.email}` : key) }),
}))
vi.mock('@/lib/firebase/firebase', () => ({ db: {}, functions: {} }))
type Doc = { id: string; data: () => Record<string, unknown> }
const baseDocs: Doc[] = [
  { id: 'ryan@freshnest.ca', data: () => ({ role: 'owner' }) },
  { id: 'lauren@freshnest.ca', data: () => ({ role: 'manager' }) },
  { id: 'legacy@freshnest.ca', data: () => ({}) },
]
let docs: Doc[] = baseDocs
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), getDocs: vi.fn(() => Promise.resolve({ docs })) }))
const setUserRole = vi.fn((_data: unknown) => Promise.resolve({ data: { success: true, pending: false } }))
const noEmails: Record<string, string | null> = {}
const resolveOfficeEntries = vi.fn((_data: unknown) => Promise.resolve({ data: { emails: noEmails } }))
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((_fns: unknown, name: string) => (name === 'resolveOfficeEntries' ? resolveOfficeEntries : setUserRole)),
}))

beforeEach(() => {
  vi.clearAllMocks()
  docs = baseDocs
})

describe('Team & roles tab', () => {
  it('lists Owners first; legacy entries without a role count as Owners; you cannot change yourself', async () => {
    render(<TeamRolesTab currentEmail="Ryan@freshnest.ca" />)
    const items = await screen.findAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('legacy@freshnest.ca'),
      expect.stringContaining('ryan@freshnest.ca'),
      expect.stringContaining('lauren@freshnest.ca'),
    ])
    // Two other people, each with Make … and Remove; none for yourself.
    expect(screen.getAllByRole('button', { name: 'admin.team.remove' })).toHaveLength(2)
  })

  it('gives someone the Manager role by email', async () => {
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    fireEvent.change(screen.getByLabelText('admin.team.email'), { target: { value: ' New@FreshNest.ca ' } })
    fireEvent.click(screen.getByRole('button', { name: 'admin.team.add' }))
    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith({ email: 'new@freshnest.ca', role: 'manager', forceDowngrade: false }))
  })

  it('removing access asks first, then demotes', async () => {
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    const laurenRow = screen.getAllByRole('listitem').find((li) => li.textContent?.includes('lauren'))!
    fireEvent.click(laurenRow.querySelectorAll('button')[1])
    expect(screen.getByRole('dialog')).toHaveTextContent('lauren@freshnest.ca')
    expect(setUserRole).not.toHaveBeenCalled()
    const removeButtons = screen.getAllByRole('button', { name: 'admin.team.remove' })
    fireEvent.click(removeButtons[removeButtons.length - 1])
    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith({ email: 'lauren@freshnest.ca', role: 'customer', forceDowngrade: true }))
  })

  it('making an Owner a Manager is an explicit downgrade', async () => {
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    fireEvent.click(screen.getAllByRole('button', { name: 'admin.team.makeManager' })[0])
    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith({ email: 'legacy@freshnest.ca', role: 'manager', forceDowngrade: true }))
  })

  it('pre-approves an email that has no account yet, and says so', async () => {
    setUserRole.mockResolvedValueOnce({ data: { success: true, pending: true } })
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    fireEvent.change(screen.getByLabelText('admin.team.email'), { target: { value: 'owner2@freshnest.ca' } })
    fireEvent.change(screen.getByLabelText('admin.team.role'), { target: { value: 'owner' } })
    fireEvent.click(screen.getByRole('button', { name: 'admin.team.add' }))
    expect(await screen.findByRole('status')).toHaveTextContent('admin.team.addedPending:owner2@freshnest.ca')
    expect(setUserRole).toHaveBeenCalledWith({ email: 'owner2@freshnest.ca', role: 'owner', forceDowngrade: false })
  })

  it('shows a plain message if the server still reports no account', async () => {
    setUserRole.mockRejectedValueOnce(new Error('User with email x not found in Auth.'))
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    fireEvent.change(screen.getByLabelText('admin.team.email'), { target: { value: 'x@y.ca' } })
    fireEvent.click(screen.getByRole('button', { name: 'admin.team.add' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('admin.team.errors.noAccount')
  })
})

describe('old entries saved under an account ID', () => {
  it('shows the email instead of the ID, and shows someone with both entries once', async () => {
    docs = [
      { id: 'ryan@freshnest.ca', data: () => ({ role: 'owner' }) },
      { id: 'UID_RYAN', data: () => ({}) },
      { id: 'UID_SAM', data: () => ({ role: 'owner' }) },
    ]
    resolveOfficeEntries.mockResolvedValueOnce({ data: { emails: { UID_RYAN: 'ryan@freshnest.ca', UID_SAM: 'sam@freshnest.ca' } } })
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    const items = await screen.findAllByRole('listitem')
    expect(resolveOfficeEntries).toHaveBeenCalledWith({ ids: ['UID_RYAN', 'UID_SAM'] })
    expect(items).toHaveLength(2)
    expect(items.map((li) => li.textContent).join(' ')).not.toContain('UID_')
    expect(items[1]).toHaveTextContent('sam@freshnest.ca')
    fireEvent.click(screen.getByRole('button', { name: 'admin.team.makeManager' }))
    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith({ email: 'sam@freshnest.ca', role: 'manager', forceDowngrade: true }))
  })

  it('an entry whose account is gone is labelled as unknown and can only be removed', async () => {
    docs = [{ id: 'ryan@freshnest.ca', data: () => ({ role: 'owner' }) }, { id: 'UID_GONE', data: () => ({}) }]
    resolveOfficeEntries.mockResolvedValueOnce({ data: { emails: { UID_GONE: null } } })
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    const items = await screen.findAllByRole('listitem')
    expect(items[1]).toHaveTextContent('admin.team.unknownAccount')
    expect(screen.queryByRole('button', { name: 'admin.team.makeManager' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'admin.team.remove' }))
    const removeButtons = screen.getAllByRole('button', { name: 'admin.team.remove' })
    fireEvent.click(removeButtons[removeButtons.length - 1])
    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith({ email: 'UID_GONE', role: 'customer', forceDowngrade: true }))
  })

  it('email-only lists never call the lookup', async () => {
    render(<TeamRolesTab currentEmail="ryan@freshnest.ca" />)
    await screen.findAllByRole('listitem')
    expect(resolveOfficeEntries).not.toHaveBeenCalled()
  })
})

describe('Owner-only tab', () => {
  it('Managers see every tab except Team & roles; ?tab=team falls back for them', () => {
    expect(visibleAdminTabs(true).map((t) => t.key)).toContain('team')
    expect(visibleAdminTabs(false).map((t) => t.key)).not.toContain('team')
    expect(visibleAdminTabs(false)).toHaveLength(9)
    expect(parseAdminTab('team', false)).toBe('bookings')
    expect(parseAdminTab('team', true)).toBe('team')
  })
})
