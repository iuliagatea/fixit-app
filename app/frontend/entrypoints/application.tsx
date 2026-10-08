import 'bootstrap/dist/css/bootstrap.min.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '../src/App'
import { AuthProvider } from '../src/context/AuthContext'

const mountNode = document.getElementById('root')

if (mountNode) {
  createRoot(mountNode).render(
    <BrowserRouter basename="/app">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>,
  )
}
