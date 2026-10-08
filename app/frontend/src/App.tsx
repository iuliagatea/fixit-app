import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { useAuth } from './context/AuthContext'
import { ConfirmPage } from './pages/ConfirmPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditProductPage } from './pages/EditProductPage'
import { NewProductPage } from './pages/NewProductPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsListPage } from './pages/ProductsListPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { StatusBoardPage } from './pages/StatusBoardPage'
import { StatusesAdminPage } from './pages/StatusesAdminPage'
import { TenantSettingsPage } from './pages/TenantSettingsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="text-center mt-5">Loading…</p>
  if (!user) return <Navigate to="/sign-in" replace />

  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="text-center mt-5">Loading…</p>
  if (!user) return <Navigate to="/sign-in" replace />
  if (!user.is_admin) return <Navigate to="/" replace />

  return <>{children}</>
}

export function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={(
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/products"
          element={(
            <RequireAuth>
              <ProductsListPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/products/new"
          element={(
            <RequireAuth>
              <NewProductPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/products/:id"
          element={(
            <RequireAuth>
              <ProductDetailPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/products/:id/edit"
          element={(
            <RequireAuth>
              <EditProductPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/statuses"
          element={(
            <RequireAdmin>
              <StatusesAdminPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/status-board"
          element={(
            <RequireAuth>
              <StatusBoardPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/settings"
          element={(
            <RequireAdmin>
              <TenantSettingsPage />
            </RequireAdmin>
          )}
        />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </>
  )
}
