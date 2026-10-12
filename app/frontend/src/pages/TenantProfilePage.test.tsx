import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TenantProfilePage } from './TenantProfilePage'
import { useAuth } from '../context/AuthContext'
import { fetchTenantProfile } from '../api/tenantDirectory'
import { createReview, deleteReview } from '../api/reviews'

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../api/tenantDirectory', () => ({ fetchTenantProfile: jest.fn() }))
jest.mock('../api/reviews', () => ({ createReview: jest.fn(), deleteReview: jest.fn() }))

const mockUseAuth = useAuth as jest.Mock
const mockFetchTenantProfile = fetchTenantProfile as jest.Mock
const mockCreateReview = createReview as jest.Mock
const mockDeleteReview = deleteReview as jest.Mock

const baseProfile = {
  id: 1,
  name: 'Acme Repairs',
  description: 'We fix things',
  category_ids: [1],
  categories: [{ id: 1, name: 'Plumbing' }],
  average_rating: 4.5,
  rated_reviews_count: 1,
  keywords: null,
  reviews: [
    {
      id: 10,
      rating: 5,
      title: 'Great work',
      review: 'Fixed my sink fast',
      created_at: '2026-01-01T00:00:00Z',
      user: { id: 2, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
    },
  ],
  reviews_meta: { total_pages: 1, current_page: 1, per_page: 5, total_entries: 1 },
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tenants/1']}>
        <Routes>
          <Route path="/tenants/:id" element={<TenantProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TenantProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchTenantProfile.mockResolvedValue(baseProfile)
  })

  it('shows the tenant profile and its reviews', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Acme Repairs' })).toBeInTheDocument()
    expect(screen.getByText('Great work')).toBeInTheDocument()
    expect(screen.getByText('Fixed my sink fast')).toBeInTheDocument()
  })

  it('prompts a signed-out visitor to sign in instead of showing the review form', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderPage()

    await screen.findByRole('heading', { name: 'Acme Repairs' })
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Rating')).not.toBeInTheDocument()
  })

  it('lets a signed-in user submit a review', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 3, email: 'customer@example.com', is_admin: false } })
    mockCreateReview.mockResolvedValue({ ...baseProfile.reviews[0], id: 11 })
    const user = userEvent.setup()

    renderPage()

    await user.selectOptions(await screen.findByLabelText('Rating'), '5')
    await user.type(screen.getByLabelText('Title'), 'Loved it')
    await user.type(screen.getByLabelText('Review'), 'Would hire again')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    await waitFor(() =>
      expect(mockCreateReview).toHaveBeenCalledWith(1, { rating: 5, title: 'Loved it', review: 'Would hire again' }),
    )
  })

  it('shows the not-eligible error returned by the API', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 3, email: 'not-eligible@example.com', is_admin: false } })
    mockCreateReview.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: 'You can review this tenant once you have a completed product with them.' } } },
    })
    const user = userEvent.setup()

    renderPage()

    await user.selectOptions(await screen.findByLabelText('Rating'), '5')
    await user.type(screen.getByLabelText('Title'), 'Loved it')
    await user.type(screen.getByLabelText('Review'), 'Would hire again')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(
      await screen.findByText('You can review this tenant once you have a completed product with them.'),
    ).toBeInTheDocument()
  })

  it('lets the review author delete their own review', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, email: 'jane@example.com', is_admin: false } })
    mockDeleteReview.mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockDeleteReview).toHaveBeenCalledWith(1, 10))
  })

  it('does not show a delete button for a review that is not the viewer\'s own', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 99, email: 'someone-else@example.com', is_admin: false } })

    renderPage()

    await screen.findByText('Great work')
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
