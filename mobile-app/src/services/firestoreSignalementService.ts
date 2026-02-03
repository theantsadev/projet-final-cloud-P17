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

// Types correspondant au backend identity-provider
export type StatutSignalement = 'NOUVEAU' | 'EN_COURS' | 'TERMINE' | 'ANNULE'

export interface Signalement {
  id: string
  titre: string
  description: string
  statut: StatutSignalement
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  entrepriseConcernee?: string
  pourcentageAvancement: number
  user_id: string
  firebaseId?: string
  isSynchronized?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SignalementCreateRequest {
  titre: string
  description?: string
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  entrepriseConcernee?: string
  pourcentageAvancement?: number
}

export interface SignalementRecap {
  total: number
  nouveaux: number
  enCours: number
  termines: number
  annules: number
  pourcentageTermines: number
}

// Labels pour les statuts (correspondant au backend)
export const statutLabels: Record<StatutSignalement, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé'
}

// Couleurs pour les statuts
export const statutColors: Record<StatutSignalement, string> = {
  NOUVEAU: 'primary',
  EN_COURS: 'warning',
  TERMINE: 'success',
  ANNULE: 'danger'
}

// Labels pour types de problème (pour compatibilité avec les vues existantes)
export const typeProblemeLabels: Record<string, string> = {
  'nid-de-poule': 'Nid de poule',
  'fissure': 'Fissure',
  'inondation': 'Inondation',
  'eclairage': 'Éclairage défaillant',
  'autre': 'Autre'
}

// Labels pour priorités (pour compatibilité avec les vues existantes)
export const prioriteLabels: Record<string, string> = {
  'basse': 'Basse',
  'moyenne': 'Moyenne',
  'haute': 'Haute',
  'critique': 'Critique'
}

// Convertir un document Firestore en objet Signalement (structure backend)
function docToSignalement(docId: string, data: DocumentData): Signalement {
  return {
    id: docId,
    titre: data.titre || '',
    description: data.description || '',
    statut: data.statut || 'NOUVEAU',
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    surfaceM2: data.surfaceM2,
    budget: data.budget,
    entrepriseConcernee: data.entrepriseConcernee,
    pourcentageAvancement: data.pourcentageAvancement || 0,
    user_id: data.user_id || '',
    firebaseId: data.firebaseId || docId,
    isSynchronized: data.isSynchronized || false,
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
        orderBy('createdAt', 'desc')
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
        where('user_id', '==', userId),
        orderBy('createdAt', 'desc')
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

  // Créer un signalement (structure backend identity-provider)
  async create(data: SignalementCreateRequest): Promise<Signalement> {
    const user = firebaseAuthService.getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      const signalementData = {
        titre: data.titre,
        description: data.description || '',
        statut: 'NOUVEAU' as StatutSignalement,
        latitude: data.latitude,
        longitude: data.longitude,
        surfaceM2: data.surfaceM2 || null,
        budget: data.budget || null,
        entrepriseConcernee: data.entrepriseConcernee || '',
        pourcentageAvancement: data.pourcentageAvancement || 0,
        user_id: user.id,
        isSynchronized: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, this.collectionName), signalementData)
      
      // Retourner le signalement créé
      return {
        id: docRef.id,
        titre: data.titre,
        description: data.description || '',
        statut: 'NOUVEAU',
        latitude: data.latitude,
        longitude: data.longitude,
        surfaceM2: data.surfaceM2,
        budget: data.budget,
        entrepriseConcernee: data.entrepriseConcernee,
        pourcentageAvancement: data.pourcentageAvancement || 0,
        user_id: user.id,
        firebaseId: docRef.id,
        isSynchronized: false,
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
      if (signalement.user_id !== userId) {
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
