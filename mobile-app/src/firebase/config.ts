// Configuration Firebase pour l'application mobile
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS8Nny0FwraiDeQ3aDBMuS40Nbjz9WGkY",
  authDomain: "idp-dev-85c8d.firebaseapp.com",
  databaseURL: "https://idp-dev-85c8d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "idp-dev-85c8d",
  storageBucket: "idp-dev-85c8d.firebasestorage.app",
  messagingSenderId: "149925149083",
  appId: "1:149925149083:web:b6ea71804748697c45893e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialiser les services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
