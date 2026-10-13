import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AboutPage } from './AboutPage'
import { useAuth } from '../context/AuthContext'

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }))

const mockUseAuth = useAuth as jest.Mock

function renderPage() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  )
}

describe('AboutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the marketing copy and both plans', () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderPage()

    expect(screen.getByText("If it's broken, we will FixIT!")).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('shows sign-up CTAs when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderPage()

    expect(screen.getByRole('link', { name: 'Sign up for free' })).toHaveAttribute('href', '/sign-up')
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/sign-up')
  })

  it('hides sign-up CTAs when logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'jane@example.com', is_admin: false } })

    renderPage()

    expect(screen.queryByRole('link', { name: 'Sign up for free' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument()
  })
})
