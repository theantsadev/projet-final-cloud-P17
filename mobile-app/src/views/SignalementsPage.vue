<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mes signalements</ion-title>
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
              <span class="stat-value">{{ (recap.totalSurfaceM2 || 0) }} m²</span>
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
        <p>Vous n'avez pas encore créé de signalement.</p>
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
        <ion-card v-if="selectedSignalement.description" class="description-card">
          <ion-card-header>
            <ion-card-subtitle>Description</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content style="color: #ccc;">
            {{ selectedSignalement.description }}
          </ion-card-content>
        </ion-card>

        <!-- Photos du signalement -->
        <ion-card v-if="signalementPhotos.length > 0" class="photos-card">
          <ion-card-header>
            <ion-card-subtitle>
              <ion-icon :icon="imagesOutline" style="margin-right: 8px;"></ion-icon>
              Photos ({{ signalementPhotos.length }})
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="photo-gallery">
              <div 
                v-for="(photo, index) in signalementPhotos" 
                :key="photo.id" 
                class="photo-gallery-item"
                @click="openPhotoFullscreen(photo.url)"
              >
                <img :src="photo.url" :alt="photo.nom" loading="lazy" />
              </div>
            </div>
          </ion-card-content>
        </ion-card>
        <div v-else-if="loadingPhotos" class="photos-loading">
          <ion-spinner name="dots"></ion-spinner>
          <p>Chargement des photos...</p>
        </div>

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
  trashOutline, documentTextOutline, mapOutline,
  arrowBackOutline, locationOutline, navigateOutline, calendarOutline,
  personOutline, checkmarkCircleOutline, openOutline, alertCircleOutline,
  imagesOutline
} from 'ionicons/icons'
import { useSignalementStore } from '@/stores/signalementStore'
import { useAuthStore } from '@/stores/authStore'
import { statutLabels, statutColors } from '@/types/firestore.types'
import type { Signalement, UserPhoto } from '@/types/firestore.types'
import userPhotosService from '@/services/userPhotosService'

const router = useRouter()
const signalementStore = useSignalementStore()
const authStore = useAuthStore()

// State
const showDetailModal = ref(false)
const selectedSignalement = ref<Signalement | null>(null)
const showDeleteAlert = ref(false)
const signalementToDelete = ref<Signalement | null>(null)

// Photos
const signalementPhotos = ref<UserPhoto[]>([])
const loadingPhotos = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Computed
const recap = computed(() => signalementStore.recap)

const displayedSignalements = computed(() => {
  return signalementStore.mesSignalements
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
  return sig.userId === authStore.user?.id
}

// Actions
const refreshSignalements = async () => {
  await signalementStore.fetchMesSignalements()
  await signalementStore.fetchRecap()
}

const handleRefresh = async (event: CustomEvent) => {
  await refreshSignalements()
  ;(event.target as any).complete()
}

const viewDetails = async (sig: Signalement) => {
  selectedSignalement.value = sig
  showDetailModal.value = true
  
  // Charger les photos du signalement
  loadingPhotos.value = true
  signalementPhotos.value = []
  try {
    signalementPhotos.value = await userPhotosService.getPhotosBySignalement(sig.id)
  } catch (error) {
    console.error('Erreur chargement photos:', error)
  } finally {
    loadingPhotos.value = false
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSignalement.value = null
  signalementPhotos.value = []
}

const openPhotoFullscreen = (url: string) => {
  // Ouvrir la photo dans un nouvel onglet
  window.open(url, '_blank')
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
  await signalementStore.fetchMesSignalements()
  await signalementStore.fetchRecap()
})
</script>


<style scoped>
.recap-card {
  background: var(--neumorphic-bg);
  padding: 15px;
  margin-bottom: 30px;
}

.recap-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  text-align: center;
  margin-bottom: 20px;
}

.recap-item {
  display: flex;
  flex-direction: column;
  padding: 10px 5px;
  border-radius: 15px;
  box-shadow: var(--neumorphic-shadow-inset); /* Inset for stats */
  background: rgba(0,0,0,0.2);
}

.recap-number {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 0 5px rgba(255,255,255,0.5);
}

.recap-label {
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 5px;
}

.recap-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.05);
  text-align: center;
}

.recap-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin-top: 4px;
}

.text-primary { color: var(--ion-color-primary); }
.text-warning { color: var(--ion-color-warning); }
.text-success { color: var(--ion-color-success); }

/* List Styling */
ion-item-sliding {
  margin-bottom: 20px;
}

ion-item {
  --background: var(--neumorphic-bg);
  border-radius: 20px;
  box-shadow: var(--neumorphic-shadow-dark), var(--neumorphic-shadow-light);
  --padding-start: 16px;
  transition: transform 0.2s;
  margin: 0 5px;
}

ion-item:active {
  transform: scale(0.98);
}

ion-label h2 {
  font-weight: 800;
  color: #fff;
  font-size: 1.1rem;
}

ion-label p {
  color: #888;
  font-size: 0.9rem;
}

ion-avatar {
  background: var(--neumorphic-bg);
  box-shadow: var(--neumorphic-shadow-inset);
  border-radius: 50%;
  padding: 25px; /* Large space around icon */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

ion-chip {
  background: var(--neumorphic-bg);
  box-shadow: var(--neumorphic-shadow-dark), var(--neumorphic-shadow-light);
  font-weight: bold;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--neumorphic-bg);
  border-radius: 30px;
  box-shadow: var(--neumorphic-shadow-inset);
  margin: 20px;
}

.empty-icon {
  font-size: 80px;
  color: #333;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 2px rgba(255,255,255,0.1));
}

.detail-title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -1px;
  margin-top: 20px;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Photo Gallery Styles */
.photos-card {
  margin: 16px 0;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.photo-gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.photo-gallery-item:active {
  transform: scale(0.95);
}

.photo-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photos-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #888;
}

.photos-loading p {
  margin-top: 8px;
  font-size: 14px;
}
</style>

