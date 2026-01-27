// Service Firestore pour les signalements
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import firebaseAuthService from './firebaseAuthService'

export type TypeProbleme = 'NID_DE_POULE' | 'FISSURE' | 'INONDATION' | 'OBSTACLE' | 'ECLAIRAGE' | 'SIGNALISATION' | 'AUTRE'
export type SignalementStatus = 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'REJETE'
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'

export interface Signalement {
  id: string
  titre: string
  description: string
  typeProbleme: TypeProbleme
  latitude: number
  longitude: number
  adresse: string
  photoUrl?: string
  statut: SignalementStatus
  priorite: Priorite
  dateSignalement: Date
  dateResolution?: Date
  commentaireResolution?: string
  createdById: string
  createdByName: string
  createdByEmail: string
  createdAt: Date
  updatedAt: Date
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

// Convertir un document Firestore en objet Signalement
function docToSignalement(docId: string, data: DocumentData): Signalement {
  return {
    id: docId,
    titre: data.titre || '',
    description: data.description || '',
    typeProbleme: data.typeProbleme || 'AUTRE',
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    adresse: data.adresse || '',
    photoUrl: data.photoUrl,
    statut: data.statut || 'NOUVEAU',
    priorite: data.priorite || 'NORMALE',
    dateSignalement: data.dateSignalement instanceof Timestamp 
      ? data.dateSignalement.toDate() 
      : new Date(data.dateSignalement || Date.now()),
    dateResolution: data.dateResolution instanceof Timestamp 
      ? data.dateResolution.toDate() 
      : data.dateResolution ? new Date(data.dateResolution) : undefined,
    commentaireResolution: data.commentaireResolution,
    createdById: data.createdById || '',
    createdByName: data.createdByName || '',
    createdByEmail: data.createdByEmail || '',
    createdAt: data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate() 
      : new Date(data.createdAt || Date.now()),
    updatedAt: data.updatedAt instanceof Timestamp 
      ? data.updatedAt.toDate() 
      : new Date(data.updatedAt || Date.now())
  }
}

class FirestoreSignalementService {
  private collectionName = 'signalements'

  // Récupérer tous les signalements
  async getAll(): Promise<Signalement[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('dateSignalement', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => docToSignalement(doc.id, doc.data()))
    } catch (error) {
      console.error('Erreur getAll signalements:', error)
      throw error
    }
  }

  // Récupérer mes signalements
  async getMesSignalements(): Promise<Signalement[]> {
    const userId = firebaseAuthService.getCurrentUserId()
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      const q = query(
        collection(db, this.collectionName),
        where('createdById', '==', userId),
        orderBy('dateSignalement', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => docToSignalement(doc.id, doc.data()))
    } catch (error) {
      console.error('Erreur getMesSignalements:', error)
      throw error
    }
  }

  // Récupérer un signalement par ID
  async getById(id: string): Promise<Signalement | null> {
    try {
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docToSignalement(docSnap.id, docSnap.data())
      }
      return null
    } catch (error) {
      console.error('Erreur getById:', error)
      throw error
    }
  }

  // Créer un signalement
  async create(data: SignalementCreateRequest): Promise<Signalement> {
    const user = firebaseAuthService.getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      const signalementData = {
        titre: data.titre,
        description: data.description || '',
        typeProbleme: data.typeProbleme,
        latitude: data.latitude,
        longitude: data.longitude,
        adresse: data.adresse || '',
        photoUrl: data.photoUrl || null,
        statut: 'NOUVEAU' as SignalementStatus,
        priorite: data.priorite || 'NORMALE',
        dateSignalement: serverTimestamp(),
        createdById: user.id,
        createdByName: user.fullName,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, this.collectionName), signalementData)
      
      // Retourner le signalement créé
      return {
        id: docRef.id,
        titre: data.titre,
        description: data.description || '',
        typeProbleme: data.typeProbleme,
        latitude: data.latitude,
        longitude: data.longitude,
        adresse: data.adresse || '',
        photoUrl: data.photoUrl,
        statut: 'NOUVEAU',
        priorite: data.priorite || 'NORMALE',
        dateSignalement: new Date(),
        createdById: user.id,
        createdByName: user.fullName,
        createdByEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Erreur create signalement:', error)
      throw error
    }
  }

  // Supprimer un signalement
  async delete(id: string): Promise<void> {
    const userId = firebaseAuthService.getCurrentUserId()
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      // Vérifier que le signalement appartient à l'utilisateur
      const signalement = await this.getById(id)
      if (!signalement) {
        throw new Error('Signalement non trouvé')
      }
      if (signalement.createdById !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres signalements')
      }

      await deleteDoc(doc(db, this.collectionName, id))
    } catch (error) {
      console.error('Erreur delete signalement:', error)
      throw error
    }
  }

  // Mettre à jour un signalement
  async update(id: string, data: Partial<SignalementCreateRequest>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Erreur update signalement:', error)
      throw error
    }
  }

  // Récapitulatif des signalements
  async getRecap(): Promise<SignalementRecap> {
    try {
      const signalements = await this.getAll()
      
      const total = signalements.length
      const nouveaux = signalements.filter(s => s.statut === 'NOUVEAU').length
      const enCours = signalements.filter(s => s.statut === 'EN_COURS').length
      const resolus = signalements.filter(s => s.statut === 'RESOLU').length
      const pourcentageResolus = total > 0 ? Math.round((resolus / total) * 100) : 0

      return {
        total,
        nouveaux,
        enCours,
        resolus,
        pourcentageResolus
      }
    } catch (error) {
      console.error('Erreur getRecap:', error)
      throw error
    }
  }
}

export default new FirestoreSignalementService()
