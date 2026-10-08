import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import type { StatusOption } from '../api/statuses'

export interface ProductFilterValues {
  name: string
  status_id: number | ''
  customer_email: string
}

export const emptyProductFilters: ProductFilterValues = { name: '', status_id: '', customer_email: '' }

interface Props {
  value: ProductFilterValues
  onChange: (value: ProductFilterValues) => void
  statuses: StatusOption[]
}

export function ProductFilterBar({ value, onChange, statuses }: Props) {
  const hasFilters = value.name !== '' || value.status_id !== '' || value.customer_email !== ''

  return (
    <Card className="card-flat mb-3">
      <Card.Body>
        <Row className="g-3 align-items-end">
          <Col sm={6} md={4}>
            <Form.Group controlId="productFilterName">
              <Form.Label className="small text-secondary mb-1">Product name or code</Form.Label>
              <Form.Control
                placeholder="Search…"
                value={value.name}
                onChange={(event) => onChange({ ...value, name: event.target.value })}
              />
            </Form.Group>
          </Col>
          <Col sm={6} md={3}>
            <Form.Group controlId="productFilterStatus">
              <Form.Label className="small text-secondary mb-1">Status</Form.Label>
              <Form.Select
                value={value.status_id}
                onChange={(event) =>
                  onChange({ ...value, status_id: event.target.value ? Number(event.target.value) : '' })
                }
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={8} md={4}>
            <Form.Group controlId="productFilterCustomerEmail">
              <Form.Label className="small text-secondary mb-1">Customer email</Form.Label>
              <Form.Control
                placeholder="Search…"
                value={value.customer_email}
                onChange={(event) => onChange({ ...value, customer_email: event.target.value })}
              />
            </Form.Group>
          </Col>
          <Col sm={4} md={1}>
            <Button
              variant="outline-secondary"
              className="w-100"
              disabled={!hasFilters}
              onClick={() => onChange(emptyProductFilters)}
            >
              Clear
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
