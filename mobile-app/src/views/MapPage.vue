<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Carte - Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshSignalements">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
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

      <!-- Filtre et contrôles -->
      <div class="card-header" style="padding: 16px; background: white; border-bottom: 1px solid #e5e7eb;">
        <div class="controls-row">
          <div class="btn-group">
            <ion-button 
              @click="filter = 'tous'"
              :fill="filter === 'tous' ? 'solid' : 'outline'"
              size="small"
            >
              Tous
            </ion-button>
            <ion-button 
              @click="filter = 'mes'"
              :fill="filter === 'mes' ? 'solid' : 'outline'"
              size="small"
            >
              Mes signalements
            </ion-button>
          </div>
          <ion-button color="success" @click="startAddSignalement" size="small">
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Ajouter
          </ion-button>
        </div>
      </div>

      <!-- Carte -->
      <div id="map" ref="mapContainer" class="map-container"></div>

      <!-- Loader -->
      <ion-loading :is-open="isLoading" message="Chargement..."></ion-loading>
    </ion-content>

    <!-- Modal pour créer un signalement -->
    <ion-modal :is-open="showCreateModal" @didDismiss="closeCreateModal">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Nouveau Signalement</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeCreateModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form @submit.prevent="submitSignalement">
          <!-- Coordonnées sélectionnées -->
          <ion-card color="light">
            <ion-card-content>
              <p><strong>Position sélectionnée :</strong></p>
              <p>Latitude: {{ selectedMapPoint?.lat?.toFixed(6) || 'Cliquez sur la carte' }}</p>
              <p>Longitude: {{ selectedMapPoint?.lng?.toFixed(6) || 'Cliquez sur la carte' }}</p>
            </ion-card-content>
          </ion-card>

          <!-- Titre -->
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input 
              v-model="newSignalement.titre" 
              placeholder="Décrire le problème..."
              required
            ></ion-input>
          </ion-item>

          <!-- Description -->
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea 
              v-model="newSignalement.description" 
              placeholder="Détails supplémentaires..."
              :rows="3"
            ></ion-textarea>
          </ion-item>

          <!-- Bouton soumettre -->
          <ion-button 
            expand="block" 
            type="submit" 
            class="ion-margin-top"
            :disabled="!isFormValid || isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>Envoyer le signalement</span>
          </ion-button>
        </form>
      </ion-content>
    </ion-modal>

    <!-- Modal détails signalement -->
    <ion-modal :is-open="showDetailModal" @didDismiss="closeDetailModal">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button @click="closeDetailModal">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Détails</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" v-if="selectedSignalement">
        <!-- Statut -->
        <ion-chip :color="getStatutChipColor(selectedSignalement.statut?.statut)">
          {{ selectedSignalement.statut?.statut || 'Inconnu' }}
          ({{ selectedSignalement.statut?.avancement || 0 }}%)
        </ion-chip>

        <!-- Titre -->
        <h1 class="detail-title">{{ selectedSignalement.titre }}</h1>

        <!-- Description -->
        <p v-if="selectedSignalement.description">{{ selectedSignalement.description }}</p>

        <!-- Informations -->
        <ion-list>
          <ion-item lines="none">
            <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>{{ selectedSignalement.latitude.toFixed(6) }}, {{ selectedSignalement.longitude.toFixed(6) }}</p>
            </ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon :icon="calendarOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>{{ formatDate(selectedSignalement.created_at) }}</p>
            </ion-label>
          </ion-item>
          <ion-item lines="none" v-if="selectedSignalement.surface_m2">
            <ion-label>
              <p>Surface: {{ selectedSignalement.surface_m2 }} m²</p>
            </ion-label>
          </ion-item>
          <ion-item lines="none" v-if="selectedSignalement.budget">
            <ion-label>
              <p>Budget: {{ selectedSignalement.budget }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonCard, IonCardContent, IonModal, IonLoading,
  IonMenuButton, IonItem, IonLabel, IonInput, IonTextarea, IonChip,
  IonSpinner, IonToast, IonList, IonCardHeader
} from '@ionic/vue'
import {
  refreshOutline, addOutline, closeOutline, locationOutline,
  calendarOutline, arrowBackOutline
} from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSignalementStore } from '@/stores/signalementStore'
import { useAuthStore } from '@/stores/authStore'
import { statutColors } from '@/types/firestore.types'
import type { Signalement } from '@/types/firestore.types'
import firestoreSignalementService from '@/services/firestoreSignalementService'

const signalementStore = useSignalementStore()
const authStore = useAuthStore()

