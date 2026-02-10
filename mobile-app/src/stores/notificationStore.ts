// Store Pinia pour la gestion des notifications
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import notificationService, { type Notification } from '@/services/notificationService'

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const isListening = ref(false)

  // Getters
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.lu)
  )

  const unreadCount = computed(() => 
    unreadNotifications.value.length
  )

  const hasUnread = computed(() => 
    unreadCount.value > 0
  )

  const sortedNotifications = computed(() => 
    [...notifications.value].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  )

  /**
   * Démarrer l'écoute des notifications pour un utilisateur
   */
  const startListening = (userId: string) => {
    if (isListening.value && notificationService.getCurrentUserId() === userId) {
      console.log('🔔 Déjà en écoute pour cet utilisateur')
      return
    }

    isLoading.value = true
    
    notificationService.startListening(userId, (newNotifications) => {
      notifications.value = newNotifications
      isLoading.value = false
      isListening.value = true
    })
  }

  /**
   * Arrêter l'écoute des notifications
   */
  const stopListening = () => {
    notificationService.stopListening()
    notifications.value = []
    isListening.value = false
  }

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      // Mise à jour locale
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.lu = true
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
      throw error
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.value.map(n => n.id)
      await notificationService.markMultipleAsRead(unreadIds)
      
      // Mise à jour locale
      notifications.value.forEach(n => {
        n.lu = true
      })
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error)
      throw error
    }
  }

  /**
   * Obtenir une notification par ID
   */
  const getNotificationById = (id: string) => {
    return notifications.value.find(n => n.id === id)
  }

  /**
   * Obtenir les notifications pour un signalement spécifique
   */
  const getNotificationsForSignalement = (signalementId: string) => {
    return notifications.value.filter(n => n.signalement_id === signalementId)
  }

  /**
   * Réinitialiser le store (à appeler lors de la déconnexion)
   */
  const reset = () => {
    stopListening()
    notifications.value = []
    isLoading.value = false
    isListening.value = false
  }

  return {
    // State
    notifications,
    isLoading,
    isListening,
    
    // Getters
    unreadNotifications,
    unreadCount,
    hasUnread,
    sortedNotifications,
    
    // Actions
    startListening,
    stopListening,
    markAsRead,
    markAllAsRead,
    getNotificationById,
    getNotificationsForSignalement,
    reset
  }
})
