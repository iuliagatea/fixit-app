import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, Form } from 'react-bootstrap'
import axios from 'axios'
import { fetchCategories } from '../api/categories'
import { fetchTenant, updateTenant } from '../api/tenant'
import { LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

export function TenantSettingsPage() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['tenant-profile', tenant?.id],
    queryFn: () => fetchTenant(tenant!.id),
    enabled: Boolean(tenant),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', 'tenant'],
    queryFn: () => fetchCategories('tenant'),
  })

  useEffect(() => {
    if (!profile) return
    setDescription(profile.description ?? '')
    setKeywords(profile.keywords ?? '')
    setCategoryIds(profile.category_ids)
  }, [profile])

  const mutation = useMutation({
    mutationFn: () => updateTenant(tenant!.id, { description, keywords, category_ids: categoryIds }),
    onSuccess: () => {
      setSaved(true)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['tenant-profile', tenant?.id] })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setError(message ?? 'Could not save changes.')
    },
  })

  const toggleCategory = (id: number) => {
    setCategoryIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]))
  }

  if (!tenant || profileLoading || !profile || !categories) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="h3 mb-3">Settings</h1>

      <Card className="card-flat mb-3">
        <Card.Body className="p-4">
          {saved && <Alert variant="success">Saved.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <Form.Group className="mb-3" controlId="tenantSettingsName">
              <Form.Label>Organization</Form.Label>
              <Form.Control value={profile.name} disabled />
            </Form.Group>
            <Form.Group className="mb-3" controlId="tenantSettingsDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="tenantSettingsKeywords">
              <Form.Label>Keywords</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Categories</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((category) => {
                  const checked = categoryIds.includes(category.id)
                  return (
                    <Form.Check
                      key={category.id}
                      id={`tenantSettingsCategory-${category.id}`}
                      type="checkbox"
                      label={category.name}
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                      className={`border rounded-pill px-3 py-1 ${checked ? 'border-primary bg-primary-subtle' : ''}`}
                    />
                  )
                })}
              </div>
            </Form.Group>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="card-flat">
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <Card.Title className="h6 mb-1">Plan</Card.Title>
            <Badge bg={profile.plan === 'premium' ? 'primary' : 'light'} text={profile.plan === 'premium' ? undefined : 'dark'} className="text-capitalize border">
              {profile.plan}
            </Badge>
          </div>
          {profile.plan === 'free' && (
            <Link to="/upgrade" className="btn btn-primary btn-sm">
              Upgrade to Premium
            </Link>
          )}
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
