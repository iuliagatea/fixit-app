import { LegacyRedirectNotice } from '../components/LegacyRedirectNotice'

export function ResetPasswordPage() {
  return (
    <LegacyRedirectNotice
      title="Reset your password"
      legacyPath="/users/password/new"
      linkText="Continue to the existing password reset page"
    />
  )
}
