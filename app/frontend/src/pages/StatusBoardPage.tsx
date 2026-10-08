import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Nav } from 'react-bootstrap'
import { fetchStatuses, fetchStatusProducts } from '../api/statuses'
import { LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
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

  if (!tenant || !statuses) {
    return (
      <PageContainer maxWidth={960}>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth={960}>
      <h1 className="h3 mb-3">Status board</h1>
      <Nav variant="pills" className="mb-3 gap-2 flex-wrap">
        {statuses.map((status) => (
          <Nav.Item key={status.id}>
            <Nav.Link
              active={status.id === statusId}
              className="rounded-pill border"
              onClick={() => {
                setStatusId(status.id)
                setPage(1)
              }}
            >
              <span className="d-inline-flex align-items-center gap-2">
                <span className="status-dot" style={{ backgroundColor: status.color }} />
                {status.name}
              </span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <Card className="card-flat">
        <Card.Body>
          {isLoading || !productsPage ? <LoadingState /> : <ProductsTable data={productsPage} page={page} onPageChange={setPage} />}
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
