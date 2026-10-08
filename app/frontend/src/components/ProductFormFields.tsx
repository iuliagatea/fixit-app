import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button, Form, Table } from 'react-bootstrap'
import type { StatusOption } from '../api/statuses'

export interface ProductFormFieldsValues {
  code: string
  name: string
  expected_completion_date: string
  comments?: string
  status_id: number
  estimates: { id?: number; name: string; quantity: number; price: number }[]
}

interface Props {
  statuses: StatusOption[]
}

export function ProductFormFields({ statuses }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormFieldsValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'estimates' })

  return (
    <>
      <Form.Group className="mb-3" controlId="productCode">
        <Form.Label>Code</Form.Label>
        <Form.Control {...register('code')} isInvalid={!!errors.code} />
        <Form.Control.Feedback type="invalid">{errors.code?.message}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="productName">
        <Form.Label>Name</Form.Label>
        <Form.Control {...register('name')} isInvalid={!!errors.name} />
        <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="productExpectedCompletionDate">
        <Form.Label>Expected completion date</Form.Label>
        <Form.Control
          type="date"
          {...register('expected_completion_date')}
          isInvalid={!!errors.expected_completion_date}
        />
        <Form.Control.Feedback type="invalid">{errors.expected_completion_date?.message}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="productComments">
        <Form.Label>Comments</Form.Label>
        <Form.Control as="textarea" rows={3} {...register('comments')} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="productStatusId">
        <Form.Label>Status</Form.Label>
        <Form.Select {...register('status_id', { valueAsNumber: true })} isInvalid={!!errors.status_id}>
          <option value={0}>Select a status…</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.status_id?.message}</Form.Control.Feedback>
      </Form.Group>

      <h2 className="h5">Estimates</h2>
      {fields.length > 0 && (
        <Table size="sm" className="mb-2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td>
                  <Form.Control
                    size="sm"
                    {...register(`estimates.${index}.name` as const)}
                    isInvalid={!!errors.estimates?.[index]?.name}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    step="1"
                    {...register(`estimates.${index}.quantity` as const, { valueAsNumber: true })}
                    isInvalid={!!errors.estimates?.[index]?.quantity}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    step="0.01"
                    {...register(`estimates.${index}.price` as const, { valueAsNumber: true })}
                    isInvalid={!!errors.estimates?.[index]?.price}
                  />
                </td>
                <td>
                  <Button variant="outline-danger" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => append({ name: '', quantity: 1, price: 0 })}
      >
        Add estimate
      </Button>
    </>
  )
}
