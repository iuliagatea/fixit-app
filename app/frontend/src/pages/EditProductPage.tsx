import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormProvider, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { ProductFormFields } from '../components/ProductFormFields'
import { fetchStatuses } from '../api/statuses'
import { fetchProduct, updateProduct } from '../api/products'
import { useAuth } from '../context/AuthContext'
import { productFieldsSchema } from '../validation/productSchema'

const schema = yup.object(productFieldsSchema)
type FormValues = yup.InferType<typeof schema>

export function EditProductPage() {
  const { tenant } = useAuth()
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', tenant?.id, productId],
    queryFn: () => fetchProduct(tenant!.id, productId),
    enabled: Boolean(tenant) && Number.isFinite(productId),
  })

  const { data: statuses } = useQuery({
    queryKey: ['statuses', tenant?.id],
    queryFn: () => fetchStatuses(tenant!.id),
    enabled: Boolean(tenant),
  })

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { code: '', name: '', expected_completion_date: '', comments: '', status_id: 0, estimates: [] },
  })

  useEffect(() => {
    if (!product) return

    methods.reset({
      code: product.code,
      name: product.name,
      expected_completion_date: product.expected_completion_date,
      comments: product.comments ?? '',
      status_id: product.current_status?.id ?? 0,
      estimates: product.estimates.map((estimate) => ({
        id: estimate.id,
        name: estimate.name,
        quantity: estimate.quantity,
        price: estimate.price,
      })),
    })
  }, [product, methods])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateProduct(tenant!.id, productId, {
        product: {
          code: values.code,
          name: values.name,
          expected_completion_date: values.expected_completion_date,
          comments: values.comments,
          estimates_attributes: values.estimates,
        },
        status_id: values.status_id,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['product', tenant?.id, productId] })
      navigate(`/products/${updated.id}`)
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : null
      setSubmitError(message ?? 'Something went wrong. Please try again.')
    },
  })

  if (!tenant || productLoading || !statuses) return <Spinner animation="border" className="d-block mx-auto mt-5" />
  if (!product) return <p className="text-danger text-center mt-5">Couldn't load this product.</p>

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h1 className="h4 mb-3">Edit product</h1>
      {submitError && <Alert variant="danger">{submitError}</Alert>}
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit((values) => mutation.mutate(values))}>
          <ProductFormFields statuses={statuses} />
          <Button type="submit" className="mt-3" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </Form>
      </FormProvider>
    </div>
  )
}
