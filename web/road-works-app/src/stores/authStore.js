import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

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
          const data = response.data
          
          // Set token in API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          // Determine role from email or response
          // You may need to fetch user profile to get the role
          let role = 'user' // default
          if (email.includes('manager') || email.includes('admin')) {
            role = 'manager'
          } else if (email.includes('visitor')) {
            role = 'visitor'
          }
          
          const user = {
            id: data.userId,
            email: data.email,
            name: data.email.split('@')[0],
            role: role
          }
          
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken,
            isLoading: false,
            error: null
          })
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur de connexion'
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
          const data = response.data
          
          // Set token in API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          const user = {
            id: data.userId,
            email: data.email,
            name: fullName || data.email.split('@')[0],
            role: role
          }
          
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken,
            isLoading: false,
            error: null
          })
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur lors de l\'inscription'
          set({ isLoading: false, error: message })
          throw new Error(message)
        }
      },

      // Quick login for testing (simulates authentication without API)
      quickLogin: (role) => {
        const users = {
          visitor: { id: '1', email: 'visitor@test.com', name: 'Visiteur Test', role: 'visitor' },
          user: { id: '2', email: 'user@test.com', name: 'Utilisateur Test', role: 'user' },
          manager: { id: '3', email: 'manager@test.com', name: 'Manager Test', role: 'manager' }
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
