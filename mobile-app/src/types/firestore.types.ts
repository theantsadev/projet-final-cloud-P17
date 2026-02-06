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
  password_hash?: string          // Hash du mot de passe (géré par Firebase Auth)
  full_name: string               // Nom complet
  phone?: string                  // Téléphone
  role?: string                   // Role ID (relation ManyToOne)
  is_active: boolean              // Compte actif
  is_locked: boolean              // Compte bloqué après 3 tentatives
  failed_login_attempts: number   // Nombre de tentatives échouées
  last_failed_login?: Date        // Date dernière tentative échouée
  last_login?: Date               // Date dernière connexion réussie
  created_at: Date                // Date de création
  updated_at: Date                // Date de dernière modification
  firestore_id?: string           // ID Firestore (référence unique)
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED'  // Statut de synchronisation
}

/**
 * Collection: signalements
 * Correspond à l'entité Signalement.java du backend
 */
export interface Signalement {
  id: string                      // ID unique (UUID)
  titre: string                   // Titre du signalement (max 500 caractères)
  description?: string            // Description détaillée (TEXT)
  statut_id: string               // ID du statut d'avancement (FK vers statut_avancement_signalement)
  statut?: StatutAvancementSignalement  // Relation avec statut complet (optionnel à la lecture)
  latitude: number                // Latitude GPS (obligatoire)
  longitude: number               // Longitude GPS (obligatoire)
  surface_m2?: number             // Surface en m² (BigDecimal)
  budget?: number                 // Budget estimé (BigDecimal)
  entreprise_concernee?: string   // Entreprise concernée (max 255 caractères)
  user_id: string                 // ID utilisateur créateur (FK vers users)
  signaleur?: User                // Relation avec utilisateur (optionnel à la lecture)
  firebase_id?: string            // ID Firebase (référence)
  is_synchronized: boolean        // Statut de synchronisation avec PostgreSQL
  last_synced_at?: Date           // Date de dernière synchronisation
  created_at: Date                // Date de création (auto)
  updated_at: Date                // Date de modification (auto)
}

/**
 * Collection: user_sessions
 * Correspond à l'entité UserSession.java du backend
 */
export interface UserSession {
  id: string                      // ID unique
  user_id: string                 // ID utilisateur (FK vers users)
  session_token: string           // Token de session
  refresh_token?: string          // Token de rafraîchissement
  ip_address?: string             // Adresse IP
  user_agent?: string             // User agent
  is_active: boolean              // Session active
  expires_at: Date                // Date d'expiration
  created_at: Date                // Date de création
  last_activity_at?: Date         // Dernière activité
  firestore_id?: string           // ID Firestore
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED'
}

/**
 * Collection: login_attempts
 * Correspond à l'entité LoginAttempt.java du backend
 */
export interface LoginAttempt {
  id: string                      // ID unique
  user_id?: string                // ID utilisateur (nullable)
  email: string                   // Email de la tentative
  ip_address?: string             // Adresse IP
  user_agent?: string             // User agent
  is_successful: boolean          // Tentative réussie
  failure_reason?: string         // Raison de l'échec
  attempted_at: Date              // Date de la tentative
  firestore_id?: string           // ID Firestore
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED'
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
  updated_at: Date                // Date de modification
  firestore_id?: string           // ID Firestore
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED'
}

// Requêtes pour l'API/Services

export interface SignalementCreateRequest {
  titre: string
  description?: string
  latitude: number
  longitude: number
  surface_m2?: number
  budget?: number
  entreprise_concernee?: string
  statut_id?: string              // ID du statut (défaut: NOUVEAU)
}

export interface SignalementUpdateRequest {
  titre?: string
  description?: string
  latitude?: number
  longitude?: number
  surface_m2?: number
  budget?: number
  entreprise_concernee?: string
  statut_id?: string
}

export interface SignalementUpdateStatusRequest {
  statut_id: string               // ID du nouveau statut
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
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
