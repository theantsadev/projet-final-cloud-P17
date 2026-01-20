import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import L from 'leaflet'
import toast from 'react-hot-toast'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function UserDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    location: '',
    type: 'pothole',
    lat: -18.8792,
    lng: 47.5079
  })
  
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  // Mock user reports
  const [myReports, setMyReports] = useState([
    {
      id: 1,
      title: 'Nid de poule dangereux',
      description: 'Grand trou sur la route principale',
      location: 'Rue Rainizanabololona, Antananarivo',
      type: 'pothole',
      status: 'pending',
      createdAt: '2026-01-18',
      lat: -18.8850,
      lng: 47.5150
    },
    {
      id: 2,
      title: 'Route inondée',
      description: 'Accumulation d\'eau après les pluies',
      location: 'Avenue de France, Analakely',
      type: 'flooding',
      status: 'in-progress',
      createdAt: '2026-01-15',
      lat: -18.9100,
      lng: 47.5200
    },
    {
      id: 3,
      title: 'Panneau de signalisation manquant',
      description: 'Stop arraché au carrefour',
      location: 'Carrefour Andraharo',
      type: 'signage',
      status: 'completed',
      createdAt: '2026-01-10',
      lat: -18.8900,
      lng: 47.5300
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

  // Initialize modal map
  useEffect(() => {
    if (showModal && mapRef.current && !mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current = L.map(mapRef.current).setView([newReport.lat, newReport.lng], 14)
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(mapInstanceRef.current)

        // Add draggable marker
        markerRef.current = L.marker([newReport.lat, newReport.lng], { draggable: true })
          .addTo(mapInstanceRef.current)
          .bindPopup('Déplacez le marqueur pour indiquer l\'emplacement')

        markerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng()
          setNewReport(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }))
        })

        // Click to move marker
        mapInstanceRef.current.on('click', (e) => {
          markerRef.current.setLatLng(e.latlng)
          setNewReport(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }))
        })
      }, 100)
    }

    return () => {
      if (!showModal && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [showModal])

  const handleSubmitReport = (e) => {
    e.preventDefault()
    
    if (!newReport.title || !newReport.description || !newReport.location) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const report = {
      id: Date.now(),
      ...newReport,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    }

    setMyReports(prev => [report, ...prev])
    setShowModal(false)
    setNewReport({
      title: '',
      description: '',
      location: '',
      type: 'pothole',
      lat: -18.8792,
      lng: 47.5079
    })
    toast.success('Signalement créé avec succès!')
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { class: 'badge-pending', text: 'En attente' },
      'in-progress': { class: 'badge-in-progress', text: 'En cours' },
      'completed': { class: 'badge-completed', text: 'Terminé' }
    }
    return badges[status] || { class: '', text: status }
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

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">📝</div>
          <div className="stat-content">
            <div className="stat-label">Mes Signalements</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-content">
            <div className="stat-label">En Attente</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon info">🔧</div>
          <div className="stat-content">
            <div className="stat-label">En Traitement</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-content">
            <div className="stat-label">Résolus</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Reports List */}
        <div className="card full-width">
          <div className="card-header">
            <h3 className="card-title">📋 Mes Signalements</h3>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Nouveau Signalement
            </button>
          </div>
          <div className="card-body">
            {/* Tabs */}
            <div className="tabs">
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

            {/* Reports Table */}
            {filteredReports.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Titre</th>
                      <th>Localisation</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => {
                      const badge = getStatusBadge(report.status)
                      return (
                        <tr key={report.id}>
                          <td>
                            <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(report.type)}</span>
                          </td>
                          <td>
                            <strong>{report.title}</strong>
                            <div className="text-small text-muted">{report.description}</div>
                          </td>
                          <td>{report.location}</td>
                          <td>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td>
                            <span className={`badge ${badge.class}`}>{badge.text}</span>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button className="btn btn-secondary btn-sm" title="Voir">
                                👁️
                              </button>
                              {report.status === 'pending' && (
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  title="Supprimer"
                                  onClick={() => {
                                    setMyReports(prev => prev.filter(r => r.id !== report.id))
                                    toast.success('Signalement supprimé')
                                  }}
                                >
                                  🗑️
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
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">Aucun signalement trouvé</div>
                <p>Cliquez sur "Nouveau Signalement" pour créer votre premier rapport.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Actions Rapides</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-col gap-2">
              <button className="btn btn-primary btn-block" onClick={() => setShowModal(true)}>
                🕳️ Signaler un nid de poule
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => setShowModal(true)}>
                🌊 Signaler une inondation
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => setShowModal(true)}>
                🚧 Signaler un problème de signalisation
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => setShowModal(true)}>
                💡 Signaler un éclairage défaillant
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💡 Conseils</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-2">
              <span>📸</span>
              <span>Ajoutez des photos pour accélérer le traitement de vos signalements.</span>
            </div>
            <div className="alert alert-success mb-2">
              <span>📍</span>
              <span>Soyez précis dans la localisation pour faciliter l'intervention.</span>
            </div>
            <div className="alert alert-warning">
              <span>⚠️</span>
              <span>Pour les urgences, contactez directement les services municipaux.</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📝 Nouveau Signalement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Type de problème *</label>
                  <select 
                    className="form-select"
                    value={newReport.type}
                    onChange={e => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="pothole">🕳️ Nid de poule</option>
                    <option value="flooding">🌊 Inondation / Accumulation d'eau</option>
                    <option value="signage">🚧 Signalisation défectueuse</option>
                    <option value="lighting">💡 Éclairage public</option>
                    <option value="other">📍 Autre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Titre *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Décrivez brièvement le problème"
                    value={newReport.title}
                    onChange={e => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    placeholder="Donnez plus de détails sur le problème observé"
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
                    placeholder="ex: Rue de l'Indépendance, Antananarivo"
                    value={newReport.location}
                    onChange={e => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Position sur la carte</label>
                  <div ref={mapRef} style={{ height: '200px', borderRadius: '8px' }}></div>
                  <small className="text-muted text-small">
                    Cliquez sur la carte ou déplacez le marqueur pour préciser l'emplacement
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  ✓ Créer le signalement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard
