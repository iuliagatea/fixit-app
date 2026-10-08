import { useState } from 'react'
import { Alert, Badge, Button, Form } from 'react-bootstrap'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { deleteStatus, updateStatus } from '../api/statuses'
import type { StatusDetail } from '../api/statuses'

interface Props {
  tenantId: number
  status: StatusDetail
}

export function StatusRow({ tenantId, status }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(status.name)
  const [color, setColor] = useState(status.color)
  const [sendEmail, setSendEmail] = useState(status.send_email)
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['statuses', tenantId] })

  const updateMutation = useMutation({
    mutationFn: () => updateStatus(tenantId, status.id, { name, color, send_email: sendEmail }),
    onSuccess: () => {
      setEditing(false)
      invalidate()
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Could not save this status.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteStatus(tenantId, status.id),
    onSuccess: invalidate,
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Could not delete this status.')
    },
  })

  if (editing) {
    return (
      <tr>
        <td colSpan={4} className="py-2 ps-3 pe-3">
          {error && <Alert variant="danger" className="py-1">{error}</Alert>}
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <Form.Control size="sm" value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 200 }} />
            <Form.Control
              size="sm"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ maxWidth: 60 }}
            />
            <Form.Check
              id={`status-send-email-${status.id}`}
              type="checkbox"
              label="Email customer on this status"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              Save
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="ps-3">
        <span className="d-inline-flex align-items-center gap-2">
          <span className="status-dot" style={{ backgroundColor: status.color }} />
          {status.name}
        </span>
      </td>
      <td>
        <Badge bg={status.is_active ? 'success' : 'secondary'} className="fw-normal">
          {status.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td>
        <Badge
          bg={status.send_email ? 'info' : 'light'}
          text={status.send_email ? undefined : 'dark'}
          className="fw-normal border"
        >
          {status.send_email ? 'Emails customer' : 'Silent'}
        </Badge>
      </td>
      <td className="text-end pe-3">
        {error && <Alert variant="danger" className="py-1 mb-1">{error}</Alert>}
        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline-danger"
          disabled={!status.can_be_deleted || deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
        >
          Delete
        </Button>
      </td>
    </tr>
  )
}
