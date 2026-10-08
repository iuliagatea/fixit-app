import axios from 'axios'
import { apiClient } from './client'
import type { Customer } from './products'

/** Returns null when no customer matches — distinct from a real request failure, which rethrows. */
export async function lookupCustomer(tenantId: number, email: string): Promise<Customer | null> {
  try {
    const { data } = await apiClient.get<Customer>(`/tenants/${tenantId}/customers/lookup`, { params: { email } })
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}
