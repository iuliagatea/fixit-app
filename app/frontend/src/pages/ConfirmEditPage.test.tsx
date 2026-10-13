import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmEditPage } from './ConfirmEditPage'
import { useAuth } from '../context/AuthContext'
import { completeConfirmation } from '../api/confirmations'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/confirmations', () => ({
  completeConfirmation: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseAuth = useAuth as jest.Mock
const mockCompleteConfirmation = completeConfirmation as jest.Mock

function renderConfirmEditPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ConfirmEditPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ConfirmEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('confirms the account with the token from the URL and navigates home on success', async () => {
    const applySession = jest.fn()
    const session = { user: { id: 1, email: 'customer@example.com', is_admin: false }, tenant: null }
    mockCompleteConfirmation.mockResolvedValue(session)
    mockUseAuth.mockReturnValue({ applySession })

    renderConfirmEditPage('/confirm/edit?confirmation_token=abc123')

    await waitFor(() => expect(mockCompleteConfirmation).toHaveBeenCalledWith('abc123'))
    await waitFor(() => expect(applySession).toHaveBeenCalledWith(session))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows the server error message and does not navigate when confirmation fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Confirmation token is invalid' } } },
    }
    mockCompleteConfirmation.mockRejectedValue(axiosLikeError)
    const applySession = jest.fn()
    mockUseAuth.mockReturnValue({ applySession })

    renderConfirmEditPage('/confirm/edit?confirmation_token=bad-token')

    expect(await screen.findByText('Confirmation token is invalid')).toBeInTheDocument()
    expect(applySession).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows an invalid-link message when there is no token in the URL', async () => {
    mockUseAuth.mockReturnValue({ applySession: jest.fn() })

    renderConfirmEditPage('/confirm/edit')

    expect(await screen.findByText('This confirmation link is missing its token.')).toBeInTheDocument()
    expect(mockCompleteConfirmation).not.toHaveBeenCalled()
  })
})
