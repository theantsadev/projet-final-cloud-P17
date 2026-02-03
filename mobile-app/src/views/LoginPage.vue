<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Signalement Routier</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <!-- Logo / Titre -->
        <div class="logo-section">
          <ion-icon :icon="carOutline" class="logo-icon"></ion-icon>
          <h1>Antananarivo</h1>
          <p>Application de signalement routier</p>
        </div>

        <!-- Formulaire de connexion / inscription -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ isRegisterMode ? 'Inscription' : 'Connexion' }}</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="handleSubmit">
              <!-- Nom complet (inscription uniquement) -->
              <ion-item v-if="isRegisterMode">
                <ion-label position="floating">Nom complet</ion-label>
                <ion-input
                  v-model="fullName"
                  type="text"
                  placeholder="Votre nom complet"
                  :required="isRegisterMode"
                ></ion-input>
              </ion-item>

              <!-- Email -->
              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input
                  v-model="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                ></ion-input>
              </ion-item>

              <!-- Mot de passe -->
              <ion-item>
                <ion-label position="floating">Mot de passe</ion-label>
                <ion-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Votre mot de passe"
                  required
                ></ion-input>
                <ion-button 
                  fill="clear" 
                  slot="end" 
                  @click="showPassword = !showPassword"
                >
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </ion-button>
              </ion-item>

              <!-- Message d'erreur -->
              <ion-text color="danger" v-if="authStore.error">
                <p class="error-message">{{ authStore.error }}</p>
              </ion-text>

              <!-- Bouton principal -->
              <ion-button
                expand="block"
                type="submit"
                :disabled="authStore.isLoading"
                class="login-button"
              >
                <ion-spinner v-if="authStore.isLoading" name="crescent"></ion-spinner>
                <span v-else>{{ isRegisterMode ? "S'inscrire" : 'Se connecter' }}</span>
              </ion-button>
            </form>

            <!-- Lien pour changer de mode -->
            <div class="switch-mode">
              <ion-button fill="clear" @click="toggleMode">
                {{ isRegisterMode ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire" }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Info Firebase -->
        <ion-card color="light">
          <ion-card-content>
            <p><strong>🔥 Firebase Authentication</strong></p>
            <p>L'authentification est gérée directement par Firebase.</p>
            <p v-if="!isRegisterMode">Créez un compte pour commencer à signaler les problèmes routiers.</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Toast pour les messages -->
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
import { ref } from 'vue'
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
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonToast
} from '@ionic/vue'
import { carOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Mode
const isRegisterMode = ref(false)

// Form data
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  authStore.clearError()
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    toastMessage.value = 'Veuillez remplir tous les champs'
    toastColor.value = 'warning'
    showToast.value = true
    return
  }

  if (isRegisterMode.value && !fullName.value) {
    toastMessage.value = 'Veuillez entrer votre nom complet'
    toastColor.value = 'warning'
    showToast.value = true
    return
  }

  authStore.clearError()

  let result
  if (isRegisterMode.value) {
    result = await authStore.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value
    })
  } else {
    result = await authStore.login({
      email: email.value,
      password: password.value
    })
  }

  if (result.success) {
    toastMessage.value = isRegisterMode.value ? 'Inscription réussie !' : 'Connexion réussie !'
    toastColor.value = 'success'
    showToast.value = true

    // Rediriger vers la carte après connexion
    setTimeout(() => {
      router.push('/map')
    }, 1000)
  } else {
    toastMessage.value = result.message
    toastColor.value = 'danger'
    showToast.value = true
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 64px;
  color: var(--ion-color-primary);
  margin-bottom: 16px;
}

.logo-section h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.logo-section p {
  margin: 8px 0 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

ion-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

ion-card-title {
  font-size: 20px;
  text-align: center;
}

ion-item {
  margin-bottom: 16px;
  --border-radius: 8px;
}

.error-message {
  font-size: 14px;
  margin: 8px 0;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(var(--ion-color-danger-rgb), 0.1);
}

.login-button {
  margin-top: 24px;
  --border-radius: 8px;
  height: 48px;
  font-weight: 600;
}

.switch-mode {
  text-align: center;
  margin-top: 16px;
}
</style>
