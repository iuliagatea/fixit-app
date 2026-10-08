import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { stripePromise } from '../api/stripe'
import { upgradeTenant } from '../api/tenant'
import { useAuth } from '../context/AuthContext'

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
      <Form.Group className="mb-3">
        <Form.Label>Billing email</Form.Label>
        <Form.Control type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Card details</Form.Label>
        <div className="form-control" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <CardElement />
        </div>
      </Form.Group>
      <Button type="submit" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : 'Upgrade to Premium'}
      </Button>
    </Form>
  )
}

export function UpgradePlanPage() {
  const { tenant } = useAuth()

  if (!tenant) return <Spinner animation="border" className="d-block mx-auto mt-5" />

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">Upgrade to Premium</h1>
      <Elements stripe={stripePromise}>
        <UpgradeForm />
      </Elements>
    </div>
  )
}
