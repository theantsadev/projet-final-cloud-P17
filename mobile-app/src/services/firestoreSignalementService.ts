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
import type { 
  Signalement, 
  SignalementCreateRequest, 
  SignalementRecap, 
  StatutAvancementSignalement 
} from '@/types/firestore.types'
import { statutLabels, statutColors } from '@/types/firestore.types'

// Cache des statuts d'avancement
let statutCache: Map<string, StatutAvancementSignalement> | null = null

// Charger les statuts depuis Firestore
async function loadStatuts(): Promise<StatutAvancementSignalement[]> {
  try {
    const q = query(collection(db, 'statut_avancement_signalement'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StatutAvancementSignalement))
  } catch (error) {
    console.error('Erreur chargement statuts:', error)
    return []
  }
}

// Obtenir le statut par son label
async function getStatutByLabel(label: string): Promise<StatutAvancementSignalement | null> {
  const statuts = await loadStatuts()
  return statuts.find(s => s.statut === label) || null
}

// Obtenir le statut par ID
async function getStatutById(id: string): Promise<StatutAvancementSignalement | null> {
  try {
    if (!statutCache) {
      const statuts = await loadStatuts()
      statutCache = new Map(statuts.map(s => [s.id, s]))
    }
    return statutCache.get(id) || null
  } catch (error) {
    console.error('Erreur récupération statut:', error)
    return null
  }
}

// Convertir un document Firestore en objet Signalement
async function docToSignalement(docId: string, data: DocumentData): Promise<Signalement> {
  let statut: StatutAvancementSignalement | null = null
  if (data.statut_id) {
    statut = await getStatutById(data.statut_id)
  }

  return {
    id: docId,
    titre: data.titre || '',
    description: data.description || '',
    statut_id: data.statut_id || '',
    statut: statut || undefined,
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    surface_m2: data.surface_m2,
    budget: data.budget,
    entreprise_concernee: data.entreprise_concernee,
    user_id: data.user_id || '',
    firebase_id: data.firebase_id || docId,
    is_synchronized: data.is_synchronized || false,
    last_synced_at: data.last_synced_at instanceof Timestamp
      ? data.last_synced_at.toDate()
      : undefined,
    created_at: data.created_at instanceof Timestamp 
      ? data.created_at.toDate() 
      : new Date(data.created_at || Date.now()),
    updated_at: data.updated_at instanceof Timestamp 
      ? data.updated_at.toDate() 
      : new Date(data.updated_at || Date.now())
  }
}

class FirestoreSignalementService {
  private collectionName = 'signalements'

  // Récupérer tous les signalements
  async getAll(): Promise<Signalement[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('created_at', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const results: Signalement[] = []
      for (const doc of querySnapshot.docs) {
        results.push(await docToSignalement(doc.id, doc.data()))
      }
      return results
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
        orderBy('created_at', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const results: Signalement[] = []
      for (const doc of querySnapshot.docs) {
        results.push(await docToSignalement(doc.id, doc.data()))
      }
      return results
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
        return await docToSignalement(docSnap.id, docSnap.data())
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
      // Obtenir le statut NOUVEAU par défaut
      let statutId = data.statut_id
      if (!statutId) {
        const nouveauStatut = await getStatutByLabel('NOUVEAU')
        if (!nouveauStatut) {
          throw new Error('Statut NOUVEAU non trouvé')
        }
        statutId = nouveauStatut.id
      }

      const signalementData = {
        titre: data.titre,
        description: data.description || '',
        statut_id: statutId,
        latitude: data.latitude,
        longitude: data.longitude,
        surface_m2: data.surface_m2 || null,
        budget: data.budget || null,
        entreprise_concernee: data.entreprise_concernee || '',
        user_id: user.id,
        is_synchronized: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, this.collectionName), signalementData)

      // Retourner le signalement créé
      const statut = await getStatutById(statutId)
      return {
        id: docRef.id,
        titre: data.titre,
        description: data.description || '',
        statut_id: statutId,
        statut: statut || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        surface_m2: data.surface_m2,
        budget: data.budget,
        entreprise_concernee: data.entreprise_concernee,
        user_id: user.id,
        firebase_id: docRef.id,
        is_synchronized: false,
        created_at: new Date(),
        updated_at: new Date()
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
      const updateData: any = {
        updated_at: serverTimestamp()
      }

      if (data.titre !== undefined) updateData.titre = data.titre
      if (data.description !== undefined) updateData.description = data.description
      if (data.latitude !== undefined) updateData.latitude = data.latitude
      if (data.longitude !== undefined) updateData.longitude = data.longitude
      if (data.surface_m2 !== undefined) updateData.surface_m2 = data.surface_m2
      if (data.budget !== undefined) updateData.budget = data.budget
      if (data.entreprise_concernee !== undefined) updateData.entreprise_concernee = data.entreprise_concernee
      if (data.statut_id !== undefined) updateData.statut_id = data.statut_id

      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('Erreur update signalement:', error)
      throw error
    }
  }

  // Mettre à jour le statut d'un signalement
  async updateStatus(id: string, statutId: string): Promise<void> {
    const userId = firebaseAuthService.getCurrentUserId()
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      const signalement = await this.getById(id)
      if (!signalement) {
        throw new Error('Signalement non trouvé')
      }
      if (signalement.user_id !== userId) {
        throw new Error('Vous ne pouvez modifier que vos propres signalements')
      }

      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, {
        statut_id: statutId,
        updated_at: serverTimestamp()
      })
    } catch (error) {
      console.error('Erreur updateStatus:', error)
      throw error
    }
  }

  // Récapitulatif des signalements
  async getRecap(): Promise<SignalementRecap> {
    try {
      const userId = firebaseAuthService.getCurrentUserId()
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      const q = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      const signalements: Signalement[] = []
      for (const doc of querySnapshot.docs) {
        signalements.push(await docToSignalement(doc.id, doc.data()))
      }

      const total = signalements.length
      const nouveaux = signalements.filter(s => s.statut?.statut === 'NOUVEAU').length
      const enCours = signalements.filter(s => s.statut?.statut === 'EN_COURS').length
      const termines = signalements.filter(s => s.statut?.statut === 'TERMINE').length
      const annules = signalements.filter(s => s.statut?.statut === 'ANNULE').length

      // Calculer les totaux et moyennes
      const totalSurfaceM2 = signalements.reduce((sum, s) => sum + (s.surface_m2 || 0), 0)
      const totalBudget = signalements.reduce((sum, s) => sum + (s.budget || 0), 0)
      const averageAvancement = total > 0 
        ? Math.round(
            signalements.reduce((sum, s) => sum + (s.statut?.avancement || 0), 0) / total
          )
        : 0

      return {
        total,
        nouveaux,
        enCours,
        termines,
        annules,
        totalSurfaceM2,
        totalBudget,
        averageAvancement
      }
    } catch (error) {
      console.error('Erreur getRecap:', error)
      throw error
    }
  }
}

// Export des types
export type { Signalement, SignalementCreateRequest, SignalementRecap, StatutAvancementSignalement }
export { statutLabels, statutColors, getStatutByLabel, getStatutById }

export default new FirestoreSignalementService()
