// Types Firestore correspondant EXACTEMENT au projet identity-provider
// Basé sur les entités Java du backend

/**
 * Collection: statut_avancement_signalement
 * Correspond à l'entité StatutAvancementSignalement.java du backend
 */
export interface StatutAvancementSignalement {
  id: string                      // UUID
  statut: string                  // 'NOUVEAU' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  avancement: number              // 0-100 (pourcentage d'avancement)
}

/**
 * Collection: users
 * Correspond à l'entité User.java du backend
 */
export interface User {
  id: string                      // ID unique (UUID)
  email: string                   // Email unique
  passwordHash?: string           // Hash du mot de passe (géré par Firebase Auth)
  fullName: string                // Nom complet
  phone?: string                  // Téléphone
  role?: string                   // Role ID (relation ManyToOne)
  isActive: boolean               // Compte actif
  isLocked: boolean               // Compte bloqué après 3 tentatives
  failedLoginAttempts: number     // Nombre de tentatives échouées
  lastFailedLogin?: Date          // Date dernière tentative échouée
  lastLogin?: Date                // Date dernière connexion réussie
  createdAt: Date                 // Date de création
  updatedAt: Date                 // Date de dernière modification
  firestoreId?: string            // ID Firestore (référence unique)
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'  // Statut de synchronisation
}

/**
 * Collection: signalements
 * Correspond à l'entité Signalement.java du backend
 */
export interface Signalement {
  id: string                      // ID unique (UUID)
  titre: string                   // Titre du signalement (max 500 caractères)
  description?: string            // Description détaillée (TEXT)
  statutId: string                // ID du statut d'avancement (FK vers statut_avancement_signalement)
  statut?: StatutAvancementSignalement  // Relation avec statut complet (optionnel à la lecture)
  latitude: number                // Latitude GPS (obligatoire)
  longitude: number               // Longitude GPS (obligatoire)
  surfaceM2?: number              // Surface en m² (BigDecimal)
  budget?: number                 // Budget estimé (BigDecimal)
  entrepriseConcernee?: string    // Entreprise concernée (max 255 caractères)
  userId: string                  // ID utilisateur créateur (FK vers users)
  signaleur?: User                // Relation avec utilisateur (optionnel à la lecture)
  firebaseId?: string             // ID Firebase (référence)
  isSynchronized: boolean         // Statut de synchronisation avec PostgreSQL
  lastSyncedAt?: Date             // Date de dernière synchronisation
  createdAt: Date                 // Date de création (auto)
  updatedAt: Date                 // Date de modification (auto)
}

/**
 * Collection: user_sessions
 * Correspond à l'entité UserSession.java du backend
 */
export interface UserSession {
  id: string                      // ID unique
  userId: string                  // ID utilisateur (FK vers users)
  sessionToken: string            // Token de session
  refreshToken?: string           // Token de rafraîchissement
  ipAddress?: string              // Adresse IP
  userAgent?: string              // User agent
  isActive: boolean               // Session active
  expires_at: Date                // Date d'expiration
  createdAt: Date                 // Date de création
  lastActivityAt?: Date           // Dernière activité
  firestoreId?: string            // ID Firestore
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'
}

/**
 * Collection: login_attempts
 * Correspond à l'entité LoginAttempt.java du backend
 */
export interface LoginAttempt {
  id: string                      // ID unique
  userId?: string                 // ID utilisateur (nullable)
  email: string                   // Email de la tentative
  ipAddress?: string              // Adresse IP
  userAgent?: string              // User agent
  isSuccessful: boolean           // Tentative réussie
  failureReason?: string          // Raison de l'échec
  attemptedAt: Date               // Date de la tentative
  firestoreId?: string            // ID Firestore
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'
}

/**
 * Collection: security_settings
 * Correspond à l'entité SecuritySetting.java du backend
 */
export interface SecuritySetting {
  id: string                      // ID unique
  key: string                     // Clé du paramètre (unique)
  value: string                   // Valeur du paramètre
  description?: string            // Description
  updatedAt: Date                 // Date de modification
  firestoreId?: string            // ID Firestore
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'
}

// Requêtes pour l'API/Services

export interface SignalementCreateRequest {
  titre: string
  description?: string
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  entrepriseConcernee?: string
  statutId?: string               // ID du statut (défaut: NOUVEAU)
}

export interface SignalementUpdateRequest {
  titre?: string
  description?: string
  latitude?: number
  longitude?: number
  surfaceM2?: number
  budget?: number
  entrepriseConcernee?: string
  statutId?: string
}

export interface SignalementUpdateStatusRequest {
  statutId: string                // ID du nouveau statut
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UnlockRequest {
  email: string
}

// Réponses et statistiques

export interface SignalementRecap {
  total: number                  // totalSignalements
  nouveaux: number               // signalementNouveaux
  enCours: number                // signalementEnCours
  termines: number               // signalementTermines
  annules: number                // signalementAnnules
  totalSurfaceM2: number         // Somme des surfaces en m²
  totalBudget: number            // Somme des budgets
  averageAvancement: number      // Pourcentage moyen d'avancement
}

// Labels et configurations

/**
 * Collection: user_photos
 * Photos uploadées par les utilisateurs (synchronisation web)
 */
export interface UserPhoto {
  id?: string                     // ID du document Firestore
  uid: string                     // ID de l'utilisateur propriétaire
  url: string                     // URL publique Cloudinary
  path: string                    // Chemin dans Cloudinary (public_id)
  nom: string                     // Nom du fichier original
  dateUpload: string              // Date d'upload (ISO string)
  type: 'profile' | 'signalement' | 'message'  // Type de photo
  taille: number                  // Taille en bytes
  signalement_id?: string         // ID du signalement associé (si type = signalement)
  cloudinary_public_id: string    // Public ID Cloudinary pour transformations
}

/**
 * Collection: signalement_photos
 * Liaison entre signalements et photos
 */
export interface SignalementPhoto {
  id?: string                     // ID du document
  signalement_id: string          // ID du signalement
  photo_id: string                // ID de la photo (user_photos)
  ordre: number                   // Ordre d'affichage (0-4)
  created_at: Date                // Date d'ajout
}

/**
 * Collection: notifications
 * Notifications envoyées aux utilisateurs lors de mises à jour de signalements
 */
export interface FirestoreNotification {
  id: string                      // ID unique de la notification
  motif: string                   // Message de la notification
  history_id?: string             // ID de l'historique de statut associé
  signalement_id: string          // ID du signalement concerné
  signalement_titre?: string      // Titre du signalement (pour affichage)
  user_id: string                 // ID de l'utilisateur destinataire
  status_id?: string              // ID du nouveau statut
  status_libelle?: string         // Libellé du statut (NOUVEAU, EN_COURS, etc.)
  status_avancement?: number      // Pourcentage d'avancement
  date: string                    // Date de création (ISO string)
  lu: boolean                     // Si la notification a été lue
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp?: string
}

// Labels et configurations

export const statutLabels: Record<string, string> = {
  'NOUVEAU': 'Nouveau',
  'EN_COURS': 'En cours',
  'TERMINE': 'Terminé',
  'ANNULE': 'Annulé'
}

export const statutColors: Record<string, string> = {
  'NOUVEAU': 'primary',
  'EN_COURS': 'warning',
  'TERMINE': 'success',
  'ANNULE': 'danger'
}
