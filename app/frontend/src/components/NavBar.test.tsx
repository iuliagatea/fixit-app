import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'
import { useAuth } from '../context/AuthContext'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.Mock

function renderNavBar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  it('shows a sign-in link when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, tenant: null, signOut: jest.fn() })

    renderNavBar()

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Products' })).not.toBeInTheDocument()
  })

  it('shows member navigation but not admin-only links for a regular user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'customer@example.com', is_admin: false },
      tenant: { id: 1, name: 'Acme', plan: 'free' },
      signOut: jest.fn(),
    })

    renderNavBar()

    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Status board' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Statuses' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.getByText(/customer@example.com/)).toBeInTheDocument()
  })

  it('shows admin-only navigation for an admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: 'admin@example.com', is_admin: true },
      tenant: { id: 1, name: 'Acme', plan: 'free' },
      signOut: jest.fn(),
    })

    renderNavBar()

    expect(screen.getByRole('link', { name: 'Statuses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
})
