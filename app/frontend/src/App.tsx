import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { useAuth } from './context/AuthContext'
import { AboutPage } from './pages/AboutPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ConfirmEditPage } from './pages/ConfirmEditPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditProductPage } from './pages/EditProductPage'
import { NewProductPage } from './pages/NewProductPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsListPage } from './pages/ProductsListPage'
import { ResetPasswordEditPage } from './pages/ResetPasswordEditPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { StatusBoardPage } from './pages/StatusBoardPage'
import { StatusesAdminPage } from './pages/StatusesAdminPage'
import { TenantProfilePage } from './pages/TenantProfilePage'
import { TenantSearchPage } from './pages/TenantSearchPage'
import { TenantSettingsPage } from './pages/TenantSettingsPage'
import { UpgradePlanPage } from './pages/UpgradePlanPage'

function LoadingScreen() {
  return (
    <div className="d-flex justify-content-center align-items-center text-secondary" style={{ minHeight: '40vh' }}>
      Loading…
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/sign-in" replace />

  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/sign-in" replace />
  if (!user.is_admin) return <Navigate to="/" replace />

  return <>{children}</>
}

export function App() {
  return (
    <div className="app-shell">
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
        <Route
          path="/account/password"
          element={(
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/upgrade"
          element={(
            <RequireAdmin>
              <UpgradePlanPage />
            </RequireAdmin>
          )}
        />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/confirm/edit" element={<ConfirmEditPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/edit" element={<ResetPasswordEditPage />} />
        <Route path="/tenants" element={<TenantSearchPage />} />
        <Route path="/tenants/:id" element={<TenantProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  )
}
