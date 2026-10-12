import { Link } from 'react-router-dom'
import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function NavBar() {
  const { user, tenant, signOut } = useAuth()

  return (
    <Navbar bg="white" expand="md" className="border-bottom sticky-top shadow-sm">
      <Container style={{ maxWidth: 1100 }}>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
          FixIT
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/tenants" className="fw-medium">
              Find a provider
            </Nav.Link>
            {user && (
              <Nav.Link as={Link} to="/products" className="fw-medium">
                Products
              </Nav.Link>
            )}
            {user && (
              <Nav.Link as={Link} to="/status-board" className="fw-medium">
                Status board
              </Nav.Link>
            )}
            {user?.is_admin && (
              <Nav.Link as={Link} to="/statuses" className="fw-medium">
                Statuses
              </Nav.Link>
            )}
            {user?.is_admin && (
              <Nav.Link as={Link} to="/settings" className="fw-medium">
                Settings
              </Nav.Link>
            )}
          </Nav>
          <Nav className="align-items-md-center gap-2 gap-md-3">
            {user ? (
              <>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-semibold flex-shrink-0"
                    style={{ width: 32, height: 32, fontSize: '0.7rem' }}
                  >
                    {initials(user.email)}
                  </span>
                  <div className="d-flex flex-column lh-sm">
                    <span className="small fw-medium">{user.email}</span>
                    {tenant && <span className="small text-secondary">{tenant.name}</span>}
                  </div>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/sign-in" className="fw-medium">
                Sign in
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
