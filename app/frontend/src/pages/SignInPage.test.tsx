import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInPage } from './SignInPage'
import { useAuth } from '../context/AuthContext'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockUseAuth = useAuth as jest.Mock

describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signs in with the entered credentials and navigates home on success', async () => {
    const signIn = jest.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ signIn })

    render(<SignInPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('admin@example.com', 'secret123'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows the server error message and does not navigate when sign-in fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Invalid email or password' } } },
    }
    const signIn = jest.fn().mockRejectedValue(axiosLikeError)
    mockUseAuth.mockReturnValue({ signIn })

    render(<SignInPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    const signIn = jest.fn().mockRejectedValue(new Error('network down'))
    mockUseAuth.mockReturnValue({ signIn })

    render(<SignInPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
