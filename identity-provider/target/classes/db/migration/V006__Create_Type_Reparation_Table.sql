-- V006: Création de la table type_reparation et relation avec signalement

-- Table type_reparation
CREATE TABLE IF NOT EXISTS type_reparation (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cout_unitaire NUMERIC(15,2) NOT NULL DEFAULT 0,
    unite VARCHAR(50) NOT NULL DEFAULT 'm2',
    niveau INTEGER NOT NULL DEFAULT 1 CHECK (niveau >= 1 AND niveau <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajout de la colonne type_reparation_id dans signalements
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS type_reparation_id VARCHAR(36);
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT NULL CHECK (niveau IS NULL OR (niveau >= 1 AND niveau <= 10));

-- Clé étrangère
ALTER TABLE signalements 
    ADD CONSTRAINT fk_signalement_type_reparation 
    FOREIGN KEY (type_reparation_id) REFERENCES type_reparation(id)
    ON DELETE SET NULL;

-- Insertion de quelques types de réparation par défaut
INSERT INTO type_reparation (id, nom, description, cout_unitaire, unite, niveau) VALUES
    (gen_random_uuid(), 'Rebouchage nid-de-poule', 'Rebouchage simple de nid-de-poule avec enrobé à froid', 15000, 'm2', 3),
    (gen_random_uuid(), 'Resurfaçage léger', 'Resurfaçage de la couche superficielle de la chaussée', 45000, 'm2', 5),
    (gen_random_uuid(), 'Reconstruction complète', 'Reconstruction totale de la chaussée (fondation + revêtement)', 120000, 'm2', 9),
    (gen_random_uuid(), 'Réparation fissures', 'Colmatage et traitement des fissures', 8000, 'ml', 2),
    (gen_random_uuid(), 'Drainage et assainissement', 'Réparation du système de drainage routier', 75000, 'ml', 7)
ON CONFLICT (nom) DO NOTHING;
