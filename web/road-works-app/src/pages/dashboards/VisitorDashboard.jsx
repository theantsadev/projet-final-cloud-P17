import { useState, useEffect } from 'react'
import MapComponent from '../../components/Map/MapComponent'
import { signalementAPI } from '../../services/api'
import toast from 'react-hot-toast'

function VisitorDashboard() {
  const [filter, setFilter] = useState('all')
  const [selectedWork, setSelectedWork] = useState(null)
  const [viewMode, setViewMode] = useState('map') // 'map' or 'list'
  const [roadWorks, setRoadWorks] = useState([])
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load signalements from API
  useEffect(() => {
    loadSignalements()
  }, [])

  const loadSignalements = async () => {
    try {
      setLoading(true)

      // Load signalements and statistics in parallel
      const [signalements, statsData] = await Promise.all([
        signalementAPI.getAll(),
        signalementAPI.getRecap()
      ])

      // Backend returns ApiResponse with data field: { success: true, data: [...], message: "..." }
      const signalementsList = signalements.data?.data || []
      const statsInfo = statsData.data?.data || null

      // Transform backend data to frontend format
      const transformedWorks = signalementsList.map(s => ({
        id: s.id,
        title: `Signalement ${s.entrepriseConcernee || 'Travaux'}`,
        description: `Surface: ${s.surfaceM2}m² - Budget: ${s.budget} Ar`,
        status: s.statut.toLowerCase().replace('_', '-'), // NOUVEAU -> nouveau, EN_COURS -> en-cours, TERMINE -> termine
        priority: 'medium',
        lat: s.latitude,
        lng: s.longitude,
        location: `Coordonnées: ${s.latitude}, ${s.longitude}`,
        startDate: s.createdAt,
        endDate: null,
        progress: s.statut === 'TERMINE' ? 100 : (s.statut === 'EN_COURS' ? 50 : 0),
        contractor: s.entrepriseConcernee || 'Non défini',
        surface: s.surfaceM2,
        budget: parseFloat(s.budget) || 0
      }))

      setRoadWorks(transformedWorks)
      setRecap(statsInfo)
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error)
      toast.error('Impossible de charger les signalements')
      // Keep mock data as fallback
      setRoadWorks(getMockData())
    } finally {
      setLoading(false)
    }
  }

  const getMockData = () => [
    {
      id: 1,
      title: 'Réfection Avenue de l\'Indépendance',
      description: 'Rénovation complète de la chaussée et des trottoirs sur 2km',
      status: 'en-cours',
      priority: 'high',
      lat: -18.8792,
      lng: 47.5079,
      location: 'Avenue de l\'Indépendance, Analakely',
      startDate: '2026-01-10',
      endDate: '2026-02-28',
      progress: 45,
      contractor: 'COLAS Madagascar'
    },
    {
      id: 2,
      title: 'Travaux d\'assainissement Analakely',
      description: 'Installation de nouvelles canalisations d\'évacuation des eaux',
      status: 'nouveau',
      priority: 'medium',
      lat: -18.9108,
      lng: 47.5216,
      location: 'Quartier Analakely',
      startDate: '2026-02-01',
      endDate: '2026-04-15',
      progress: 0,
      contractor: 'JIRAMA'
    },
    {
      id: 3,
      title: 'Réparation Pont Anosibe',
      description: 'Renforcement structurel et élargissement du pont',
      status: 'termine',
      priority: 'high',
      lat: -18.9250,
      lng: 47.5100,
      location: 'Pont d\'Anosibe',
      startDate: '2025-10-01',
      endDate: '2026-01-05',
      progress: 100,
      contractor: 'SOGEA SATOM'
    },
    {
      id: 4,
      title: 'Élargissement Route Ivandry',
      description: 'Ajout d\'une voie supplémentaire pour fluidifier le trafic',
      status: 'en-cours',
      priority: 'high',
      lat: -18.8950,
      lng: 47.5350,
      location: 'Route principale Ivandry',
      startDate: '2026-01-15',
      endDate: '2026-06-30',
      progress: 20,
      contractor: 'ENTREPRISE ANDRIANAIVO'
    },
    {
      id: 5,
      title: 'Nouvelle signalisation Andraharo',
      description: 'Installation de feux tricolores et panneaux directionnels',
      status: 'nouveau',
      priority: 'low',
      lat: -18.8850,
      lng: 47.5280,
      location: 'Carrefour Andraharo',
      startDate: '2026-02-15',
      endDate: '2026-02-28',
      progress: 0,
      contractor: 'COMMUNE URBAINE'
    },
    {
      id: 6,
      title: 'Réhabilitation Route Digue',
      description: 'Reconstruction de la chaussée endommagée par les inondations',
      status: 'en-cours',
      priority: 'high',
      lat: -18.9150,
      lng: 47.5050,
      location: 'Route Digue, Isotry',
      startDate: '2026-01-05',
      endDate: '2026-03-31',
      progress: 65,
      contractor: 'COLAS Madagascar'
    }
  ]

  // Stats - use recap data if available, otherwise calculate from roadWorks
  const pendingCount = roadWorks.filter(w => w.status === 'pending' || w.status === 'nouveau').length
  const inProgressCount = roadWorks.filter(w => w.status === 'in-progress' || w.status === 'en-cours').length
  const completedCount = roadWorks.filter(w => w.status === 'completed' || w.status === 'termine').length
  //  .totalSignalements(total)
  //                 .signalementNouveaux(nouveaux)
  //                 .signalementEnCours(enCours)
  //                 .signalementTermines(termines)
  //                 .signalementAnnules(annules)
  //                 .totalSurfaceM2(totalSurfaceM2)
  //                 .totalBudget(totalBudget)
  //                 .averageAvancement(averageAvancement)
  const stats = recap ? {
    total: recap.totalSignalements || roadWorks.length,
    pending: recap.signalementNouveaux || pendingCount,
    inProgress: recap.signalementEnCours || inProgressCount,
    completed: recap.signalementTermines || completedCount,
    totalSurface: recap.totalSurfaceM2 || 0,
    totalBudget: recap.totalBudget || 0,
    progress: recap.averageAvancement || 0
  } : {
    total: roadWorks.length,
    pending: pendingCount,
    inProgress: inProgressCount,
    completed: completedCount,
    totalSurface: roadWorks.reduce((sum, w) => sum + (w.surface || 0), 0),
    totalBudget: roadWorks.reduce((sum, w) => sum + (w.budget || 0), 0),
    progress: roadWorks.length > 0 ? Math.round((completedCount / roadWorks.length) * 100) : 0
  }

  // Filtered works
  const filteredWorks = filter === 'all'
    ? roadWorks
    : roadWorks.filter(w => {
      const status = w.status.toLowerCase()
      if (filter === 'pending') return status === 'pending' || status === 'nouveau'
      if (filter === 'in-progress') return status === 'in-progress' || status === 'en-cours'
      if (filter === 'completed') return status === 'completed' || status === 'termine'
      return w.status === filter
    })

  const getStatusConfig = (status) => {
    const normalizedStatus = status.toLowerCase()
    const configs = {
      'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'En attente', icon: '◷' },
      'nouveau': { color: '#f59e0b', bg: '#fef3c7', label: 'Nouveau', icon: '◷' },
      'in-progress': { color: '#3b82f6', bg: '#dbeafe', label: 'En cours', icon: '⚙' },
      'en-cours': { color: '#3b82f6', bg: '#dbeafe', label: 'En cours', icon: '⚙' },
      'completed': { color: '#10b981', bg: '#d1fae5', label: 'Terminé', icon: '✓' },
      'termine': { color: '#10b981', bg: '#d1fae5', label: 'Terminé', icon: '✓' },
      'cancelled': { color: '#ef4444', bg: '#fee2e2', label: 'Annulé', icon: '✗' }
    }
    return configs[normalizedStatus] || { color: '#6b7280', bg: '#f3f4f6', label: status, icon: '●' }
  }

  const getPriorityConfig = (priority) => ({
    'high': { color: '#dc2626', label: 'Haute' },
    'medium': { color: '#f59e0b', label: 'Moyenne' },
    'low': { color: '#10b981', label: 'Basse' }
  }[priority] || { color: '#6b7280', label: priority })

  return (
    <div className="visitor-dashboard">
      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="loader" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ color: '#6b7280' }}>Chargement des signalements...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Header Stats */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Travaux</div>
                <div className="stat-value">{stats.total}</div>
                <div className="stat-change positive">Sur Antananarivo</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon warning">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Nouveau</div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-change">À démarrer</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilter('in-progress')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">En Cours</div>
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-change">Actifs maintenant</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilter('completed')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Terminés</div>
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-change positive">{stats.progress}% complétés</div>
              </div>
            </div>

            {/* Additional stats from recap */}
            {recap && (
              <>
                <div className="stat-card">
                  <div className="stat-icon info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Surface Totale</div>
                    <div className="stat-value">{stats.totalSurface?.toLocaleString()} m²</div>
                    <div className="stat-change">Travaux cumulés</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Budget Total</div>
                    <div className="stat-value">{(stats.totalBudget / 1000000).toFixed(1)}M Ar</div>
                    <div className="stat-change">Investissement total</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="dashboard-grid">
            {/* Map Card - Full Width */}
            <div className="card full-width">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <h3 className="card-title">Carte des Travaux - Antananarivo</h3>
                  <span className="badge badge-user">{filteredWorks.length} travaux affichés</span>
                </div>
                <div className="flex gap-2">
                  {/* View Toggle */}
                  <div className="btn-group">
                    <button
                      className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setViewMode('map')}
                    >
                      Carte
                    </button>
                    <button
                      className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setViewMode('list')}
                    >
                      Liste
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="tabs" style={{ margin: 0, padding: 0, border: 'none' }}>
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                      Tous
                    </button>
                    <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                      Nouveau
                    </button>
                    <button className={`tab ${filter === 'in-progress' ? 'active' : ''}`} onClick={() => setFilter('in-progress')}>
                      En cours
                    </button>
                    <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
                      Terminés
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                {viewMode === 'map' ? (
                  <div style={{ position: 'relative' }}>
                    <MapComponent
                      markers={filteredWorks}
                      height="500px"
                      onMarkerClick={(work) => setSelectedWork(work)}
                    />
                  </div>
                ) : (
                  <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Projet</th>
                          <th>Localisation</th>
                          <th>Statut</th>
                          <th>Priorité</th>
                          <th>Progression</th>
                          <th>Dates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorks.map(work => {
                          const status = getStatusConfig(work.status)
                          const priority = getPriorityConfig(work.priority)
                          return (
                            <tr key={work.id} onClick={() => setSelectedWork(work)} style={{ cursor: 'pointer' }}>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: '1.25rem' }}>{status.icon}</span>
                                  <div>
                                    <strong>{work.title}</strong>
                                    <div className="text-small text-muted">{work.contractor}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{work.location}</td>
                              <td>
                                <span className="badge" style={{ background: status.bg, color: status.color }}>
                                  {status.label}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: priority.color, fontWeight: 500 }}>
                                  {priority.label}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="progress-bar" style={{ width: '60px' }}>
                                    <div
                                      className="progress-fill"
                                      style={{
                                        width: `${work.progress}%`,
                                        background: status.color
                                      }}
                                    />
                                  </div>
                                  <span className="text-small">{work.progress}%</span>
                                </div>
                              </td>
                              <td className="text-small">
                                {new Date(work.startDate).toLocaleDateString('fr-FR')}
                                <br />
                                <span className="text-muted">→ {new Date(work.endDate).toLocaleDateString('fr-FR')}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Activité Récente</h3>
              </div>
              <div className="card-body" style={{ padding: 0, maxHeight: '350px', overflow: 'auto' }}>
                <ul className="list-group">
                  {roadWorks.slice(0, 5).map(work => {
                    const status = getStatusConfig(work.status)
                    return (
                      <li
                        key={work.id}
                        className="list-item"
                        onClick={() => setSelectedWork(work)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="list-item-icon" style={{ background: status.bg }}>
                          {status.icon}
                        </div>
                        <div className="list-item-content">
                          <div className="list-item-title">{work.title}</div>
                          <div className="list-item-subtitle">
                            {work.location} • {new Date(work.startDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <span className="badge" style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* Legend & Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Légende & Informations</h3>
              </div>
              <div className="card-body">
                <div className="donut-legend mb-3">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#f59e0b' }}></div>
                    <span className="legend-text">En attente</span>
                    <span className="legend-value">{stats.pending}</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                    <span className="legend-text">En cours</span>
                    <span className="legend-value">{stats.inProgress}</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#10b981' }}></div>
                    <span className="legend-text">Terminés</span>
                    <span className="legend-value">{stats.completed}</span>
                  </div>
                </div>

                <div className="alert alert-info mb-2">
                  <span style={{ fontWeight: 600 }}>Conseil :</span>
                  <span>Cliquez sur un marqueur pour voir les détails du chantier.</span>
                </div>

                <div className="alert alert-warning">
                  <span style={{ fontWeight: 600 }}>Note :</span>
                  <span>Pensez à consulter les déviations avant vos déplacements.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Modal */}
          {selectedWork && (
            <div className="modal-overlay" onClick={() => setSelectedWork(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                  <h3 className="modal-title">{selectedWork.title}</h3>
                  <button className="modal-close" onClick={() => setSelectedWork(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="flex gap-2 mb-3">
                    <span
                      className="badge"
                      style={{
                        background: getStatusConfig(selectedWork.status).bg,
                        color: getStatusConfig(selectedWork.status).color
                      }}
                    >
                      {getStatusConfig(selectedWork.status).icon} {getStatusConfig(selectedWork.status).label}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: '#f3f4f6',
                        color: getPriorityConfig(selectedWork.priority).color
                      }}
                    >
                      Priorité {getPriorityConfig(selectedWork.priority).label}
                    </span>
                  </div>

                  <p className="text-muted mb-3">{selectedWork.description}</p>

                  <div className="mb-3">
                    <label className="form-label">Progression</label>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar" style={{ flex: 1, height: '12px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${selectedWork.progress}%`,
                            background: getStatusConfig(selectedWork.status).color
                          }}
                        />
                      </div>
                      <span className="text-small" style={{ fontWeight: 600 }}>{selectedWork.progress}%</span>
                    </div>
                  </div>

                  <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Localisation</label>
                      <p className="text-small">{selectedWork.location}</p>
                    </div>
                    <div>
                      <label className="form-label">Entreprise</label>
                      <p className="text-small">{selectedWork.contractor}</p>
                    </div>
                    <div>
                      <label className="form-label">Date de début</label>
                      <p className="text-small">{new Date(selectedWork.startDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="form-label">Date de fin prévue</label>
                      <p className="text-small">{new Date(selectedWork.endDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Localisation sur la carte</label>
                    <MapComponent
                      markers={[selectedWork]}
                      center={[selectedWork.lat, selectedWork.lng]}
                      zoom={15}
                      height="200px"
                      showControls={false}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setSelectedWork(null)}>
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
        .btn-group .btn:not(:first-child):not(:last-child) {
          border-radius: 0;
        }
      `}</style>
        </>
      )}
    </div>
  )
}

export default VisitorDashboard
