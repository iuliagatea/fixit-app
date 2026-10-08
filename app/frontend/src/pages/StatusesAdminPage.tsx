import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import axios from 'axios'
import { createStatus, fetchStatusesDetailed } from '../api/statuses'
import { StatusRow } from '../components/StatusRow'
import { useAuth } from '../context/AuthContext'

export function StatusesAdminPage() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#428bca')
  const [error, setError] = useState<string | null>(null)

  const { data: statuses, isLoading } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatusesDetailed(tenant!.id),
    enabled: Boolean(tenant),
  })

  const createMutation = useMutation({
    mutationFn: () => createStatus(tenant!.id, { name, color }),
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

  if (!tenant || isLoading || !statuses) return <Spinner animation="border" className="d-block mx-auto mt-5" />

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">Statuses</h1>
      <Table size="sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => (
            <StatusRow key={status.id} tenantId={tenant.id} status={status} />
          ))}
        </tbody>
      </Table>

      <h2 className="h6 mt-4">Add a status</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form
        className="d-flex gap-2 align-items-center"
        onSubmit={(event) => {
          event.preventDefault()
          createMutation.mutate()
        }}
      >
        <Form.Control
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ maxWidth: 200 }}
          required
        />
        <Form.Control
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          style={{ maxWidth: 60 }}
        />
        <Button type="submit" size="sm" disabled={createMutation.isPending}>
          Add
        </Button>
      </Form>
    </div>
  )
}
