import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { completeConfirmation } from '../api/confirmations'

export function ConfirmEditPage() {
  const { applySession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const confirmationToken = searchParams.get('confirmation_token') ?? ''

  const { data, error, isLoading } = useQuery({
    queryKey: ['confirm-account', confirmationToken],
    queryFn: () => completeConfirmation(confirmationToken),
    enabled: Boolean(confirmationToken),
    retry: false,
  })

  useEffect(() => {
    if (data) {
      applySession(data)
      navigate('/')
    }
  }, [data, applySession, navigate])

  if (!confirmationToken) {
    return (
      <AuthLayout title="Confirmation link invalid">
        <p className="text-secondary text-center mb-0">This confirmation link is missing its token.</p>
      </AuthLayout>
    )
  }

  if (isLoading) {
    return (
      <AuthLayout title="Confirming your account">
        <p className="text-secondary text-center mb-0">One moment…</p>
      </AuthLayout>
    )
  }

  if (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : null
    return (
      <AuthLayout title="Confirmation failed">
        <p className="text-danger text-center mb-0">{message ?? 'Something went wrong. Please try again.'}</p>
      </AuthLayout>
    )
  }

  return null
}
