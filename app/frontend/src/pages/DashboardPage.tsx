import { Link } from 'react-router-dom'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

interface QuickLink {
  to: string
  title: string
  description: string
}

export function DashboardPage() {
  const { user, tenant } = useAuth()

  const quickLinks: QuickLink[] = [
    { to: '/products', title: 'Products', description: 'Browse, create, and manage products for your customers.' },
    { to: '/status-board', title: 'Status board', description: 'See what’s in progress, filtered by workflow status.' },
    ...(user?.is_admin
      ? [
          { to: '/statuses', title: 'Statuses', description: 'Add, rename, or retire workflow statuses.' },
          { to: '/settings', title: 'Settings', description: 'Update your organization profile and plan.' },
        ]
      : []),
  ]

  return (
    <PageContainer maxWidth={880}>
      <div className="mb-4">
        <h1 className="h3 mb-1">Welcome back{user ? `, ${user.email}` : ''}</h1>
        {tenant && (
          <p className="text-secondary mb-0">
            {tenant.name} <Badge bg="light" text="dark" className="border ms-1 text-capitalize">{tenant.plan} plan</Badge>
          </p>
        )}
      </div>

      <Row xs={1} sm={2} className="g-3">
        {quickLinks.map((link) => (
          <Col key={link.to}>
            <Card as={Link} to={link.to} className="h-100 card-flat quick-link-card">
              <Card.Body>
                <Card.Title className="h6 mb-2">{link.title}</Card.Title>
                <Card.Text className="text-secondary small mb-0">{link.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  )
}
