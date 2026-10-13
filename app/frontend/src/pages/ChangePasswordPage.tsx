import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import axios from 'axios'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/passwords'

export function ChangePasswordPage() {
  const { applySession } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSaved(false)

    try {
      const session = await changePassword({ currentPassword, password, passwordConfirmation })
      applySession(session)
      setSaved(true)
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <h1 className="h3 mb-3">Change password</h1>
      <Card className="card-flat" style={{ maxWidth: 480 }}>
        <Card.Body className="p-4">
          {saved && <Alert variant="success">Your password has been changed.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="changePasswordCurrent">
              <Form.Label>Current password</Form.Label>
              <Form.Control
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="changePasswordNew">
              <Form.Label>New password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="changePasswordConfirmation">
              <Form.Label>Confirm new password</Form.Label>
              <Form.Control
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Change password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
