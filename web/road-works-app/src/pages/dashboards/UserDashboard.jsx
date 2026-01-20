import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import MapComponent from '../../components/Map/MapComponent'
import toast from 'react-hot-toast'

function UserDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [showModal, setShowModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [markerPosition, setMarkerPosition] = useState({ lat: -18.8792, lng: 47.5079 })
  
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    location: '',
    type: 'pothole',
    priority: 'medium',
    lat: -18.8792,
    lng: 47.5079
  })

  // Mock user reports
  const [myReports, setMyReports] = useState([
    {
      id: 1,
      title: 'Nid de poule dangereux',
      description: 'Grand trou sur la route principale causant des dommages aux véhicules',
      location: 'Rue Rainizanabololona, Antananarivo',
      type: 'pothole',
      priority: 'high',
      status: 'pending',
      createdAt: '2026-01-18',
      lat: -18.8850,
      lng: 47.5150,
      photos: 2,
      comments: 0
    },
    {
      id: 2,
      title: 'Route inondée après les pluies',
      description: 'Accumulation d\'eau importante bloquant la circulation',
      location: 'Avenue de France, Analakely',
      type: 'flooding',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-01-15',
      lat: -18.9100,
      lng: 47.5200,
      photos: 3,
      comments: 2,
      assignedTo: 'Équipe Drainage Nord'
    },
    {
      id: 3,
      title: 'Panneau Stop manquant',
      description: 'Panneau arraché suite à un accident, danger au carrefour',
      location: 'Carrefour Andraharo',
      type: 'signage',
      priority: 'medium',
      status: 'completed',
      createdAt: '2026-01-10',
      lat: -18.8900,
      lng: 47.5300,
      photos: 1,
      comments: 3,
      completedAt: '2026-01-17'
    },
    {
      id: 4,
      title: 'Lampadaire défaillant',
      description: 'Zone non éclairée la nuit, sentiment d\'insécurité',
      location: 'Boulevard Ratsimilaho, Isotry',
      type: 'lighting',
      priority: 'low',
      status: 'pending',
      createdAt: '2026-01-20',
      lat: -18.9000,
      lng: 47.5100,
      photos: 0,
      comments: 0
    },
    {
      id: 5,
      title: 'Glissement de terrain',
      description: 'Début d\'éboulement sur le bas-côté de la route',
      location: 'Route d\'Ambohimanga',
      type: 'other',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-01-19',
      lat: -18.8700,
      lng: 47.5400,
      photos: 5,
      comments: 4,
      assignedTo: 'Direction des Routes'
    }
  ])

  // Stats
  const stats = {
    total: myReports.length,
    pending: myReports.filter(r => r.status === 'pending').length,
    inProgress: myReports.filter(r => r.status === 'in-progress').length,
    completed: myReports.filter(r => r.status === 'completed').length
  }

  // Filtered reports
  const filteredReports = activeTab === 'all' 
    ? myReports 
    : myReports.filter(r => r.status === activeTab)

  const handleSubmitReport = (e) => {
    e.preventDefault()
    
    if (!newReport.title || !newReport.description || !newReport.location) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const report = {
      id: Date.now(),
      ...newReport,
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      photos: 0,
      comments: 0
    }

    setMyReports(prev => [report, ...prev])
    setShowModal(false)
    resetForm()
    toast.success('Signalement créé avec succès!')
  }

  const resetForm = () => {
    setNewReport({
      title: '',
      description: '',
      location: '',
      type: 'pothole',
      priority: 'medium',
      lat: -18.8792,
      lng: 47.5079
    })
    setMarkerPosition({ lat: -18.8792, lng: 47.5079 })
  }

  const getStatusConfig = (status) => ({
    'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'En attente', icon: '◷' },
    'in-progress': { color: '#3b82f6', bg: '#dbeafe', label: 'En cours', icon: '⚙' },
    'completed': { color: '#10b981', bg: '#d1fae5', label: 'Terminé', icon: '✓' }
  }[status] || { color: '#6b7280', bg: '#f3f4f6', label: status, icon: '●' })

  const getPriorityConfig = (priority) => ({
    'high': { color: '#dc2626', bg: '#fee2e2', label: 'Urgente', icon: '●' },
    'medium': { color: '#f59e0b', bg: '#fef3c7', label: 'Moyenne', icon: '●' },
    'low': { color: '#10b981', bg: '#d1fae5', label: 'Basse', icon: '●' }
  }[priority] || { color: '#6b7280', bg: '#f3f4f6', label: priority, icon: '●' })

  const getTypeConfig = (type) => ({
    'pothole': { icon: '■', label: 'Nid de poule' },
    'flooding': { icon: '▲', label: 'Inondation' },
    'signage': { icon: '◆', label: 'Signalisation' },
    'lighting': { icon: '☆', label: 'Éclairage' },
    'other': { icon: '●', label: 'Autre' }
  }[type] || { icon: '●', label: type })

  return (
    <div className="user-dashboard">
      {/* Welcome Banner */}
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h2 style={{ margin: 0, color: 'white' }}>Bonjour, {user?.email?.split('@')[0] || 'Utilisateur'}!</h2>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
                Vous avez {stats.pending} signalement(s) en attente de traitement.
              </p>
            </div>
            <button 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
              onClick={() => setShowModal(true)}
            >
              + Nouveau Signalement
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Mes Signalements</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">Total créés</div>
          </div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">En Attente</div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-change">À traiter</div>
          </div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('in-progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">En Traitement</div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-change">Équipes mobilisées</div>
          </div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('completed')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Résolus</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-change positive">Ce mois</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Reports Card */}
        <div className="card full-width">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <h3 className="card-title">Mes Signalements</h3>
              <span className="badge badge-user">{filteredReports.length} résultats</span>
            </div>
            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('list')}
                >
                  Liste
                </button>
                <button 
                  className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('map')}
                >
                  Carte
                </button>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + Nouveau
              </button>
            </div>
          </div>
          
          <div className="card-body">
            {/* Tabs */}
            <div className="tabs mb-3">
              <button 
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tous ({myReports.length})
              </button>
              <button 
                className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                En attente ({stats.pending})
              </button>
              <button 
                className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('in-progress')}
              >
                En cours ({stats.inProgress})
              </button>
              <button 
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Terminés ({stats.completed})
              </button>
            </div>

            {viewMode === 'map' ? (
              <MapComponent 
                markers={filteredReports}
                height="450px"
                onMarkerClick={(report) => setSelectedReport(report)}
              />
            ) : filteredReports.length > 0 ? (
              <div className="table-container" style={{ maxHeight: '450px', overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Signalement</th>
                      <th>Localisation</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => {
                      const status = getStatusConfig(report.status)
                      const priority = getPriorityConfig(report.priority)
                      const type = getTypeConfig(report.type)
                      return (
                        <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                              <span className="text-small text-muted">{type.label}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{report.title}</strong>
                            <div className="text-small text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {report.description}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {report.photos > 0 && (
                                <span className="text-small text-muted">{report.photos} photo(s)</span>
                              )}
                              {report.comments > 0 && (
                                <span className="text-small text-muted">{report.comments} com.</span>
                              )}
                            </div>
                          </td>
                          <td className="text-small">{report.location}</td>
                          <td>
                            <span className="badge" style={{ background: priority.bg, color: priority.color }}>
                              {priority.icon} {priority.label}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: status.bg, color: status.color }}>
                              {status.icon} {status.label}
                            </span>
                            {report.assignedTo && (
                              <div className="text-small text-muted mt-1">
                                Assigné: {report.assignedTo}
                              </div>
                            )}
                          </td>
                          <td className="text-small">
                            {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button 
                                className="btn btn-secondary btn-sm" 
                                title="Voir détails"
                                onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                              >
                                Voir
                              </button>
                              {report.status === 'pending' && (
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  title="Supprimer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm('Voulez-vous vraiment supprimer ce signalement ?')) {
                                      setMyReports(prev => prev.filter(r => r.id !== report.id))
                                      toast.success('Signalement supprimé')
                                    }
                                  }}
                                >
                                  Suppr.
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: '2rem', color: '#94a3b8' }}>✉</div>
                <div className="empty-state-title">Aucun signalement trouvé</div>
                <p>Créez votre premier signalement pour améliorer les routes d'Antananarivo!</p>
                <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>
                  + Nouveau Signalement
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Signalement Rapide</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn"
                onClick={() => { setNewReport(prev => ({ ...prev, type: 'pothole' })); setShowModal(true); }}
              >
                <span className="quick-action-icon" style={{ background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '8px' }}>■</span>
                <span>Nid de poule</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => { setNewReport(prev => ({ ...prev, type: 'flooding' })); setShowModal(true); }}
              >
                <span className="quick-action-icon" style={{ background: '#dbeafe', color: '#3b82f6', padding: '8px', borderRadius: '8px' }}>▲</span>
                <span>Inondation</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => { setNewReport(prev => ({ ...prev, type: 'signage' })); setShowModal(true); }}
              >
                <span className="quick-action-icon" style={{ background: '#fef3c7', color: '#f59e0b', padding: '8px', borderRadius: '8px' }}>◆</span>
                <span>Signalisation</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => { setNewReport(prev => ({ ...prev, type: 'lighting' })); setShowModal(true); }}
              >
                <span className="quick-action-icon" style={{ background: '#d1fae5', color: '#10b981', padding: '8px', borderRadius: '8px' }}>☆</span>
                <span>Éclairage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Conseils</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-2">
              <span style={{ fontWeight: 600 }}>Photos :</span>
              <span>Ajoutez des photos pour accélérer le traitement.</span>
            </div>
            <div className="alert alert-success mb-2">
              <span style={{ fontWeight: 600 }}>Position :</span>
              <span>Précisez bien la localisation sur la carte.</span>
            </div>
            <div className="alert alert-warning">
              <span style={{ fontWeight: 600 }}>Urgences :</span>
              <span>Appelez le 117 ou 020 22 357 53</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nouveau Signalement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Type de problème *</label>
                    <select 
                      className="form-select"
                      value={newReport.type}
                      onChange={e => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="pothole">Nid de poule</option>
                      <option value="flooding">Inondation / Accumulation d'eau</option>
                      <option value="signage">Signalisation défectueuse</option>
                      <option value="lighting">Éclairage public</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priorité *</label>
                    <select 
                      className="form-select"
                      value={newReport.priority}
                      onChange={e => setNewReport(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="high">Urgente - Danger immédiat</option>
                      <option value="medium">Moyenne - À traiter rapidement</option>
                      <option value="low">Basse - Peu urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Titre *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Ex: Nid de poule dangereux sur la route principale"
                    value={newReport.title}
                    onChange={e => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description détaillée *</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    placeholder="Décrivez le problème, son ampleur, les risques potentiels..."
                    value={newReport.description}
                    onChange={e => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse / Localisation *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Ex: Avenue de l'Indépendance, près du marché Analakely"
                    value={newReport.location}
                    onChange={e => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Position sur la carte</label>
                  <MapComponent 
                    markers={[{ id: 'new', lat: markerPosition.lat, lng: markerPosition.lng, title: 'Emplacement', status: 'pending' }]}
                    center={[markerPosition.lat, markerPosition.lng]}
                    zoom={15}
                    height="250px"
                    draggableMarker={true}
                    onMarkerDrag={(pos) => setMarkerPosition({ lat: pos.lat, lng: pos.lng })}
                  />
                  <small className="text-muted text-small mt-1" style={{ display: 'block' }}>
                    Cliquez sur la carte ou déplacez le marqueur pour préciser l'emplacement exact
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le signalement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {getTypeConfig(selectedReport.type).icon} {selectedReport.title}
              </h3>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="flex gap-2 mb-3">
                <span 
                  className="badge" 
                  style={{ 
                    background: getStatusConfig(selectedReport.status).bg, 
                    color: getStatusConfig(selectedReport.status).color 
                  }}
                >
                  {getStatusConfig(selectedReport.status).icon} {getStatusConfig(selectedReport.status).label}
                </span>
                <span 
                  className="badge"
                  style={{
                    background: getPriorityConfig(selectedReport.priority).bg,
                    color: getPriorityConfig(selectedReport.priority).color
                  }}
                >
                  {getPriorityConfig(selectedReport.priority).icon} Priorité {getPriorityConfig(selectedReport.priority).label}
                </span>
              </div>

              <p className="text-muted mb-3">{selectedReport.description}</p>

              {selectedReport.assignedTo && (
                <div className="alert alert-info mb-3">
                  <span style={{ fontWeight: 600 }}>Assigné à:</span>
                  <span><strong>{selectedReport.assignedTo}</strong></span>
                </div>
              )}

              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Localisation</label>
                  <p className="text-small">{selectedReport.location}</p>
                </div>
                <div>
                  <label className="form-label">Date de création</label>
                  <p className="text-small">{new Date(selectedReport.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="form-label">Photos</label>
                  <p className="text-small">{selectedReport.photos} photo(s) jointe(s)</p>
                </div>
                <div>
                  <label className="form-label">Commentaires</label>
                  <p className="text-small">{selectedReport.comments} commentaire(s)</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Position</label>
                <MapComponent 
                  markers={[selectedReport]}
                  center={[selectedReport.lat, selectedReport.lng]}
                  zoom={16}
                  height="200px"
                  showControls={false}
                />
              </div>
            </div>
            <div className="modal-footer">
              {selectedReport.status === 'pending' && (
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm('Voulez-vous vraiment supprimer ce signalement ?')) {
                      setMyReports(prev => prev.filter(r => r.id !== selectedReport.id))
                      setSelectedReport(null)
                      toast.success('Signalement supprimé')
                    }
                  }}
                >
                  Supprimer
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-group {
          display: flex;
          gap: 0;
        }
        .btn-group .btn:first-child {
          border-radius: 8px 0 0 8px;
        }
        .btn-group .btn:last-child {
          border-radius: 0 8px 8px 0;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          color: #475569;
        }
        .quick-action-btn:hover {
          background: #f1f5f9;
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }
        .quick-action-icon {
          font-size: 1.75rem;
        }
      `}</style>
    </div>
  )
}

export default UserDashboard
