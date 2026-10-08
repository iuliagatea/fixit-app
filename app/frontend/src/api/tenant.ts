import { apiClient } from './client'

export interface TenantProfile {
  id: number
  name: string
  description: string | null
  keywords: string | null
  plan: string
  category_ids: number[]
}

export interface TenantProfilePayload {
  description?: string
  keywords?: string
  category_ids?: number[]
}

export async function fetchTenant(tenantId: number): Promise<TenantProfile> {
  const { data } = await apiClient.get<TenantProfile>(`/tenants/${tenantId}`)
  return data
}

export async function updateTenant(tenantId: number, payload: TenantProfilePayload): Promise<TenantProfile> {
  const { data } = await apiClient.patch<TenantProfile>(`/tenants/${tenantId}`, { tenant: payload })
  return data
}

export interface UpgradePayload {
  email: string
  token: string
}

export async function upgradeTenant(tenantId: number, payload: UpgradePayload): Promise<TenantProfile> {
  const { data } = await apiClient.post<TenantProfile>(`/tenants/${tenantId}/upgrade`, { payment: payload })
  return data
}
