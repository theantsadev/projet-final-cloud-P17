import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { signalementAPI } from '../../services/api'
import toast from 'react-hot-toast'

function DelaiMoyenTraitementPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [delaiData, setDelaiData] = useState(null)

  // Load data from API
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await signalementAPI.getDelaiMoyenTraitement()
      setDelaiData(response.data?.data || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des délais:', error)
      toast.error('Impossible de charger les délais de traitement')
    } finally {
      setLoading(false)
    }
  }

  const formatDelay = (days) => {
    if (days === null || days === undefined) return 'N/A'
    const daysInt = Math.floor(days)
    const hours = Math.round((days - daysInt) * 24)
    if (daysInt === 0) {
      return `${hours}h`
    }
    return `${daysInt}j ${hours}h`
  }

  const getDelayStatus = (days) => {
    if (days === null || days === undefined) return { color: '#94a3b8', label: 'Sans données' }
    
    if (days <= 2) return { color: '#10b981', label: 'Excellent' }
    if (days <= 5) return { color: '#3b82f6', label: 'Bon' }
    if (days <= 10) return { color: '#f59e0b', label: 'Acceptable' }
    return { color: '#ef4444', label: 'A améliorer' }
  }

  const stats = [
    {
      title: 'Délai moyen (NOUVEAU → EN_COURS)',
      value: delaiData?.delaiMoyenNouveauEnCours,
      description: 'Temps moyen pour traiter un nouveau signalement',
      icon: '⏱️'
    },
    {
      title: 'Délai moyen (EN_COURS → TERMINE)',
      value: delaiData?.delaiMoyenEnCoursTermine,
      description: 'Temps moyen pour finaliser un signalement en cours',
      icon: '⚙️'
    },
    {
      title: 'Délai moyen TOTAL (NOUVEAU → TERMINE)',
      value: delaiData?.delaiMoyenTraitementTotal,
      description: 'Temps total moyen du signalement',
      icon: '🏁'
    },
    {
      title: 'Signalements traités',
      value: delaiData?.nombreSignalementsTraites,
      description: 'Nombre de signalements complétés',
      icon: '✅',
      isCount: true
    }
  ]

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
          {/* Page Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Délais de Traitement
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Analysez les délais moyens de traitement des signalements par étape
            </p>
          </div>

          {/* Main Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {stats.map((stat, index) => {
              const status = getDelayStatus(stat.value)
              const formattedValue = stat.isCount ? stat.value : formatDelay(stat.value)
              
              return (
                <div key={index} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Background accent */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100px',
                    background: status.color,
                    opacity: 0.1,
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }}></div>

                  <div className="card-body" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {stat.title}
                        </h3>
                      </div>
                      <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: status.color, marginBottom: '0.5rem' }}>
                        {formattedValue}
                      </div>
                      <div style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: status.color, color: 'white', borderRadius: '0.25rem', display: 'inline-block' }}>
                        {status.label}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                      {stat.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Details Section */}
          {delaiData && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Résumé des Performances</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                  {/* Performance Overview */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Performance par Étape</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* NOUVEAU → EN_COURS */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '500', color: '#475569' }}>Traitement initial</span>
                          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {formatDelay(delaiData.delaiMoyenNouveauEnCours)}
                          </span>
                        </div>
                        <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              background: getDelayStatus(delaiData.delaiMoyenNouveauEnCours).color,
                              height: '100%',
                              width: '100%',
                              maxWidth: '100%'
                            }}
                          ></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                          De NOUVEAU à EN_COURS
                        </p>
                      </div>

                      {/* EN_COURS → TERMINE */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '500', color: '#475569' }}>Finalisation</span>
                          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {formatDelay(delaiData.delaiMoyenEnCoursTermine)}
                          </span>
                        </div>
                        <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              background: getDelayStatus(delaiData.delaiMoyenEnCoursTermine).color,
                              height: '100%',
                              width: '100%',
                              maxWidth: '100%'
                            }}
                          ></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                          De EN_COURS à TERMINE
                        </p>
                      </div>

                      {/* TOTAL */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '500', color: '#475569' }}>Durée totale</span>
                          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {formatDelay(delaiData.delaiMoyenTraitementTotal)}
                          </span>
                        </div>
                        <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              background: getDelayStatus(delaiData.delaiMoyenTraitementTotal).color,
                              height: '100%',
                              width: '100%',
                              maxWidth: '100%'
                            }}
                          ></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                          De NOUVEAU à TERMINE
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Informations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Signalements traités
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {delaiData.nombreSignalementsTraites || 0}
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                          💡 <strong>Conseil:</strong> Un délai de traitement initial (NOUVEAU → EN_COURS) court indique une bonne réactivité. Les délais de finalisation dépendent de la complexité des travaux.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && !delaiData && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Aucune donnée disponible
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  Il n'y a pas encore de signalements terminés pour calculer les délais moyens.
                </p>
                <button
                  onClick={() => navigate('/manager/signalements')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Voir les signalements
                </button>
              </div>
            </div>
          )}

          {/* Reload Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s'
              }}
            >
              {loading ? '⟳ Actualisation...' : '↻ Actualiser les données'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default DelaiMoyenTraitementPage
