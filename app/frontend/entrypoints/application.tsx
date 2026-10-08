import 'bootstrap/dist/css/bootstrap.min.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '../src/App'
import { AuthProvider } from '../src/context/AuthContext'

const queryClient = new QueryClient()
const mountNode = document.getElementById('root')

if (mountNode) {
  createRoot(mountNode).render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/app">
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  )
}
