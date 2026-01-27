// Service d'authentification Firebase
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  role: string
  isActive: boolean
  createdAt?: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
}

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
          fullName: data.fullName || data.full_name || '',
          phone: data.phone || '',
          role: data.role || 'USER',
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate()
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
          fullName: userCredential.user.displayName || credentials.email.split('@')[0],
          role: 'USER',
          isActive: true
        }
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          isActive: newUser.isActive,
          createdAt: serverTimestamp()
        })
        
        this.currentUser = newUser
        return { success: true, message: 'Connexion réussie', user: newUser }
      }

      // Vérifier le rôle - seulement USER autorisé
      if (user.role !== 'USER') {
        await this.logout()
        return { 
          success: false, 
          message: 'Accès refusé. Cette application est réservée aux utilisateurs.' 
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
        displayName: data.fullName
      })

      // Créer le document utilisateur dans Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: 'USER',
        isActive: true
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone || '',
        role: 'USER',
        isActive: true,
        createdAt: serverTimestamp()
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
