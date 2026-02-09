<template>
  <ion-app>
    <!-- Menu latéral -->
    <ion-menu content-id="main-content" type="overlay" v-if="isAuthenticated">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <!-- Profil utilisateur -->
        <ion-list-header v-if="authStore.user">
          <ion-label>
            <h2>{{ authStore.userFullName }}</h2>
            <p>{{ authStore.user.email }}</p>
          </ion-label>
        </ion-list-header>

        <ion-list lines="none">
          <ion-menu-toggle :auto-hide="false">
            <ion-item 
              button 
              router-link="/map" 
              :class="{ 'selected': currentRoute === '/map' }"
            >
              <ion-icon :icon="mapOutline" slot="start"></ion-icon>
              <ion-label>Carte</ion-label>
            </ion-item>

            <ion-item 
              button 
              router-link="/signalements"
              :class="{ 'selected': currentRoute === '/signalements' }"
            >
              <ion-icon :icon="listOutline" slot="start"></ion-icon>
              <ion-label>Signalements</ion-label>
            </ion-item>

            <ion-item 
              button 
              router-link="/home"
              :class="{ 'selected': currentRoute === '/home' }"
            >
              <ion-icon :icon="personOutline" slot="start"></ion-icon>
              <ion-label>Mon Profil</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>

        <ion-list lines="none" class="bottom-menu">
          <ion-menu-toggle :auto-hide="false">
            <ion-item button @click="handleLogout" color="danger">
              <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
              <ion-label>Déconnexion</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- Contenu principal -->
    <ion-router-outlet id="main-content"></ion-router-outlet>
  </ion-app>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IonApp, IonRouterOutlet, IonSplitPane, IonMenu, IonHeader,
  IonToolbar, IonTitle, IonContent, IonList, IonListHeader,
  IonItem, IonLabel, IonIcon, IonMenuToggle
} from '@ionic/vue'
import { mapOutline, listOutline, personOutline, logOutOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentRoute = computed(() => route.path)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Initialiser l'état d'authentification au chargement
  authStore.initAuth()
})
</script>


<style>
/* Global Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes glow {
  0% { text-shadow: 0 0 5px rgba(0, 229, 255, 0.5); }
  50% { text-shadow: 0 0 20px rgba(0, 229, 255, 0.8), 0 0 10px rgba(0, 229, 255, 0.5); }
  100% { text-shadow: 0 0 5px rgba(0, 229, 255, 0.5); }
}

.scrolling-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05), transparent 60%);
  animation: float 20s infinite linear;
  pointer-events: none;
  z-index: -1;
}

h1, h2, h3 {
  font-family: 'Exo 2', sans-serif !important; /* Futuristic Font if avail, else fallback */
  letter-spacing: 1px;
}

ion-menu::part(container) {
  box-shadow: 5px 0 15px rgba(0,0,0,0.5);
  border-right: 1px solid rgba(255,255,255,0.05);
}
</style>

<style scoped>
ion-menu ion-content {
  --background: var(--neumorphic-bg);
}

ion-list-header {
  padding: 30px 20px;
  background: transparent;
  color: var(--ion-color-primary);
  text-transform: uppercase;
  letter-spacing: 2px;
}

ion-item {
  --background: transparent;
  --color: #ccc;
  border-radius: 15px;
  margin: 10px;
}

ion-item.selected {
  --color: var(--ion-color-primary);
  box-shadow: var(--neumorphic-shadow-inset);
}

ion-item ion-icon {
  color: var(--ion-color-primary);
}
</style>

