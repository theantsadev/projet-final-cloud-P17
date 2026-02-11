import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import toast from 'react-hot-toast'

function PhotosPage() {
  const [photos, setPhotos] = useState([])
  const [usersWithPhotos, setUsersWithPhotos] = useState([])
  const [signalementsWithPhotos, setSignalementsWithPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    uid: '',
    signalementId: '',
    startDate: '',
    endDate: ''
  })
  const [activeFilters, setActiveFilters] = useState({})

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Load filtered photos when filters change
  useEffect(() => {
    if (Object.keys(activeFilters).length > 0) {
      loadPhotosWithFilters(activeFilters)
    }
  }, [activeFilters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load photos from Firestore
      const photosRef = collection(db, 'user_photos')
      const photosSnapshot = await getDocs(photosRef)
      
      const photosData = photosSnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        firestoreId: docSnapshot.id,
        ...docSnapshot.data()
      }))

      // Helper function to compare dates
      const getTime = (date) => {
        if (!date) return 0
        if (date.toMillis) return date.toMillis() // Firestore Timestamp
        if (date instanceof Date) return date.getTime()
        if (typeof date === 'string') return new Date(date).getTime()
        return 0
      }

      // Sort by dateUpload desc
      photosData.sort((a, b) => getTime(b) - getTime(a))

      setPhotos(photosData)

      // Calculate users with photos
      const userMap = {}
      photosData.forEach(photo => {
        if (photo.uid) {
          if (!userMap[photo.uid]) {
            userMap[photo.uid] = { uid: photo.uid, photoCount: 0 }
          }
          userMap[photo.uid].photoCount++
        }
      })
      setUsersWithPhotos(Object.values(userMap))

      // Calculate signalements with photos
      const sigMap = {}
      photosData.forEach(photo => {
        if (photo.signalement_id) {
          if (!sigMap[photo.signalement_id]) {
            sigMap[photo.signalement_id] = { signalementId: photo.signalement_id, photoCount: 0 }
          }
          sigMap[photo.signalement_id].photoCount++
        }
      })
      setSignalementsWithPhotos(Object.values(sigMap))

    } catch (error) {
      console.error('Erreur chargement photos:', error)
      toast.error('Impossible de charger les photos depuis Firestore')
    } finally {
      setLoading(false)
    }
  }

  const loadPhotosWithFilters = async (filterParams) => {
    try {
      setLoading(true)
      
      const photosRef = collection(db, 'user_photos')
      let photosQuery = photosRef

      // Build query with filters
      const conditions = []
      
      if (filterParams.uid) {
        conditions.push(where('uid', '==', filterParams.uid))
      }
      
      if (filterParams.signalementId) {
        conditions.push(where('signalement_id', '==', filterParams.signalementId))
      }

      if (conditions.length > 0) {
        photosQuery = query(photosRef, ...conditions)
      }

      const photosSnapshot = await getDocs(photosQuery)
      
      let photosData = photosSnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        firestoreId: docSnapshot.id,
        ...docSnapshot.data()
      }))

      // Helper function to compare dates
      const getTime = (date) => {
        if (!date) return 0
        if (date.toMillis) return date.toMillis() // Firestore Timestamp
        if (date instanceof Date) return date.getTime()
        if (typeof date === 'string') return new Date(date).getTime()
        return 0
      }

      // Filter by date range in memory (Firestore doesn't support range on string dates easily)
      if (filterParams.startDate) {
        const startTime = new Date(filterParams.startDate).getTime()
        photosData = photosData.filter(p => p.dateUpload && getTime(p.dateUpload) >= startTime)
      }
      if (filterParams.endDate) {
        const endTime = new Date(filterParams.endDate).getTime()
        photosData = photosData.filter(p => p.dateUpload && getTime(p.dateUpload) <= endTime)
      }

      // Sort by dateUpload desc
      photosData.sort((a, b) => getTime(b) - getTime(a))

      setPhotos(photosData)

    } catch (error) {
      console.error('Erreur chargement photos filtrées:', error)
      toast.error('Impossible de charger les photos')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    await loadData()
    toast.success('Photos rechargées depuis Firestore')
    setSyncing(false)
  }

  const handleDelete = async (photoId) => {
    try {
      // Delete from Firestore
      const photoRef = doc(db, 'user_photos', photoId)
      await deleteDoc(photoRef)
      
      toast.success('Photo supprimée de Firestore')
      setDeleteConfirm(null)
      setSelectedPhoto(null)
      
      // Reload data
      await loadData()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const applyFilters = () => {
    setActiveFilters({ ...filters })
  }

  const clearFilters = () => {
    setFilters({
      uid: '',
      signalementId: '',
      startDate: '',
      endDate: ''
    })
    setActiveFilters({})
    loadData()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      // Handle Firestore Timestamp objects
      let dateObj = dateStr
      if (dateStr.toDate) {
        dateObj = dateStr.toDate() // Firestore Timestamp
      } else if (typeof dateStr === 'string') {
        dateObj = new Date(dateStr)
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalSize = photos.reduce((sum, p) => sum + (p.taille || 0), 0)

  return (
    <div className="photos-page">
      {/* Header with stats and sync button */}
      <div className="photos-header">
        <div className="photos-stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📷</div>
            <div className="stat-content">
              <div className="stat-value">{photos.length}</div>
              <div className="stat-label">Photos totales</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{usersWithPhotos.length}</div>
              <div className="stat-label">Utilisateurs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-content">
              <div className="stat-value">{signalementsWithPhotos.length}</div>
              <div className="stat-label">Signalements</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-value">{formatSize(totalSize)}</div>
              <div className="stat-label">Taille totale</div>
            </div>
          </div>
        </div>

        <button
          className={`sync-button ${syncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={syncing}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={syncing ? 'spinning' : ''}>
            <path d="M21 2v6h-6M3 22v-6h6M21 12A9 9 0 1 1 6.22 6.22M3 12a9 9 0 0 1 14.78 5.78" />
          </svg>
          {syncing ? 'Chargement...' : 'Recharger depuis Firestore'}
        </button>
      </div>

      {/* Filters */}
      <div className="photos-filters">
        <h3>Filtres</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Utilisateur</label>
            <select
              value={filters.uid}
              onChange={(e) => setFilters({ ...filters, uid: e.target.value })}
            >
              <option value="">Tous les utilisateurs</option>
              {usersWithPhotos.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.uid.substring(0, 8)}... ({u.photoCount} photos)
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Signalement</label>
            <select
              value={filters.signalementId}
              onChange={(e) => setFilters({ ...filters, signalementId: e.target.value })}
            >
              <option value="">Tous les signalements</option>
              {signalementsWithPhotos.map(s => (
                <option key={s.signalementId} value={s.signalementId}>
                  {s.signalementId.substring(0, 8)}... ({s.photoCount} photos)
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="filter-actions">
            <button className="btn-apply" onClick={applyFilters}>
              Appliquer
            </button>
            <button className="btn-clear" onClick={clearFilters}>
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="photos-content">
        <h3>Galerie ({photos.length} photos)</h3>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des photos depuis Firestore...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <h4>Aucune photo</h4>
            <p>Aucune photo trouvée dans la collection Firestore user_photos.</p>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="photo-card"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="photo-thumbnail">
                  <img
                    src={photo.url}
                    alt={photo.nom || 'Photo'}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJldXI8L3RleHQ+PC9zdmc+'
                    }}
                  />
                </div>
                <div className="photo-info">
                  <div className="photo-name">{photo.nom || 'Sans nom'}</div>
                  <div className="photo-meta">
                    <span>{formatDate(photo.dateUpload)}</span>
                    <span>{formatSize(photo.taille)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>×</button>
            
            <div className="modal-image">
              <img src={selectedPhoto.url} alt={selectedPhoto.nom || 'Photo'} />
            </div>
            
            <div className="modal-details">
              <h3>{selectedPhoto.nom || 'Photo sans nom'}</h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Firestore ID</span>
                  <span className="detail-value">{selectedPhoto.firestoreId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Utilisateur (UID)</span>
                  <span className="detail-value">{selectedPhoto.uid || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Signalement ID</span>
                  <span className="detail-value">{selectedPhoto.signalement_id || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date d'upload</span>
                  <span className="detail-value">{formatDate(selectedPhoto.dateUpload)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedPhoto.type || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Taille</span>
                  <span className="detail-value">{formatSize(selectedPhoto.taille)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cloudinary Public ID</span>
                  <span className="detail-value">{selectedPhoto.cloudinary_public_id || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Path</span>
                  <span className="detail-value">{selectedPhoto.path || '-'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view"
                >
                  Ouvrir l'original
                </a>
                <button
                  className="btn-delete"
                  onClick={() => setDeleteConfirm(selectedPhoto.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette photo de Firestore ? Cette action est irréversible.</p>
            <p style={{ fontSize: '12px', color: '#f59e0b' }}>Note: L'image restera sur Cloudinary (suppression manuelle requise).</p>
            <div className="delete-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteConfirm)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .photos-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .photos-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .photos-stats-cards {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          min-width: 140px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .sync-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .sync-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .sync-button.syncing {
          background: #6b7280;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .photos-filters {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .photos-filters h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #374151;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .filter-group select,
        .filter-group input {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: #f9fafb;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .btn-apply, .btn-clear {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }

        .btn-apply {
          background: #3b82f6;
          color: white;
        }

        .btn-clear {
          background: #f3f4f6;
          color: #374151;
        }

        .photos-content {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .photos-content h3 {
          margin: 0 0 20px;
          font-size: 16px;
          color: #374151;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .photo-card {
          background: #f9fafb;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .photo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .photo-thumbnail {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #e5e7eb;
        }

        .photo-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-info {
          padding: 12px;
        }

        .photo-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .photo-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          margin: 0 0 8px;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
          text-align: center;
          max-width: 400px;
        }

        /* Photo Modal */
        .photo-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .photo-modal {
          background: white;
          border-radius: 16px;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .modal-image {
          max-height: 50vh;
          overflow: hidden;
          background: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-image img {
          max-width: 100%;
          max-height: 50vh;
          object-fit: contain;
        }

        .modal-details {
          padding: 24px;
          overflow-y: auto;
        }

        .modal-details h3 {
          margin: 0 0 20px;
          font-size: 18px;
          color: #1f2937;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-value {
          font-size: 14px;
          color: #1f2937;
          word-break: break-all;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-view, .btn-delete {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          text-decoration: none;
          text-align: center;
        }

        .btn-view {
          background: #3b82f6;
          color: white;
          flex: 1;
        }

        .btn-delete {
          background: #fee2e2;
          color: #dc2626;
          flex: 1;
        }

        .btn-delete:hover {
          background: #fecaca;
        }

        /* Delete Confirmation Modal */
        .delete-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }

        .delete-modal {
          background: white;
          padding: 24px;
          border-radius: 16px;
          max-width: 400px;
          text-align: center;
        }

        .delete-modal h3 {
          margin: 0 0 12px;
          color: #dc2626;
        }

        .delete-modal p {
          margin: 0 0 16px;
          color: #6b7280;
        }

        .delete-actions {
          display: flex;
          gap: 12px;
        }

        .btn-cancel, .btn-confirm-delete {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-confirm-delete {
          background: #dc2626;
          color: white;
        }

        @media (max-width: 768px) {
          .photos-header {
            flex-direction: column;
          }

          .photos-stats-cards {
            width: 100%;
            justify-content: space-between;
          }

          .stat-card {
            flex: 1;
            min-width: 120px;
          }

          .sync-button {
            width: 100%;
            justify-content: center;
          }

          .photo-modal {
            max-width: 100%;
            margin: 10px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default PhotosPage
