import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Alert, Badge, Button, Card, Form, Pagination } from 'react-bootstrap'
import axios from 'axios'
import { fetchTenantProfile } from '../api/tenantDirectory'
import { createReview, deleteReview } from '../api/reviews'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../context/AuthContext'

const schema = yup.object({
  rating: yup.number().typeError('Select a rating').min(1, 'Select a rating').max(5).required('Required'),
  title: yup.string().trim().min(2, 'Too short').max(255, 'Too long').required('Required'),
  review: yup.string().trim().min(2, 'Too short').required('Required'),
})

type FormValues = yup.InferType<typeof schema>

export function TenantProfilePage() {
  const { id } = useParams<{ id: string }>()
  const tenantId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [reviewsPage, setReviewsPage] = useState(1)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ['tenant-profile', tenantId, reviewsPage],
    queryFn: () => fetchTenantProfile(tenantId, reviewsPage),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { rating: 0, title: '', review: '' },
  })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createReview(tenantId, values),
    onSuccess: () => {
      setSubmitError(null)
      reset()
      queryClient.invalidateQueries({ queryKey: ['tenant-profile', tenantId] })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setSubmitError(message ?? 'Something went wrong. Please try again.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(tenantId, reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-profile', tenantId] }),
  })

  if (profileQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageContainer>
        <ErrorState message="Couldn't load this provider." />
      </PageContainer>
    )
  }

  const tenant = profileQuery.data

  return (
    <PageContainer maxWidth={800}>
      <h1 className="h3 mb-1">{tenant.name}</h1>
      <p className="text-secondary mb-2">
        {tenant.average_rating !== null
          ? `${tenant.average_rating.toFixed(1)} ★ (${tenant.rated_reviews_count} review${tenant.rated_reviews_count === 1 ? '' : 's'})`
          : 'No reviews yet'}
      </p>
      {tenant.categories.length > 0 && (
        <div className="mb-3">
          {tenant.categories.map((category) => (
            <Badge key={category.id} bg="secondary" className="me-1">
              {category.name}
            </Badge>
          ))}
        </div>
      )}
      {tenant.description && <p className="mb-4">{tenant.description}</p>}

      <h2 className="h5 mb-3">Reviews</h2>
      {tenant.reviews.length === 0 && <p className="text-secondary mb-4">No reviews yet.</p>}
      {tenant.reviews.map((review) => (
        <Card key={review.id} className="card-flat mb-2">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{review.title}</strong>
                <span className="text-secondary ms-2">{review.rating} ★</span>
              </div>
              {(user?.id === review.user.id || user?.is_admin) && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(review.id)}
                >
                  Delete
                </Button>
              )}
            </div>
            <p className="mb-1">{review.review}</p>
            <span className="small text-secondary">{review.user.email}</span>
          </Card.Body>
        </Card>
      ))}

      {tenant.reviews_meta.total_pages > 1 && (
        <Pagination className="mb-4">
          {Array.from({ length: tenant.reviews_meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
            <Pagination.Item key={pageNumber} active={pageNumber === reviewsPage} onClick={() => setReviewsPage(pageNumber)}>
              {pageNumber}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      <h2 className="h5 mb-3">Write a review</h2>
      {!user && (
        <p className="text-secondary">
          <Link to="/sign-in">Sign in</Link> to write a review.
        </p>
      )}
      {user && (
        <Card className="card-flat">
          <Card.Body>
            {submitError && <Alert variant="danger">{submitError}</Alert>}
            <Form onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
              <Form.Group className="mb-3" controlId="tenantReviewRating">
                <Form.Label>Rating</Form.Label>
                <Form.Select {...register('rating')} isInvalid={!!errors.rating}>
                  <option value={0}>Select a rating</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value === 1 ? '' : 's'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.rating?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3" controlId="tenantReviewTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control {...register('title')} isInvalid={!!errors.title} />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3" controlId="tenantReviewBody">
                <Form.Label>Review</Form.Label>
                <Form.Control as="textarea" rows={4} {...register('review')} isInvalid={!!errors.review} />
                <Form.Control.Feedback type="invalid">{errors.review?.message}</Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : 'Submit review'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </PageContainer>
  )
}
