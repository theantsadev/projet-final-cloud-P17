// Utiliser firebaseAuthService pour l'authentification
// Ce fichier est conservé pour compatibilité, mais réexporte le service Firebase
import firebaseAuthService from './firebaseAuthService'

// Types pour compatibilité
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  nom: string
  prenom: string
  email: string
  password: string
}

// Réexporter le service Firebase comme service d'authentification par défaut
export default firebaseAuthService
