import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function VisitorDashboard() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [filter, setFilter] = useState('all')

  // Mock data for road works
  const roadWorks = [
    {
      id: 1,
      title: 'Réfection de chaussée - Avenue de l\'Indépendance',
      status: 'in-progress',
      lat: -18.8792,
      lng: 47.5079,
      startDate: '2026-01-10',
      endDate: '2026-02-15',
      description: 'Rénovation complète de la chaussée'
    },
    {
      id: 2,
      title: 'Travaux d\'assainissement - Analakely',
      status: 'pending',
      lat: -18.9108,
      lng: 47.5216,
      startDate: '2026-01-25',
      endDate: '2026-03-01',
      description: 'Installation de nouvelles canalisations'
    },
    {
      id: 3,
      title: 'Réparation pont - Anosibe',
      status: 'completed',
      lat: -18.9250,
      lng: 47.5100,
      startDate: '2025-11-01',
      endDate: '2026-01-05',
      description: 'Renforcement de la structure du pont'
    },
    {
      id: 4,
      title: 'Élargissement route - Ivandry',
      status: 'in-progress',
      lat: -18.8950,
      lng: 47.5350,
      startDate: '2026-01-15',
      endDate: '2026-04-30',
      description: 'Ajout d\'une voie supplémentaire'
    },
    {
      id: 5,
      title: 'Signalisation - Andraharo',
      status: 'pending',
      lat: -18.8850,
      lng: 47.5280,
      startDate: '2026-02-01',
      endDate: '2026-02-10',
      description: 'Installation de nouveaux panneaux'
    }
  ]

  // Stats calculation
  const stats = {
    total: roadWorks.length,
    pending: roadWorks.filter(w => w.status === 'pending').length,
    inProgress: roadWorks.filter(w => w.status === 'in-progress').length,
    completed: roadWorks.filter(w => w.status === 'completed').length
  }

  // Filtered works
  const filteredWorks = filter === 'all' 
    ? roadWorks 
    : roadWorks.filter(w => w.status === filter)

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map centered on Antananarivo
      mapInstanceRef.current = L.map(mapRef.current).setView([-18.8792, 47.5079], 13)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers
    if (mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Add markers for filtered works
      filteredWorks.forEach(work => {
        const color = {
          'pending': '#f59e0b',
          'in-progress': '#3b82f6',
          'completed': '#10b981'
        }[work.status] || '#6b7280'

        const statusText = {
          'pending': 'En attente',
          'in-progress': 'En cours',
          'completed': 'Terminé'
        }[work.status] || work.status

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })

        const marker = L.marker([work.lat, work.lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="map-popup">
              <div class="map-popup-title">${work.title}</div>
              <div class="map-popup-status" style="color: ${color}; font-weight: 500;">● ${statusText}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #666;">
                ${work.description}<br/>
                <strong>Du:</strong> ${new Date(work.startDate).toLocaleDateString('fr-FR')}<br/>
                <strong>Au:</strong> ${new Date(work.endDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          `)
      })
    }

    return () => {
      // Don't destroy map on filter change
    }
  }, [filter, filteredWorks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { class: 'badge-pending', text: 'En attente' },
      'in-progress': { class: 'badge-in-progress', text: 'En cours' },
      'completed': { class: 'badge-completed', text: 'Terminé' }
    }
    return badges[status] || { class: '', text: status }
  }

  return (
    <div>
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Travaux</div>
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
            <div className="stat-label">En Cours</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-content">
            <div className="stat-label">Terminés</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Map */}
        <div className="card full-width">
          <div className="card-header">
            <h3 className="card-title">🗺️ Carte des Travaux - Antananarivo</h3>
            <div className="tabs" style={{ margin: 0, padding: 0, border: 'none' }}>
              <button 
                className={`tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                En attente
              </button>
              <button 
                className={`tab ${filter === 'in-progress' ? 'active' : ''}`}
                onClick={() => setFilter('in-progress')}
              >
                En cours
              </button>
              <button 
                className={`tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Terminés
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div ref={mapRef} className="map-container large"></div>
          </div>
        </div>

        {/* Recent Works List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Liste des Travaux</h3>
            <span className="badge badge-user">{filteredWorks.length} travaux</span>
          </div>
          <div className="card-body" style={{ padding: 0, maxHeight: '400px', overflow: 'auto' }}>
            <ul className="list-group">
              {filteredWorks.map(work => {
                const badge = getStatusBadge(work.status)
                return (
                  <li key={work.id} className="list-item">
                    <div 
                      className="list-item-icon"
                      style={{ 
                        background: work.status === 'completed' ? '#d1fae5' : 
                                   work.status === 'in-progress' ? '#dbeafe' : '#fef3c7'
                      }}
                    >
                      {work.status === 'completed' ? '✅' : 
                       work.status === 'in-progress' ? '🔧' : '⏳'}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{work.title}</div>
                      <div className="list-item-subtitle">
                        {new Date(work.startDate).toLocaleDateString('fr-FR')} - {new Date(work.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📌 Légende</h3>
          </div>
          <div className="card-body">
            <div className="donut-legend">
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

            <div className="mt-3">
              <div className="alert alert-info">
                <span>ℹ️</span>
                <span>Cliquez sur un marqueur pour voir les détails du chantier.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisitorDashboard
