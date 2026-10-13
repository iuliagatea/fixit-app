import { Link } from 'react-router-dom'
import { Card, Col, Row } from 'react-bootstrap'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  'Track products and repairs from intake to completion',
  'Five flexible default statuses, customizable per organization',
  'Generate estimates for your customers',
  'Email customers directly about their products',
  'Get discovered by customers searching for service providers',
  'Collect ratings and reviews from your customers',
  'Real-time email notifications as work progresses',
]

interface Plan {
  name: string
  price: string
  features: string[]
  cta: string
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: 'Free',
    features: ['Unlimited statuses', 'Responsive design', 'Access anywhere', '500 products'],
    cta: 'Sign up for free',
  },
  {
    name: 'Premium',
    price: '$10',
    features: ['Unlimited statuses', 'Responsive design', 'Access anywhere', 'Unlimited products'],
    cta: 'Get started',
  },
]

export function AboutPage() {
  const { user } = useAuth()

  return (
    <PageContainer maxWidth={880}>
      <h1 className="mb-4">If it&apos;s broken, we will FixIT!</h1>

      <ul className="mb-5">
        {FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <Row xs={1} sm={2} className="g-3">
        {PLANS.map((plan) => (
          <Col key={plan.name}>
            <Card className="h-100 card-flat">
              <Card.Body>
                <Card.Title as="h2" className="h4">{plan.name}</Card.Title>
                <hr />
                <p className="mb-3">Price: {plan.price}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {!user && (
                  <Link to="/sign-up" className="btn btn-outline-secondary">
                    {plan.cta}
                  </Link>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  )
}
