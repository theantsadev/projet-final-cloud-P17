<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Accueil</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="home-container">
        <!-- Bienvenue -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Bienvenue, {{ authStore.userFullName }}</ion-card-title>
            <ion-card-subtitle>{{ authStore.user?.role }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>Vous êtes connecté avec succès !</p>
            <p><strong>Email :</strong> {{ authStore.user?.email }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Menu principal -->
        <ion-list>
          <ion-list-header>
            <ion-label>Menu Principal</ion-label>
          </ion-list-header>

          <ion-item button @click="goToSignalements">
            <ion-icon :icon="warningOutline" slot="start" color="warning"></ion-icon>
            <ion-label>
              <h2>Signalements</h2>
              <p>Voir et gérer les signalements routiers</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item button @click="goToNewSignalement">
            <ion-icon :icon="addCircleOutline" slot="start" color="success"></ion-icon>
            <ion-label>
              <h2>Nouveau Signalement</h2>
              <p>Signaler un problème routier</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item button @click="goToMap">
            <ion-icon :icon="mapOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Carte</h2>
              <p>Voir la carte des signalements</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>
        </ion-list>

        <!-- Statistiques -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Connexion Firebase</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-chip color="success">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <ion-label>Authentification réussie</ion-label>
            </ion-chip>
            <p class="token-info">
              <strong>Token JWT :</strong> 
              <code>{{ tokenPreview }}</code>
            </p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Toast -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :color="toastColor"
      :duration="2000"
      @didDismiss="showToast = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonButtons,
  IonChip,
  IonToast
} from '@ionic/vue'
import {
  logOutOutline,
  warningOutline,
  addCircleOutline,
  mapOutline,
  personOutline,
  chevronForwardOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// User ID preview
const tokenPreview = computed(() => {
  if (authStore.userId) {
    return authStore.userId.substring(0, 20) + '...'
  }
  return 'N/A'
})

const handleLogout = async () => {
  await authStore.logout()
  toastMessage.value = 'Déconnexion réussie'
  toastColor.value = 'success'
  showToast.value = true
  
  setTimeout(() => {
    router.push('/login')
  }, 1000)
}

const goToSignalements = () => {
  showToast.value = true
  toastMessage.value = 'Page en cours de développement'
  toastColor.value = 'warning'
}

const goToNewSignalement = () => {
  showToast.value = true
  toastMessage.value = 'Page en cours de développement'
  toastColor.value = 'warning'
}

const goToMap = () => {
  showToast.value = true
  toastMessage.value = 'Page en cours de développement'
  toastColor.value = 'warning'
}


</script>


<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
  animation: fadeIn 0.8s ease-out;
}

/* User Card */
ion-card {
  background: var(--neumorphic-bg);
  color: #fff;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

ion-card-header {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

ion-card-title {
  color: var(--ion-color-primary) !important;
  font-size: 1.5rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

ion-card-subtitle {
  color: #888 !important;
  font-family: monospace;
}

ion-list-header {
  font-size: 1.2rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #555;
  letter-spacing: 2px;
  padding-left: 10px;
  margin-bottom: 15px;
}

.token-info code {
  background: #000;
  color: var(--ion-color-secondary);
  box-shadow: inset 2px 2px 5px #000;
  padding: 10px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  display: block;
}

ion-chip {
  background: transparent;
  border: 1px solid var(--ion-color-success);
  color: var(--ion-color-success) !important;
  box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
}

/* Menu Items as Neumorphic Buttons */
ion-list {
  background: transparent;
}

ion-item {
  --background: var(--neumorphic-bg);
  --color: #fff;
  margin-bottom: 20px;
  border-radius: 20px;
  box-shadow: var(--neumorphic-shadow-dark), var(--neumorphic-shadow-light);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  padding: 10px 0;
}

ion-item:active {
  box-shadow: var(--neumorphic-shadow-inset);
  transform: scale(0.98);
}

ion-item h2 {
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1.1rem;
}

ion-item p {
  color: #888;
}

/* Icons popping out */
ion-item ion-icon[slot="start"] {
  background: var(--neumorphic-bg);
  padding: 12px;
  border-radius: 50%;
  box-shadow: var(--neumorphic-shadow-dark), var(--neumorphic-shadow-light);
  font-size: 24px;
}

/* Override icon colors specifically */
ion-item:nth-child(2) ion-icon[slot="start"] { color: var(--ion-color-warning); }
ion-item:nth-child(3) ion-icon[slot="start"] { color: var(--ion-color-success); }
ion-item:nth-child(4) ion-icon[slot="start"] { color: var(--ion-color-primary); }
ion-item:nth-child(5) ion-icon[slot="start"] { color: var(--ion-color-tertiary); }

</style>

