import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { signalementAPI, typeReparationAPI } from '../services/api'
import '../styles/SignalementDetailsPage.css'

function SignalementDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [signalement, setSignalement] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [typesReparation, setTypesReparation] = useState([])
    const [prixM2Global, setPrixM2Global] = useState(0)
    const [selectedTypeId, setSelectedTypeId] = useState('')
    const [selectedNiveau, setSelectedNiveau] = useState('')
    const [calculatedBudget, setCalculatedBudget] = useState(null)
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        latitude: '',
        longitude: '',
        surfaceM2: '',
        budget: '',
        entrepriseConcernee: '',
        pourcentageAvancement: 0
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadSignalement()
        loadTypesReparation()
    }, [id])

    const loadTypesReparation = async () => {
        try {
            const response = await typeReparationAPI.getActive()
            const data = response.data?.data || {}
            setTypesReparation(data.types || [])
            setPrixM2Global(data.prixM2Global || 0)
        } catch (err) {
            console.error('Erreur chargement types de réparation:', err)
        }
    }

    // Calculer le budget automatiquement quand la surface ou le niveau change
    // Formule: budget = prixM2Global × niveau × surfaceM2
    useEffect(() => {
        if (selectedNiveau && formData.surfaceM2 && prixM2Global > 0) {
            const budget = prixM2Global * parseInt(selectedNiveau) * parseFloat(formData.surfaceM2)
            setCalculatedBudget(budget)
        } else {
            setCalculatedBudget(null)
        }
    }, [selectedNiveau, formData.surfaceM2, prixM2Global])

    const loadSignalement = async () => {
        try {
            setLoading(true)
            const response = await signalementAPI.getById(id)
            const data = response.data?.data || response.data
            setSignalement(data)
            setFormData({
                titre: data.titre || '',
                description: data.description || '',
                latitude: data.latitude || '',
                longitude: data.longitude || '',
                surfaceM2: data.surfaceM2 || '',
                budget: data.budget || '',
                entrepriseConcernee: data.entrepriseConcernee || '',
                pourcentageAvancement: data.pourcentageAvancement || 0
            })
            // Si un niveau est déjà défini
            if (data.niveau) {
                setSelectedNiveau(data.niveau.toString())
            }
            // Si un type de réparation est déjà assigné
            if (data.typeReparation?.id) {
                setSelectedTypeId(data.typeReparation.id)
            }
        } catch (err) {
            setError('Erreur lors du chargement du signalement')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pourcentageAvancement' ? parseInt(value) || 0 : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.titre.trim()) {
            setError('Le titre est obligatoire')
            return
        }

        if (!formData.latitude || !formData.longitude) {
            setError('La latitude et longitude sont obligatoires')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            // 1. Mettre à jour le signalement
            await signalementAPI.update(id, formData)

            // 2. Définir le niveau et calculer le budget si un niveau est sélectionné
            if (selectedNiveau) {
                await typeReparationAPI.setNiveau(id, parseInt(selectedNiveau))
            }

            // 3. Affecter le type de réparation si sélectionné (optionnel, pour catégorisation)
            if (selectedTypeId) {
                await typeReparationAPI.assignToSignalement(id, selectedTypeId)
            }

            setSuccess('Signalement mis à jour avec succès')

            setTimeout(() => {
                navigate('/manager')
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        navigate('/manager')
    }

    if (loading) {
        return (
            <div className="signalement-details-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement du signalement...</p>
                </div>
            </div>
        )
    }

    if (!signalement) {
        return (
            <div className="signalement-details-page">
                <div className="error-state">
                    <p>Signalement non trouvé</p>
                    <button className="btn btn-primary" onClick={() => navigate('/manager')}>
                        Retour au dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="signalement-details-page">
            <div className="page-header">
                <h1>Gestion du Signalement</h1>
                <p className="text-muted">ID: {id}</p>
            </div>

            <div className="details-container">
                <div className="details-card">
                    <div className="card-header">
                        <h2>Informations du Signalement</h2>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span className="alert-icon">✕</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <span className="alert-icon">✓</span>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="form-details">
                        {/* Titre */}
                        <div className="form-group">
                            <label htmlFor="titre">Titre du signalement *</label>
                            <input
                                type="text"
                                id="titre"
                                name="titre"
                                value={formData.titre}
                                onChange={handleInputChange}
                                placeholder="Ex: Nid-de-poule rue Zafimaniry"
                                className="form-control"
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Décrivez le problème en détail..."
                                rows="4"
                                className="form-control"
                            />
                        </div>

                        {/* Localisation */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="latitude">Latitude *</label>
                                <input
                                    type="number"
                                    id="latitude"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    placeholder="-18.8792"
                                    step="0.0001"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="longitude">Longitude *</label>
                                <input
                                    type="number"
                                    id="longitude"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    placeholder="47.5079"
                                    step="0.0001"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        {/* Surface et Budget */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="surfaceM2">Surface (m²)</label>
                                <input
                                    type="number"
                                    id="surfaceM2"
                                    name="surfaceM2"
                                    value={formData.surfaceM2}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 25.5"
                                    step="0.01"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="budget">Budget estimé (Ar)</label>
                                <input
                                    type="number"
                                    id="budget"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 5000000"
                                    step="10000"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        {/* Type de Réparation (catégorisation) */}
                        <div className="form-group">
                            <label htmlFor="typeReparation">Type de Réparation (catégorie)</label>
                            <select
                                id="typeReparation"
                                name="typeReparation"
                                value={selectedTypeId}
                                onChange={(e) => setSelectedTypeId(e.target.value)}
                                className="form-control"
                            >
                                <option value="">-- Sélectionner un type --</option>
                                {typesReparation.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.nom} (Niveau {type.niveau})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Niveau et Budget Calculé */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="niveau">
                                    Niveau de réparation : <strong>{selectedNiveau}</strong>
                                </label>
                                <input
                                    type="range"
                                    id="niveau"
                                    name="niveau"
                                    value={selectedNiveau}
                                    onChange={(e) => setSelectedNiveau(e.target.value)}
                                    min="1"
                                    max="10"
                                    step="1"
                                    className="form-control range-input"
                                />
                                <div className="niveau-labels">
                                    <span>1 - Léger</span>
                                    <span>5 - Moyen</span>
                                    <span>10 - Critique</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Budget Calculé (Ar)</label>
                                <div className="calculated-budget">
                                    {calculatedBudget !== null ? (
                                        <>
                                            <span className="budget-value">
                                                {calculatedBudget.toLocaleString()} Ar
                                            </span>
                                            <span className="budget-formula">
                                                {prixM2Global?.toLocaleString()} × {selectedNiveau} × {formData.surfaceM2 || 0} m²
                                            </span>
                                        </>
                                    ) : (
                                        <span className="budget-placeholder">
                                            Entrez une surface pour calculer
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Entreprise et Avancement */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="entrepriseConcernee">Entreprise responsable</label>
                                <input
                                    type="text"
                                    id="entrepriseConcernee"
                                    name="entrepriseConcernee"
                                    value={formData.entrepriseConcernee}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Constructo SPA"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="pourcentageAvancement">
                                    Avancement (%) : <strong>{formData.pourcentageAvancement}%</strong>
                                </label>
                                <input
                                    type="range"
                                    id="pourcentageAvancement"
                                    name="pourcentageAvancement"
                                    value={formData.pourcentageAvancement}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    step="5"
                                    className="form-range"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Statut actuel */}
                        <div className="form-group">
                            <label>Statut actuel</label>
                            <div className="status-badge" style={{ display: 'inline-block' }}>
                                {signalement.statut === 'NOUVEAU' && '● En attente'}
                                {signalement.statut === 'EN_COURS' && '● En cours'}
                                {signalement.statut === 'TERMINE' && '● Terminé'}
                                {signalement.statut === 'ANNULE' && '● Annulé'}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>

                {/* Infos supplémentaires */}
                <div className="details-sidebar">
                    <div className="info-card">
                        <h3>Informations supplémentaires</h3>

                        <div className="info-item">
                            <span className="info-label">Signalé par:</span>
                            <span className="info-value">{signalement.signaleurNom}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Date de création:</span>
                            <span className="info-value">
                                {new Date(signalement.createdAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Dernière mise à jour:</span>
                            <span className="info-value">
                                {new Date(signalement.updatedAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Synchronisé:</span>
                            <span className={`info-value sync-status ${signalement.synchronized ? 'synced' : 'not-synced'}`}>
                                {signalement.synchronized ? '✓ Oui' : '✗ Non'}
                            </span>
                        </div>

                        {signalement.firebaseId && (
                            <div className="info-item">
                                <span className="info-label">Firebase ID:</span>
                                <span className="info-value firebase-id">{signalement.firebaseId}</span>
                            </div>
                        )}
                    </div>

                    <div className="map-preview">
                        <h3>Localisation</h3>
                        <div className="map-container">
                            <div className="map-placeholder">
                                <p>Latitude: {formData.latitude}</p>
                                <p>Longitude: {formData.longitude}</p>
                                <p className="text-small text-muted">
                                    Intégration Google Maps possible
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignalementDetailsPage
