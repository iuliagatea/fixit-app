import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardSummary } from '../api/dashboard'
import { fetchProducts } from '../api/products'

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../api/dashboard', () => ({ fetchDashboardSummary: jest.fn() }))
jest.mock('../api/products', () => ({ fetchProducts: jest.fn() }))

const mockUseAuth = useAuth as jest.Mock
const mockFetchDashboardSummary = fetchDashboardSummary as jest.Mock
const mockFetchProducts = fetchProducts as jest.Mock

const baseSummary = {
  status_counts: [
    { id: 1, name: 'Received', color: '#428bca', count: 2 },
    { id: 2, name: 'Completed', color: '#3c763d', count: 1 },
  ],
  total_active_products: 2,
  completed_this_month: 1,
  total_estimated_value: '450.0',
  plan: { plan: 'free', product_count: 3, limit: 500 },
  rating: { average: 4.5, count: 2 },
}

const baseProducts = {
  products: [
    {
      id: 10,
      code: 'ABC-1',
      name: 'Kitchen repair',
      expected_completion_date: '2099-01-01',
      comments: null,
      estimated_value: '100.0',
      tenant_id: 1,
      updated_at: '2026-01-01T00:00:00Z',
      user: { id: 2, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
      current_status: { id: 1, name: 'Received', color: '#428bca' },
    },
  ],
  meta: { total_pages: 1, current_page: 1, per_page: 5, total_entries: 1 },
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchDashboardSummary.mockResolvedValue(baseSummary)
    mockFetchProducts.mockResolvedValue(baseProducts)
  })

  it('shows status counts, key stats, rating, and recent products', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', is_admin: true },
      tenant: { id: 1, name: 'Acme Repairs', plan: 'free' },
    })

    renderPage()

    expect(await screen.findByText('Products by status')).toBeInTheDocument()
    expect(screen.getAllByText('Received').length).toBeGreaterThan(0)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('450.0')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('ABC-1 - Kitchen repair')).toBeInTheDocument()
    expect(mockFetchProducts).toHaveBeenCalledWith(1, 1, {}, 5)
  })

  it('shows the plan usage widget for an admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', is_admin: true },
      tenant: { id: 1, name: 'Acme Repairs', plan: 'free' },
    })

    renderPage()

    expect(await screen.findByText('Plan usage')).toBeInTheDocument()
    expect(screen.getByText(/3 \/ 500 products used/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade to premium' })).toBeInTheDocument()
  })

  it('hides the plan usage widget for a non-admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: 'customer@example.com', is_admin: false },
      tenant: { id: 1, name: 'Acme Repairs', plan: 'free' },
    })

    renderPage()

    await screen.findByText('Products by status')
    expect(screen.queryByText('Plan usage')).not.toBeInTheDocument()
  })
})
