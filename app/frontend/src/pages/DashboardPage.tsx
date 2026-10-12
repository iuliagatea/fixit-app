import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Col, ProgressBar, Row } from 'react-bootstrap'
import { PageContainer } from '../components/PageContainer'
import { LoadingState, ErrorState } from '../components/AsyncState'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardSummary } from '../api/dashboard'
import { fetchProducts } from '../api/products'
import { dueStatus } from '../utils/dueDate'

interface QuickLink {
  to: string
  title: string
  description: string
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Col>
      <Card className="h-100 card-flat">
        <Card.Body>
          <div className="text-secondary small text-uppercase fw-semibold mb-1">{label}</div>
          <div className="h4 mb-0">{value}</div>
        </Card.Body>
      </Card>
    </Col>
  )
}

export function DashboardPage() {
  const { user, tenant } = useAuth()

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ['dashboard-summary', tenant?.id],
    queryFn: () => fetchDashboardSummary(tenant!.id),
    enabled: Boolean(tenant),
  })

  const { data: recentProducts, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent-products', tenant?.id],
    queryFn: () => fetchProducts(tenant!.id, 1, {}, 5),
    enabled: Boolean(tenant),
  })

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

      {summaryLoading && <LoadingState />}
      {summaryError && <ErrorState message="Couldn’t load your dashboard summary." />}

      {summary && (
        <>
          <Row xs={1} sm={3} className="g-3 mb-3">
            <StatCard label="Active products" value={String(summary.total_active_products)} />
            <StatCard label="Completed this month" value={String(summary.completed_this_month)} />
            <StatCard label="Estimated value (active)" value={summary.total_estimated_value} />
          </Row>

          <Row xs={1} sm={2} className="g-3 mb-3">
            <Col>
              <Card className="h-100 card-flat">
                <Card.Body>
                  <Card.Title className="h6 mb-3">Products by status</Card.Title>
                  {summary.status_counts.length === 0 ? (
                    <p className="text-secondary small mb-0">No statuses configured yet.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {summary.status_counts.map((status) => (
                        <li key={status.id} className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="status-dot" style={{ backgroundColor: status.color }} />
                            {status.name}
                          </span>
                          <Badge bg="light" text="dark" className="border">{status.count}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col>
              <Card className="h-100 card-flat">
                <Card.Body>
                  <Card.Title className="h6 mb-3">Rating</Card.Title>
                  {summary.rating.count === 0 ? (
                    <p className="text-secondary small mb-0">No reviews yet.</p>
                  ) : (
                    <p className="mb-0">
                      <span className="h4 me-2">{summary.rating.average?.toFixed(1)}</span>
                      <span className="text-secondary small">
                        from {summary.rating.count} review{summary.rating.count === 1 ? '' : 's'}
                      </span>
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {user?.is_admin && (
            <Row xs={1} className="g-3 mb-3">
              <Col>
                <Card className="h-100 card-flat">
                  <Card.Body>
                    <Card.Title className="h6 mb-3">Plan usage</Card.Title>
                    {summary.plan.limit === null ? (
                      <Badge bg="light" text="dark" className="border text-capitalize">{summary.plan.plan} plan</Badge>
                    ) : (
                      <>
                        <ProgressBar
                          now={(summary.plan.product_count / summary.plan.limit) * 100}
                          className="mb-2"
                        />
                        <p className="text-secondary small mb-0">
                          {summary.plan.product_count} / {summary.plan.limit} products used ·{' '}
                          <Link to="/upgrade">Upgrade to premium</Link>
                        </p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      <Card className="card-flat mb-4">
        <Card.Body>
          <Card.Title className="h6 mb-3">Recently added products</Card.Title>
          {recentLoading && <LoadingState />}
          {recentProducts && recentProducts.products.length === 0 && (
            <p className="text-secondary small mb-0">No products yet.</p>
          )}
          {recentProducts && recentProducts.products.length > 0 && (
            <ul className="list-unstyled mb-0">
              {recentProducts.products.map((product) => {
                const due = dueStatus(product.expected_completion_date)
                return (
                  <li key={product.id} className="d-flex align-items-center justify-content-between py-1">
                    <Link to={`/products/${product.id}`} className="text-decoration-none fw-medium">
                      {product.code} - {product.name}
                    </Link>
                    <span className="d-inline-flex align-items-center gap-2 text-secondary small">
                      {product.current_status && (
                        <span className="d-inline-flex align-items-center gap-2">
                          <span className="status-dot" style={{ backgroundColor: product.current_status.color }} />
                          {product.current_status.name}
                        </span>
                      )}
                      {product.expected_completion_date}
                      {due === 'overdue' && <Badge bg="danger">Overdue</Badge>}
                      {due === 'due-soon' && <Badge bg="warning" text="dark">Due soon</Badge>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card.Body>
      </Card>

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
