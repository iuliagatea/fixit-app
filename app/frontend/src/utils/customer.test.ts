import { customerInitials, customerName } from './customer'
import type { Customer } from '../api/products'

function buildCustomer(overrides: Partial<Customer>): Customer {
  return { id: 1, email: 'jane.doe@example.com', first_name: null, last_name: null, ...overrides }
}

describe('customerName', () => {
  it('joins first and last name when both are present', () => {
    expect(customerName(buildCustomer({ first_name: 'Jane', last_name: 'Doe' }))).toBe('Jane Doe')
  })

  it('falls back to whichever name is present', () => {
    expect(customerName(buildCustomer({ first_name: 'Jane', last_name: null }))).toBe('Jane')
    expect(customerName(buildCustomer({ first_name: null, last_name: 'Doe' }))).toBe('Doe')
  })

  it('returns null when no member profile is on file', () => {
    expect(customerName(buildCustomer({ first_name: null, last_name: null }))).toBeNull()
  })
})

describe('customerInitials', () => {
  it('uses the first letter of first and last name', () => {
    expect(customerInitials(buildCustomer({ first_name: 'Jane', last_name: 'Doe' }))).toBe('JD')
  })

  it('falls back to the email when there is no name on file', () => {
    expect(customerInitials(buildCustomer({ email: 'zed@example.com' }))).toBe('ZE')
  })

  it('does not crash with a single-word name', () => {
    expect(customerInitials(buildCustomer({ first_name: 'Cher', last_name: null }))).toBe('C')
  })
})
