import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import axios from 'axios'
import { stripePromise } from '../api/stripe'
import { upgradeTenant } from '../api/tenant'
import { LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

const cardElementOptions = {
  style: {
    base: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#1e293b',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#dc2626' },
  },
}

function UpgradeForm() {
  const { tenant } = useAuth()
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tokenizing, setTokenizing] = useState(false)

  const mutation = useMutation({
    mutationFn: (token: string) => upgradeTenant(tenant!.id, { email, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-profile', tenant?.id] })
      navigate('/settings')
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Something went wrong. Please try again.')
    },
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setTokenizing(true)
    setError(null)

    const { token, error: stripeError } = await stripe.createToken(cardElement)
    setTokenizing(false)

    if (stripeError || !token) {
      setError(stripeError?.message ?? 'Could not validate card details.')
      return
    }

    mutation.mutate(token.id)
  }

  const submitting = tokenizing || mutation.isPending

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3" controlId="upgradeBillingEmail">
        <Form.Label>Billing email</Form.Label>
        <Form.Control type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </Form.Group>
      <Form.Group className="mb-4">
        {/* No controlId here — Stripe's CardElement renders into its own
            iframe, so there's no real input id for a label to point at. */}
        <Form.Label>Card details</Form.Label>
        <div className="form-control" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <CardElement options={cardElementOptions} />
        </div>
      </Form.Group>
      <Button type="submit" className="w-100" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : 'Upgrade to Premium'}
      </Button>
    </Form>
  )
}

export function UpgradePlanPage() {
  const { tenant } = useAuth()

  if (!tenant) {
    return (
      <PageContainer maxWidth={480}>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth={480}>
      <Link to="/settings" className="d-inline-block mb-3 text-decoration-none">
        &larr; Back to settings
      </Link>
      <Card className="card-flat">
        <Card.Body className="p-4">
          <h1 className="h4 mb-1">Upgrade to Premium</h1>
          <p className="text-secondary small mb-4">Unlimited products, no more 500-product cap.</p>
          <Elements stripe={stripePromise}>
            <UpgradeForm />
          </Elements>
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
