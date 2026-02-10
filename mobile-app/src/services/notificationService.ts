// Service de notification pour l'application mobile
// Écoute les notifications en temps réel depuis Firestore

import { db } from '@/firebase/config'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore'

/**
 * Interface pour une notification
 */
export interface Notification {
  id: string
  motif: string
  history_id?: string
  signalement_id: string
  signalement_titre?: string
  user_id: string
  status_id?: string
  status_libelle?: string
  status_avancement?: number
  date: string
  lu: boolean
}

/**
 * Callback pour les mises à jour de notifications
 */
type NotificationsCallback = (notifications: Notification[]) => void

/**
 * Service de gestion des notifications
 */
class NotificationFirestoreService {
  private unsubscribe: Unsubscribe | null = null
  private currentUserId: string | null = null

  /**
   * Démarrer l'écoute en temps réel des notifications pour un utilisateur
   */
  startListening(userId: string, callback: NotificationsCallback): void {
    // Si on écoute déjà pour le même utilisateur, ne rien faire
    if (this.currentUserId === userId && this.unsubscribe) {
      console.log('🔔 Déjà en écoute des notifications pour cet utilisateur')
      return
    }

    // Arrêter l'écoute précédente si nécessaire
    this.stopListening()

    this.currentUserId = userId
    console.log('🔔 Démarrage de l\'écoute des notifications pour:', userId)

    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      where('user_id', '==', userId)
    )

    this.unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notifications: Notification[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          notifications.push({
            id: doc.id,
            motif: data.motif || '',
            history_id: data.history_id,
            signalement_id: data.signalement_id,
            signalement_titre: data.signalement_titre,
            user_id: data.user_id,
            status_id: data.status_id,
            status_libelle: data.status_libelle,
            status_avancement: data.status_avancement,
            date: data.date || new Date().toISOString(),
            lu: data.lu || false
          })
        })

        console.log(`🔔 ${notifications.length} notifications reçues`)
        callback(notifications)
      },
      (error) => {
        console.error('❌ Erreur lors de l\'écoute des notifications:', error)
      }
    )
  }

  /**
   * Arrêter l'écoute des notifications
   */
  stopListening(): void {
    if (this.unsubscribe) {
      console.log('🔕 Arrêt de l\'écoute des notifications')
      this.unsubscribe()
      this.unsubscribe = null
      this.currentUserId = null
    }
  }

  /**
   * Marquer une notification comme lue dans Firestore
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId)
      await updateDoc(notificationRef, { lu: true })
      console.log('✅ Notification marquée comme lue:', notificationId)
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error)
      throw error
    }
  }

  /**
   * Marquer plusieurs notifications comme lues
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const promises = notificationIds.map(id => this.markAsRead(id))
    await Promise.all(promises)
  }

  /**
   * Vérifie si le service est en cours d'écoute
   */
  isListening(): boolean {
    return this.unsubscribe !== null
  }

  /**
   * Obtenir l'ID de l'utilisateur actuellement écouté
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }
}

// Export d'une instance singleton
export const notificationService = new NotificationFirestoreService()
export default notificationService
