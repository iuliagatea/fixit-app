import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Form } from 'react-bootstrap'
import axios from 'axios'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { signUp } from '../api/registrations'

export function SignUpPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [tenantName, setTenantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await signUp({ tenantName, email, password, passwordConfirmation })
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create an account">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="signUpTenantName">
          <Form.Label>Organization name</Form.Label>
          <Form.Control
            type="text"
            value={tenantName}
            onChange={(event) => setTenantName(event.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="signUpEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="signUpPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-2" controlId="signUpPasswordConfirmation">
          <Form.Label>Confirm password</Form.Label>
          <Form.Control
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" className="w-100 mt-2" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-secondary small mt-3 mb-0">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </Form>
    </AuthLayout>
  )
}
