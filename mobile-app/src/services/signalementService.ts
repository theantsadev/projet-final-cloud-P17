import api from './api'

export type TypeProbleme = 'NID_DE_POULE' | 'FISSURE' | 'INONDATION' | 'OBSTACLE' | 'ECLAIRAGE' | 'SIGNALISATION' | 'AUTRE'
export type SignalementStatus = 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'REJETE'
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'

export interface Signalement {
  id: number
  titre: string
  description: string
  typeProbleme: TypeProbleme
  latitude: number
  longitude: number
  adresse: string
  photoUrl?: string
  statut: SignalementStatus
  priorite: Priorite
  dateSignalement: string
  dateResolution?: string
  commentaireResolution?: string
  createdById: string
  createdByName: string
  createdByEmail: string
  createdAt: string
  updatedAt: string
}

export interface SignalementCreateRequest {
  titre: string
  description?: string
  typeProbleme: TypeProbleme
  latitude: number
  longitude: number
  adresse?: string
  photoUrl?: string
  priorite?: Priorite
}

export interface SignalementRecap {
  total: number
  nouveaux: number
  enCours: number
  resolus: number
  pourcentageResolus: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Labels pour les types de problèmes
export const typeProblemeLabels: Record<TypeProbleme, string> = {
  NID_DE_POULE: 'Nid de poule',
  FISSURE: 'Fissure',
  INONDATION: 'Inondation',
  OBSTACLE: 'Obstacle',
  ECLAIRAGE: 'Éclairage',
  SIGNALISATION: 'Signalisation',
  AUTRE: 'Autre'
}

// Labels pour les statuts
export const statutLabels: Record<SignalementStatus, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  RESOLU: 'Résolu',
  REJETE: 'Rejeté'
}

// Labels pour les priorités
export const prioriteLabels: Record<Priorite, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente'
}

// Couleurs pour les statuts
export const statutColors: Record<SignalementStatus, string> = {
  NOUVEAU: 'primary',
  EN_COURS: 'warning',
  RESOLU: 'success',
  REJETE: 'danger'
}

// Couleurs pour les priorités
export const prioriteColors: Record<Priorite, string> = {
  BASSE: 'medium',
  NORMALE: 'primary',
  HAUTE: 'warning',
  URGENTE: 'danger'
}

// Icônes pour les types de problèmes
export const typeProblemeIcons: Record<TypeProbleme, string> = {
  NID_DE_POULE: 'alert-circle',
  FISSURE: 'warning',
  INONDATION: 'water',
  OBSTACLE: 'construct',
  ECLAIRAGE: 'bulb',
  SIGNALISATION: 'sign-post',
  AUTRE: 'help-circle'
}

class SignalementService {
  // Récupérer tous les signalements
  async getAll(): Promise<Signalement[]> {
    const response = await api.get<ApiResponse<Signalement[]>>('/signalements')
    return response.data.data
  }

  // Récupérer mes signalements
  async getMesSignalements(): Promise<Signalement[]> {
    const response = await api.get<ApiResponse<Signalement[]>>('/signalements/mes-signalements')
    return response.data.data
  }

  // Récupérer un signalement par ID
  async getById(id: number): Promise<Signalement> {
    const response = await api.get<ApiResponse<Signalement>>(`/signalements/${id}`)
    return response.data.data
  }

  // Créer un signalement
  async create(data: SignalementCreateRequest): Promise<Signalement> {
    const response = await api.post<ApiResponse<Signalement>>('/signalements', data)
    return response.data.data
  }

  // Supprimer un signalement
  async delete(id: number): Promise<void> {
    await api.delete(`/signalements/${id}`)
  }

  // Récapitulatif
  async getRecap(): Promise<SignalementRecap> {
    const response = await api.get<ApiResponse<SignalementRecap>>('/signalements/recap')
    return response.data.data
  }
}

export default new SignalementService()
