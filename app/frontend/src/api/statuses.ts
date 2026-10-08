import { apiClient } from './client'

export interface StatusOption {
  id: number
  name: string
  color: string
}

export async function fetchStatuses(tenantId: number): Promise<StatusOption[]> {
  const { data } = await apiClient.get<StatusOption[]>(`/tenants/${tenantId}/statuses`)
  return data
}
