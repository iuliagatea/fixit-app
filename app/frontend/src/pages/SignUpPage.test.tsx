import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignUpPage } from './SignUpPage'
import { useAuth } from '../context/AuthContext'
import { signUp } from '../api/registrations'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/registrations', () => ({
  signUp: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseAuth = useAuth as jest.Mock
const mockSignUp = signUp as jest.Mock

function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Organization name'), 'New Service Co')
  await userEvent.type(screen.getByLabelText('Email'), 'founder@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'Password123!')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'Password123!')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signs up, signs in with the entered credentials, and navigates home on success', async () => {
    mockSignUp.mockResolvedValue(undefined)
    const signIn = jest.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ signIn })

    renderSignUpPage()
    await fillAndSubmit()

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        tenantName: 'New Service Co',
        email: 'founder@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      }),
    )
    expect(signIn).toHaveBeenCalledWith('founder@example.com', 'Password123!')
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows the server error message and does not sign in or navigate when sign-up fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Name has already been taken' } } },
    }
    mockSignUp.mockRejectedValue(axiosLikeError)
    const signIn = jest.fn()
    mockUseAuth.mockReturnValue({ signIn })

    renderSignUpPage()
    await fillAndSubmit()

    expect(await screen.findByText('Name has already been taken')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    mockSignUp.mockRejectedValue(new Error('network down'))
    mockUseAuth.mockReturnValue({ signIn: jest.fn() })

    renderSignUpPage()
    await fillAndSubmit()

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
