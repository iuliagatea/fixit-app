import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { apiClient } from '../api/client'

jest.mock('../api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

function Probe() {
  const { user, tenant, loading, signIn, signOut, applySession } = useAuth()

  if (loading) return <p>loading</p>

  return (
    <div>
      <p>user: {user ? user.email : 'none'}</p>
      <p>tenant: {tenant ? tenant.name : 'none'}</p>
      <button onClick={() => signIn('admin@example.com', 'secret')}>sign in</button>
      <button onClick={() => signOut()}>sign out</button>
      <button
        onClick={() =>
          applySession({ user: { id: 9, email: 'applied@example.com', is_admin: false }, tenant: null })
        }
      >
        apply session
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches /me on mount and exposes the current user/tenant', async () => {
    mockApiClient.get.mockResolvedValue({
      data: { user: { id: 1, email: 'already@example.com', is_admin: false }, tenant: { id: 1, name: 'Acme', plan: 'free' } },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('user: already@example.com')).toBeInTheDocument())
    expect(screen.getByText('tenant: Acme')).toBeInTheDocument()
    expect(mockApiClient.get).toHaveBeenCalledWith('/me')
  })

  it('treats a failed /me fetch as signed out, not an error', async () => {
    mockApiClient.get.mockRejectedValue(new Error('401'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('user: none')).toBeInTheDocument())
  })

  it('signIn updates user/tenant from the response', async () => {
    mockApiClient.get.mockRejectedValue(new Error('401'))
    mockApiClient.post.mockResolvedValue({
      data: { user: { id: 2, email: 'admin@example.com', is_admin: true }, tenant: { id: 3, name: 'New Co', plan: 'free' } },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('user: none')).toBeInTheDocument())

    await userEvent.click(screen.getByText('sign in'))

    expect(mockApiClient.post).toHaveBeenCalledWith('/sign_in', { user: { email: 'admin@example.com', password: 'secret' } })
    await waitFor(() => expect(screen.getByText('user: admin@example.com')).toBeInTheDocument())
  })

  it('signOut clears user/tenant', async () => {
    mockApiClient.get.mockResolvedValue({
      data: { user: { id: 1, email: 'admin@example.com', is_admin: true }, tenant: { id: 1, name: 'Acme', plan: 'free' } },
    })
    mockApiClient.delete.mockResolvedValue({ data: null })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('user: admin@example.com')).toBeInTheDocument())

    await userEvent.click(screen.getByText('sign out'))

    expect(mockApiClient.delete).toHaveBeenCalledWith('/sign_out')
    await waitFor(() => expect(screen.getByText('user: none')).toBeInTheDocument())
  })

  it('applySession sets user/tenant directly from a payload without calling /me again', async () => {
    mockApiClient.get.mockResolvedValue({
      data: { user: null, tenant: null },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('user: none')).toBeInTheDocument())
    mockApiClient.get.mockClear()

    await userEvent.click(screen.getByText('apply session'))

    await waitFor(() => expect(screen.getByText('user: applied@example.com')).toBeInTheDocument())
    expect(screen.getByText('tenant: none')).toBeInTheDocument()
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })
})
