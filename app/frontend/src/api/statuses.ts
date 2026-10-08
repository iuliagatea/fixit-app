import { apiClient } from './client'
import type { ProductsPage } from './products'

export interface StatusOption {
  id: number
  name: string
  color: string
}

export interface StatusDetail extends StatusOption {
  is_active: boolean
  can_be_deleted: boolean
  send_email: boolean
}

export interface StatusPayload {
  name: string
  color: string
  is_active?: boolean
  send_email?: boolean
}

export async function fetchStatuses(tenantId: number): Promise<StatusOption[]> {
  const { data } = await apiClient.get<StatusOption[]>(`/tenants/${tenantId}/statuses`)
  return data
}

export async function fetchStatusesDetailed(tenantId: number): Promise<StatusDetail[]> {
  const { data } = await apiClient.get<StatusDetail[]>(`/tenants/${tenantId}/statuses`)
  return data
}

export async function createStatus(tenantId: number, payload: StatusPayload): Promise<StatusDetail> {
  const { data } = await apiClient.post<StatusDetail>(`/tenants/${tenantId}/statuses`, { status: payload })
  return data
}

export async function updateStatus(
  tenantId: number,
  statusId: number,
  payload: Partial<StatusPayload>,
): Promise<StatusDetail> {
  const { data } = await apiClient.patch<StatusDetail>(`/tenants/${tenantId}/statuses/${statusId}`, { status: payload })
  return data
}

export async function deleteStatus(tenantId: number, statusId: number): Promise<void> {
  await apiClient.delete(`/tenants/${tenantId}/statuses/${statusId}`)
}

export async function fetchStatusProducts(
  tenantId: number,
  statusId: number,
  page: number,
): Promise<ProductsPage> {
  const { data } = await apiClient.get<ProductsPage>(`/tenants/${tenantId}/statuses/${statusId}/products`, {
    params: { page },
  })
  return data
}
