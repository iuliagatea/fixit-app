import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from 'react-bootstrap'
import { fetchProducts } from '../api/products'
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
  if (isLoading) return <Spinner animation="border" className="d-block mx-auto mt-5" />
  if (isError || !data) return <p className="text-danger text-center mt-5">Couldn't load products.</p>

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Products</h1>
        {user?.is_admin && (
          <Link to="/products/new" className="btn btn-primary btn-sm">
            New product
          </Link>
        )}
      </div>
      <ProductsTable data={data} page={page} onPageChange={setPage} />
    </div>
  )
}
