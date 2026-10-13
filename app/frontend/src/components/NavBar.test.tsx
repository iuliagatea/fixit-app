import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.queryByRole('link', { name: 'Change password' })).not.toBeInTheDocument()
  })

  it('shows member navigation but not admin-only links for a regular user', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'customer@example.com', is_admin: false },
      tenant: { id: 1, name: 'Acme', plan: 'free' },
      signOut: jest.fn(),
    })

    renderNavBar()
    expect(screen.getByText(/customer@example.com/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /customer@example.com/i }))

    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Status board' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Statuses' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change password' })).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('shows admin-only navigation for an admin user', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: 'admin@example.com', is_admin: true },
      tenant: { id: 1, name: 'Acme', plan: 'free' },
      signOut: jest.fn(),
    })

    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /admin@example.com/i }))

    expect(screen.getByRole('link', { name: 'Statuses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
})
