import { Link } from 'react-router-dom'
import { Button, Nav, Navbar } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

export function NavBar() {
  const { user, tenant, signOut } = useAuth()

  return (
    <Navbar bg="light" className="mb-4 px-3">
      <Navbar.Brand as={Link} to="/">FixIT</Navbar.Brand>
      <Nav className="ms-auto align-items-center">
        {user ? (
          <>
            <Navbar.Text className="me-3">
              {user.email}
              {tenant ? ` · ${tenant.name}` : ''}
            </Navbar.Text>
            <Button variant="outline-secondary" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <Nav.Link as={Link} to="/sign-in">Sign in</Nav.Link>
        )}
      </Nav>
    </Navbar>
  )
}
