import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Pagination, Spinner, Table } from 'react-bootstrap'
import { fetchProducts } from '../api/products'
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
      {data.products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <Table striped responsive>
          <thead>
            <tr>
              <th>Code · Name</th>
              <th>Estimated value</th>
              <th>Expected completion</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link to={`/products/${product.id}`}>
                    {product.code} - {product.name}
                  </Link>
                </td>
                <td>{product.estimated_value}</td>
                <td>{product.expected_completion_date}</td>
                <td>
                  {product.current_status && (
                    <Badge style={{ backgroundColor: product.current_status.color }}>
                      {product.current_status.name}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data.meta.total_pages > 1 && (
        <Pagination>
          {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
            <Pagination.Item key={pageNumber} active={pageNumber === page} onClick={() => setPage(pageNumber)}>
              {pageNumber}
            </Pagination.Item>
          ))}
        </Pagination>
      )}
    </div>
  )
}
