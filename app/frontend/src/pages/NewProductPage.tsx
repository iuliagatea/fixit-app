import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormProvider, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import axios from 'axios'
import { ProductFormFields } from '../components/ProductFormFields'
import { LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { fetchStatuses } from '../api/statuses'
import { createProduct } from '../api/products'
import { lookupCustomer } from '../api/customers'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { productFieldsSchema } from '../validation/productSchema'

const EMAIL_LOOKUP_DEBOUNCE_MS = 400
const EMAIL_SHAPE = /\S+@\S+\.\S+/

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

  const emailValue = methods.watch('email')
  const debouncedEmail = useDebouncedValue(emailValue, EMAIL_LOOKUP_DEBOUNCE_MS)
  const emailLooksValid = EMAIL_SHAPE.test(debouncedEmail)

  const { data: existingCustomer, isFetching: lookupPending } = useQuery({
    queryKey: ['customer-lookup', tenant?.id, debouncedEmail],
    queryFn: () => lookupCustomer(tenant!.id, debouncedEmail),
    enabled: Boolean(tenant) && emailLooksValid,
  })

  // Mirrors Products::CreateService#find_or_create_user, which silently
  // ignores member_params for an email that already belongs to a customer —
  // lock the name fields to what's on file instead of letting admins type a
  // name that will be discarded.
  useEffect(() => {
    if (existingCustomer) {
      methods.setValue('first_name', existingCustomer.first_name ?? '')
      methods.setValue('last_name', existingCustomer.last_name ?? '')
    } else {
      methods.setValue('first_name', '')
      methods.setValue('last_name', '')
    }
    // `methods.setValue` is a stable reference from react-hook-form — only
    // re-run this when the lookup result itself changes.
  }, [existingCustomer])

  const customerLocked = Boolean(existingCustomer)

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

  if (!tenant || !statuses) {
    return (
      <PageContainer maxWidth={700}>
        <LoadingState />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth={700}>
      <h1 className="h3 mb-3">New product</h1>
      <Card className="card-flat">
        <Card.Body className="p-4">
          {submitError && <Alert variant="danger">{submitError}</Alert>}
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit((values) => mutation.mutate(values))}>
              <h2 className="h6 mb-3">Customer</h2>
              <Form.Group className="mb-3" controlId="newProductCustomerEmail">
                <Form.Label>Customer email</Form.Label>
                <Form.Control {...methods.register('email')} isInvalid={!!methods.formState.errors.email} />
                <Form.Control.Feedback type="invalid">{methods.formState.errors.email?.message}</Form.Control.Feedback>
                {!methods.formState.errors.email && lookupPending && (
                  <Form.Text className="text-secondary">Checking for an existing customer…</Form.Text>
                )}
                {!methods.formState.errors.email && !lookupPending && customerLocked && (
                  <Form.Text className="text-success">
                    Existing customer found — name below is locked to their profile on file.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3" controlId="newProductCustomerFirstName">
                <Form.Label>First name</Form.Label>
                <Form.Control {...methods.register('first_name')} disabled={customerLocked} />
              </Form.Group>
              <Form.Group className="mb-4" controlId="newProductCustomerLastName">
                <Form.Label>Last name</Form.Label>
                <Form.Control {...methods.register('last_name')} disabled={customerLocked} />
              </Form.Group>

              <hr className="mb-4" />
              <h2 className="h6 mb-3">Product details</h2>
              <ProductFormFields statuses={statuses} />

              <Button type="submit" className="mt-4" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create product'}
              </Button>
            </Form>
          </FormProvider>
        </Card.Body>
      </Card>
    </PageContainer>
  )
}
