import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NewProductPage } from './NewProductPage'
import { useAuth } from '../context/AuthContext'
import { fetchStatuses } from '../api/statuses'
import { lookupCustomer } from '../api/customers'

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../api/statuses', () => ({ fetchStatuses: jest.fn() }))
jest.mock('../api/customers', () => ({ lookupCustomer: jest.fn() }))
jest.mock('../api/products', () => ({ createProduct: jest.fn() }))

const mockUseAuth = useAuth as jest.Mock
const mockFetchStatuses = fetchStatuses as jest.Mock
const mockLookupCustomer = lookupCustomer as jest.Mock

const LOOKUP_TIMEOUT = 2000 // comfortably longer than the component's 400ms debounce

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NewProductPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewProductPage customer lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ tenant: { id: 1, name: 'Acme', plan: 'free' } })
    mockFetchStatuses.mockResolvedValue([{ id: 1, name: 'Received', color: '#428bca' }])
  })

  it('autofills and locks the name fields when the email matches an existing customer', async () => {
    mockLookupCustomer.mockResolvedValue({ id: 5, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Customer email'), 'jane@example.com')

    await waitFor(() => expect(screen.getByLabelText('First name')).toHaveValue('Jane'), { timeout: LOOKUP_TIMEOUT })
    expect(screen.getByLabelText('Last name')).toHaveValue('Doe')
    expect(screen.getByLabelText('First name')).toBeDisabled()
    expect(screen.getByLabelText('Last name')).toBeDisabled()
    expect(screen.getByText(/Existing customer found/)).toBeInTheDocument()
  })

  it('leaves the name fields editable and empty when no customer matches', async () => {
    mockLookupCustomer.mockResolvedValue(null)
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Customer email'), 'nobody@example.com')

    await waitFor(() => expect(mockLookupCustomer).toHaveBeenCalled(), { timeout: LOOKUP_TIMEOUT })
    expect(screen.getByLabelText('First name')).not.toBeDisabled()
    expect(screen.getByLabelText('First name')).toHaveValue('')
  })

  it('unlocks and clears the name fields when the email changes from a match to a non-match', async () => {
    mockLookupCustomer.mockResolvedValueOnce({ id: 5, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Customer email'), 'jane@example.com')
    await waitFor(() => expect(screen.getByLabelText('First name')).toBeDisabled(), { timeout: LOOKUP_TIMEOUT })

    mockLookupCustomer.mockResolvedValueOnce(null)
    await user.clear(screen.getByLabelText('Customer email'))
    await user.type(screen.getByLabelText('Customer email'), 'new-person@example.com')

    await waitFor(() => expect(screen.getByLabelText('First name')).not.toBeDisabled(), { timeout: LOOKUP_TIMEOUT })
    expect(screen.getByLabelText('First name')).toHaveValue('')
  })

  it('does not look up an email that is not yet a valid shape', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Customer email'), 'not-an-email')
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(mockLookupCustomer).not.toHaveBeenCalled()
  })
})
