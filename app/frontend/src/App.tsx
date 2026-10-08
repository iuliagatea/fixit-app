import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { useAuth } from './context/AuthContext'
import { ConfirmPage } from './pages/ConfirmPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsListPage } from './pages/ProductsListPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="text-center mt-5">Loading…</p>
  if (!user) return <Navigate to="/sign-in" replace />

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
          path="/products/:id"
          element={(
            <RequireAuth>
              <ProductDetailPage />
            </RequireAuth>
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
