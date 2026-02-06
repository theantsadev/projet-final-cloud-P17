// Service d'authentification Firebase
// Compatible avec la structure identity-provider
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { User, LoginRequest, RegisterRequest } from '@/types/firestore.types'

class FirebaseAuthService {
  private currentUser: User | null = null

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser.uid)
        this.currentUser = user
        callback(user)
      } else {
        this.currentUser = null
        callback(null)
      }
    })
  }

  // Récupérer les données utilisateur depuis Firestore
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          id: uid,
          email: data.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          is_active: data.is_active !== false,
          is_locked: data.is_locked || false,
          failed_login_attempts: data.failed_login_attempts || 0,
          last_failed_login: data.last_failed_login?.toDate(),
          last_login: data.last_login?.toDate(),
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          firestore_id: uid,
          sync_status: 'SYNCED'
        }
      }
      return null
    } catch (error) {
      console.error('Erreur récupération user:', error)
      return null
    }
  }

  // Connexion avec email/mot de passe
  async login(credentials: LoginRequest): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      )
      
      const user = await this.getUserData(userCredential.user.uid)
      
      if (!user) {
        // Créer un profil par défaut si non existant dans Firestore
        const newUser: User = {
          id: userCredential.user.uid,
          email: credentials.email,
          full_name: userCredential.user.displayName || credentials.email.split('@')[0],
          is_active: true,
          is_locked: false,
          failed_login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date(),
          firestore_id: userCredential.user.uid,
          sync_status: 'PENDING'
        }
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: newUser.email,
          full_name: newUser.full_name,
          is_active: newUser.is_active,
          is_locked: newUser.is_locked,
          failed_login_attempts: newUser.failed_login_attempts,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
        
        this.currentUser = newUser
        return { success: true, message: 'Connexion réussie', user: newUser }
      }

      // Vérifier le compte - pas bloqué et actif
      if (user.is_locked) {
        return { 
          success: false, 
          message: 'Compte bloqué après trop de tentatives. Contactez l\'administrateur.' 
        }
      }

      if (!user.is_active) {
        return { 
          success: false, 
          message: 'Compte désactivé.' 
        }
      }
      
      this.currentUser = user
      return { success: true, message: 'Connexion réussie', user }
    } catch (error: any) {
      console.error('Erreur login:', error)
      let message = 'Erreur de connexion'
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email invalide'
          break
        case 'auth/user-disabled':
          message = 'Compte désactivé'
          break
        case 'auth/user-not-found':
          message = 'Utilisateur non trouvé'
          break
        case 'auth/wrong-password':
          message = 'Mot de passe incorrect'
          break
        case 'auth/invalid-credential':
          message = 'Identifiants invalides'
          break
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Réessayez plus tard.'
          break
      }
      
      return { success: false, message }
    }
  }

  // Inscription
  async register(data: RegisterRequest): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      // Mettre à jour le profil Firebase
      await updateProfile(userCredential.user, {
        displayName: data.full_name
      })

      // Créer le document utilisateur dans Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        is_active: true,
        is_locked: false,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date(),
        firestore_id: userCredential.user.uid,
        sync_status: 'PENDING'
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone || '',
        is_active: true,
        is_locked: false,
        failed_login_attempts: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })

      this.currentUser = newUser
      return { success: true, message: 'Inscription réussie', user: newUser }
    } catch (error: any) {
      console.error('Erreur register:', error)
      console.error('Code erreur:', error.code)
      console.error('Message erreur:', error.message)
      let message = "Erreur lors de l'inscription"

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Cet email est déjà utilisé'
          break
        case 'auth/invalid-email':
          message = 'Email invalide'
          break
        case 'auth/weak-password':
          message = 'Mot de passe trop faible (min 6 caractères)'
          break
        case 'auth/operation-not-allowed':
          message = 'Inscription par email non activée dans Firebase'
          break
        case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        case 'auth/invalid-api-key':
          message = 'Clé API Firebase invalide. Vérifiez la configuration.'
          break
        default:
          message = `Erreur: ${error.code || error.message}`
      }

      return { success: false, message }
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await signOut(auth)
      this.currentUser = null
    } catch (error) {
      console.error('Erreur logout:', error)
    }
  }

  // Vérifier si connecté
  isAuthenticated(): boolean {
    return auth.currentUser !== null
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Récupérer l'ID de l'utilisateur actuel
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null
  }
}

export default new FirebaseAuthService()
