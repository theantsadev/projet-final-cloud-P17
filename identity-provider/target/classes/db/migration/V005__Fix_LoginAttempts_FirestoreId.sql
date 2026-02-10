-- Migration: Corriger les doublons firestore_id et rendre la colonne nullable

-- Supprimer les données existantes (optionnel, selon votre besoin)
DELETE FROM login_attempts WHERE firestore_id IS NOT NULL;

-- Supprimer la contrainte unique sur firestore_id
ALTER TABLE login_attempts DROP CONSTRAINT IF EXISTS uk_cdw6jaf6l8oamws299ruoxt3s;

-- Rendre firestore_id nullable et sans contrainte unique (permet les doublons)
ALTER TABLE login_attempts ALTER COLUMN firestore_id DROP NOT NULL;
