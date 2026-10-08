import * as yup from 'yup'

export const estimateSchema = yup.object({
  id: yup.number().optional(),
  name: yup.string().trim().min(2, 'Too short').max(100, 'Too long').required('Required'),
  quantity: yup.number().typeError('Must be a number').moreThan(0, 'Must be greater than 0').required('Required'),
  price: yup.number().typeError('Must be a number').min(0, 'Must be 0 or more').required('Required'),
})

export const productFieldsSchema = {
  code: yup
    .string()
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/, 'Only letters, numbers, and hyphens')
    .required('Required'),
  name: yup.string().trim().min(3, 'Too short').max(255, 'Too long').required('Required'),
  expected_completion_date: yup.string().required('Required'),
  comments: yup.string().optional(),
  status_id: yup.number().typeError('Select a status').min(1, 'Select a status').required('Required'),
  estimates: yup.array().of(estimateSchema).default([]),
}
