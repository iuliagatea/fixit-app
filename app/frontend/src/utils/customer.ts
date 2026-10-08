import type { Customer } from '../api/products'

export function customerName(customer: Customer): string | null {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ')
  return name || null
}

export function customerInitials(customer: Customer): string {
  const name = customerName(customer)
  if (name) {
    const parts = name.split(' ')
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return customer.email.slice(0, 2).toUpperCase()
}
