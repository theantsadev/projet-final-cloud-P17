import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

// Map backend roles array to a single frontend role string
const mapBackendRolesToFrontend = (roles, emailFallback = '') => {
  if (roles && roles.length > 0) {
    const roleNames = roles.map(r => r.name || r)
    if (roleNames.includes('MANAGER')) return 'manager'
    if (roleNames.includes('USER')) return 'user'
  }
  // Heuristic fallback
  if (emailFallback.includes('manager') || emailFallback.includes('admin')) return 'manager'
  return 'visitor'
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Check if authenticated (function instead of getter for better reactivity)
      isAuthenticated: () => {
        const state = get()
        return !!state.token && !!state.user
      },

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null })

        try {
          const response = await api.post('/auth/login', { email, password })
          const payload = response.data?.data
          const message = response.data?.message

          if (!payload) {
            throw new Error(message || 'Réponse inattendue du serveur')
          }

          // Set token for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`

          // Map backend roles to a single frontend role
          const role = mapBackendRolesToFrontend(payload.user?.roles, email)

          const user = {
            id: payload.user?.id || payload.userId,
            email: payload.user?.email || email,
            name: payload.user?.fullName || (payload.user?.email || email).split('@')[0],
            role
          }

          set({
            user,
            token: payload.token,
            refreshToken: payload.refreshToken,
            isLoading: false,
            error: null
          })

          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Erreur de connexion'
          set({ isLoading: false, error: message })
          throw new Error(message)
        }
      },

      register: async (email, password, fullName, role = 'user') => {
        set({ isLoading: true, error: null })

        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            fullName
          })
          const payload = response.data?.data
          const message = response.data?.message

          if (!payload) {
            throw new Error(message || 'Réponse inattendue du serveur')
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`

          const userRole = mapBackendRolesToFrontend(payload.user?.roles, email) || role

          const user = {
            id: payload.user?.id || payload.userId,
            email: payload.user?.email || email,
            name: fullName || payload.user?.fullName || (payload.user?.email || email).split('@')[0],
            role: userRole
          }

          set({
            user,
            token: payload.token,
            refreshToken: payload.refreshToken,
            isLoading: false,
            error: null
          })

          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription'
          set({ isLoading: false, error: message })
          throw new Error(message)
        }
      },

      // Quick login for testing (simulates authentication without API)
      quickLogin: (role) => {
        const users = {
          visitor: { id: '1', email: 'visitor@test.com', name: 'Visiteur Test', role: 'visitor' },
          manager: { id: '2', email: 'manager@test.com', name: 'Manager Test', role: 'manager' }
        }

        const user = users[role]
        const fakeToken = 'fake-jwt-token-' + role

        set({
          user,
          token: fakeToken,
          refreshToken: 'fake-refresh-token',
          isLoading: false,
          error: null
        })

        return { success: true, user }
      },

      logout: () => {
        // Clear token from API
        delete api.defaults.headers.common['Authorization']

        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null
        })
      },

      clearError: () => {
        set({ error: null })
      },

      // Check if account is locked
      checkLockStatus: async (email) => {
        try {
          const response = await api.get(`/auth/check-lock/${email}`)
          return response.data.locked
        } catch (error) {
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      })
    }
  )
)
