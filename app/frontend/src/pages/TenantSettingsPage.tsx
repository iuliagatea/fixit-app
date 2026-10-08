import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { fetchCategories } from '../api/categories'
import { fetchTenant, updateTenant } from '../api/tenant'
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
    return <Spinner animation="border" className="d-block mx-auto mt-5" />
  }

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">Tenant settings</h1>
      {saved && <Alert variant="success">Saved.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>Organization</Form.Label>
          <Form.Control value={profile.name} disabled />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Keywords</Form.Label>
          <Form.Control as="textarea" rows={2} value={keywords} onChange={(event) => setKeywords(event.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Categories</Form.Label>
          {categories.map((category) => (
            <Form.Check
              key={category.id}
              type="checkbox"
              label={category.name}
              checked={categoryIds.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
          ))}
        </Form.Group>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>

      <hr className="my-4" />
      <p className="text-muted mb-0">
        Current plan: <strong>{profile.plan}</strong>.{' '}
        {profile.plan === 'free' && <Link to="/upgrade">Upgrade to Premium</Link>}
      </p>
    </div>
  )
}
