import { Link } from 'react-router-dom'
import { Badge, Pagination, Table } from 'react-bootstrap'
import type { ProductsPage } from '../api/products'
import { dueStatus } from '../utils/dueDate'

interface Props {
  data: ProductsPage
  page: number
  onPageChange: (page: number) => void
  /** Flag overdue/due-soon dates — turned off for the completed table, where it's not meaningful. */
  showDueFlags?: boolean
  emptyMessage?: string
}

function rowClassFor(status: ReturnType<typeof dueStatus>): string {
  if (status === 'overdue') return 'table-danger'
  if (status === 'due-soon') return 'table-warning'
  return ''
}

export function ProductsTable({ data, page, onPageChange, showDueFlags = true, emptyMessage }: Props) {
  if (data.products.length === 0) {
    return <p className="text-secondary text-center py-5 mb-0">{emptyMessage ?? 'No products here yet.'}</p>
  }

  return (
    <>
      <Table hover responsive className="align-middle mb-0">
        <thead>
          <tr className="text-secondary small text-uppercase">
            <th className="fw-semibold">Code · Name</th>
            <th className="fw-semibold">Customer</th>
            <th className="fw-semibold">Estimated value</th>
            <th className="fw-semibold">Expected completion</th>
            <th className="fw-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.products.map((product) => {
            const due = showDueFlags ? dueStatus(product.expected_completion_date) : 'on-track'

            return (
              <tr key={product.id} className={rowClassFor(due)}>
                <td>
                  <Link to={`/products/${product.id}`} className="fw-medium text-decoration-none">
                    {product.code} - {product.name}
                  </Link>
                </td>
                <td>{product.user.email}</td>
                <td>{product.estimated_value}</td>
                <td>
                  <span className="d-inline-flex align-items-center gap-2">
                    {product.expected_completion_date}
                    {due === 'overdue' && <Badge bg="danger">Overdue</Badge>}
                    {due === 'due-soon' && (
                      <Badge bg="warning" text="dark">
                        Due soon
                      </Badge>
                    )}
                  </span>
                </td>
                <td>
                  {product.current_status && (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span className="status-dot" style={{ backgroundColor: product.current_status.color }} />
                      {product.current_status.name}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      {data.meta.total_pages > 1 && (
        <Pagination className="mt-3 mb-0">
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
