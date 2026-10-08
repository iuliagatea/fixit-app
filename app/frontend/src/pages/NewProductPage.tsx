import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormProvider, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { ProductFormFields } from '../components/ProductFormFields'
import { fetchStatuses } from '../api/statuses'
import { createProduct } from '../api/products'
import { useAuth } from '../context/AuthContext'
import { productFieldsSchema } from '../validation/productSchema'

const schema = yup.object({
  ...productFieldsSchema,
  email: yup.string().email('Invalid email').required('Required'),
  first_name: yup.string().optional(),
  last_name: yup.string().optional(),
})

type FormValues = yup.InferType<typeof schema>

export function NewProductPage() {
  const { tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: statuses } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatuses(tenant!.id),
    enabled: Boolean(tenant),
  })

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      expected_completion_date: '',
      comments: '',
      status_id: 0,
      estimates: [],
      email: '',
      first_name: '',
      last_name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createProduct(tenant!.id, {
        product: {
          code: values.code,
          name: values.name,
          expected_completion_date: values.expected_completion_date,
          comments: values.comments,
          estimates_attributes: values.estimates,
        },
        user: { email: values.email },
        member: { first_name: values.first_name ?? '', last_name: values.last_name ?? '' },
        status_id: values.status_id,
      }),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenant?.id] })
      navigate(`/products/${product.id}`)
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setSubmitError(message ?? 'Something went wrong. Please try again.')
    },
  })

  if (!tenant || !statuses) return <Spinner animation="border" className="d-block mx-auto mt-5" />

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">New product</h1>
      {submitError && <Alert variant="danger">{submitError}</Alert>}
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit((values) => mutation.mutate(values))}>
          <Form.Group className="mb-3">
            <Form.Label>Customer email</Form.Label>
            <Form.Control {...methods.register('email')} isInvalid={!!methods.formState.errors.email} />
            <Form.Control.Feedback type="invalid">{methods.formState.errors.email?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New customer first name (only needed if they don't exist yet)</Form.Label>
            <Form.Control {...methods.register('first_name')} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New customer last name</Form.Label>
            <Form.Control {...methods.register('last_name')} />
          </Form.Group>

          <ProductFormFields statuses={statuses} />

          <Button type="submit" className="mt-3" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create product'}
          </Button>
        </Form>
      </FormProvider>
    </div>
  )
}
