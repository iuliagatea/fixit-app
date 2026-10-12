import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TenantSearchPage } from './TenantSearchPage'
import { fetchCategories } from '../api/categories'
import { searchTenants } from '../api/tenantDirectory'

jest.mock('../api/categories', () => ({ fetchCategories: jest.fn() }))
jest.mock('../api/tenantDirectory', () => ({ searchTenants: jest.fn() }))

const mockFetchCategories = fetchCategories as jest.Mock
const mockSearchTenants = searchTenants as jest.Mock

const SEARCH_TIMEOUT = 2000 // comfortably longer than the component's 300ms debounce

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantSearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TenantSearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchCategories.mockResolvedValue([{ id: 1, name: 'Plumbing', entity: 'tenant' }])
  })

  it('renders search results with rating and categories', async () => {
    mockSearchTenants.mockResolvedValue({
      tenants: [
        {
          id: 1,
          name: 'Acme Repairs',
          description: 'We fix things',
          category_ids: [1],
          categories: [{ id: 1, name: 'Plumbing' }],
          average_rating: 4.5,
          rated_reviews_count: 2,
        },
      ],
      meta: { total_pages: 1, current_page: 1, per_page: 10, total_entries: 1 },
    })

    renderPage()

    expect(await screen.findByRole('link', { name: 'Acme Repairs' })).toHaveAttribute('href', '/tenants/1')
    expect(screen.getByText('Plumbing', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/4.5 ★ \(2 reviews\)/)).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    mockSearchTenants.mockResolvedValue({
      tenants: [],
      meta: { total_pages: 0, current_page: 1, per_page: 10, total_entries: 0 },
    })

    renderPage()

    expect(await screen.findByText('No providers match your search.')).toBeInTheDocument()
  })

  it('re-queries with the typed search text after debouncing', async () => {
    mockSearchTenants.mockResolvedValue({
      tenants: [],
      meta: { total_pages: 0, current_page: 1, per_page: 10, total_entries: 0 },
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Search'), 'Acme')

    await waitFor(
      () => expect(mockSearchTenants).toHaveBeenCalledWith(expect.objectContaining({ query: 'Acme' })),
      { timeout: SEARCH_TIMEOUT },
    )
  })
})
