import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { signalementAPI, usersAPI } from '../../services/api'
import toast from 'react-hot-toast'

function ManagerDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('reports')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])

  // Load data from API
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load signalements and users in parallel
      const [signalements, usersData] = await Promise.all([
        signalementAPI.getAll(),
        usersAPI.getAll().catch(() => ({ data: { data: [] } })) // Fallback if users API fails
      ])

      // Transform signalements from backend format
      const signalementsList = signalements.data?.data || []
      const transformedReports = signalementsList.map(s => ({
        id: s.id,
        title: `Signalement ${s.entrepriseConcernee || 'Travaux'}`,
        reporter: s.signaleurNom || 'Anonyme',
        reporterEmail: '-',
        type: 'other',
        status: mapBackendStatus(s.statut),
        priority: determinePriority(s.budget),
        createdAt: s.createdAt,
        location: `${s.latitude}, ${s.longitude}`,
        surface: s.surfaceM2,
        budget: s.budget,
        entreprise: s.entrepriseConcernee
      }))

      // Transform users from backend format
      const usersList = usersData.data?.data || []
      console.log(usersList)
      const transformedUsers = usersList.map(u => ({
        id: u.id,
        name: u.fullName || u.email,
        email: u.email,
        role: u?.role,  // Keep original role (string or object)
        roleValue: mapBackendRoleObject(u?.role),  // For select value
        reportsCount: 0, // TODO: Add count from backend
        createdAt: u.createdAt || new Date().toISOString(),
        locked: u.isLocked || false
      }))

      setReports(transformedReports)
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast.error('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  // Map backend status to frontend status
  const mapBackendStatus = (backendStatus) => {
    const statusMap = {
      'NOUVEAU': 'pending',
      'EN_COURS': 'in-progress',
      'TERMINE': 'completed'
    }
    return statusMap[backendStatus] || 'pending'
  }

  // Map frontend status to backend status
  const mapFrontendStatus = (frontendStatus) => {
    const statusMap = {
      'pending': 'NOUVEAU',
      'in-progress': 'EN_COURS',
      'completed': 'TERMINE'
    }
    return statusMap[frontendStatus] || 'NOUVEAU'
  }

  // Map backend role object to frontend role
  const mapBackendRoleObject = (role) => {
    if (!role) return 'user'

    // Handle both string and object formats
    const roleName = typeof role === 'string'
      ? role
      : (role?.nom || 'user')

    const lowerRole = String(roleName).toLowerCase()
    if (lowerRole === 'manager') return 'manager'
    if (lowerRole === 'user') return 'user'
    return 'user'
  }



  // Determine priority based on budget
  const determinePriority = (budget) => {
    const budgetNum = parseFloat(budget) || 0
    if (budgetNum > 5000000) return 'high'
    if (budgetNum > 1000000) return 'medium'
    return 'low'
  }

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

  const updateReportStatus = async (id, newStatus) => {
    try {
      const backendStatus = mapFrontendStatus(newStatus)
      await signalementAPI.updateStatus(id, backendStatus)

      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, status: newStatus } : r
      ))

      toast.success(`Statut mis à jour: ${newStatus === 'completed' ? 'Terminé' : newStatus === 'in-progress' ? 'En cours' : 'En attente'}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Impossible de mettre à jour le statut')
    }
  }

  const updateUserRole = async (id, newRole) => {
    try {
      // Map frontend role to backend role
      const backendRole = newRole.toUpperCase()
      await usersAPI.updateRole(id, backendRole)

      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, roleValue: newRole } : u
      ))

      toast.success(`Rôle mis à jour: ${newRole}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
      toast.error('Impossible de mettre à jour le rôle')
    }
  }
  const unlockUser = async (id) => {
    try {
      const response = await usersAPI.unlockUser(id)

      // Reload users list to show updated status
      await loadData()

      toast.success('Utilisateur débloqué avec succès')
    } catch (error) {
      console.error('Erreur lors du déblocage:', error)
      toast.error(error.response?.data?.message || 'Impossible de débloquer l\'utilisateur')
    }
  }
  const deleteReport = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      return
    }

    try {
      await signalementAPI.delete(id)

      setReports(prev => prev.filter(r => r.id !== id))
      toast.success('Signalement supprimé')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Impossible de supprimer le signalement')
    }
  }

  // Sync Functions
  const syncUsersPush = async () => {
    try {
      setLoading(true)
      await usersAPI.syncPushAll()
      toast.success('✅ Synchronisation PUSH des utilisateurs vers Firebase réussie')
      await loadData()
    } catch (error) {
      console.error('Erreur sync users push:', error)
      toast.error('Impossible de synchroniser les utilisateurs vers Firebase')
    } finally {
      setLoading(false)
    }
  }

  const syncUsersPull = async () => {
    try {
      setLoading(true)
      await usersAPI.syncPullAll()
      toast.success('✅ Synchronisation PULL des utilisateurs depuis Firebase réussie')
      await loadData()
    } catch (error) {
      console.error('Erreur sync users pull:', error)
      toast.error('Impossible de synchroniser les utilisateurs depuis Firebase')
    } finally {
      setLoading(false)
    }
  }

  const syncSignalementsPush = async () => {
    try {
      setLoading(true)
      await signalementAPI.syncPushAll()
      toast.success('✅ Synchronisation PUSH des signalements vers Firebase réussie')
      await loadData()
    } catch (error) {
      console.error('Erreur sync signalements push:', error)
      toast.error('Impossible de synchroniser les signalements vers Firebase')
    } finally {
      setLoading(false)
    }
  }

  const syncSignalementsPull = async () => {
    try {
      setLoading(true)
      await signalementAPI.syncPullAll()
      toast.success('✅ Synchronisation PULL des signalements depuis Firebase réussie')
      await loadData()
    } catch (error) {
      console.error('Erreur sync signalements pull:', error)
      toast.error('Impossible de synchroniser les signalements depuis Firebase')
    } finally {
      setLoading(false)
    }
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
      'pothole': '■',
      'flooding': '▲',
      'signage': '◆',
      'lighting': '☆',
      'other': '●'
    }
    return icons[type] || '●'
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
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', color: '#3b82f6' }}>⟳</div>
          <p>Chargement des données...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Signalements</div>
                <div className="stat-value">{stats.totalReports}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Haute Priorité</div>
                <div className="stat-value">{stats.highPriority}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">En Attente</div>
                <div className="stat-value">{stats.pendingReports}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Utilisateurs</div>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>
            </div>
          </div>

          {/* Sync Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={syncUsersPush}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s'
              }}
            >
              📤 Sync Users → Firebase
            </button>
            <button
              onClick={syncUsersPull}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s'
              }}
            >
              📥 Sync Users ← Firebase
            </button>
            <button
              onClick={syncSignalementsPush}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s'
              }}
            >
              📤 Sync Signalements → Firebase
            </button>
            <button
              onClick={syncSignalementsPull}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s'
              }}
            >
              📥 Sync Signalements ← Firebase
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/manager/type-reparations')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s'
              }}
            >
              🔧 Gérer les Types de Réparation
            </button>
            <button
              onClick={() => navigate('/manager/delai-moyen-traitement')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s'
              }}
            >
              📊 Délai Moyen de Traitement
            </button>
          </div>

          {/* Main Content */}
          <div className="dashboard-grid">
            {/* Chart & Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Répartition des Signalements</h3>
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
                <h3 className="card-title">Top Contributeurs</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <ul className="list-group">
                  {users
                    .filter(u => u.roleValue !== 'visitor')
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
                          {index === 0 ? '' : index === 1 ? '' : index === 2 ? '' : index + 1}
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
                  Signalements ({reports.length})
                </button>
                <button
                  className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  Utilisateurs ({users.length})
                </button>
              </div>
              <div className="search-box" style={{ width: '300px' }}>
                <span className="search-box-icon"></span>
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
                                <button
                                  className="btn btn-secondary btn-sm"
                                  title="Voir"
                                  onClick={() => navigate(`/manager/signalements/${report.id}`)}
                                >
                                  Voir
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  title="Supprimer"
                                  onClick={() => deleteReport(report.id)}
                                >
                                  Suppr.
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
                      <div className="empty-state-icon" style={{ fontSize: '2rem', color: '#94a3b8' }}>⌕</div>
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
                        const roleBadge = getRoleBadge(u.roleValue)
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
                                value={u.roleValue}
                                onChange={e => updateUserRole(u.id, e.target.value)}
                              >
                                <option value="user">Utilisateur</option>
                                <option value="manager">Manager</option>
                              </select>
                            </td>

                            <td>{u.reportsCount}</td>
                            <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-secondary btn-sm" title="Voir le profil">Profil</button>
                                {u.locked && (
                                  <button
                                    className="btn btn-success btn-sm"
                                    title="Débloquer"
                                    onClick={() => unlockUser(u.id)}
                                  >
                                    Débloquer
                                  </button>
                                )}
                                {u.role !== 'manager' && (
                                  <button className="btn btn-danger btn-sm" title="Désactiver">Désact.</button>
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
                      <div className="empty-state-icon"></div>
                      <div className="empty-state-title">Aucun résultat</div>
                      <p>Aucun utilisateur ne correspond à votre recherche.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ManagerDashboard
