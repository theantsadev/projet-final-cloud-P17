import { useState, useEffect } from 'react'
import { typeReparationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import '../../styles/TypeReparationsPage.css'

function TypeReparationsPage() {
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        niveau: 1,
        prixM2: '',
        isActive: true
    })

    useEffect(() => {
        loadTypes()
    }, [])

    const loadTypes = async () => {
        try {
            setLoading(true)
            const response = await typeReparationAPI.getAll()
            setTypes(response.data?.data || [])
        } catch (error) {
            console.error('Erreur chargement types:', error)
            toast.error('Impossible de charger les types de réparation')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.nom.trim()) {
            toast.error('Le nom est obligatoire')
            return
        }
        if (formData.niveau < 1 || formData.niveau > 10) {
            toast.error('Le niveau doit être entre 1 et 10')
            return
        }
        if (!formData.prixM2 || parseFloat(formData.prixM2) <= 0) {
            toast.error('Le prix au m² doit être supérieur à 0')
            return
        }

        try {
            const data = {
                ...formData,
                prixM2: parseFloat(formData.prixM2)
            }

            if (editingType) {
                await typeReparationAPI.update(editingType.id, data)
                toast.success('Type de réparation mis à jour')
            } else {
                await typeReparationAPI.create(data)
                toast.success('Type de réparation créé')
            }

            setShowModal(false)
            resetForm()
            loadTypes()
        } catch (error) {
            console.error('Erreur sauvegarde:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde')
        }
    }

    const handleEdit = (type) => {
        setEditingType(type)
        setFormData({
            nom: type.nom,
            description: type.description || '',
            niveau: type.niveau,
            prixM2: type.prixM2,
            isActive: type.isActive
        })
        setShowModal(true)
    }

    const handleDelete = async (type) => {
        if (!confirm(`Voulez-vous vraiment désactiver "${type.nom}" ?`)) {
            return
        }

        try {
            await typeReparationAPI.delete(type.id)
            toast.success('Type de réparation désactivé')
            loadTypes()
        } catch (error) {
            console.error('Erreur suppression:', error)
            toast.error('Erreur lors de la suppression')
        }
    }

    const resetForm = () => {
        setEditingType(null)
        setFormData({
            nom: '',
            description: '',
            niveau: 1,
            prixM2: '',
            isActive: true
        })
    }

    const openCreateModal = () => {
        resetForm()
        setShowModal(true)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MG', {
            minimumFractionDigits: 0
        }).format(price) + ' Ar'
    }

    const getNiveauBadgeClass = (niveau) => {
        if (niveau <= 3) return 'badge-niveau niveau-low'
        if (niveau <= 6) return 'badge-niveau niveau-medium'
        if (niveau <= 8) return 'badge-niveau niveau-high'
        return 'badge-niveau niveau-critical'
    }

    const getNiveauLabel = (niveau) => {
        if (niveau <= 2) return 'Mineur'
        if (niveau <= 4) return 'Modéré'
        if (niveau <= 6) return 'Important'
        if (niveau <= 8) return 'Grave'
        return 'Critique'
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="type-reparations-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Types de Réparation</h1>
                    <p>Gérez les types de réparation et leurs tarifs au m²</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouveau type
                </button>
            </div>

            {/* Info Card */}
            <div className="info-card">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h3>Calcul du budget</h3>
                    <p>Le budget est calculé automatiquement: <strong>Budget = Surface (m²) × Prix au m²</strong></p>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Niveau</th>
                                <th>Prix / m²</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-state">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <p>Aucun type de réparation défini</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                types.map((type) => (
                                    <tr key={type.id} className={!type.isActive ? 'inactive-row' : ''}>
                                        <td>
                                            <div className="type-info">
                                                <div className="type-name">{type.nom}</div>
                                                {type.description && (
                                                    <div className="type-description">{type.description}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="niveau-cell">
                                                <span className={getNiveauBadgeClass(type.niveau)}>
                                                    Niveau {type.niveau}
                                                </span>
                                                <span className="niveau-label">({getNiveauLabel(type.niveau)})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="price-value">{formatPrice(type.prixM2)}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${type.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                                {type.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    onClick={() => handleEdit(type)}
                                                    className="btn-icon btn-edit"
                                                    title="Modifier"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {type.isActive && (
                                                    <button
                                                        onClick={() => handleDelete(type)}
                                                        className="btn-icon btn-delete"
                                                        title="Désactiver"
                                                    >
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingType ? 'Modifier le type' : 'Nouveau type de réparation'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body modal-form">
                                {/* Nom */}
                                <div className="form-group">
                                    <label>
                                        Nom <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        className="form-input"
                                        placeholder="Ex: Nid de poule mineur"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-textarea"
                                        rows="2"
                                        placeholder="Description du type de réparation"
                                    />
                                </div>

                                {/* Niveau */}
                                <div className="form-group">
                                    <label>
                                        Niveau de gravité <span className="required">*</span>
                                    </label>
                                    <div className="niveau-slider-group">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={formData.niveau}
                                            onChange={(e) => setFormData({ ...formData, niveau: parseInt(e.target.value) })}
                                        />
                                        <span className={`niveau-display ${getNiveauBadgeClass(formData.niveau)}`}>
                                            {formData.niveau} - {getNiveauLabel(formData.niveau)}
                                        </span>
                                    </div>
                                    <p className="help-text">1 = Mineur, 10 = Critique</p>
                                </div>

                                {/* Prix au m² */}
                                <div className="form-group">
                                    <label>
                                        Prix au m² (Ar) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.prixM2}
                                        onChange={(e) => setFormData({ ...formData, prixM2: e.target.value })}
                                        className="form-input"
                                        placeholder="Ex: 50000"
                                        min="1"
                                        step="100"
                                        required
                                    />
                                </div>

                                {/* Statut actif (uniquement en édition) */}
                                {editingType && (
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="isActive">
                                            Type actif (visible pour l'affectation)
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingType ? 'Enregistrer' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TypeReparationsPage
