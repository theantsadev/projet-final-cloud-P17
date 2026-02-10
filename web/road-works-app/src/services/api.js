import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Clear storage and redirect to login
        localStorage.removeItem('auth-storage')
        window.location.href = '/auth/login'
      }

      // Handle 423 Locked (account locked)
      if (error.response.status === 423) {
        console.error('Account is locked')
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ===================================
// API ENDPOINTS - Ready for backend
// ===================================

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  checkLock: (email) => api.get(`/auth/check-lock/${email}`)
}

// Signalements API
export const signalementAPI = {
  getAll: () => api.get('/signalements'),
  getById: (id) => api.get(`/signalements/${id}`),
  create: (data) => api.post('/signalements', data),
  update: (id, data) => api.put(`/signalements/${id}`, data),
  updateStatus: (id, statut) => api.patch(`/signalements/${id}/statut?statut=${statut}`),
  delete: (id) => api.delete(`/signalements/${id}`),
  getRecap: () => api.get('/signalements/stats/recap'),
  getDelaiMoyenTraitement: () => api.get('/signalements/stats/delai-moyen-traitement'),
  syncPushAll: () => api.post('/signalements/sync/push-all'),
  syncPullAll: () => api.post('/signalements/sync/pull-all'),
  // Test endpoints
  testSyncPush: () => api.post('/signalements/test/sync-firebase-push'),
  testSyncPull: () => api.post('/signalements/test/sync-firebase-pull')
}

// Road Works API (alias for backward compatibility)
export const roadWorksAPI = signalementAPI

// Users API (for managers)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getAllLocked: () => api.get('/users/locked'),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  unlockUser: (id) => api.post(`/users/${id}/unlock`),
  delete: (id) => api.delete(`/users/${id}`),
  // Sync endpoints
  syncPushAll: () => api.post('/users/sync/push-all'),
  syncPullAll: () => api.post('/users/sync/pull-all'),
  // Test endpoints
  testSyncPush: () => api.post('/users/test/sync-firebase-push'),
  testSyncPull: () => api.post('/users/test/sync-firebase-pull')
}

// Types de Réparation API
export const typeReparationAPI = {
  // CRUD
  getAll: () => api.get('/type-reparations'),
  getActive: () => api.get('/type-reparations/active'),
  getById: (id) => api.get(`/type-reparations/${id}`),
  create: (data) => api.post('/type-reparations', data),
  update: (id, data) => api.put(`/type-reparations/${id}`, data),
  delete: (id) => api.delete(`/type-reparations/${id}`),
  // Affectation et calcul de budget
  assignToSignalement: (signalementId, typeReparationId) => 
    api.post('/type-reparations/assign', { signalementId, typeReparationId }),
  recalculateBudget: (signalementId) => 
    api.post(`/type-reparations/recalculate-budget/${signalementId}`),
  calculateBudget: (surfaceM2, prixM2) => 
    api.get(`/type-reparations/calculate-budget?surfaceM2=${surfaceM2}&prixM2=${prixM2}`)
}
