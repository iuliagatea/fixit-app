import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Form, Table } from 'react-bootstrap'
import axios from 'axios'
import { createStatus, fetchStatusesDetailed } from '../api/statuses'
import { LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { StatusRow } from '../components/StatusRow'
import { useAuth } from '../context/AuthContext'

export function StatusesAdminPage() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#428bca')
  const [sendEmail, setSendEmail] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: statuses, isLoading } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatusesDetailed(tenant!.id),
    enabled: Boolean(tenant),
  })

  const createMutation = useMutation({
    mutationFn: () => createStatus(tenant!.id, { name, color, send_email: sendEmail }),
    onSuccess: () => {
      setName('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['statuses', tenant?.id] })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Could not create this status.')
    },
  })

  if (!tenant || isLoading || !statuses) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="h3 mb-3">Statuses</h1>
      <Card className="card-flat mb-3">
        <Table size="sm" className="align-middle mb-0">
          <thead>
            <tr className="text-secondary small text-uppercase">
              <th className="fw-semibold ps-3">Name</th>
              <th className="fw-semibold">Active</th>
              <th className="fw-semibold">Email</th>
              <th className="pe-3" />
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <StatusRow key={status.id} tenantId={tenant.id} status={status} />
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="card-flat">
        <Card.Body>
          <Card.Title className="h6 mb-3">Add a status</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form
            className="d-flex gap-2 align-items-end flex-wrap"
            onSubmit={(event) => {
              event.preventDefault()
              createMutation.mutate()
            }}
          >
            <Form.Group controlId="newStatusName">
              <Form.Label className="small text-secondary mb-1">Name</Form.Label>
              <Form.Control
                placeholder="e.g. On hold"
                value={name}
                onChange={(event) => setName(event.target.value)}
                style={{ maxWidth: 220 }}
                required
              />
            </Form.Group>
            <Form.Group controlId="newStatusColor">
              <Form.Label className="small text-secondary mb-1">Color</Form.Label>
              <Form.Control
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                style={{ maxWidth: 60 }}
              />
            </Form.Group>
            <Form.Check
              id="newStatusSendEmail"
              type="checkbox"
              label="Email customer on this status"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            <Button type="submit" disabled={createMutation.isPending}>
              Add status
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
