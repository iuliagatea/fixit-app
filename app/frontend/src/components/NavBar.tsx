import { Link } from 'react-router-dom'
import { Button, Nav, Navbar } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

export function NavBar() {
  const { user, tenant, signOut } = useAuth()

  return (
    <Navbar bg="light" className="mb-4 px-3">
      <Navbar.Brand as={Link} to="/">FixIT</Navbar.Brand>
      <Nav className="me-auto">
        {user && <Nav.Link as={Link} to="/products">Products</Nav.Link>}
        {user && <Nav.Link as={Link} to="/status-board">Status board</Nav.Link>}
        {user?.is_admin && <Nav.Link as={Link} to="/statuses">Statuses</Nav.Link>}
        {user?.is_admin && <Nav.Link as={Link} to="/settings">Settings</Nav.Link>}
      </Nav>
      <Nav className="align-items-center">
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
