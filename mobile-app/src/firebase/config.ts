// Configuration Firebase pour l'application mobile
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuration Firebase - Project: projet cloud P17

const firebaseConfig = {
  apiKey: "AIzaSyA0OBiUCmQ2Na1bn-2fX2CvCjEV9_j7SsM",
  authDomain: "projet-cloud-p17-89206.firebaseapp.com",
  projectId: "projet-cloud-p17-89206",
  storageBucket: "projet-cloud-p17-89206.firebasestorage.app",
  messagingSenderId: "798891976818",
  appId: "1:798891976818:web:b65c89a2ea83adfca5faeb",
  measurementId: "G-QLJ62H7CXW"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser les services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
