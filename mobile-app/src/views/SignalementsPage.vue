<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshSignalements">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <!-- Segment pour filtrer -->
      <ion-toolbar>
        <ion-segment v-model="filter" @ionChange="onFilterChange">
          <ion-segment-button value="tous">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mes">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Récapitulatif -->
      <ion-card v-if="recap" class="recap-card">
        <ion-card-content>
          <!-- Compteurs de statuts -->
          <div class="recap-grid">
            <div class="recap-item">
              <span class="recap-number">{{ recap.total }}</span>
              <span class="recap-label">Total</span>
            </div>
            <div class="recap-item">
              <span class="recap-number text-primary">{{ recap.nouveaux }}</span>
              <span class="recap-label">Nouveaux</span>
            </div>
            <div class="recap-item">
              <span class="recap-number text-warning">{{ recap.enCours }}</span>
              <span class="recap-label">En cours</span>
            </div>
            <div class="recap-item">
              <span class="recap-number text-success">{{ recap.termines }}</span>
              <span class="recap-label">Terminés</span>
            </div>
          </div>
          
          <!-- Statistiques détaillées -->
          <div class="recap-stats-row">
            <div class="recap-stat">
              <span class="stat-label">Surface totale</span>
              <span class="stat-value">{{ (recap.totalSurfaceM2 || 0).toFixed(1) }} m²</span>
            </div>
            <div class="recap-stat">
              <span class="stat-label">Budget total</span>
              <span class="stat-value">{{ ((recap.totalBudget || 0) / 1000000).toFixed(1) }}M Ar</span>
            </div>
            <div class="recap-stat">
              <span class="stat-label">Avancement moyen</span>
              <span class="stat-value">{{ recap.averageAvancement || 0 }}%</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Liste des signalements -->
      <ion-list v-if="displayedSignalements.length > 0">
        <ion-item-sliding v-for="sig in displayedSignalements" :key="sig.id">
          <ion-item button @click="viewDetails(sig)">
            <ion-avatar slot="start" :style="{ background: getStatutColor(sig.statutId) }">
              <span style="color: white; font-weight: bold; font-size: 18px">📍</span>
            </ion-avatar>
            <ion-label>
              <h2>{{ sig.titre }}</h2>
              <p>{{ sig.latitude.toFixed(4) }}, {{ sig.longitude.toFixed(4) }}</p>
              <p class="date-text">{{ formatDate(sig.createdAt) }}</p>
            </ion-label>
            <ion-chip slot="end" :color="getStatutChipColor(sig.statut?.statut)" size="small">
              {{ sig.statut?.statut || 'Inconnu' }}
            </ion-chip>
          </ion-item>

          <!-- Actions de glissement -->
          <ion-item-options side="end" v-if="canDelete(sig)">
            <ion-item-option color="danger" @click="confirmDelete(sig)">
              <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- État vide -->
      <div v-else-if="!signalementStore.isLoading" class="empty-state">
        <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
        <h3>Aucun signalement</h3>
        <p v-if="filter === 'mes'">Vous n'avez pas encore créé de signalement.</p>
        <p v-else>Aucun signalement n'a été enregistré.</p>
        <ion-button @click="goToMap">
          <ion-icon :icon="mapOutline" slot="start"></ion-icon>
          Créer un signalement
        </ion-button>
      </div>

      <!-- Loader -->
      <div v-if="signalementStore.isLoading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement...</p>
      </div>

      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- Modal détails -->
    <ion-modal :is-open="showDetailModal" @didDismiss="closeDetailModal">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button @click="closeDetailModal">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Détails du signalement</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" v-if="selectedSignalement">
        <!-- Statut -->
        <div class="status-badges">
          <ion-chip :color="getStatutChipColor(selectedSignalement.statut?.statut)">
            {{ selectedSignalement.statut?.statut || 'Inconnu' }}
            ({{ selectedSignalement.statut?.avancement || 0 }}%)
          </ion-chip>
        </div>

        <!-- Titre -->
        <h1 class="detail-title">{{ selectedSignalement.titre }}</h1>

        <!-- Description -->
        <ion-card v-if="selectedSignalement.description">
          <ion-card-header>
            <ion-card-subtitle>Description</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            {{ selectedSignalement.description }}
          </ion-card-content>
        </ion-card>

        <!-- Informations -->
        <ion-list>
          <ion-item>
            <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Coordonnées</h3>
              <p>{{ selectedSignalement.latitude.toFixed(6) }}, {{ selectedSignalement.longitude.toFixed(6) }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="openInMaps">
              <ion-icon :icon="openOutline"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-item v-if="selectedSignalement.surfaceM2">
            <ion-label>
              <h3>Surface</h3>
              <p>{{ selectedSignalement.surfaceM2 }} m²</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="selectedSignalement.budget">
            <ion-label>
              <h3>Budget</h3>
              <p>{{ selectedSignalement.budget }}</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="selectedSignalement.entrepriseConcernee">
            <ion-label>
              <h3>Entreprise</h3>
              <p>{{ selectedSignalement.entrepriseConcernee }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon :icon="calendarOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Date du signalement</h3>
              <p>{{ formatDateLong(selectedSignalement.createdAt) }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Actions -->
        <div class="detail-actions" v-if="canDelete(selectedSignalement)">
          <ion-button expand="block" color="danger" @click="confirmDelete(selectedSignalement)">
            <ion-icon :icon="trashOutline" slot="start"></ion-icon>
            Supprimer ce signalement
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Alert de confirmation -->
    <ion-alert
      :is-open="showDeleteAlert"
      header="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer ce signalement ?"
      :buttons="alertButtons"
      @didDismiss="showDeleteAlert = false"
    ></ion-alert>

    <!-- Toast -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :color="toastColor"
      :duration="3000"
      @didDismiss="showToast = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonAvatar, IonChip,
  IonSegment, IonSegmentButton, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardContent, IonModal, IonRefresher, IonRefresherContent,
  IonItemSliding, IonItemOptions, IonItemOption, IonSpinner, IonToast,
  IonAlert, IonMenuButton
} from '@ionic/vue'
import {
  refreshOutline, trashOutline, documentTextOutline, mapOutline,
  arrowBackOutline, locationOutline, navigateOutline, calendarOutline,
  personOutline, checkmarkCircleOutline, openOutline, alertCircleOutline
} from 'ionicons/icons'
import { useSignalementStore } from '@/stores/signalementStore'
import { useAuthStore } from '@/stores/authStore'
import { statutLabels, statutColors } from '@/types/firestore.types'
import type { Signalement } from '@/types/firestore.types'

const router = useRouter()
const signalementStore = useSignalementStore()
const authStore = useAuthStore()

// State
const filter = ref<'tous' | 'mes'>('tous')
const showDetailModal = ref(false)
const selectedSignalement = ref<Signalement | null>(null)
const showDeleteAlert = ref(false)
const signalementToDelete = ref<Signalement | null>(null)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Computed
const recap = computed(() => signalementStore.recap)

const displayedSignalements = computed(() => {
  if (filter.value === 'mes') {
    return signalementStore.mesSignalements
  }
  return signalementStore.signalements
})

// Alert buttons
const alertButtons = [
  {
    text: 'Annuler',
    role: 'cancel'
  },
  {
    text: 'Supprimer',
    role: 'destructive',
    handler: () => deleteSignalement()
  }
]

// Helpers
const getStatutColor = (statutId: string): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': '#3880ff',
    'EN_COURS': '#ffc409',
    'TERMINE': '#2dd36f',
    'ANNULE': '#eb445a'
  }
  return colors[statutId] || '#92949c'
}

const getStatutChipColor = (statut: string | undefined): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': 'primary',
    'EN_COURS': 'warning',
    'TERMINE': 'success',
    'ANNULE': 'danger'
  }
  return colors[statut || 'NOUVEAU'] || 'medium'
}

const formatDate = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateLong = (date: Date | string | undefined) => {
  if (!date) return 'Non disponible'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const canDelete = (sig: Signalement): boolean => {
  return sig.userId === authStore.currentUser?.id
}

// Actions
const refreshSignalements = async () => {
  if (filter.value === 'mes') {
    await signalementStore.fetchMesSignalements()
  } else {
    await signalementStore.fetchAll()
  }
  await signalementStore.fetchRecap()
}

const handleRefresh = async (event: CustomEvent) => {
  await refreshSignalements()
  ;(event.target as any).complete()
}

const onFilterChange = async () => {
  await refreshSignalements()
}

const viewDetails = (sig: Signalement) => {
  selectedSignalement.value = sig
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSignalement.value = null
}

const goToMap = () => {
  router.push('/map')
}

const openInMaps = () => {
  if (!selectedSignalement.value) return
  const { latitude, longitude } = selectedSignalement.value
  window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
}

const confirmDelete = (sig: Signalement) => {
  signalementToDelete.value = sig
  showDeleteAlert.value = true
}

const deleteSignalement = async () => {
  if (!signalementToDelete.value) return

  const result = await signalementStore.deleteSignalement(signalementToDelete.value.id)
  
  if (result.success) {
    toastMessage.value = 'Signalement supprimé'
    toastColor.value = 'success'
    closeDetailModal()
  } else {
    toastMessage.value = result.message || 'Erreur lors de la suppression'
    toastColor.value = 'danger'
  }
  
  showToast.value = true
  signalementToDelete.value = null
}

// Lifecycle
onMounted(async () => {
  await refreshSignalements()
})
</script>

<style scoped>
.recap-card {
  margin: 16px;
}

.recap-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
}

.recap-item {
  display: flex;
  flex-direction: column;
}

.recap-number {
  font-size: 24px;
  font-weight: bold;
}

.recap-label {
  font-size: 11px;
  color: var(--ion-color-medium);
}

.recap-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ion-color-light);
  text-align: center;
}

.recap-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-top: 4px;
}

.text-primary { color: var(--ion-color-primary); }
.text-warning { color: var(--ion-color-warning); }
.text-success { color: var(--ion-color-success); }

.date-text {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0 0 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.status-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 24px;
  margin: 0 0 16px;
}

.detail-actions {
  margin-top: 24px;
}

ion-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