// Map
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let tempMarker: L.Marker | null = null

// Antananarivo center
const ANTANANARIVO_CENTER: [number, number] = [-18.9137, 47.5226]
const DEFAULT_ZOOM = 13

// State
const filter = ref<'tous' | 'mes'>('tous')
const isLoading = ref(false)
const isAddingMode = ref(false)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedSignalement = ref<Signalement | null>(null)
const selectedMapPoint = ref<{ lat: number; lng: number } | null>(null)

// Form
const newSignalement = ref({
  titre: '',
  description: ''
})

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

const isFormValid = computed(() => {
  return newSignalement.value.titre.trim() !== '' && selectedMapPoint.value
})

// Helpers
const getStatutChipColor = (statut: string | undefined): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': 'primary',
    'EN_COURS': 'warning',
    'TERMINE': 'success',
    'ANNULE': 'danger'
  }
  return colors[statut || 'NOUVEAU'] || 'medium'
}

const getMarkerColor = (statut: string): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': '#3880ff',
    'EN_COURS': '#ffc409',
    'TERMINE': '#2dd36f',
    'ANNULE': '#eb445a'
  }
  return colors[statut] || '#92949c'
}

const formatDate = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Map functions
const initMap = () => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView(ANTANANARIVO_CENTER, DEFAULT_ZOOM)

  // OSM tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map)

  // Markers layer
  markersLayer = L.layerGroup().addTo(map)

  // Click handler for adding marker
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (isAddingMode.value) {
      const { lat, lng } = e.latlng
      
      // Remove old temp marker
      if (tempMarker) {
        tempMarker.removeFrom(map!)
      }

      // Add temp marker
      tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker temp-marker',
          html: '<div style="background: #10dc60; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map!)

      selectedMapPoint.value = { lat, lng }
      showCreateModal.value = true
      isAddingMode.value = false
    }
  })

  loadMarkers()
}

const loadMarkers = () => {
  if (!markersLayer || !map) return

  markersLayer.clearLayers()

  displayedSignalements.value.forEach((sig, index) => {
    const color = getMarkerColor(sig.statut?.statut || 'NOUVEAU')
    
    const marker = L.marker([sig.latitude, sig.longitude], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 10px; font-weight: bold;">${index + 1}</span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    })

    marker.on('click', () => {
      selectedSignalement.value = sig
      showDetailModal.value = true
    })

    markersLayer!.addLayer(marker)
  })
}

// Actions
const refreshSignalements = async () => {
  if (filter.value === 'mes') {
    await signalementStore.fetchMesSignalements()
  } else {
    await signalementStore.fetchAll()
  }
  await signalementStore.fetchRecap()
  loadMarkers()
}

const startAddSignalement = () => {
  isAddingMode.value = true
  toastMessage.value = 'Cliquez sur la carte pour placer le signalement'
  toastColor.value = 'primary'
  showToast.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
  if (tempMarker && map) {
    tempMarker.removeFrom(map)
  }
  tempMarker = null
  isAddingMode.value = false
}

const resetForm = () => {
  newSignalement.value = {
    titre: '',
    description: ''
  }
  selectedMapPoint.value = null
}

const submitSignalement = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  try {
    await signalementStore.create({
      titre: newSignalement.value.titre,
      description: newSignalement.value.description || undefined,
      latitude: selectedMapPoint.value!.lat,
      longitude: selectedMapPoint.value!.lng
    })

    toastMessage.value = 'Signalement créé avec succès !'
    toastColor.value = 'success'
    showToast.value = true
    closeCreateModal()
    await refreshSignalements()
  } catch (error: any) {
    toastMessage.value = error.message || 'Erreur lors de la création'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    isLoading.value = false
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSignalement.value = null
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true
  try {
    await refreshSignalements()
  } finally {
    isLoading.value = false
  }
  
  // Initialize map after a small delay to ensure container is mounted
  setTimeout(() => {
    initMap()
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Watch filter changes
import { watch } from 'vue'
watch(() => filter.value, () => {
  refreshSignalements()
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.btn-group {
  display: flex;
  gap: 0;
}

.btn-group ion-button:first-child {
  border-radius: 4px 0 0 4px;
}

.btn-group ion-button:last-child {
  border-radius: 0 4px 4px 0;
}

.map-container {
  width: 100%;
  height: 400px;
  z-index: 1;
}

.detail-title {
  font-size: 24px;
  margin: 0 0 16px;
  font-weight: bold;
}

ion-card {
  margin: 16px 0;
}
</style>
