import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProductsTable } from './ProductsTable'
import type { ProductsPage, ProductSummary } from '../api/products'

function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildProduct(overrides: Partial<ProductSummary>): ProductSummary {
  return {
    id: 1,
    code: 'ABC-1',
    name: 'Sink repair',
    expected_completion_date: daysFromNow(30),
    comments: null,
    estimated_value: '100.0',
    tenant_id: 1,
    updated_at: new Date().toISOString(),
    user: { id: 1, email: 'customer@example.com', first_name: null, last_name: null },
    current_status: { id: 1, name: 'Received', color: '#428bca' },
    ...overrides,
  }
}

function buildPage(products: ProductSummary[]): ProductsPage {
  return {
    products,
    meta: { total_pages: 1, current_page: 1, per_page: 10, total_entries: products.length },
  }
}

function renderTable(products: ProductSummary[], showDueFlags = true) {
  return render(
    <MemoryRouter>
      <ProductsTable data={buildPage(products)} page={1} onPageChange={jest.fn()} showDueFlags={showDueFlags} />
    </MemoryRouter>,
  )
}

describe('ProductsTable', () => {
  it('shows the customer email', () => {
    renderTable([buildProduct({ user: { id: 2, email: 'jane@example.com', first_name: null, last_name: null } })])

    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('flags a past expected completion date as overdue', () => {
    renderTable([buildProduct({ expected_completion_date: daysFromNow(-2) })])

    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('ABC-1 - Sink repair').closest('tr')).toHaveClass('table-danger')
  })

  it('flags a near-term expected completion date as due soon', () => {
    renderTable([buildProduct({ expected_completion_date: daysFromNow(1) })])

    expect(screen.getByText('Due soon')).toBeInTheDocument()
    expect(screen.getByText('ABC-1 - Sink repair').closest('tr')).toHaveClass('table-warning')
  })

  it('does not flag a far-off expected completion date', () => {
    renderTable([buildProduct({ expected_completion_date: daysFromNow(30) })])

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(screen.queryByText('Due soon')).not.toBeInTheDocument()
  })

  it('suppresses due-date flags when showDueFlags is false', () => {
    renderTable([buildProduct({ expected_completion_date: daysFromNow(-2) })], false)

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })

  it('shows a custom empty message', () => {
    render(
      <MemoryRouter>
        <ProductsTable data={buildPage([])} page={1} onPageChange={jest.fn()} emptyMessage="Nothing matches." />
      </MemoryRouter>,
    )

    expect(screen.getByText('Nothing matches.')).toBeInTheDocument()
  })
})
