<template>
  <ion-page>
    <ion-header>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <!-- Logo / Titre (Intro Animation) -->
        <div class="logo-section" v-if="showIntro">
          <ion-icon :icon="carOutline" class="logo-icon"></ion-icon>
          <h1>{{ displayedTitle }}<span class="cursor">|</span></h1>
          <p>Application de signalement routier</p>
        </div>

        <!-- Formulaire de connexion / inscription -->
        <ion-card v-else class="fade-in-form">
          <ion-card-header>
            <ion-card-title>{{ isRegisterMode ? 'Inscription' : 'Connexion' }}</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="handleSubmit">
              <!-- Nom complet (inscription uniquement) -->
              <ion-item v-if="isRegisterMode" class="neo-input-item">
                <ion-label position="stacked">Nom complet</ion-label>
                <ion-input
                  v-model="fullName"
                  type="text"
                  placeholder="Votre nom complet"
                  :required="isRegisterMode"
                ></ion-input>
              </ion-item>

              <!-- Email -->
              <ion-item class="neo-input-item">
                <ion-label position="stacked">Email</ion-label>
                <ion-input
                  v-model="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                ></ion-input>
              </ion-item>

              <!-- Mot de passe -->
              <ion-item class="neo-input-item">
                <ion-label position="stacked">Mot de passe</ion-label>
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
                  class="eye-icon"
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
import { ref, onMounted } from 'vue'
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

// Intro Animation State
const showIntro = ref(true)
const displayedTitle = ref('')
const fullTitle = 'Antananarivo'

const startTypingAnimation = () => {
  let i = 0
  displayedTitle.value = ''
  
  const interval = setInterval(() => {
    displayedTitle.value += fullTitle.charAt(i)
    i++
    
    if (i >= fullTitle.length) {
      clearInterval(interval)
      // Attendre 1 seconde avant d'afficher le formulaire
      setTimeout(() => {
        showIntro.value = false
      }, 1000)
    }
  }, 150) // Vitesse de frappe (ms)
}

onMounted(() => {
  startTypingAnimation()
})

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
      full_name: fullName.value
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 90vh; /* Full height */
  animation: fadeIn 1s ease-out;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.logo-icon {
  font-size: 80px;
  color: var(--ion-color-primary);
  filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.6));
  animation: glow 3s infinite;
}

.logo-section h1 {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  background: linear-gradient(90deg, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: 10px;
  letter-spacing: 3px;
}

.logo-section p {
  color: var(--ion-color-primary);
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 4px;
  margin-top: 0;
  opacity: 0.8;
}

ion-card {
  padding: 20px;
  background: var(--neumorphic-bg);
  box-shadow: var(--neumorphic-shadow-dark), var(--neumorphic-shadow-light);
  border-radius: 30px;
}

ion-card-title {
  color: #fff;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  text-align: center;
}

/* Inputs styling override */
ion-item.neo-input-item {
  --padding-start: 15px;
  --inner-padding-end: 15px;
  margin-bottom: 25px;
}

ion-label {
  color: var(--ion-color-primary) !important;
  font-size: 0.8rem !important;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 8px; /* Spacing for stacked label */
}

/* Button override */
.login-button {
  margin-top: 40px;
  height: 60px;
  font-size: 1.1rem;
  letter-spacing: 2px;
  --background: linear-gradient(145deg, #1e1e1e, #151515);
  --color: var(--ion-color-primary);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: scale(1.02);
  --color: #fff;
  filter: drop-shadow(0 0 5px var(--ion-color-primary));
}

.switch-mode ion-button {
  --color: var(--ion-color-medium);
  font-size: 0.8rem;
  text-transform: none;
  --box-shadow: none;
}

/* Animation Styles */
.cursor {
  display: inline-block;
  vertical-align: middle;
  width: 4px; /* Un peu plus épais */
  height: 1em;
  background-color: var(--ion-color-primary);
  animation: blink 0.7s infinite;
  margin-left: 5px;
  box-shadow: 0 0 5px var(--ion-color-primary); /* Effet néon */
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.fade-in-form {
  animation: fadeInForm 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes fadeInForm {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>

