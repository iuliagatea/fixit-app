import { apiClient } from './client'

interface CurrentUser {
  id: number
  email: string
  is_admin: boolean
}

interface CurrentTenant {
  id: number
  name: string
  plan: string
}

interface SessionPayload {
  user: CurrentUser
  tenant: CurrentTenant | null
}

export async function resendConfirmation(email: string): Promise<void> {
  await apiClient.post('/confirmation', { user: { email } })
}

export async function completeConfirmation(confirmationToken: string): Promise<SessionPayload> {
  const { data } = await apiClient.put('/confirmation', { user: { confirmation_token: confirmationToken } })
  return data
}
