// Utiliser firestoreSignalementService pour les signalements
// Ce fichier est conservé pour compatibilité, mais réexporte le service Firestore
import { 
  Signalement,
  SignalementCreateRequest,
  SignalementRecap,
  getStatutByLabel,
  getStatutById,
  statutLabels,
  statutColors
} from './firestoreSignalementService'
import firestoreSignalementService from './firestoreSignalementService'

// Réexporter les types et labels
export type { Signalement, SignalementCreateRequest, SignalementRecap }
export { statutLabels, statutColors, getStatutByLabel, getStatutById }

// Réexporter le service Firestore comme service de signalement par défaut
export default firestoreSignalementService
