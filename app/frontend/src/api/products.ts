import { apiClient } from './client'

export interface ProductStatus {
  id: number
  name: string
  color: string
}

export interface ProductSummary {
  id: number
  code: string
  name: string
  expected_completion_date: string
  comments: string | null
  estimated_value: string
  tenant_id: number
  updated_at: string
  user: { id: number; email: string }
  current_status: ProductStatus | null
}

export interface Estimate {
  id: number
  name: string
  quantity: number
  price: string
  total_value: string
}

export interface ProductDetail extends ProductSummary {
  estimates: Estimate[]
}

export interface PaginationMeta {
  total_pages: number
  current_page: number
  per_page: number
  total_entries: number
}

export interface ProductsPage {
  products: ProductSummary[]
  meta: PaginationMeta
}

export async function fetchProducts(tenantId: number, page: number): Promise<ProductsPage> {
  const { data } = await apiClient.get<ProductsPage>(`/tenants/${tenantId}/products`, { params: { page } })
  return data
}

export async function fetchProduct(tenantId: number, productId: number): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/tenants/${tenantId}/products/${productId}`)
  return data
}
