import { apiClient } from './client'

export interface SignUpPayload {
  tenantName: string
  email: string
  password: string
  passwordConfirmation: string
}

export async function signUp(payload: SignUpPayload): Promise<void> {
  await apiClient.post('/sign_up', {
    tenant: { name: payload.tenantName },
    user: {
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    },
  })
}
