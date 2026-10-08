import { Link } from 'react-router-dom'
import { Badge, Pagination, Table } from 'react-bootstrap'
import type { ProductsPage } from '../api/products'

interface Props {
  data: ProductsPage
  page: number
  onPageChange: (page: number) => void
}

export function ProductsTable({ data, page, onPageChange }: Props) {
  if (data.products.length === 0) return <p>No products here.</p>

  return (
    <>
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
      {data.meta.total_pages > 1 && (
        <Pagination>
          {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
            <Pagination.Item key={pageNumber} active={pageNumber === page} onClick={() => onPageChange(pageNumber)}>
              {pageNumber}
            </Pagination.Item>
          ))}
        </Pagination>
      )}
    </>
  )
}
