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

          <ion-item button @click="goToProfile">
            <ion-icon :icon="personOutline" slot="start" color="tertiary"></ion-icon>
            <ion-label>
              <h2>Profil</h2>
              <p>Gérer votre profil</p>
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

// Token preview (first 20 chars)
const tokenPreview = computed(() => {
  if (authStore.token) {
    return authStore.token.substring(0, 30) + '...'
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

const goToProfile = () => {
  showToast.value = true
  toastMessage.value = 'Page en cours de développement'
  toastColor.value = 'warning'
}
</script>

<style scoped>
.home-container {
  max-width: 600px;
  margin: 0 auto;
}

ion-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

ion-list {
  margin-bottom: 16px;
  border-radius: 12px;
}

ion-item {
  --border-radius: 8px;
}

.token-info {
  margin-top: 12px;
  font-size: 12px;
  word-break: break-all;
}

.token-info code {
  background: var(--ion-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

ion-chip {
  margin-top: 8px;
}
</style>
