import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseAuthService from '@/services/firebaseAuthService'
import type { User, LoginRequest, RegisterRequest } from '@/types/firestore.types'

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
  const isAccountLocked = computed(() => user.value?.isLocked || false)
  const isAccountActive = computed(() => user.value?.isActive !== false)
  const failedAttempts = computed(() => user.value?.failedLoginAttempts || 0)

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

  // Mettre à jour le profil
  const updateProfile = async (data: { fullName?: string; phone?: string }) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await firebaseAuthService.updateUserProfile(data)
      
      if (result.success && result.user) {
        user.value = result.user
        return { success: true, message: result.message }
      } else {
        error.value = result.message
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      const message = err.message || 'Erreur lors de la mise à jour'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // Débloquer un compte
  const unlockAccount = async (email: string) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await firebaseAuthService.unlockAccount(email)
      return result
    } catch (err: any) {
      const message = err.message || 'Erreur lors du déblocage'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // Rafraîchir les données utilisateur
  const refreshUser = async () => {
    try {
      const refreshedUser = await firebaseAuthService.refreshCurrentUser()
      if (refreshedUser) {
        user.value = refreshedUser
      }
      return refreshedUser
    } catch (err: any) {
      console.error('Erreur refreshUser:', err)
      return null
    }
  }

  // Vérifier si un compte est bloqué
  const checkAccountLocked = async (email: string) => {
    return await firebaseAuthService.isAccountLocked(email)
  }

  // Obtenir le nombre de tentatives restantes
  const getRemainingAttempts = async (email: string) => {
    return await firebaseAuthService.getRemainingAttempts(email)
  }

  // Vérifier si la session est valide
  const isSessionValid = async () => {
    return await firebaseAuthService.isSessionValid()
  }

  // Rafraîchir la session
  const refreshSession = async () => {
    const result = await firebaseAuthService.refreshSession()
    if (!result.success) {
      // Session invalide, déconnecter
      await logout()
    }
    return result
  }

  // Obtenir la durée de session configurée
  const getSessionDuration = () => {
    return firebaseAuthService.getSessionDuration()
  }

  // Obtenir le nombre max de tentatives configuré
  const getMaxFailedAttempts = () => {
    return firebaseAuthService.getMaxFailedAttempts()
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
    isAccountLocked,
    isAccountActive,
    failedAttempts,
    // Actions
    initAuth,
    login,
    register,
    logout,
    updateProfile,
    unlockAccount,
    refreshUser,
    checkAccountLocked,
    getRemainingAttempts,
    isSessionValid,
    refreshSession,
    getSessionDuration,
    getMaxFailedAttempts,
    clearError
  }
})
