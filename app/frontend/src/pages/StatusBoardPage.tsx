import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Nav, Spinner } from 'react-bootstrap'
import { fetchStatuses, fetchStatusProducts } from '../api/statuses'
import { ProductsTable } from '../components/ProductsTable'
import { useAuth } from '../context/AuthContext'

export function StatusBoardPage() {
  const { tenant } = useAuth()
  const [statusId, setStatusId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data: statuses } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatuses(tenant!.id),
    enabled: Boolean(tenant),
  })

  useEffect(() => {
    if (statuses && statuses.length > 0 && statusId === null) {
      setStatusId(statuses[0].id)
    }
  }, [statuses, statusId])

  const { data: productsPage, isLoading } = useQuery({
    queryKey: ['status-products', tenant?.id, statusId, page],
    queryFn: () => fetchStatusProducts(tenant!.id, statusId!, page),
    enabled: Boolean(tenant) && statusId !== null,
  })

  if (!tenant || !statuses) return <Spinner animation="border" className="d-block mx-auto mt-5" />

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">Status board</h1>
      <Nav variant="tabs" className="mb-3">
        {statuses.map((status) => (
          <Nav.Item key={status.id}>
            <Nav.Link
              active={status.id === statusId}
              onClick={() => {
                setStatusId(status.id)
                setPage(1)
              }}
            >
              <span
                className="d-inline-block me-2"
                style={{ width: 10, height: 10, backgroundColor: status.color, borderRadius: '50%' }}
              />
              {status.name}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {isLoading || !productsPage ? (
        <Spinner animation="border" className="d-block mx-auto mt-5" />
      ) : (
        <ProductsTable data={productsPage} page={page} onPageChange={setPage} />
      )}
    </div>
  )
}
