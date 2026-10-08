import { LegacyRedirectNotice } from '../components/LegacyRedirectNotice'

export function ConfirmPage() {
  return (
    <LegacyRedirectNotice
      title="Confirm your account"
      legacyPath="/users/confirmation/new"
      linkText="Continue to the existing confirmation page"
    />
  )
}
