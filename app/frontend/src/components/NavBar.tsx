import { Link } from 'react-router-dom'
import { Container, Nav, NavDropdown, Navbar } from 'react-bootstrap'
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
            <Nav.Link as={Link} to="/about" className="fw-medium">
              About
            </Nav.Link>
          </Nav>
          <Nav className="align-items-md-center gap-2 gap-md-3">
            {user ? (
              <NavDropdown
                align="end"
                title={
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-semibold flex-shrink-0"
                      style={{ width: 32, height: 32, fontSize: '0.7rem' }}
                    >
                      {initials(user.email)}
                    </span>
                    <span className="d-flex flex-column lh-sm text-start">
                      <span className="small fw-medium">{user.email}</span>
                      {tenant && <span className="small text-secondary">{tenant.name}</span>}
                    </span>
                  </span>
                }
              >
                <NavDropdown.Item as={Link} to="/products">
                  Products
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/status-board">
                  Status board
                </NavDropdown.Item>
                {user.is_admin && (
                  <NavDropdown.Item as={Link} to="/statuses">
                    Statuses
                  </NavDropdown.Item>
                )}
                {user.is_admin && (
                  <NavDropdown.Item as={Link} to="/settings">
                    Settings
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/account/password">
                  Change password
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => signOut()}>Sign out</NavDropdown.Item>
              </NavDropdown>
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
