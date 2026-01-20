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
import UserDashboard from './pages/dashboards/UserDashboard'
import ManagerDashboard from './pages/dashboards/ManagerDashboard'

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
      user: '/user',
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
      user: '/user',
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

      {/* Visitor Dashboard - accessible to all authenticated users */}
      <Route path="/visitor" element={
        <ProtectedRoute allowedRoles={['visitor', 'user', 'manager']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<VisitorDashboard />} />
      </Route>

      {/* User Dashboard */}
      <Route path="/user" element={
        <ProtectedRoute allowedRoles={['user', 'manager']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<UserDashboard />} />
      </Route>

      {/* Manager Dashboard */}
      <Route path="/manager" element={
        <ProtectedRoute allowedRoles={['manager']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ManagerDashboard />} />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  )
}

export default App
