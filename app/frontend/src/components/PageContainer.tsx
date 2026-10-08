import type { ReactNode } from 'react'
import { Container } from 'react-bootstrap'

interface Props {
  children: ReactNode
  maxWidth?: number
}

/** Consistent page width/padding — used instead of ad-hoc inline styles per page. */
export function PageContainer({ children, maxWidth = 720 }: Props) {
  return (
    <Container className="py-4" style={{ maxWidth }}>
      {children}
    </Container>
  )
}
