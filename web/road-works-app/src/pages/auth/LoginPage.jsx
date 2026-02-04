import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  
  const { login, quickLogin, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide'
    }
    
    if (!password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) return
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        toast.success('Connexion réussie!')
        
        // Redirect based on role
        const redirects = {
          visitor: '/visitor',
          manager: '/manager'
        }
        
        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          navigate(redirects[result.user.role] || '/visitor', { replace: true })
        }, 100)
      }
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion')
    }
  }

  const handleQuickLogin = (role) => {
    const result = quickLogin(role)
    
    if (result.success) {
      toast.success(`Connecté en tant que ${role}`)
      
      const redirects = {
        visitor: '/visitor',
        manager: '/manager'
      }
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate(redirects[role], { replace: true })
      }, 100)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">Connexion</h1>
        <p className="auth-subtitle">
          Accédez à votre espace de suivi des travaux routiers
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) {
                setErrors({ ...errors, email: '' })
              }
            }}
            disabled={isLoading}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors({ ...errors, password: '' })
              }
            }}
            disabled={isLoading}
          />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loader"></span>
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Pas encore de compte ?{' '}
          <Link to="/auth/register">Créer un compte</Link>
        </p>
      </div>

      {/* Quick Login for Testing */}
      <div className="quick-login">
        <div className="quick-login-title">Connexion rapide (Test)</div>
        <div className="quick-login-buttons">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin('visitor')}
            disabled={isLoading}
          >
            🌐 Mode Visiteur
          </button>
          <button 
            type="button"
            className="btn btn-success"
            onClick={() => handleQuickLogin('manager')}
            disabled={isLoading}
          >
            👤 Manager
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
