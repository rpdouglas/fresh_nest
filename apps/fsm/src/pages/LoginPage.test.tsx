import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { User } from 'firebase/auth'
import LoginPage from './LoginPage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { Staff } from '../types'

// Mock hooks and router
vi.mock('../hooks/useStaffAuth')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockChangeLanguage = vi.fn().mockResolvedValue({})
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

describe('LoginPage Component', () => {
  const mockSignInWithPassword = vi.fn()
  const mockSendMagicLink = vi.fn()
  const mockCompleteMagicLinkSignIn = vi.fn()
  const mockSetError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStaffAuth).mockReturnValue({
      user: null,
      staffProfile: null,
      loading: false,
      error: null,
      setError: mockSetError,
      signInWithPassword: mockSignInWithPassword,
      sendMagicLink: mockSendMagicLink,
      completeMagicLinkSignIn: mockCompleteMagicLinkSignIn,
      logout: vi.fn(),
    })
  })

  it('renders login form with fields and language toggles', () => {
    render(<LoginPage />)

    expect(screen.getByText('fsm.login.title')).toBeInTheDocument()
    expect(screen.getByLabelText('fsm.login.emailLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('fsm.login.passwordLabel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument()
    // Arabic is removed, so 'AR' button should NOT exist
    expect(screen.queryByRole('button', { name: 'AR' })).not.toBeInTheDocument()
  })

  it('calls changeLanguage when language toggle is clicked', () => {
    render(<LoginPage />)

    const frButton = screen.getByRole('button', { name: 'FR' })
    fireEvent.click(frButton)

    expect(mockChangeLanguage).toHaveBeenCalledWith('fr')
  })

  it('calls signInWithPassword on form submission', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('fsm.login.emailLabel')
    const passwordInput = screen.getByLabelText('fsm.login.passwordLabel')
    const submitBtn = screen.getByRole('button', { name: 'fsm.login.signInBtn' })

    fireEvent.change(emailInput, { target: { value: 'test@freshnest.ca' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    act(() => {
      fireEvent.click(submitBtn)
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith('test@freshnest.ca', 'password123')
  })

  it('calls sendMagicLink when magic link button is clicked', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('fsm.login.emailLabel')
    const magicLinkBtn = screen.getByRole('button', { name: 'fsm.login.sendMagicLinkBtn' })

    // Disabled initially because email is empty
    expect(magicLinkBtn).toBeDisabled()

    fireEvent.change(emailInput, { target: { value: 'john@freshnest.ca' } })
    expect(magicLinkBtn).not.toBeDisabled()

    act(() => {
      fireEvent.click(magicLinkBtn)
    })

    expect(mockSendMagicLink).toHaveBeenCalledWith('john@freshnest.ca')
  })

  it('displays error alert if authentication hook returns an error', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: null,
      staffProfile: null,
      loading: false,
      error: 'fsm.login.errorNoProfile',
      setError: mockSetError,
      signInWithPassword: mockSignInWithPassword,
      sendMagicLink: mockSendMagicLink,
      completeMagicLinkSignIn: mockCompleteMagicLinkSignIn,
      logout: vi.fn(),
    })

    render(<LoginPage />)

    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toBeInTheDocument()
    expect(errorAlert).toHaveTextContent('fsm.login.errorNoProfile')
  })

  it('triggers completeMagicLinkSignIn on mount if URL contains apiKey', () => {
    // Temporarily override window.location
    const originalLocation = window.location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    delete (window as any).location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ;(window as any).location = {
      ...originalLocation,
      href: 'https://lilypad-freshnest.web.app/login?apiKey=fake-key',
    }

    act(() => {
      render(<LoginPage />)
    })

    expect(mockCompleteMagicLinkSignIn).toHaveBeenCalled()

    // Restore location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ;(window as any).location = originalLocation
  })

  it('redirects to root dashboard if staffProfile is loaded', async () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: {} as User,
      staffProfile: { id: 'staff123' } as unknown as Staff,
      loading: false,
      error: null,
      setError: mockSetError,
      signInWithPassword: mockSignInWithPassword,
      sendMagicLink: mockSendMagicLink,
      completeMagicLinkSignIn: mockCompleteMagicLinkSignIn,
      logout: vi.fn(),
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
