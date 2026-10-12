import { apiClient } from './client'

export interface StatusCount {
  id: number
  name: string
  color: string
  count: number
}

export interface PlanUsage {
  plan: string
  product_count: number
  limit: number | null
}

export interface RatingSummary {
  average: number | null
  count: number
}

export interface DashboardSummary {
  status_counts: StatusCount[]
  total_active_products: number
  completed_this_month: number
  total_estimated_value: string
  plan: PlanUsage
  rating: RatingSummary
}

export async function fetchDashboardSummary(tenantId: number): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>(`/tenants/${tenantId}/dashboard`)
  return data
}
