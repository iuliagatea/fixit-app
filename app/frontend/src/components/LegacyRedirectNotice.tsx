import { Button } from 'react-bootstrap'
import { AuthLayout } from './AuthLayout'

interface Props {
  title: string
  legacyPath: string
  linkText: string
}

export function LegacyRedirectNotice({ title, legacyPath, linkText }: Props) {
  return (
    <AuthLayout title={title}>
      <p className="text-secondary text-center">This isn't available in the new app yet.</p>
      <Button href={legacyPath} className="w-100">
        {linkText}
      </Button>
    </AuthLayout>
  )
}
