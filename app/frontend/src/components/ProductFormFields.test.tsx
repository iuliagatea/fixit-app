import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { ProductFormFields } from './ProductFormFields'
import type { ProductFormFieldsValues } from './ProductFormFields'

const statuses = [
  { id: 1, name: 'Received', color: '#428bca' },
  { id: 2, name: 'In progress', color: '#d9534f' },
]

function Harness() {
  const methods = useForm<ProductFormFieldsValues>({
    defaultValues: {
      code: '',
      name: '',
      expected_completion_date: '',
      comments: '',
      status_id: 0,
      estimates: [],
    },
  })

  return (
    <FormProvider {...methods}>
      <form>
        <ProductFormFields statuses={statuses} />
      </form>
    </FormProvider>
  )
}

describe('ProductFormFields', () => {
  it('renders the given statuses as options', () => {
    render(<Harness />)

    expect(screen.getByRole('option', { name: 'Received' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'In progress' })).toBeInTheDocument()
  })

  it('starts with no estimates table when there are no estimates', () => {
    render(<Harness />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('adds an estimate row when "Add estimate" is clicked', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Add estimate' }))

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2) // header + 1 estimate row
  })

  it('removes an estimate row when its own Remove button is clicked', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Add estimate' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add estimate' }))
    expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 estimate rows

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])

    expect(screen.getAllByRole('row')).toHaveLength(2) // header + 1 estimate row
    expect(screen.queryAllByRole('button', { name: 'Remove' })).toHaveLength(1)
  })

  it('removes the table entirely once the last estimate is removed', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Add estimate' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
