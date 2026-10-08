import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Table } from 'react-bootstrap'
import { fetchProduct, sendProductCard } from '../api/products'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

export function ProductDetailPage() {
  const { user, tenant } = useAuth()
  const { id } = useParams()
  const productId = Number(id)
  const [cardSent, setCardSent] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', tenant?.id, productId],
    queryFn: () => fetchProduct(tenant!.id, productId),
    enabled: Boolean(tenant) && Number.isFinite(productId),
  })

  const sendCardMutation = useMutation({
    mutationFn: () => sendProductCard(tenant!.id, productId),
    onSuccess: () => setCardSent(true),
  })

  if (!tenant) return null

  return (
    <PageContainer maxWidth={760}>
      <Link to="/products" className="d-inline-block mb-3 text-decoration-none">
        &larr; Back to products
      </Link>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Couldn't load this product." />}

      {data && (
        <>
          <Card className="card-flat mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                  <h1 className="h3 mb-1">
                    {data.code} - {data.name}
                  </h1>
                  {data.current_status && (
                    <span className="d-inline-flex align-items-center gap-2 text-secondary">
                      <span className="status-dot" style={{ backgroundColor: data.current_status.color }} />
                      {data.current_status.name}
                    </span>
                  )}
                </div>
                {user?.is_admin && (
                  <Link to={`/products/${data.id}/edit`} className="btn btn-outline-secondary btn-sm">
                    Edit
                  </Link>
                )}
              </div>

              <dl className="row small mb-0">
                <dt className="col-4 col-sm-3 text-secondary fw-normal">Expected completion</dt>
                <dd className="col-8 col-sm-9">{data.expected_completion_date}</dd>
                <dt className="col-4 col-sm-3 text-secondary fw-normal">Owner</dt>
                <dd className="col-8 col-sm-9">{data.user.email}</dd>
                {data.comments && (
                  <>
                    <dt className="col-4 col-sm-3 text-secondary fw-normal">Comments</dt>
                    <dd className="col-8 col-sm-9 mb-0">{data.comments}</dd>
                  </>
                )}
              </dl>
            </Card.Body>
            <Card.Footer className="bg-white d-flex flex-wrap gap-2 align-items-center">
              {/* PDF generation stays server-side (wicked_pdf) — linking straight to the existing route. */}
              <a
                href={`/tenants/${data.tenant_id}/products/${data.id}.pdf`}
                className="btn btn-outline-secondary btn-sm"
                target="_blank"
                rel="noreferrer"
              >
                Download PDF
              </a>
              {user?.is_admin && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={sendCardMutation.isPending}
                  onClick={() => sendCardMutation.mutate()}
                >
                  {sendCardMutation.isPending ? 'Sending…' : 'Send product card'}
                </Button>
              )}
              {cardSent && (
                <Alert variant="success" className="py-1 px-2 mb-0 small">
                  Product card sent.
                </Alert>
              )}
            </Card.Footer>
          </Card>

          <Card className="card-flat">
            <Card.Body>
              <Card.Title className="h6 mb-3">Estimates</Card.Title>
              {data.estimates.length === 0 ? (
                <p className="text-secondary mb-0">No estimates yet.</p>
              ) : (
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr className="text-secondary small text-uppercase">
                      <th className="fw-semibold">Name</th>
                      <th className="fw-semibold">Quantity</th>
                      <th className="fw-semibold">Price</th>
                      <th className="fw-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.estimates.map((estimate) => (
                      <tr key={estimate.id}>
                        <td>{estimate.name}</td>
                        <td>{estimate.quantity}</td>
                        <td>{estimate.price}</td>
                        <td>{estimate.total_value}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="text-end fw-semibold border-0 pt-2">
                        Total
                      </td>
                      <td className="fw-semibold border-0 pt-2">{data.estimated_value}</td>
                    </tr>
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </PageContainer>
  )
}
