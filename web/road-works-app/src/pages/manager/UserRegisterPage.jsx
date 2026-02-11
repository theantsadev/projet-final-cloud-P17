import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

function UserRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  
  const { register, isLoading, error, clearError } = useAuthStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Le nom doit contenir au moins 2 caracteres'
    }
    if (!formData.email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    if (!validateForm()) return
    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.fullName,
        'visitor'
      )
      if (result.success) {
        toast.success('Utilisateur cree avec succes!')
        setFormData({ fullName: '', email: '', password: '' })
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start',
      minHeight: 'calc(100vh - 150px)',
      padding: '2rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="card-header" style={{ textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Créer un utilisateur</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Remplissez le formulaire pour ajouter un utilisateur
          </p>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Nom complet</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Minimum 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg"
              disabled={isLoading}
              style={{ marginTop: '1.5rem' }}
            >
              {isLoading ? 'Creation en cours...' : 'Creer l\'utilisateur'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserRegisterPage