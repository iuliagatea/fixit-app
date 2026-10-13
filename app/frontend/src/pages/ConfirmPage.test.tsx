import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ConfirmPage } from './ConfirmPage'
import { resendConfirmation } from '../api/confirmations'

jest.mock('../api/confirmations', () => ({
  resendConfirmation: jest.fn(),
}))

const mockResendConfirmation = resendConfirmation as jest.Mock

function renderConfirmPage() {
  return render(
    <MemoryRouter>
      <ConfirmPage />
    </MemoryRouter>,
  )
}

describe('ConfirmPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resends confirmation instructions and shows a confirmation message', async () => {
    mockResendConfirmation.mockResolvedValue(undefined)

    renderConfirmPage()
    await userEvent.type(screen.getByLabelText('Email'), 'customer@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Resend confirmation instructions' }))

    expect(mockResendConfirmation).toHaveBeenCalledWith('customer@example.com')
    expect(await screen.findByText(/you'll receive new confirmation instructions/)).toBeInTheDocument()
  })

  it('shows the server error message when the request fails', async () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { error: { message: 'Email was already confirmed, please try signing in' } } },
    }
    mockResendConfirmation.mockRejectedValue(axiosLikeError)

    renderConfirmPage()
    await userEvent.type(screen.getByLabelText('Email'), 'confirmed@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Resend confirmation instructions' }))

    expect(await screen.findByText('Email was already confirmed, please try signing in')).toBeInTheDocument()
  })

  it('falls back to a generic message for a non-axios error', async () => {
    mockResendConfirmation.mockRejectedValue(new Error('network down'))

    renderConfirmPage()
    await userEvent.type(screen.getByLabelText('Email'), 'customer@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Resend confirmation instructions' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
