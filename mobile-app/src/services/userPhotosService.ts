// Service Firestore pour la collection user_photos
// Gestion des photos uploadées par les utilisateurs
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type DocumentData
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import firebaseAuthService from './firebaseAuthService'
import { 
  uploadToCloudinary, 
  uploadMultipleToCloudinary,
  getCloudinaryThumbnail,
  type CloudinaryUploadResult,
  type UploadProgress
} from './cloudinaryService'
import type { UserPhoto, SignalementPhoto } from '@/types/firestore.types'

const USER_PHOTOS_COLLECTION = 'user_photos'
const SIGNALEMENT_PHOTOS_COLLECTION = 'signalement_photos'
const MAX_PHOTOS_PER_SIGNALEMENT = 5

// Convertir un document Firestore en UserPhoto
function docToUserPhoto(docId: string, data: DocumentData): UserPhoto {
  return {
    id: docId,
    uid: data.uid || '',
    url: data.url || '',
    path: data.path || '',
    nom: data.nom || '',
    dateUpload: data.dateUpload || new Date().toISOString().split('T')[0],
    type: data.type || 'signalement',
    taille: data.taille || 0,
    signalement_id: data.signalement_id,
    cloudinary_public_id: data.cloudinary_public_id || data.path || ''
  }
}

// Convertir un document Firestore en SignalementPhoto
function docToSignalementPhoto(docId: string, data: DocumentData): SignalementPhoto {
  return {
    id: docId,
    signalement_id: data.signalement_id || '',
    photo_id: data.photo_id || '',
    ordre: data.ordre || 0,
    created_at: data.created_at instanceof Timestamp 
      ? data.created_at.toDate() 
      : new Date(data.created_at || Date.now())
  }
}

class UserPhotosService {
  /**
   * Upload des photos pour un signalement
   * @param files - Liste des fichiers (max 5)
   * @param signalementId - ID du signalement
   * @param onProgress - Callback de progression
   * @returns Liste des UserPhoto créées
   */
  async uploadPhotosForSignalement(
    files: File[],
    signalementId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UserPhoto[]> {
    const user = firebaseAuthService.getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    // Vérifier le nombre de photos
    if (files.length > MAX_PHOTOS_PER_SIGNALEMENT) {
      throw new Error(`Maximum ${MAX_PHOTOS_PER_SIGNALEMENT} photos par signalement`)
    }

    // Vérifier les photos existantes
    const existingPhotos = await this.getPhotosBySignalement(signalementId)
    if (existingPhotos.length + files.length > MAX_PHOTOS_PER_SIGNALEMENT) {
      throw new Error(`Ce signalement a déjà ${existingPhotos.length} photos. Maximum ${MAX_PHOTOS_PER_SIGNALEMENT} autorisées.`)
    }

    const uploadedPhotos: UserPhoto[] = []
    // Ne pas spécifier de dossier pour éviter les conflits avec le preset Cloudinary
    // Le preset gère le dossier de destination

    // Upload chaque fichier vers Cloudinary
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Upload vers Cloudinary (sans dossier spécifique)
        const cloudinaryResult = await uploadToCloudinary(
          file,
          undefined, // Pas de dossier - le preset Cloudinary gère cela
          onProgress ? (progress) => onProgress(i, progress) : undefined
        )

        // Créer l'entrée dans user_photos
        const userPhotoData = {
          uid: user.id,
          url: cloudinaryResult.secure_url,
          path: `signalements/${signalementId}/${cloudinaryResult.original_filename || file.name}`,
          nom: file.name,
          dateUpload: new Date().toISOString().split('T')[0],
          type: 'signalement' as const,
          taille: cloudinaryResult.bytes || file.size,
          signalement_id: signalementId,
          cloudinary_public_id: cloudinaryResult.public_id,
          created_at: serverTimestamp()
        }

        const docRef = await addDoc(collection(db, USER_PHOTOS_COLLECTION), userPhotoData)

        // Créer la liaison signalement_photos
        await addDoc(collection(db, SIGNALEMENT_PHOTOS_COLLECTION), {
          signalement_id: signalementId,
          photo_id: docRef.id,
          ordre: existingPhotos.length + i,
          created_at: serverTimestamp()
        })

        uploadedPhotos.push({
          id: docRef.id,
          ...userPhotoData,
          dateUpload: userPhotoData.dateUpload
        })
      } catch (error) {
        console.error(`Erreur upload photo ${i + 1}:`, error)
        throw new Error(`Erreur lors de l'upload de la photo "${file.name}"`)
      }
    }

