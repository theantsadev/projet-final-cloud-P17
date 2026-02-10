-- Migration: Modification du calcul de budget avec prix global
-- Date: 2026-02-10
-- Description: 
--   - Création table global_config pour stocker le prix global au m²
--   - Ajout colonne niveau sur signalements
--   - Suppression colonne prix_m2 de type_reparations (prix maintenant global)
--   - Formule: budget = prix_m2_global × niveau × surface_m2

-- 1. Créer la table global_config
CREATE TABLE IF NOT EXISTS global_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insérer le prix global au m² par défaut (50 000 Ar)
INSERT INTO global_config (config_key, config_value, description) 
VALUES ('PRIX_M2_GLOBAL', '50000', 'Prix global par mètre carré pour le calcul du budget (en Ariary). Formule: budget = prix_m2_global × niveau × surface_m2')
ON CONFLICT (config_key) DO NOTHING;

-- 3. Ajouter la colonne niveau sur signalements
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS niveau INTEGER CHECK (niveau >= 1 AND niveau <= 10);

-- 4. Migrer les niveaux depuis type_reparations vers signalements
UPDATE signalements s
SET niveau = tr.niveau
FROM type_reparations tr
WHERE s.type_reparation_id = tr.id
AND s.niveau IS NULL;

-- 5. Supprimer la colonne prix_m2 de type_reparations (le prix est maintenant global)
ALTER TABLE type_reparations 
DROP COLUMN IF EXISTS prix_m2;

-- 6. Créer un index sur la colonne niveau de signalements
CREATE INDEX IF NOT EXISTS idx_signalements_niveau ON signalements(niveau);

-- 7. Commentaires
COMMENT ON TABLE global_config IS 'Configuration globale de l''application';
COMMENT ON COLUMN global_config.config_key IS 'Clé unique de configuration';
COMMENT ON COLUMN global_config.config_value IS 'Valeur de la configuration';
COMMENT ON COLUMN signalements.niveau IS 'Niveau de gravité (1-10) pour le calcul du budget: prix_m2_global × niveau × surface_m2';
