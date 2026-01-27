<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="lg">
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
            <ion-menu-toggle auto-hide="false">
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
            <ion-menu-toggle auto-hide="false">
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
    </ion-split-pane>
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

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}

ion-list-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--ion-color-light);
  margin-bottom: 10px;
}

ion-list-header h2 {
  margin: 0;
  font-weight: 600;
}

ion-list-header p {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.1);
  --color: var(--ion-color-primary);
}

ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

.bottom-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid var(--ion-color-light);
}
</style>
