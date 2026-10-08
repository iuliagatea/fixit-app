import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from 'react-bootstrap'
import { fetchProducts } from '../api/products'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { ProductsTable } from '../components/ProductsTable'
import { useAuth } from '../context/AuthContext'

export function ProductsListPage() {
  const { user, tenant } = useAuth()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', tenant?.id, page],
    queryFn: () => fetchProducts(tenant!.id, page),
    enabled: Boolean(tenant),
  })

  if (!tenant) return null

  return (
    <PageContainer maxWidth={960}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Products</h1>
          {data && <p className="text-secondary mb-0">{data.meta.total_entries} total</p>}
        </div>
        {user?.is_admin && (
          <Link to="/products/new" className="btn btn-primary">
            New product
          </Link>
        )}
      </div>
      <Card className="card-flat">
        <Card.Body>
          {isLoading && <LoadingState />}
          {isError && <ErrorState message="Couldn't load products." />}
          {data && <ProductsTable data={data} page={page} onPageChange={setPage} />}
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
