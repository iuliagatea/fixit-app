import { apiClient } from './client'
import type { Customer } from './products'

export interface PaginationMeta {
  total_pages: number
  current_page: number
  per_page: number
  total_entries: number
}

export interface CategoryRef {
  id: number
  name: string
}

export interface TenantSummary {
  id: number
  name: string
  description: string | null
  category_ids: number[]
  categories: CategoryRef[]
  average_rating: number | null
  rated_reviews_count: number
}

export interface TenantReview {
  id: number
  rating: number
  title: string
  review: string
  created_at: string
  user: Customer
}

export interface TenantProfile extends TenantSummary {
  keywords: string | null
  reviews: TenantReview[]
  reviews_meta: PaginationMeta
}

export interface TenantSearchPage {
  tenants: TenantSummary[]
  meta: PaginationMeta
}

export interface TenantSearchFilters {
  query?: string
  category_id?: number
  page?: number
}

export async function searchTenants(filters: TenantSearchFilters = {}): Promise<TenantSearchPage> {
  const { data } = await apiClient.get<TenantSearchPage>('/tenant_directory', { params: filters })
  return data
}

export async function fetchTenantProfile(tenantId: number, reviewsPage?: number): Promise<TenantProfile> {
  const { data } = await apiClient.get<TenantProfile>(`/tenant_directory/${tenantId}`, {
    params: { reviews_page: reviewsPage },
  })
  return data
}
