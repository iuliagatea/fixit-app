import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ResetPasswordEditPage } from './ResetPasswordEditPage'
import { useAuth } from '../context/AuthContext'
import { completePasswordReset } from '../api/passwords'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/passwords', () => ({
  completePasswordReset: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseAuth = useAuth as jest.Mock
const mockCompletePasswordReset = completePasswordReset as jest.Mock

function renderResetPasswordEditPage() {
  return render(
    <MemoryRouter initialEntries={['/reset-password/edit?reset_password_token=abc123']}>
      <ResetPasswordEditPage />
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('New password'), 'NewPassword456!')
  await userEvent.type(screen.getByLabelText('Confirm new password'), 'NewPassword456!')
  await userEvent.click(screen.getByRole('button', { name: 'Change my password' }))
}

describe('ResetPasswordEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('completes the reset with the token from the URL and navigates home on success', async () => {
    const applySession = jest.fn()
    const session = { user: { id: 1, email: 'customer@example.com', is_admin: false }, tenant: null }
    mockCompletePasswordReset.mockResolvedValue(session)
    mockUseAuth.mockReturnValue({ applySession })

    renderResetPasswordEditPage()
    await fillAndSubmit()

    await waitFor(() =>
      expect(mockCompletePasswordReset).toHaveBeenCalledWith({
        resetPasswordToken: 'abc123',
        password: 'NewPassword456!',
        passwordConfirmation: 'NewPassword456!',
      }),
    )
    expect(applySession).toHaveBeenCalledWith(session)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows the server error message and does not navigate when the reset fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Reset password token is invalid' } } },
    }
    mockCompletePasswordReset.mockRejectedValue(axiosLikeError)
    const applySession = jest.fn()
    mockUseAuth.mockReturnValue({ applySession })

    renderResetPasswordEditPage()
    await fillAndSubmit()

    expect(await screen.findByText('Reset password token is invalid')).toBeInTheDocument()
    expect(applySession).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    mockCompletePasswordReset.mockRejectedValue(new Error('network down'))
    mockUseAuth.mockReturnValue({ applySession: jest.fn() })

    renderResetPasswordEditPage()
    await fillAndSubmit()

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
