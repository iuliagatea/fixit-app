import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Spinner, Table } from 'react-bootstrap'
import { fetchProduct, sendProductCard } from '../api/products'
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
  if (isLoading) return <Spinner animation="border" className="d-block mx-auto mt-5" />
  if (isError || !data) return <p className="text-danger text-center mt-5">Couldn't load this product.</p>

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <p>
        <Link to="/products">&larr; Back to products</Link>
      </p>
      <h1 className="h4 d-flex align-items-center gap-2">
        {data.code} - {data.name}
        {user?.is_admin && (
          <Link to={`/products/${data.id}/edit`} className="h6 mb-0">
            Edit
          </Link>
        )}
      </h1>
      <p className="mb-1">Status: {data.current_status?.name ?? 'none'}</p>
      <p className="mb-1">Expected completion: {data.expected_completion_date}</p>
      <p className="mb-1">Owner: {data.user.email}</p>
      {data.comments && <p className="mb-3">{data.comments}</p>}

      <div className="mb-3 d-flex gap-2 align-items-center">
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
      </div>
      {cardSent && <Alert variant="success">Product card sent.</Alert>}

      <h2 className="h5">Estimates</h2>
      {data.estimates.length === 0 ? (
        <p>No estimates yet.</p>
      ) : (
        <Table striped size="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Value</th>
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
              <td colSpan={3} className="text-end">
                <strong>Total</strong>
              </td>
              <td>
                <strong>{data.estimated_value}</strong>
              </td>
            </tr>
          </tbody>
        </Table>
      )}
    </div>
  )
}
