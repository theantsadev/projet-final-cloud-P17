import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'visitor'
  })
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Le nom doit contenir au moins 2 caractères'
    }
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation'
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
        formData.role
      )
      
      if (result.success) {
        toast.success('Compte créé avec succès!')
        
        // Redirect based on role
        const redirects = {
          visitor: '/visitor',
          manager: '/manager'
        }
        navigate(redirects[result.user.role] || '/visitor')
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-subtitle">
          Rejoignez la communauté et participez au suivi des travaux
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span></span>
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
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
        </div>



        <div className="form-group">
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked)
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: '' }))
                }
              }}
              disabled={isLoading}
            />
            <span className="text-small">
              J'accepte les <a href="#" onClick={(e) => e.preventDefault()}>conditions d'utilisation</a> et la{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>politique de confidentialité</a>
            </span>
          </label>
          {errors.terms && <span className="form-error">{errors.terms}</span>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loader"></span>
              Création...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Déjà un compte ?{' '}
          <Link to="/auth/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
