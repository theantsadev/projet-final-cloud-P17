-- Migration: Création de la table type_reparations
-- Date: 2026-02-10
-- Description: Ajout des types de réparation avec niveau (1-10) et prix au m²

-- 1. Créer la table type_reparations
CREATE TABLE IF NOT EXISTS type_reparations (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    niveau INTEGER NOT NULL CHECK (niveau >= 1 AND niveau <= 10),
    prix_m2 DECIMAL(15, 2) NOT NULL CHECK (prix_m2 > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ajouter la colonne type_reparation_id à la table signalements
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS type_reparation_id VARCHAR(36) REFERENCES type_reparations(id);

-- 3. Insérer des types de réparation par défaut
INSERT INTO type_reparations (id, nom, description, niveau, prix_m2, is_active) VALUES
    (gen_random_uuid()::VARCHAR, 'Nid de poule mineur', 'Petits trous de moins de 20cm de diamètre', 1, 15000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Nid de poule moyen', 'Trous de 20 à 50cm de diamètre', 3, 35000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Nid de poule majeur', 'Grands trous de plus de 50cm', 5, 75000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Fissure légère', 'Fissures superficielles sans affaissement', 2, 20000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Fissure profonde', 'Fissures avec affaissement partiel', 4, 50000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Affaissement chaussée', 'Déformation importante de la route', 6, 100000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Effondrement partiel', 'Effondrement localisé nécessitant reconstruction', 8, 200000.00, TRUE),
    (gen_random_uuid()::VARCHAR, 'Destruction totale', 'Route impraticable, reconstruction complète requise', 10, 500000.00, TRUE);

-- 4. Créer un index pour les recherches par niveau
CREATE INDEX IF NOT EXISTS idx_type_reparations_niveau ON type_reparations(niveau);
CREATE INDEX IF NOT EXISTS idx_type_reparations_active ON type_reparations(is_active);
CREATE INDEX IF NOT EXISTS idx_signalements_type_reparation ON signalements(type_reparation_id);

-- 5. Commentaires sur les colonnes
COMMENT ON TABLE type_reparations IS 'Types de réparation routière avec niveau de gravité et coût au m²';
COMMENT ON COLUMN type_reparations.niveau IS 'Niveau de gravité de 1 (mineur) à 10 (critique)';
COMMENT ON COLUMN type_reparations.prix_m2 IS 'Prix de réparation par mètre carré en Ariary (MGA)';
