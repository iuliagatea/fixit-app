import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Form } from 'react-bootstrap'
import axios from 'axios'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { completePasswordReset } from '../api/passwords'

export function ResetPasswordEditPage() {
  const { applySession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetPasswordToken = searchParams.get('reset_password_token') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const session = await completePasswordReset({ resetPasswordToken, password, passwordConfirmation })
      applySession(session)
      navigate('/')
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="resetPasswordNewPassword">
          <Form.Label>New password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="resetPasswordConfirmation">
          <Form.Label>Confirm new password</Form.Label>
          <Form.Control
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? 'Saving…' : 'Change my password'}
        </Button>
      </Form>
    </AuthLayout>
  )
}
