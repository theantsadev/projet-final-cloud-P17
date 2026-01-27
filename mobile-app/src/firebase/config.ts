// Configuration Firebase pour l'application mobile
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuration Firebase - Project: projets4-a0404
const firebaseConfig = {
  apiKey: "AIzaSyDH3LqWJ0e4K5vqYZ_CPlAfmnmzMmN5vdk",
  authDomain: "projets4-a0404.firebaseapp.com",
  projectId: "projets4-a0404",
  storageBucket: "projets4-a0404.firebasestorage.app",
  messagingSenderId: "113393717801199235597",
  appId: "1:113393717801199235597:web:abcd1234efgh5678"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser les services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
