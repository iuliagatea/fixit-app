import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusRow } from './StatusRow'
import { deleteStatus, updateStatus } from '../api/statuses'
import type { StatusDetail } from '../api/statuses'

jest.mock('../api/statuses', () => ({
  updateStatus: jest.fn(),
  deleteStatus: jest.fn(),
}))

const mockUpdateStatus = updateStatus as jest.Mock
const mockDeleteStatus = deleteStatus as jest.Mock

const baseStatus: StatusDetail = {
  id: 1,
  name: 'Received',
  color: '#428bca',
  is_active: true,
  can_be_deleted: true,
  send_email: true,
}

function renderRow(overrides: Partial<StatusDetail> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <table>
        <tbody>
          <StatusRow tenantId={1} status={{ ...baseStatus, ...overrides }} />
        </tbody>
      </table>
    </QueryClientProvider>,
  )
}

describe('StatusRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the status name, active state, and email flag', () => {
    renderRow()

    expect(screen.getByText('Received')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Emails customer')).toBeInTheDocument()
  })

  it('shows "Silent" when send_email is false', () => {
    renderRow({ send_email: false })

    expect(screen.getByText('Silent')).toBeInTheDocument()
  })

  it('disables Delete when the status cannot be deleted', () => {
    renderRow({ can_be_deleted: false })

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })

  it('enters edit mode, saves, and calls updateStatus with the edited fields', async () => {
    mockUpdateStatus.mockResolvedValue({ ...baseStatus, name: 'On hold' })
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const nameInput = screen.getByDisplayValue('Received')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'On hold')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 1, { name: 'On hold', color: '#428bca', send_email: true }),
    )
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument())
  })

  it('toggles the send_email checkbox while editing', async () => {
    mockUpdateStatus.mockResolvedValue({ ...baseStatus, send_email: false })
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByLabelText('Email customer on this status'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 1, { name: 'Received', color: '#428bca', send_email: false }),
    )
  })

  it('leaves edit mode without saving when Cancel is clicked', async () => {
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockUpdateStatus).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows the server error message when a delete is refused', async () => {
    mockDeleteStatus.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: 'This status cannot be deleted.' } } },
    })
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('This status cannot be deleted.')).toBeInTheDocument()
  })
})
