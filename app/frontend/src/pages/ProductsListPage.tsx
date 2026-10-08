import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from 'react-bootstrap'
import { fetchProducts } from '../api/products'
import { fetchStatuses } from '../api/statuses'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { emptyProductFilters, ProductFilterBar } from '../components/ProductFilterBar'
import type { ProductFilterValues } from '../components/ProductFilterBar'
import { ProductsTable } from '../components/ProductsTable'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const FILTER_DEBOUNCE_MS = 300

export function ProductsListPage() {
  const { user, tenant } = useAuth()
  const [filters, setFilters] = useState<ProductFilterValues>(emptyProductFilters)
  const appliedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS)
  const [activePage, setActivePage] = useState(1)
  const [completedPage, setCompletedPage] = useState(1)

  useEffect(() => {
    setActivePage(1)
    setCompletedPage(1)
  }, [appliedFilters])

  const { data: statuses } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatuses(tenant!.id),
    enabled: Boolean(tenant),
  })

  const sharedFilters = {
    name: appliedFilters.name || undefined,
    status_id: appliedFilters.status_id || undefined,
    customer_email: appliedFilters.customer_email || undefined,
  }

  const activeQuery = useQuery({
    queryKey: ['products', tenant?.id, 'active', activePage, sharedFilters],
    queryFn: () => fetchProducts(tenant!.id, activePage, { ...sharedFilters, completed: false }),
    enabled: Boolean(tenant),
  })

  const completedQuery = useQuery({
    queryKey: ['products', tenant?.id, 'completed', completedPage, sharedFilters],
    queryFn: () => fetchProducts(tenant!.id, completedPage, { ...sharedFilters, completed: true }),
    enabled: Boolean(tenant),
  })

  if (!tenant) return null

  return (
    <PageContainer maxWidth={1000}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Products</h1>
          {activeQuery.data && <p className="text-secondary mb-0">{activeQuery.data.meta.total_entries} in progress</p>}
        </div>
        {user?.is_admin && (
          <Link to="/products/new" className="btn btn-primary">
            New product
          </Link>
        )}
      </div>

      <ProductFilterBar value={filters} onChange={setFilters} statuses={statuses ?? []} />

      <Card className="card-flat mb-4">
        <Card.Body>
          {activeQuery.isLoading && <LoadingState />}
          {activeQuery.isError && <ErrorState message="Couldn't load products." />}
          {activeQuery.data && (
            <ProductsTable
              data={activeQuery.data}
              page={activePage}
              onPageChange={setActivePage}
              emptyMessage="No in-progress products match these filters."
            />
          )}
        </Card.Body>
      </Card>

      <h2 className="h5 mb-3">Completed</h2>
      <Card className="card-flat">
        <Card.Body>
          {completedQuery.isLoading && <LoadingState />}
          {completedQuery.isError && <ErrorState message="Couldn't load completed products." />}
          {completedQuery.data && (
            <ProductsTable
              data={completedQuery.data}
              page={completedPage}
              onPageChange={setCompletedPage}
              showDueFlags={false}
              emptyMessage="No completed products match these filters."
            />
          )}
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
