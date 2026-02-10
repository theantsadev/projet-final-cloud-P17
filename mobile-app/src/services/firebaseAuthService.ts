// Service d'authentification Firebase
// Implémente les règles d'authentification du backend identity-provider
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { User, LoginRequest, RegisterRequest, UserSession, SecuritySetting } from '@/types/firestore.types'

// Configuration par défaut (sera remplacée par les valeurs de Firestore)
let securityConfig = {
  maxFailedAttempts: 3,           // Nombre max de tentatives avant blocage
  lockDurationMinutes: 30,        // Durée du blocage automatique
  sessionDurationMinutes: 60,     // Durée de session par défaut (1 heure)
  refreshTokenDurationDays: 7     // Durée du refresh token (7 jours)
}

// Charger la configuration depuis Firestore (security_settings)
async function loadSecuritySettings(): Promise<void> {
  try {
    const settingsRef = collection(db, 'security_settings')
    const querySnapshot = await getDocs(settingsRef)

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      switch (data.key) {
        case 'max_failed_attempts':
          securityConfig.maxFailedAttempts = parseInt(data.value) || 3
          break
        case 'lock_duration_minutes':
          securityConfig.lockDurationMinutes = parseInt(data.value) || 30
          break
        case 'session_duration_minutes':
          securityConfig.sessionDurationMinutes = parseInt(data.value) || 60
          break
        case 'refresh_token_duration_days':
          securityConfig.refreshTokenDurationDays = parseInt(data.value) || 7
          break
      }
    })
    console.log('🔒 Configuration sécurité chargée:', securityConfig)
  } catch (error) {
    console.warn('⚠️ Impossible de charger security_settings, utilisation des valeurs par défaut:', error)
  }
}

// Générer un token de session unique
function generateSessionToken(): string {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15)
}

// Générer un refresh token unique
function generateRefreshToken(): string {
  return 'ref_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15)
}


function toDateSafe(value: any): Date {
  if (!value) return new Date()

  // Timestamp Firestore
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  // Date JS
  if (value instanceof Date) {
    return value
  }

  // string ou number
  return new Date(value)
}


class FirebaseAuthService {
  private currentUser: User | null = null
  private currentSession: UserSession | null = null
  private configLoaded: boolean = false
  private isLoggingIn: boolean = false  // Flag pour éviter la race condition

  // Charger la configuration au démarrage
  private async ensureConfigLoaded(): Promise<void> {
    if (!this.configLoaded) {
      await loadSecuritySettings()
      this.configLoaded = true
    }
  }

  // Créer une nouvelle session utilisateur
  private async createUserSession(userId: string): Promise<UserSession> {
    await this.ensureConfigLoaded()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + securityConfig.sessionDurationMinutes * 60 * 1000)

    const sessionData = {
      userId: userId,
      sessionToken: generateSessionToken(),
      refreshToken: generateRefreshToken(),
      isActive: true,
      expiresAt: expiresAt,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      syncStatus: 'PENDING'
    }

    const docRef = await addDoc(collection(db, 'user_sessions'), sessionData)

    const session: UserSession = {
      id: docRef.id,
      ...sessionData,
      expires_at: expiresAt,
      createdAt: now,
      lastActivityAt: now,
      syncStatus: 'PENDING'
    }

    this.currentSession = session

