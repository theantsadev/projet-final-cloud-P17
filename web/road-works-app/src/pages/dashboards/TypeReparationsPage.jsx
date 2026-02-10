import { useState, useEffect } from 'react'
import { typeReparationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import '../../styles/TypeReparationsPage.css'

function TypeReparationsPage() {
    const [types, setTypes] = useState([])
    const [prixM2Global, setPrixM2Global] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showPrixModal, setShowPrixModal] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [newPrixGlobal, setNewPrixGlobal] = useState('')
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        niveau: 1,
        isActive: true
    })

    useEffect(() => {
        loadTypes()
    }, [])

    const loadTypes = async () => {
        try {
            setLoading(true)
            const response = await typeReparationAPI.getAll()
            const data = response.data?.data || {}
            setTypes(data.types || [])
            setPrixM2Global(data.prixM2Global || 0)
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

        try {
            if (editingType) {
                await typeReparationAPI.update(editingType.id, formData)
                toast.success('Type de réparation mis à jour')
            } else {
                await typeReparationAPI.create(formData)
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

    const handleUpdatePrixGlobal = async (e) => {
        e.preventDefault()
        
        const prix = parseFloat(newPrixGlobal)
        if (!prix || prix <= 0) {
            toast.error('Le prix doit être supérieur à 0')
            return
        }

        try {
            await typeReparationAPI.setPrixGlobal(prix)
            toast.success('Prix global mis à jour')
            setPrixM2Global(prix)
            setShowPrixModal(false)
        } catch (error) {
            console.error('Erreur mise à jour prix:', error)
            toast.error('Erreur lors de la mise à jour du prix')
        }
    }

    const handleEdit = (type) => {
        setEditingType(type)
        setFormData({
            nom: type.nom,
            description: type.description || '',
            niveau: type.niveau,
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
            isActive: true
        })
    }

    const openCreateModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openPrixModal = () => {
        setNewPrixGlobal(prixM2Global.toString())
        setShowPrixModal(true)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MG', {
            minimumFractionDigits: 0
        }).format(price) + ' Ar'
    }

    // Calculer le coût par m² en fonction du niveau (prix_global × niveau)
    const calculateCostPerM2 = (niveau) => {
        return prixM2Global * niveau
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
                    <p>Gérez les types de réparation et le prix global au m²</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouveau type
                </button>
            </div>

            {/* Prix Global Card */}
            <div className="prix-global-card">
                <div className="prix-global-info">
                    <div className="prix-global-icon">
                        <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3>Prix Global au m²</h3>
                        <p className="prix-global-value">{formatPrice(prixM2Global)}</p>
                    </div>
                </div>
                <button onClick={openPrixModal} className="btn btn-secondary">
                    Modifier
                </button>
            </div>

            {/* Info Card */}
            <div className="info-card">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h3>Calcul du budget</h3>
                    <p>Le budget est calculé automatiquement: <strong>Budget = Prix Global ({formatPrice(prixM2Global)}) × Niveau × Surface (m²)</strong></p>
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
                                <th>Coût effectif / m²</th>
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
                                            <div className="cost-cell">
                                                <span className="price-value">{formatPrice(calculateCostPerM2(type.niveau))}</span>
                                                <span className="cost-formula">({formatPrice(prixM2Global)} × {type.niveau})</span>
                                            </div>
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

            {/* Modal Type */}
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
                                    <p className="help-text">1 = Mineur, 10 = Critique. Coût effectif: {formatPrice(calculateCostPerM2(formData.niveau))}/m²</p>
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

            {/* Modal Prix Global */}
            {showPrixModal && (
                <div className="modal-overlay" onClick={() => setShowPrixModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Modifier le Prix Global</h2>
                            <button className="modal-close" onClick={() => setShowPrixModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePrixGlobal}>
                            <div className="modal-body modal-form">
                                <div className="form-group">
                                    <label>
                                        Prix Global au m² (Ar) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={newPrixGlobal}
                                        onChange={(e) => setNewPrixGlobal(e.target.value)}
                                        className="form-input"
                                        placeholder="Ex: 50000"
                                    />
                                    <p className="help-text">
                                        Ce prix de base est multiplié par le niveau pour calculer le coût effectif par m².
                                    </p>
                                </div>

                                <div className="info-card" style={{ marginTop: '1rem' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p><strong>Formule:</strong> Budget = Prix Global × Niveau × Surface (m²)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPrixModal(false)} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Enregistrer
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
