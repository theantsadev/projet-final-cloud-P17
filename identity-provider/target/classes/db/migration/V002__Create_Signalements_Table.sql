-- V002__Create_Signalements_Table.sql
-- Migration: Créer la table des signalements
-- Author: Team
-- Date: 2026-01-27

CREATE TABLE IF NOT EXISTS signalements (
    id VARCHAR(36) PRIMARY KEY COMMENT 'Identifiant unique UUID',
    titre VARCHAR(500) NOT NULL COMMENT 'Titre du signalement',
    description LONGTEXT COMMENT 'Description détaillée du problème',
    statut VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU' COMMENT 'NOUVEAU, EN_COURS, TERMINE, ANNULE',
    latitude DECIMAL(10, 8) NOT NULL COMMENT 'Latitude de la localisation',
    longitude DECIMAL(11, 8) NOT NULL COMMENT 'Longitude de la localisation',
    surface_m2 DECIMAL(10, 2) COMMENT 'Surface affectée en mètres carrés',
    budget DECIMAL(15, 2) COMMENT 'Budget estimé pour la réparation',
    entreprise_concernee VARCHAR(255) COMMENT 'Entreprise responsable des travaux',
    pourcentage_avancement INTEGER DEFAULT 0 COMMENT 'Pourcentage de complétion (0-100)',
    user_id VARCHAR(36) NOT NULL COMMENT 'Référence à l''utilisateur qui a signalé',
    firebase_id VARCHAR(255) UNIQUE COMMENT 'ID du document dans Firebase Firestore',
    is_synchronized BOOLEAN DEFAULT false COMMENT 'État de synchronisation avec Firebase',
    last_synced_at TIMESTAMP NULL COMMENT 'Timestamp de la dernière synchronisation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour',
    
    -- Contraintes
    CONSTRAINT chk_avancement CHECK (pourcentage_avancement >= 0 AND pourcentage_avancement <= 100),
    CONSTRAINT chk_surface CHECK (surface_m2 >= 0),
    CONSTRAINT chk_budget CHECK (budget >= 0),
    CONSTRAINT fk_signalements_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table pour stocker les signalements de problèmes routiers';

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements(statut);
CREATE INDEX IF NOT EXISTS idx_signalements_user_id ON signalements(user_id);
CREATE INDEX IF NOT EXISTS idx_signalements_firebase_id ON signalements(firebase_id);
CREATE INDEX IF NOT EXISTS idx_signalements_is_synchronized ON signalements(is_synchronized);
CREATE INDEX IF NOT EXISTS idx_signalements_coordinates ON signalements(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_signalements_created_at ON signalements(created_at);
CREATE INDEX IF NOT EXISTS idx_signalements_statut_user ON signalements(statut, user_id);