    // Stocker en localStorage pour persistance
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('session_token', session.sessionToken)
      localStorage.setItem('refresh_token', session.refreshToken || '')
      localStorage.setItem('session_expires', expiresAt.toISOString())
    }

    console.log('📝 Session créée, expire dans', securityConfig.sessionDurationMinutes, 'minutes')
    return session
  }

  // Vérifier si la session est valide
  async isSessionValid(): Promise<boolean> {
    await this.ensureConfigLoaded()

    if (typeof localStorage === 'undefined') return false

    const sessionToken = localStorage.getItem('session_token')
    const expiresStr = localStorage.getItem('session_expires')

    if (!sessionToken || !expiresStr) return false

    const expiresAt = new Date(expiresStr)
    const now = new Date()

    if (now >= expiresAt) {
      console.log('⏰ Session expirée')
      await this.invalidateSession()
      return false
    }

    // Mettre à jour lastActivityAt
    await this.updateSessionActivity(sessionToken)

    return true
  }

  // Mettre à jour l'activité de la session
  private async updateSessionActivity(sessionToken: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'user_sessions'),
        where('sessionToken', '==', sessionToken),
        where('isActive', '==', true)
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          lastActivityAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour activité session:', error)
    }
  }

  // Invalider la session actuelle
  async invalidateSession(): Promise<void> {
    if (typeof localStorage === 'undefined') return

    const sessionToken = localStorage.getItem('session_token')

    if (sessionToken) {
      try {
        const q = query(
          collection(db, 'user_sessions'),
          where('sessionToken', '==', sessionToken)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref
          await updateDoc(docRef, {
            isActive: false
          })
        }
      } catch (error) {
        console.error('Erreur invalidation session:', error)
      }
    }

    localStorage.removeItem('session_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('session_expires')
    this.currentSession = null
  }

  // Rafraîchir la session avec le refresh token
  async refreshSession(): Promise<{ success: boolean; message: string }> {
    await this.ensureConfigLoaded()

    if (typeof localStorage === 'undefined') {
      return { success: false, message: 'LocalStorage non disponible' }
    }

    const refreshToken = localStorage.getItem('refresh_token')

    if (!refreshToken) {
      return { success: false, message: 'Pas de refresh token' }
    }

    try {
      const q = query(
        collection(db, 'user_sessions'),
        where('refreshToken', '==', refreshToken),
        where('isActive', '==', true)
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        await this.invalidateSession()
        return { success: false, message: 'Session invalide ou expirée' }
      }

      const sessionDoc = querySnapshot.docs[0]
      const sessionData = sessionDoc.data()

      // Vérifier que le refresh token n'est pas trop vieux
      const createdAt = toDateSafe(sessionData.createdAt)
      const maxRefreshAge = securityConfig.refreshTokenDurationDays * 24 * 60 * 60 * 1000

      if (Date.now() - createdAt.getTime() > maxRefreshAge) {
        await this.invalidateSession()
        return { success: false, message: 'Refresh token expiré, veuillez vous reconnecter' }
      }

      // Prolonger la session
      const newExpiresAt = new Date(Date.now() + securityConfig.sessionDurationMinutes * 60 * 1000)
      const newSessionToken = generateSessionToken()

      await updateDoc(sessionDoc.ref, {
        sessionToken: newSessionToken,
        expiresAt: newExpiresAt,
        lastActivityAt: serverTimestamp()
      })

      localStorage.setItem('session_token', newSessionToken)
      localStorage.setItem('session_expires', newExpiresAt.toISOString())

      console.log('🔄 Session rafraîchie, nouvelle expiration:', newExpiresAt)
      return { success: true, message: 'Session rafraîchie' }
    } catch (error: any) {
      console.error('Erreur rafraîchissement session:', error)
      return { success: false, message: error.message || 'Erreur lors du rafraîchissement' }
    }
  }

  // Obtenir la durée de session configurée
  getSessionDuration(): number {
    return securityConfig.sessionDurationMinutes
  }

  // Obtenir le nombre max de tentatives configuré
  getMaxFailedAttempts(): number {
    return securityConfig.maxFailedAttempts
  }

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ne pas vérifier la session si on est en cours de connexion (race condition)
        if (!this.isLoggingIn) {
          const sessionValid = await this.isSessionValid()
          if (!sessionValid) {
            // Session expirée, déconnecter
            console.log('🚫 Session invalide, déconnexion...')
            await this.logout()
            callback(null)
            return
          }
        }

        const user = await this.getUserData(firebaseUser.uid)
        this.currentUser = user
        callback(user)
      } else {
        this.currentUser = null
        callback(null)
      }
    })
  }

  // Récupérer un utilisateur par son email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0]
        const data = docSnap.data()
        return {
          id: data.id || docSnap.id,
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          isActive: data.isActive !== false,
          isLocked: data.isLocked || false,
          failedLoginAttempts: data.failedLoginAttempts || 0,
          lastFailedLogin: toDateSafe(data.lastFailedLogin),
          lastLogin: toDateSafe(data.lastLogin),
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
          firestoreId: data.firestoreId || docSnap.id,
          syncStatus: 'SYNCED'
        }
      }
      return null
    } catch (error) {
      console.error('Erreur getUserByEmail:', error)
      return null
    }
  }

  // Récupérer les données utilisateur depuis Firestore
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          id: data.id || uid,
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          isActive: data.isActive !== false,
          isLocked: data.isLocked || false,
          failedLoginAttempts: data.failedLoginAttempts || 0,
          lastFailedLogin: toDateSafe(data.lastFailedLogin),
          lastLogin: toDateSafe(data.lastLogin),
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
          firestoreId: data.firestoreId || uid,
          syncStatus: 'SYNCED'
        }
      }
      return null
    } catch (error) {
      console.error('Erreur récupération user:', error)
      return null
    }
  }

  // Enregistrer une tentative de connexion dans Firestore
  private async recordLoginAttempt(
    email: string,
    isSuccessful: boolean,
    failureReason?: string,
    userId?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'login_attempts'), {
        userId: userId || null,
        email: email,
        isSuccessful: isSuccessful,
        failureReason: failureReason || null,
        attemptedAt: serverTimestamp(),
        syncStatus: 'PENDING'
      })
    } catch (error) {
      console.error('Erreur enregistrement tentative:', error)
    }
  }

  // Incrémenter les tentatives échouées et bloquer si nécessaire
  private async handleFailedLogin(user: User): Promise<void> {
    await this.ensureConfigLoaded()
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1
    const shouldLock = newFailedAttempts >= securityConfig.maxFailedAttempts

    try {
      // Chercher le document par email pour avoir le bon ID
      const q = query(collection(db, 'users'), where('email', '==', user.email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLogin: serverTimestamp(),
          isLocked: shouldLock,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour tentatives échouées:', error)
    }
  }

  // Réinitialiser les tentatives après connexion réussie
  private async resetLoginAttempts(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        failedLoginAttempts: 0,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Erreur réinitialisation tentatives:', error)
    }
  }

  // Connexion avec email/mot de passe - AVEC TOUTES LES RÈGLES
  async login(credentials: LoginRequest): Promise<{ success: boolean; message: string; user?: User }> {
    // Marquer qu'on est en cours de connexion (éviter race condition avec onAuthStateChanged)
    this.isLoggingIn = true

    // Charger la configuration de sécurité
    await this.ensureConfigLoaded()

    try {
      // 1. Vérifier d'abord si l'utilisateur existe dans Firestore
      const existingUser = await this.getUserByEmail(credentials.email)

      if (existingUser) {
        // 2. Vérifier si le compte est actif
        if (!existingUser.isActive) {
          await this.recordLoginAttempt(credentials.email, false, 'Compte désactivé', existingUser.id)
          this.isLoggingIn = false
          return {
            success: false,
            message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
          }
        }

        // 3. Vérifier si le compte est bloqué
        if (existingUser.isLocked) {
          await this.recordLoginAttempt(credentials.email, false, 'Compte bloqué', existingUser.id)
          this.isLoggingIn = false
          return {
            success: false,
            message: `Compte bloqué après ${securityConfig.maxFailedAttempts} tentatives échouées. Contactez l'administrateur.`
          }
        }
      }

      // 4. Tenter la connexion Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      // 5. Connexion réussie - récupérer les données utilisateur
      let user = await this.getUserData(userCredential.user.uid)

      if (!user) {
        // Créer un profil par défaut si non existant dans Firestore
        const newUser: User = {
          id: userCredential.user.uid,
          email: credentials.email,
          fullName: userCredential.user.displayName || credentials.email.split('@')[0],
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          firestoreId: userCredential.user.uid,
          syncStatus: 'PENDING'
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          email: newUser.email,
          fullName: newUser.fullName,
          isActive: newUser.isActive,
          isLocked: newUser.isLocked,
          failedLoginAttempts: newUser.failedLoginAttempts,
          lastLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        user = newUser
      } else {
        // 6. Réinitialiser les tentatives échouées après succès
        await this.resetLoginAttempts(userCredential.user.uid)
      }

      // 7. Enregistrer la tentative réussie
      await this.recordLoginAttempt(credentials.email, true, undefined, user.id)

      // 8. Créer une session utilisateur
      await this.createUserSession(user.id)

      this.currentUser = user
      this.isLoggingIn = false  // Fin de la connexion
      return { success: true, message: 'Connexion réussie', user }

    } catch (error: any) {
      console.error('Erreur login:', error)
      let message = 'Erreur de connexion'
      let failureReason = error.code || 'unknown'

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
        case 'auth/invalid-credential':
          message = 'Identifiants invalides'
          // Incrémenter les tentatives échouées si l'utilisateur existe
          const existingUser = await this.getUserByEmail(credentials.email)
          if (existingUser) {
            await this.handleFailedLogin(existingUser)
            const remainingAttempts = securityConfig.maxFailedAttempts - (existingUser.failedLoginAttempts + 1)
            if (remainingAttempts > 0) {
              message = `Identifiants invalides. ${remainingAttempts} tentative(s) restante(s) avant blocage.`
            } else {
              message = `Compte bloqué après ${securityConfig.maxFailedAttempts} tentatives échouées. Contactez l'administrateur.`
            }
          }
          break
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Réessayez plus tard.'
          break
      }

      // Enregistrer la tentative échouée
      await this.recordLoginAttempt(credentials.email, false, failureReason)

      this.isLoggingIn = false  // Fin de la tentative de connexion
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
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        firestoreId: userCredential.user.uid,
        syncStatus: 'PENDING'
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone || '',
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
      // Invalider la session avant de déconnecter
      await this.invalidateSession()
      await signOut(auth)
      this.currentUser = null
      this.currentSession = null
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
    return this.currentUser?.id || null
  }

  // Mettre à jour le profil utilisateur
  async updateUserProfile(data: { fullName?: string; phone?: string }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) {
        return { success: false, message: 'Utilisateur non connecté' }
      }

      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp()
      }

      if (data.fullName) {
        updateData.fullName = data.fullName
        // Mettre à jour aussi le profil Firebase Auth
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.fullName })
        }
      }

      if (data.phone !== undefined) {
        updateData.phone = data.phone
      }

      await updateDoc(doc(db, 'users', uid), updateData)

      // Rafraîchir les données
      const user = await this.getUserData(uid)
      if (user) {
        this.currentUser = user
        return { success: true, message: 'Profil mis à jour', user }
      }

      return { success: false, message: 'Erreur lors de la mise à jour' }
    } catch (error: any) {
      console.error('Erreur updateUserProfile:', error)
      return { success: false, message: error.message || 'Erreur lors de la mise à jour du profil' }
    }
  }

  // Débloquer un compte utilisateur (par email)
  async unlockAccount(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return { success: false, message: 'Utilisateur non trouvé' }
      }

      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, {
        isLocked: false,
        failedLoginAttempts: 0,
        updatedAt: serverTimestamp()
      })

      return { success: true, message: 'Compte débloqué avec succès' }
    } catch (error: any) {
      console.error('Erreur unlockAccount:', error)
      return { success: false, message: error.message || 'Erreur lors du déblocage du compte' }
    }
  }

  // Rafraîchir les données de l'utilisateur actuel
  async refreshCurrentUser(): Promise<User | null> {
    const uid = auth.currentUser?.uid
    if (!uid) return null

    const user = await this.getUserData(uid)
    if (user) {
      this.currentUser = user
    }
    return user
  }

  // Vérifier si le compte est bloqué (avant connexion)
  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email)
    return user?.isLocked || false
  }

  // Vérifier si le compte est actif
  async isAccountActive(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email)
    return user?.isActive !== false
  }

  // Obtenir le nombre de tentatives restantes
  async getRemainingAttempts(email: string): Promise<number> {
    await this.ensureConfigLoaded()
    const user = await this.getUserByEmail(email)
    if (!user) return securityConfig.maxFailedAttempts
    return Math.max(0, securityConfig.maxFailedAttempts - (user.failedLoginAttempts || 0))
  }
}

export default new FirebaseAuthService()
