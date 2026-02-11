<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end" v-if="notificationStore.hasUnread">
          <ion-button @click="handleMarkAllAsRead">
            <ion-icon :icon="checkmarkDoneOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Badge de compteur -->
      <div class="notification-header" v-if="notificationStore.notifications.length > 0">
        <ion-chip :color="notificationStore.hasUnread ? 'danger' : 'medium'">
          <ion-icon :icon="notificationsOutline"></ion-icon>
          <ion-label>{{ notificationStore.unreadCount }} non lue(s)</ion-label>
        </ion-chip>
      </div>

      <!-- Chargement -->
      <div class="loading-container" v-if="notificationStore.isLoading">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement des notifications...</p>
      </div>

      <!-- Liste vide -->
      <div class="empty-state" v-else-if="notificationStore.notifications.length === 0">
        <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
        <h3>Aucune notification</h3>
        <p>Vous n'avez pas encore de notifications.</p>
        <p class="hint">Vous recevrez une notification lorsqu'un manager mettra à jour l'un de vos signalements.</p>
      </div>

      <!-- Liste des notifications -->
      <ion-list v-else>
        <ion-item-sliding v-for="notification in notificationStore.sortedNotifications" :key="notification.id">
          <ion-item 
            :class="{ 'unread': !notification.lu }"
            @click="openNotificationDetail(notification)"
            button
          >
            <ion-icon 
              :icon="notification.lu ? notificationsOutline : notifications" 
              slot="start"
              :color="notification.lu ? 'medium' : 'primary'"
            ></ion-icon>
            
            <ion-label>
              <h2 :class="{ 'font-bold': !notification.lu }">
                {{ notification.signalement_titre || 'Signalement' }}
              </h2>
              <p class="motif">{{ notification.motif }}</p>
              <p class="status-info" v-if="notification.status_libelle">
                <ion-badge :color="getStatusColor(notification.status_libelle)">
                  {{ notification.status_libelle }} ({{ notification.status_avancement }}%)
                </ion-badge>
              </p>
              <p class="date">
                <ion-icon :icon="timeOutline" size="small"></ion-icon>
                {{ formatDate(notification.date) }}
              </p>
            </ion-label>

            <ion-icon 
              v-if="!notification.lu" 
              :icon="ellipse" 
              slot="end" 
              color="primary"
              size="small"
            ></ion-icon>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option v-if="!notification.lu" color="primary" @click="handleMarkAsRead(notification.id)">
              <ion-icon :icon="checkmarkOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Modal de détail -->
      <ion-modal :is-open="showDetailModal" @didDismiss="closeDetailModal">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Détail notification</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeDetailModal">
                <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" v-if="selectedNotification">
          <div class="detail-card">
            <div class="detail-header">
              <ion-icon :icon="notifications" color="primary" size="large"></ion-icon>
              <h2>{{ selectedNotification.signalement_titre || 'Signalement' }}</h2>
            </div>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Message</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ selectedNotification.motif }}</p>
              </ion-card-content>
            </ion-card>

            <ion-card v-if="selectedNotification.status_libelle">
              <ion-card-header>
                <ion-card-title>Nouveau statut</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-badge :color="getStatusColor(selectedNotification.status_libelle)" class="status-badge">
                  {{ selectedNotification.status_libelle }}
                </ion-badge>
                <div class="progress-container">
                  <ion-progress-bar 
                    :value="(selectedNotification.status_avancement || 0) / 100"
                    :color="getStatusColor(selectedNotification.status_libelle)"
                  ></ion-progress-bar>
                  <span class="progress-label">{{ selectedNotification.status_avancement }}%</span>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Date</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  {{ formatDateFull(selectedNotification.date) }}
                </p>
              </ion-card-content>
            </ion-card>

      
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonButton, IonButtons,
  IonMenuButton, IonSpinner, IonChip, IonBadge, IonModal,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonProgressBar, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/vue'
import { 
  notificationsOutline, 
  notifications,
  notificationsOffOutline,
  checkmarkOutline, 
  checkmarkDoneOutline,
  closeOutline,
  timeOutline,
  ellipse,
  calendarOutline,
  eyeOutline
} from 'ionicons/icons'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification } from '@/services/notificationService'

const router = useRouter()
const notificationStore = useNotificationStore()

const showDetailModal = ref(false)
const selectedNotification = ref<Notification | null>(null)

/**
 * Obtenir la couleur du badge selon le statut
 */
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': 'primary',
    'EN_COURS': 'warning',
    'TERMINE': 'success',
    'ANNULE': 'danger'
  }
  return colors[status] || 'medium'
}

/**
 * Formater une date de manière relative
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays} jour(s)`
  
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Formater une date complète
 */
const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return ''
  
  return new Date(dateStr).toLocaleString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Ouvrir le modal de détail
 */
const openNotificationDetail = async (notification: Notification) => {
  selectedNotification.value = notification
  showDetailModal.value = true
  
  // Marquer comme lue si ce n'est pas déjà fait
  if (!notification.lu) {
    await notificationStore.markAsRead(notification.id)
  }
}

/**
 * Fermer le modal de détail
 */
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedNotification.value = null
}

/**
 * Marquer une notification comme lue
 */
const handleMarkAsRead = async (notificationId: string) => {
  await notificationStore.markAsRead(notificationId)
}

/**
 * Marquer toutes les notifications comme lues
 */
const handleMarkAllAsRead = async () => {
  await notificationStore.markAllAsRead()
}

/**
 * Naviguer vers le signalement
 */
const goToSignalement = (signalementId: string) => {
  closeDetailModal()
  router.push(`/signalements/${signalementId}`)
}
</script>

<style scoped>
.notification-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--ion-color-medium);
}

.loading-container p {
  margin-top: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 20px;
}

.empty-icon {
  font-size: 80px;
  color: var(--ion-color-medium);
  margin-bottom: 20px;
}

.empty-state h3 {
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 8px;
}

.empty-state .hint {
  font-size: 0.85em;
  font-style: italic;
}

ion-item.unread {
  --background: rgba(var(--ion-color-primary-rgb), 0.05);
  border-left: 3px solid var(--ion-color-primary);
}

.font-bold {
  font-weight: 600 !important;
}

.motif {
  color: var(--ion-color-dark);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-info {
  margin-top: 8px;
}

.date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  color: var(--ion-color-medium);
  margin-top: 8px;
}

/* Modal styles */
.detail-card {
  max-width: 500px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  text-align: center;
}

.detail-header h2 {
  margin-top: 12px;
  color: var(--ion-color-dark);
}

.status-badge {
  font-size: 1.1em;
  padding: 8px 16px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.progress-container ion-progress-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
}

.progress-label {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.view-signalement-btn {
  margin-top: 24px;
}

ion-card {
  margin-bottom: 16px;
}

ion-card-content p {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
