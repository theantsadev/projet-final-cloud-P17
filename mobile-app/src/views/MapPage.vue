<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Carte - Antananarivo</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshSignalements">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Carte Leaflet -->
      <div id="map" ref="mapContainer"></div>

      <!-- Bouton flottant pour ajouter un signalement -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="success" @click="startAddSignalement">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

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
          <!-- Coordonnées -->
          <ion-card color="light">
            <ion-card-content>
              <p><strong>Position sélectionnée :</strong></p>
              <p>Latitude: {{ newSignalement.latitude.toFixed(6) }}</p>
              <p>Longitude: {{ newSignalement.longitude.toFixed(6) }}</p>
            </ion-card-content>
          </ion-card>

          <!-- Titre -->
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input 
              v-model="newSignalement.titre" 
              placeholder="Ex: Nid de poule dangereux"
              required
            ></ion-input>
          </ion-item>

          <!-- Type de problème -->
          <ion-item>
            <ion-label position="stacked">Type de problème *</ion-label>
            <ion-select v-model="newSignalement.typeProbleme" placeholder="Sélectionner">
              <ion-select-option value="NID_DE_POULE">Nid de poule</ion-select-option>
              <ion-select-option value="FISSURE">Fissure</ion-select-option>
              <ion-select-option value="INONDATION">Inondation</ion-select-option>
              <ion-select-option value="OBSTACLE">Obstacle</ion-select-option>
              <ion-select-option value="ECLAIRAGE">Éclairage</ion-select-option>
              <ion-select-option value="SIGNALISATION">Signalisation</ion-select-option>
              <ion-select-option value="AUTRE">Autre</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Description -->
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea 
              v-model="newSignalement.description" 
              placeholder="Décrivez le problème..."
              :rows="3"
            ></ion-textarea>
          </ion-item>

          <!-- Adresse -->
          <ion-item>
            <ion-label position="stacked">Adresse</ion-label>
            <ion-input 
              v-model="newSignalement.adresse" 
              placeholder="Ex: Avenue de l'Indépendance"
            ></ion-input>
          </ion-item>

          <!-- Priorité -->
          <ion-item>
            <ion-label position="stacked">Priorité</ion-label>
            <ion-select v-model="newSignalement.priorite" placeholder="Normale">
              <ion-select-option value="BASSE">Basse</ion-select-option>
              <ion-select-option value="NORMALE">Normale</ion-select-option>
              <ion-select-option value="HAUTE">Haute</ion-select-option>
              <ion-select-option value="URGENTE">Urgente</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Bouton soumettre -->
          <ion-button 
            expand="block" 
            type="submit" 
            class="ion-margin-top"
            :disabled="!isFormValid || signalementStore.isLoading"
          >
            <ion-spinner v-if="signalementStore.isLoading" name="crescent"></ion-spinner>
            <span v-else>Envoyer le signalement</span>
          </ion-button>
        </form>
      </ion-content>
    </ion-modal>

    <!-- Modal détails signalement -->
    <ion-modal :is-open="showDetailModal" @didDismiss="closeDetailModal">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Détails</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDetailModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" v-if="selectedSignalement">
        <ion-card>
          <ion-card-header>
            <ion-chip :color="getStatutColor(selectedSignalement.statut)">
              {{ getStatutLabel(selectedSignalement.statut) }}
            </ion-chip>
            <ion-card-title>{{ selectedSignalement.titre }}</ion-card-title>
            <ion-card-subtitle>
              {{ getTypeLabel(selectedSignalement.typeProbleme) }}
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p v-if="selectedSignalement.description">
              {{ selectedSignalement.description }}
            </p>
            <ion-list>
              <ion-item lines="none">
                <ion-icon :icon="locationOutline" slot="start"></ion-icon>
                <ion-label>
                  <p>{{ selectedSignalement.adresse || 'Adresse non renseignée' }}</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                <ion-label>
                  <p>{{ formatDate(selectedSignalement.dateSignalement) }}</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="personOutline" slot="start"></ion-icon>
                <ion-label>
                  <p>{{ selectedSignalement.createdByName || selectedSignalement.createdByEmail }}</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="flagOutline" slot="start"></ion-icon>
                <ion-label>
                  <p>Priorité: {{ getPrioriteLabel(selectedSignalement.priorite) }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFab, IonFabButton, IonModal, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonChip, IonList,
  IonSpinner, IonToast, IonLoading, IonMenuButton
} from '@ionic/vue'
import {
  addOutline, closeOutline, refreshOutline, locationOutline,
  calendarOutline, personOutline, flagOutline
} from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSignalementStore } from '@/stores/signalementStore'
import {
  typeProblemeLabels, statutLabels, prioriteLabels, statutColors,
  type Signalement, type TypeProbleme, type SignalementStatus, type Priorite
} from '@/services/firestoreSignalementService'

