import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Form } from 'react-bootstrap'
import axios from 'axios'
import { AuthLayout } from '../components/AuthLayout'
import { requestPasswordReset } from '../api/passwords'

export function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <p className="text-secondary text-center mb-0">
          If that email is registered, you&apos;ll receive password reset instructions shortly.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot your password?">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="resetPasswordEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
            required
          />
        </Form.Group>
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send me reset instructions'}
        </Button>
        <p className="text-center text-secondary small mt-3 mb-0">
          <Link to="/sign-in">Back to sign in</Link>
        </p>
      </Form>
    </AuthLayout>
  )
}
