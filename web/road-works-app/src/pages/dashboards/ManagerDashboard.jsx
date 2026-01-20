import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

function ManagerDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('reports')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data
  const [reports, setReports] = useState([
    {
      id: 1,
      title: 'Nid de poule Avenue de l\'Indépendance',
      reporter: 'Jean Rakoto',
      reporterEmail: 'jean@test.com',
      type: 'pothole',
      status: 'pending',
      priority: 'high',
      createdAt: '2026-01-19',
      location: 'Avenue de l\'Indépendance'
    },
    {
      id: 2,
      title: 'Inondation route Analakely',
      reporter: 'Marie Razafy',
      reporterEmail: 'marie@test.com',
      type: 'flooding',
      status: 'in-progress',
      priority: 'medium',
      createdAt: '2026-01-18',
      location: 'Analakely'
    },
    {
      id: 3,
      title: 'Panneau stop manquant',
      reporter: 'Paul Andria',
      reporterEmail: 'paul@test.com',
      type: 'signage',
      status: 'pending',
      priority: 'low',
      createdAt: '2026-01-17',
      location: 'Carrefour Andraharo'
    },
    {
      id: 4,
      title: 'Éclairage défaillant Ivandry',
      reporter: 'Hery Rabe',
      reporterEmail: 'hery@test.com',
      type: 'lighting',
      status: 'completed',
      priority: 'medium',
      createdAt: '2026-01-15',
      location: 'Ivandry'
    },
    {
      id: 5,
      title: 'Route effondrée Anosibe',
      reporter: 'Tiana Solo',
      reporterEmail: 'tiana@test.com',
      type: 'other',
      status: 'in-progress',
      priority: 'high',
      createdAt: '2026-01-14',
      location: 'Anosibe'
    }
  ])

  const [users, setUsers] = useState([
    { id: 1, name: 'Jean Rakoto', email: 'jean@test.com', role: 'user', reportsCount: 5, createdAt: '2025-12-01' },
    { id: 2, name: 'Marie Razafy', email: 'marie@test.com', role: 'user', reportsCount: 3, createdAt: '2025-12-15' },
    { id: 3, name: 'Paul Andria', email: 'paul@test.com', role: 'visitor', reportsCount: 0, createdAt: '2026-01-01' },
    { id: 4, name: 'Hery Rabe', email: 'hery@test.com', role: 'user', reportsCount: 8, createdAt: '2025-11-20' },
    { id: 5, name: 'Admin', email: 'admin@test.com', role: 'manager', reportsCount: 2, createdAt: '2025-10-01' }
  ])

  // Stats
  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    inProgressReports: reports.filter(r => r.status === 'in-progress').length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    totalUsers: users.length,
    highPriority: reports.filter(r => r.priority === 'high' && r.status !== 'completed').length
  }

  // Filtered data
  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const updateReportStatus = (id, newStatus) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ))
    toast.success(`Statut mis à jour: ${newStatus === 'completed' ? 'Terminé' : newStatus === 'in-progress' ? 'En cours' : 'En attente'}`)
  }

  const updateUserRole = (id, newRole) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, role: newRole } : u
    ))
    toast.success(`Rôle mis à jour: ${newRole}`)
  }

  const deleteReport = (id) => {
    setReports(prev => prev.filter(r => r.id !== id))
    toast.success('Signalement supprimé')
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { class: 'badge-pending', text: 'En attente' },
      'in-progress': { class: 'badge-in-progress', text: 'En cours' },
      'completed': { class: 'badge-completed', text: 'Terminé' }
    }
    return badges[status] || { class: '', text: status }
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': { style: { background: '#fee2e2', color: '#dc2626' }, text: 'Haute' },
      'medium': { style: { background: '#fef3c7', color: '#d97706' }, text: 'Moyenne' },
      'low': { style: { background: '#d1fae5', color: '#059669' }, text: 'Basse' }
    }
    return badges[priority] || { style: {}, text: priority }
  }

  const getRoleBadge = (role) => {
    const badges = {
      'visitor': { class: 'badge-visitor', text: 'Visiteur' },
      'user': { class: 'badge-user', text: 'Utilisateur' },
      'manager': { class: 'badge-manager', text: 'Manager' }
    }
    return badges[role] || { class: '', text: role }
  }

  const getTypeIcon = (type) => {
    const icons = {
      'pothole': '🕳️',
      'flooding': '🌊',
      'signage': '🚧',
      'lighting': '💡',
      'other': '📍'
    }
    return icons[type] || '📍'
  }

  // Donut chart data
  const donutData = [
    { label: 'En attente', value: stats.pendingReports, color: '#f59e0b' },
    { label: 'En cours', value: stats.inProgressReports, color: '#3b82f6' },
    { label: 'Terminés', value: stats.completedReports, color: '#10b981' }
  ]
  
  const total = donutData.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercent = 0

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Signalements</div>
            <div className="stat-value">{stats.totalReports}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon danger">🚨</div>
          <div className="stat-content">
            <div className="stat-label">Haute Priorité</div>
            <div className="stat-value">{stats.highPriority}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-content">
            <div className="stat-label">En Attente</div>
            <div className="stat-value">{stats.pendingReports}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-content">
            <div className="stat-label">Utilisateurs</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Chart & Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Répartition des Signalements</h3>
          </div>
          <div className="card-body">
            <div className="donut-chart">
              <div className="donut-visual">
                <svg width="150" height="150" viewBox="0 0 150 150" className="donut-svg">
                  <circle className="donut-ring" cx="75" cy="75" r="60" />
                  {donutData.map((item, index) => {
                    const percent = total > 0 ? (item.value / total) * 100 : 0
                    const dashArray = (percent * 377) / 100
                    const dashOffset = -cumulativePercent * 377 / 100
                    cumulativePercent += percent
                    
                    return (
                      <circle
                        key={index}
                        className="donut-segment"
                        cx="75"
                        cy="75"
                        r="60"
                        stroke={item.color}
                        strokeDasharray={`${dashArray} ${377 - dashArray}`}
                        strokeDashoffset={dashOffset}
                        style={{ transformOrigin: 'center' }}
                      />
                    )
                  })}
                </svg>
                <div className="donut-center">
                  <div className="donut-value">{total}</div>
                  <div className="donut-label">Total</div>
                </div>
              </div>
              <div className="donut-legend">
                {donutData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ background: item.color }}></div>
                    <span className="legend-text">{item.label}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Top Contributeurs</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <ul className="list-group">
              {users
                .filter(u => u.role !== 'visitor')
                .sort((a, b) => b.reportsCount - a.reportsCount)
                .slice(0, 5)
                .map((user, index) => (
                  <li key={user.id} className="list-item">
                    <div 
                      className="list-item-icon"
                      style={{ 
                        background: index === 0 ? '#fef3c7' : index === 1 ? '#e2e8f0' : index === 2 ? '#fed7aa' : '#f1f5f9',
                        fontWeight: 'bold'
                      }}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{user.name}</div>
                      <div className="list-item-subtitle">{user.email}</div>
                    </div>
                    <span className="badge badge-user">{user.reportsCount} signalements</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="tabs" style={{ margin: 0, padding: 0, border: 'none' }}>
            <button 
              className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📋 Signalements ({reports.length})
            </button>
            <button 
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Utilisateurs ({users.length})
            </button>
          </div>
          <div className="search-box" style={{ width: '300px' }}>
            <span className="search-box-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {activeTab === 'reports' ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Titre</th>
                    <th>Signalé par</th>
                    <th>Localisation</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => {
                    const statusBadge = getStatusBadge(report.status)
                    const priorityBadge = getPriorityBadge(report.priority)
                    return (
                      <tr key={report.id}>
                        <td>
                          <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(report.type)}</span>
                        </td>
                        <td>
                          <strong>{report.title}</strong>
                        </td>
                        <td>
                          <div>{report.reporter}</div>
                          <div className="text-small text-muted">{report.reporterEmail}</div>
                        </td>
                        <td>{report.location}</td>
                        <td>
                          <span className="badge" style={priorityBadge.style}>{priorityBadge.text}</span>
                        </td>
                        <td>
                          <select 
                            className="form-select"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            value={report.status}
                            onChange={e => updateReportStatus(report.id, e.target.value)}
                          >
                            <option value="pending">En attente</option>
                            <option value="in-progress">En cours</option>
                            <option value="completed">Terminé</option>
                          </select>
                        </td>
                        <td>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-secondary btn-sm" title="Voir">👁️</button>
                            <button 
                              className="btn btn-danger btn-sm" 
                              title="Supprimer"
                              onClick={() => deleteReport(report.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">Aucun résultat</div>
                  <p>Aucun signalement ne correspond à votre recherche.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Signalements</th>
                    <th>Inscrit le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const roleBadge = getRoleBadge(u.role)
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div 
                              className="user-avatar" 
                              style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                            >
                              {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <strong>{u.name}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <select 
                            className="form-select"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            value={u.role}
                            onChange={e => updateUserRole(u.id, e.target.value)}
                          >
                            <option value="visitor">Visiteur</option>
                            <option value="user">Utilisateur</option>
                            <option value="manager">Manager</option>
                          </select>
                        </td>
                        <td>{u.reportsCount}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-secondary btn-sm" title="Voir le profil">👤</button>
                            {u.role !== 'manager' && (
                              <button className="btn btn-danger btn-sm" title="Désactiver">🚫</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">Aucun résultat</div>
                  <p>Aucun utilisateur ne correspond à votre recherche.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
