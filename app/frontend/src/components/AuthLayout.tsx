import type { ReactNode } from 'react'
import { Card } from 'react-bootstrap'

interface Props {
  title: string
  children: ReactNode
}

/** Centered single-card layout, shared by sign-in and the legacy-redirect auth stubs. */
export function AuthLayout({ title, children }: Props) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <Card className="card-flat" style={{ width: '100%', maxWidth: 380 }}>
        <Card.Body className="p-4">
          <h1 className="h4 mb-4 text-center">{title}</h1>
          {children}
        </Card.Body>
      </Card>
    </div>
  )
}
