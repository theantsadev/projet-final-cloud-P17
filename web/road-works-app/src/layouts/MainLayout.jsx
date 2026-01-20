import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role) => {
    const badges = {
      visitor: 'Visiteur',
      user: 'Utilisateur',
      manager: 'Manager'
    }
    return badges[role] || role
  }

  const getPageTitle = () => {
    switch (user?.role) {
      case 'visitor': return 'Tableau de Bord Visiteur'
      case 'user': return 'Mes Signalements'
      case 'manager': return 'Administration'
      default: return 'Tableau de Bord'
    }
  }

  return (
    <div className="main-layout">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"></div>
          <div className="sidebar-brand">
            <h1>Travaux Routiers</h1>
            <span>Antananarivo</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Navigation</div>
            
            {/* All roles can see map */}
            <NavLink 
              to="/visitor" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-link-icon"></span>
              <span className="nav-link-text">Carte des Travaux</span>
            </NavLink>

            {/* User and Manager can access reports */}
            {(user?.role === 'user' || user?.role === 'manager') && (
              <NavLink 
                to="/user" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-link-icon"></span>
                <span className="nav-link-text">Mes Signalements</span>
              </NavLink>
            )}

            {/* Only Manager can access admin */}
            {user?.role === 'manager' && (
              <NavLink 
                to="/manager" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-link-icon"></span>
                <span className="nav-link-text">Administration</span>
              </NavLink>
            )}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Statistiques</div>
            <div className="nav-link" style={{ cursor: 'default' }}>
              <span className="nav-link-icon"></span>
              <span className="nav-link-text">Vue d'ensemble</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu">
            <div className="user-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Utilisateur'}</div>
              <div className="user-role">{getRoleBadge(user?.role)}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
              
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button 
              className="toggle-sidebar" 
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileMenuOpen(!mobileMenuOpen)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              }}
            >
              
            </button>
            <h2 className="page-title">{getPageTitle()}</h2>
          </div>
          <div className="header-right">
            <span className={`badge badge-${user?.role}`}>
              {getRoleBadge(user?.role)}
            </span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
