import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, tenant } = useAuth()

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto' }}>
      <h1 className="h4">Signed in</h1>
      <p className="mb-1">User: {user?.email}</p>
      <p className="mb-3">Tenant: {tenant ? `${tenant.name} (${tenant.plan})` : 'none'}</p>
      <Link to="/products">View products</Link>
    </div>
  )
}
