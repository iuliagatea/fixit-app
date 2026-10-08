import { LegacyRedirectNotice } from '../components/LegacyRedirectNotice'

export function SignUpPage() {
  return (
    <LegacyRedirectNotice
      title="Create an account"
      legacyPath="/users/sign_up"
      linkText="Continue to the existing sign-up page"
    />
  )
}
