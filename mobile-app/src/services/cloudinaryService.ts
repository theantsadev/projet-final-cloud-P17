// Service Cloudinary pour l'upload de photos
// Configuration pour unsigned upload (côté client)

const CLOUDINARY_CLOUD_NAME = 'djkj6ek2t'
const CLOUDINARY_UPLOAD_PRESET = 'Jordi_preset'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

// Timeout en millisecondes (60 secondes)
const UPLOAD_TIMEOUT = 60000

export interface CloudinaryUploadResult {
  public_id: string
  url: string
  secure_url: string
  format: string
  width: number
  height: number
  bytes: number
  original_filename: string
  created_at: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Nettoie un nom de dossier pour Cloudinary
 * Supprime les caractères invalides
 */
function sanitizeFolderName(folder: string): string {
  // Remplacer les caractères spéciaux par des underscores
  return folder.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
}

/**
 * Upload une image vers Cloudinary
 * @param file - Fichier image à uploader (File ou Blob)
 * @param folder - Dossier de destination dans Cloudinary (optionnel)
 * @param onProgress - Callback pour suivre la progression (optionnel)
 * @returns Résultat de l'upload avec URL et public_id
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  
  // Ne pas envoyer de dossier - laisser Cloudinary utiliser le dossier par défaut du preset
  // Cela évite les conflits avec la configuration du preset
  // Si vous voulez un dossier spécifique, configurez-le dans votre Upload Preset Cloudinary
  if (folder) {
    const cleanFolder = sanitizeFolderName(folder)
    console.log('Cloudinary folder:', cleanFolder)
    formData.append('folder', cleanFolder)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    // Timeout pour éviter le blocage
    timeoutId = setTimeout(() => {
      xhr.abort()
      reject(new Error('Timeout: l\'upload a pris trop de temps'))
    }, UPLOAD_TIMEOUT)

    const clearTimeoutSafe = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
    
    // Suivi de la progression
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          })
        }
      })
    }

    xhr.addEventListener('load', () => {
      clearTimeoutSafe()
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          console.log('Cloudinary upload success:', response.public_id)
          resolve({
            public_id: response.public_id,
            url: response.url,
            secure_url: response.secure_url,
            format: response.format,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            original_filename: response.original_filename,
            created_at: response.created_at
          })
        } catch (error) {
          console.error('Erreur parsing Cloudinary:', xhr.responseText)
          reject(new Error('Erreur parsing réponse Cloudinary'))
        }
      } else {
        console.error('Cloudinary error:', xhr.status, xhr.responseText)
        // Essayer de parser l'erreur Cloudinary
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error?.message || `Erreur Cloudinary: ${xhr.status}`))
        } catch {
          reject(new Error(`Erreur upload Cloudinary: ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      clearTimeoutSafe()
      console.error('Network error during upload')
      reject(new Error('Erreur réseau lors de l\'upload'))
    })

    xhr.addEventListener('abort', () => {
      clearTimeoutSafe()
      reject(new Error('Upload annulé'))
    })

    xhr.open('POST', CLOUDINARY_UPLOAD_URL)
    xhr.send(formData)
  })
}

/**
 * Upload multiple images vers Cloudinary
 * @param files - Liste des fichiers à uploader
 * @param folder - Dossier de destination
 * @param onFileProgress - Callback pour suivre la progression de chaque fichier
 * @returns Liste des résultats d'upload
 */
export async function uploadMultipleToCloudinary(
  files: (File | Blob)[],
  folder?: string,
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(
      files[i],
      folder,
      onFileProgress ? (progress) => onFileProgress(i, progress) : undefined
    )
    results.push(result)
  }
  
  return results
}

/**
 * Génère une URL de transformation Cloudinary
 * @param publicId - Public ID de l'image
 * @param transformations - Paramètres de transformation (ex: 'w_300,h_300,c_fill')
 * @returns URL transformée
 */
export function getCloudinaryUrl(publicId: string, transformations?: string): string {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  if (transformations) {
    return `${baseUrl}/${transformations}/${publicId}`
  }
  return `${baseUrl}/${publicId}`
}

/**
 * Génère une URL thumbnail
 * @param publicId - Public ID de l'image
 * @param width - Largeur du thumbnail
 * @param height - Hauteur du thumbnail
 * @returns URL du thumbnail
 */
export function getCloudinaryThumbnail(publicId: string, width = 150, height = 150): string {
  return getCloudinaryUrl(publicId, `w_${width},h_${height},c_fill,q_auto`)
}

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  getCloudinaryUrl,
  getCloudinaryThumbnail,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET
}
