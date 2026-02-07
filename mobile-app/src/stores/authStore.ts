import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseAuthService, { type User, type LoginRequest, type RegisterRequest } from '@/services/firebaseAuthService'

export type { User, LoginRequest, RegisterRequest }

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userFullName = computed(() => user.value?.fullName || '')
  const userId = computed(() => user.value?.id || null)

  // Initialiser l'écoute de l'état d'authentification Firebase
  const initAuth = () => {
    if (isInitialized.value) return

    isLoading.value = true
    
    firebaseAuthService.onAuthStateChange((firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false
      isInitialized.value = true
    })
  }

  // Connexion
  const login = async (credentials: LoginRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await firebaseAuthService.login(credentials)
      
      if (result.success && result.user) {
        console.log('Login successful:', result.user)
        user.value = result.user
        return { success: true, message: result.message }
      } else {
        error.value = result.message
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      const message = err.message || 'Erreur de connexion'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // Inscription
  const register = async (userData: RegisterRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await firebaseAuthService.register(userData)
      
      if (result.success && result.user) {
        user.value = result.user
        return { success: true, message: result.message }
      } else {
        error.value = result.message
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      const message = err.message || "Erreur lors de l'inscription"
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // Déconnexion
  const logout = async () => {
    isLoading.value = true

    try {
      await firebaseAuthService.logout()
      user.value = null
    } finally {
      error.value = null
      isLoading.value = false
    }
  }

  // Effacer l'erreur
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    // Getters
    isAuthenticated,
    userFullName,
    userId,
    // Actions
    initAuth,
    login,
    register,
    logout,
    clearError
  }
})