const signalementStore = useSignalementStore()

// Map
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let tempMarker: L.Marker | null = null

// Antananarivo coordinates
const ANTANANARIVO_CENTER: [number, number] = [-18.9137, 47.5226]
const DEFAULT_ZOOM = 13

// State
const isLoading = ref(false)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedSignalement = ref<Signalement | null>(null)
const isAddingMode = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Form
const newSignalement = ref({
  titre: '',
  description: '',
  typeProbleme: '' as TypeProbleme | '',
  latitude: 0,
  longitude: 0,
  adresse: '',
  priorite: 'NORMALE' as Priorite
})

const isFormValid = computed(() => {
  return newSignalement.value.titre.trim() !== '' && 
         newSignalement.value.typeProbleme !== ''
})

// Helpers
const getTypeLabel = (type: TypeProbleme) => typeProblemeLabels[type] || type
const getStatutLabel = (statut: SignalementStatus) => statutLabels[statut] || statut
const getPrioriteLabel = (priorite: Priorite) => prioriteLabels[priorite] || priorite
const getStatutColor = (statut: SignalementStatus) => statutColors[statut] || 'medium'

const formatDate = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Map functions
const initMap = () => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView(ANTANANARIVO_CENTER, DEFAULT_ZOOM)

  // Tile layer OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Layer pour les markers
  markersLayer = L.layerGroup().addTo(map)

  // Click event pour ajouter un signalement
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (isAddingMode.value) {
      handleMapClick(e)
    }
  })
}

const handleMapClick = (e: L.LeafletMouseEvent) => {
  const { lat, lng } = e.latlng

  // Supprimer le marqueur temporaire s'il existe
  if (tempMarker) {
    tempMarker.remove()
  }

  // Ajouter un nouveau marqueur temporaire
  tempMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'custom-marker temp-marker',
      html: '<div style="background: #10dc60; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(map!)

  // Mettre à jour les coordonnées
  newSignalement.value.latitude = lat
  newSignalement.value.longitude = lng

  // Ouvrir le modal
  showCreateModal.value = true
  isAddingMode.value = false
}

const loadMarkers = () => {
  if (!markersLayer || !map) return

  markersLayer.clearLayers()

  signalementStore.signalements.forEach((sig, index) => {
    const color = getMarkerColor(sig.statut)
    
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

    marker.bindTooltip(sig.titre, { direction: 'top', offset: [0, -10] })
    markersLayer!.addLayer(marker)
  })
}

const getMarkerColor = (statut: SignalementStatus): string => {
  const colors: Record<SignalementStatus, string> = {
    NOUVEAU: '#3880ff',
    EN_COURS: '#ffc409',
    RESOLU: '#2dd36f',
    REJETE: '#eb445a'
  }
  return colors[statut] || '#92949c'
}

// Actions
const startAddSignalement = () => {
  isAddingMode.value = true
  toastMessage.value = 'Cliquez sur la carte pour placer le signalement'
  toastColor.value = 'primary'
  showToast.value = true
}

const refreshSignalements = async () => {
  isLoading.value = true
  await signalementStore.fetchAll()
  loadMarkers()
  isLoading.value = false
}

const closeCreateModal = () => {
  showCreateModal.value = false
  if (tempMarker) {
    tempMarker.remove()
    tempMarker = null
  }
  resetForm()
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSignalement.value = null
}

const resetForm = () => {
  newSignalement.value = {
    titre: '',
    description: '',
    typeProbleme: '',
    latitude: 0,
    longitude: 0,
    adresse: '',
    priorite: 'NORMALE'
  }
}

const submitSignalement = async () => {
  if (!isFormValid.value) return

  const result = await signalementStore.create({
    titre: newSignalement.value.titre,
    description: newSignalement.value.description || undefined,
    typeProbleme: newSignalement.value.typeProbleme as TypeProbleme,
    latitude: newSignalement.value.latitude,
    longitude: newSignalement.value.longitude,
    adresse: newSignalement.value.adresse || undefined,
    priorite: newSignalement.value.priorite
  })

  if (result.success) {
    toastMessage.value = 'Signalement créé avec succès !'
    toastColor.value = 'success'
    showToast.value = true
    closeCreateModal()
    loadMarkers()
  } else {
    toastMessage.value = result.message || 'Erreur lors de la création'
    toastColor.value = 'danger'
    showToast.value = true
  }
}

// Lifecycle
onMounted(async () => {
  initMap()
  await refreshSignalements()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Watch for changes
watch(() => signalementStore.signalements, () => {
  loadMarkers()
}, { deep: true })
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}

ion-modal ion-content {
  --background: var(--ion-background-color);
}

.custom-marker {
  background: transparent;
  border: none;
}

.temp-marker {
  z-index: 1000 !important;
}
</style>

<style>
/* Global styles for Leaflet */
.leaflet-container {
  font-family: inherit;
}
</style>
