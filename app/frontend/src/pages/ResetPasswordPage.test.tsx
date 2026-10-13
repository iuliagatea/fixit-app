import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ResetPasswordPage } from './ResetPasswordPage'
import { requestPasswordReset } from '../api/passwords'

jest.mock('../api/passwords', () => ({
  requestPasswordReset: jest.fn(),
}))

const mockRequestPasswordReset = requestPasswordReset as jest.Mock

function renderResetPasswordPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requests reset instructions and shows a confirmation message', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined)

    renderResetPasswordPage()
    await userEvent.type(screen.getByLabelText('Email'), 'customer@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send me reset instructions' }))

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('customer@example.com')
    expect(await screen.findByText(/you'll receive password reset instructions/)).toBeInTheDocument()
  })

  it('shows the server error message when the request fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Email not found' } } },
    }
    mockRequestPasswordReset.mockRejectedValue(axiosLikeError)

    renderResetPasswordPage()
    await userEvent.type(screen.getByLabelText('Email'), 'nobody@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send me reset instructions' }))

    expect(await screen.findByText('Email not found')).toBeInTheDocument()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('network down'))

    renderResetPasswordPage()
    await userEvent.type(screen.getByLabelText('Email'), 'customer@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send me reset instructions' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
