import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firestoreSignalementService, {
  type Signalement,
  type SignalementCreateRequest,
  type SignalementRecap
} from '@/services/firestoreSignalementService'

export const useSignalementStore = defineStore('signalement', () => {
  // State
  const signalements = ref<Signalement[]>([])
  const mesSignalements = ref<Signalement[]>([])
  const selectedSignalement = ref<Signalement | null>(null)
  const recap = ref<SignalementRecap | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const signalementCount = computed(() => signalements.value.length)
  const mesSignalementsCount = computed(() => mesSignalements.value.length)

  const signalementsByStatut = computed(() => {
    const grouped: Record<string, Signalement[]> = {
      NOUVEAU: [],
      EN_COURS: [],
      RESOLU: [],
      REJETE: []
    }
    signalements.value.forEach(s => {
      if (grouped[s.statut]) {
        grouped[s.statut].push(s)
      }
    })
    return grouped
  })

  // Actions
  const fetchAll = async () => {
    isLoading.value = true
    error.value = null

    try {
      signalements.value = await firestoreSignalementService.getAll()
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du chargement des signalements'
      console.error('Erreur fetchAll:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchMesSignalements = async () => {
    isLoading.value = true
    error.value = null

    try {
      mesSignalements.value = await firestoreSignalementService.getMesSignalements()
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du chargement de vos signalements'
      console.error('Erreur fetchMesSignalements:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchById = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      selectedSignalement.value = await firestoreSignalementService.getById(id)
      return selectedSignalement.value
    } catch (err: any) {
      error.value = err.message || 'Signalement non trouvé'
      console.error('Erreur fetchById:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const create = async (data: SignalementCreateRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const newSignalement = await firestoreSignalementService.create(data)
      signalements.value.unshift(newSignalement)
      mesSignalements.value.unshift(newSignalement)
      return { success: true, signalement: newSignalement }
    } catch (err: any) {
      const message = err.message || 'Erreur lors de la création du signalement'
      error.value = message
      console.error('Erreur create:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const deleteSignalement = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      await firestoreSignalementService.delete(id)
      signalements.value = signalements.value.filter(s => s.id !== id)
      mesSignalements.value = mesSignalements.value.filter(s => s.id !== id)
      return { success: true }
    } catch (err: any) {
      const message = err.message || 'Erreur lors de la suppression'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const fetchRecap = async () => {
    try {
      recap.value = await firestoreSignalementService.getRecap()
    } catch (err: any) {
      console.error('Erreur fetchRecap:', err)
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearSelected = () => {
    selectedSignalement.value = null
  }

  return {
    // State
    signalements,
    mesSignalements,
    selectedSignalement,
    recap,
    isLoading,
    error,
    // Getters
    signalementCount,
    mesSignalementsCount,
    signalementsByStatut,
    // Actions
    fetchAll,
    fetchMesSignalements,
    fetchById,
    create,
    deleteSignalement,
    fetchRecap,
    clearError,
    clearSelected
  }
})
