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

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/password', { user: { email } })
}

export async function completePasswordReset(payload: {
  resetPasswordToken: string
  password: string
  passwordConfirmation: string
}): Promise<SessionPayload> {
  const { data } = await apiClient.put('/password', {
    user: {
      reset_password_token: payload.resetPasswordToken,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    },
  })
  return data
}

export async function changePassword(payload: {
  currentPassword: string
  password: string
  passwordConfirmation: string
}): Promise<SessionPayload> {
  const { data } = await apiClient.put('/me/password', {
    user: {
      current_password: payload.currentPassword,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    },
  })
  return data
}
