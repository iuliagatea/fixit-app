import { apiClient } from './client'

export interface CategoryOption {
  id: number
  name: string
  entity: string
}

export async function fetchCategories(entity: string): Promise<CategoryOption[]> {
  const { data } = await apiClient.get<CategoryOption[]>('/categories', { params: { entity } })
  return data
}
