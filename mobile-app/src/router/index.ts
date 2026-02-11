import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/MapPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/signalements',
    name: 'Signalements',
    component: () => import('../views/SignalementsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/NotificationsPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Fonction pour attendre l'état d'authentification Firebase
const getCurrentUser = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

// Navigation guard avec Firebase Auth
router.beforeEach(async (to, from, next) => {
  const currentUser = await getCurrentUser()
  const isAuthenticated = !!currentUser

  // Si la page nécessite l'authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // Si la page est pour les invités et l'utilisateur est connecté
  else if (to.meta.requiresGuest && isAuthenticated) {
    next('/map') // Rediriger vers la carte après connexion
  }
  else {
    next()
  }
})

export default router