    return uploadedPhotos
  }

  /**
   * Récupère les photos d'un signalement
   * @param signalementId - ID du signalement
   * @returns Liste des photos
   */
  async getPhotosBySignalement(signalementId: string): Promise<UserPhoto[]> {
    try {
      console.log('Fetching photos for signalement:', signalementId)
      const q = query(
        collection(db, USER_PHOTOS_COLLECTION),
        where('signalement_id', '==', signalementId)
      )
      const querySnapshot = await getDocs(q)
      console.log('Found photos:', querySnapshot.docs.length)
      
      const photos = querySnapshot.docs.map(doc => docToUserPhoto(doc.id, doc.data()))
      
      // Trier par date de création (évite le besoin d'un index composite)
      return photos.sort((a, b) => {
        return a.dateUpload.localeCompare(b.dateUpload)
      })
    } catch (error) {
      console.error('Erreur getPhotosBySignalement:', error)
      return []
    }
  }

  /**
   * Récupère les liaisons photo-signalement (simplifié sans orderBy)
   */
  private async getLiaisonsPhotoSignalement(signalementId: string): Promise<SignalementPhoto[]> {
    try {
      const q = query(
        collection(db, SIGNALEMENT_PHOTOS_COLLECTION),
        where('signalement_id', '==', signalementId)
      )
      const querySnapshot = await getDocs(q)
      const liaisons = querySnapshot.docs.map(doc => docToSignalementPhoto(doc.id, doc.data()))
      // Trier en mémoire
      return liaisons.sort((a, b) => a.ordre - b.ordre)
    } catch (error) {
      console.error('Erreur getLiaisonsPhotoSignalement:', error)
      return []
    }
  }

  /**
   * Récupère toutes les photos de l'utilisateur connecté
   */
  async getMesPhotos(): Promise<UserPhoto[]> {
    const userId = firebaseAuthService.getCurrentUserId()
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      const q = query(
        collection(db, USER_PHOTOS_COLLECTION),
        where('uid', '==', userId),
        orderBy('dateUpload', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => docToUserPhoto(doc.id, doc.data()))
    } catch (error) {
      console.error('Erreur getMesPhotos:', error)
      return []
    }
  }

  /**
   * Récupère une photo par son ID
   */
  async getPhotoById(photoId: string): Promise<UserPhoto | null> {
    try {
      const docRef = doc(db, USER_PHOTOS_COLLECTION, photoId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docToUserPhoto(docSnap.id, docSnap.data())
      }
      return null
    } catch (error) {
      console.error('Erreur getPhotoById:', error)
      return null
    }
  }

  /**
   * Supprime une photo
   * @param photoId - ID de la photo à supprimer
   */
  async deletePhoto(photoId: string): Promise<void> {
    const userId = firebaseAuthService.getCurrentUserId()
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      // Vérifier que la photo appartient à l'utilisateur
      const photo = await this.getPhotoById(photoId)
      if (!photo) {
        throw new Error('Photo non trouvée')
      }
      if (photo.uid !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres photos')
      }

      // Supprimer la liaison signalement_photos si existe
      if (photo.signalement_id) {
        const q = query(
          collection(db, SIGNALEMENT_PHOTOS_COLLECTION),
          where('photo_id', '==', photoId)
        )
        const querySnapshot = await getDocs(q)
        for (const doc of querySnapshot.docs) {
          await deleteDoc(doc.ref)
        }
      }

      // Supprimer le document user_photos
      await deleteDoc(doc(db, USER_PHOTOS_COLLECTION, photoId))
      
      // Note: La suppression dans Cloudinary nécessiterait un backend sécurisé
      // car l'API de suppression Cloudinary nécessite une authentification
    } catch (error) {
      console.error('Erreur deletePhoto:', error)
      throw error
    }
  }

  /**
   * Supprime toutes les photos d'un signalement
   */
  async deletePhotosForSignalement(signalementId: string): Promise<void> {
    const photos = await this.getPhotosBySignalement(signalementId)
    
    for (const photo of photos) {
      if (photo.id) {
        await this.deletePhoto(photo.id)
      }
    }
  }

  /**
   * Génère une URL thumbnail pour une photo
   */
  getThumbnailUrl(photo: UserPhoto, width = 150, height = 150): string {
    if (photo.cloudinary_public_id) {
      return getCloudinaryThumbnail(photo.cloudinary_public_id, width, height)
    }
    return photo.url
  }

  /**
   * Compte le nombre de photos d'un signalement
   */
  async countPhotosForSignalement(signalementId: string): Promise<number> {
    const photos = await this.getPhotosBySignalement(signalementId)
    return photos.length
  }

  /**
   * Vérifie si on peut encore ajouter des photos à un signalement
   */
  async canAddPhotos(signalementId: string, count: number = 1): Promise<boolean> {
    const currentCount = await this.countPhotosForSignalement(signalementId)
    return (currentCount + count) <= MAX_PHOTOS_PER_SIGNALEMENT
  }
}

export const MAX_PHOTOS = MAX_PHOTOS_PER_SIGNALEMENT
export default new UserPhotosService()
