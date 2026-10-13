import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangePasswordPage } from './ChangePasswordPage'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/passwords'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/passwords', () => ({
  changePassword: jest.fn(),
}))

const mockUseAuth = useAuth as jest.Mock
const mockChangePassword = changePassword as jest.Mock

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Current password'), 'OldPassword123!')
  await userEvent.type(screen.getByLabelText('New password'), 'NewPassword456!')
  await userEvent.type(screen.getByLabelText('Confirm new password'), 'NewPassword456!')
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('changes the password and shows a success message', async () => {
    const applySession = jest.fn()
    const session = { user: { id: 1, email: 'admin@example.com', is_admin: true }, tenant: { id: 1, name: 'Acme', plan: 'free' } }
    mockChangePassword.mockResolvedValue(session)
    mockUseAuth.mockReturnValue({ applySession })

    render(<ChangePasswordPage />)
    await fillAndSubmit()

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword123!',
        password: 'NewPassword456!',
        passwordConfirmation: 'NewPassword456!',
      }),
    )
    expect(applySession).toHaveBeenCalledWith(session)
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument()
  })

  it('shows the server error message when the current password is wrong', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Current password is invalid' } } },
    }
    mockChangePassword.mockRejectedValue(axiosLikeError)
    mockUseAuth.mockReturnValue({ applySession: jest.fn() })

    render(<ChangePasswordPage />)
    await fillAndSubmit()

    expect(await screen.findByText('Current password is invalid')).toBeInTheDocument()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    mockChangePassword.mockRejectedValue(new Error('network down'))
    mockUseAuth.mockReturnValue({ applySession: jest.fn() })

    render(<ChangePasswordPage />)
    await fillAndSubmit()

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
