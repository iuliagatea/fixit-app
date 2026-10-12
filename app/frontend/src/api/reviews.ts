import { apiClient } from './client'
import type { TenantReview } from './tenantDirectory'

export interface ReviewPayload {
  title: string
  review: string
  rating: number
}

export async function createReview(tenantId: number, payload: ReviewPayload): Promise<TenantReview> {
  const { data } = await apiClient.post<TenantReview>(`/tenants/${tenantId}/reviews`, { review: payload })
  return data
}

export async function deleteReview(tenantId: number, reviewId: number): Promise<void> {
  await apiClient.delete(`/tenants/${tenantId}/reviews/${reviewId}`)
}
