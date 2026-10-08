import { apiClient } from './client'

export interface ProductStatus {
  id: number
  name: string
  color: string
}

export interface Customer {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
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
  user: Customer
  current_status: ProductStatus | null
}

export interface Estimate {
  id: number
  name: string
  quantity: number
  price: number
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

export interface ProductFilters {
  name?: string
  status_id?: number
  customer_email?: string
  completed?: boolean
}

export async function fetchProducts(
  tenantId: number,
  page: number,
  filters: ProductFilters = {},
): Promise<ProductsPage> {
  const { data } = await apiClient.get<ProductsPage>(`/tenants/${tenantId}/products`, {
    params: { page, ...filters },
  })
  return data
}

export async function fetchProduct(tenantId: number, productId: number): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/tenants/${tenantId}/products/${productId}`)
  return data
}

export interface EstimateInput {
  id?: number
  name: string
  quantity: number
  price: number
  _destroy?: boolean
}

export interface ProductPayload {
  code: string
  name: string
  expected_completion_date: string
  comments?: string
  estimates_attributes: EstimateInput[]
}

export interface CreateProductPayload {
  product: ProductPayload
  user: { email: string }
  member?: { first_name: string; last_name: string }
  status_id: number
}

export interface UpdateProductPayload {
  product: Partial<ProductPayload>
  status_id?: number
}

export async function createProduct(tenantId: number, payload: CreateProductPayload): Promise<ProductDetail> {
  const { data } = await apiClient.post<ProductDetail>(`/tenants/${tenantId}/products`, payload)
  return data
}

export async function updateProduct(
  tenantId: number,
  productId: number,
  payload: UpdateProductPayload,
): Promise<ProductDetail> {
  const { data } = await apiClient.patch<ProductDetail>(`/tenants/${tenantId}/products/${productId}`, payload)
  return data
}

export async function sendProductCard(tenantId: number, productId: number): Promise<void> {
  await apiClient.post(`/tenants/${tenantId}/products/${productId}/send_product_card`)
}
