import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

// Auth Views
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Dashboard Views
import VisitorDashboard from './pages/dashboards/VisitorDashboard'
import ManagerDashboard from './pages/dashboards/ManagerDashboard'

// Details Views
import SignalementDetailsPage from './pages/SignalementDetailsPage'

// Photos View
import PhotosPage from './pages/PhotosPage'

// Delai Moyen View
import DelaiMoyenTraitementPage from './pages/dashboards/DelaiMoyenTraitementPage'

// Type Reparation View
import TypeReparationsPage from './pages/dashboards/TypeReparationsPage'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore()
  const isAuthenticated = !!token && !!user
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      visitor: '/visitor',
      manager: '/manager'
    }
    return <Navigate to={roleRedirects[user?.role] || '/visitor'} replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, token } = useAuthStore()
  const isAuthenticated = !!token && !!user
  
  if (isAuthenticated) {
    const roleRedirects = {
      visitor: '/visitor',
      manager: '/manager'
    }
    return <Navigate to={roleRedirects[user?.role] || '/visitor'} replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      }>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Visitor Dashboard - accessible to everyone (no authentication required) */}
      <Route path="/visitor" element={<MainLayout />}>
        <Route index element={<VisitorDashboard />} />
      </Route>

      {/* Manager Dashboard */}
      <Route path="/manager" element={
        <ProtectedRoute allowedRoles={['manager']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ManagerDashboard />} />
        <Route path="signalements/:id" element={<SignalementDetailsPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="delai-moyen-traitement" element={<DelaiMoyenTraitementPage />} />
        <Route path="type-reparations" element={<TypeReparationsPage />} />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/visitor" replace />} />
      <Route path="*" element={<Navigate to="/visitor" replace />} />
    </Routes>
  )
}

export default App
