-- ================================================================
-- SCRIPT DE RÉINITIALISATION DE LA BASE DE DONNÉES - authdb
-- ================================================================
-- Ce script supprime toutes les données et recrée les tables proprement
-- Base: PostgreSQL (port 5433, user: postgres, db: authdb)
-- ================================================================

-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = 'replica';

-- ================================================================
-- 1. SUPPRESSION DES DONNÉES (dans l'ordre des dépendances)
-- ================================================================
TRUNCATE TABLE historique_statut_signalement CASCADE;
TRUNCATE TABLE photos_signalement CASCADE;
TRUNCATE TABLE signalements CASCADE;
TRUNCATE TABLE login_attempts CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE statut_avancement_signalement CASCADE;
TRUNCATE TABLE security_settings CASCADE;
TRUNCATE TABLE roles CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ================================================================
-- 2. RÉINITIALISATION DES SÉQUENCES (si existantes)
-- ================================================================
-- Les IDs sont des UUIDs donc pas de séquences à réinitialiser

-- ================================================================
-- 3. INSERTION DES DONNÉES DE BASE
-- ================================================================

-- 3.1 Rôles
INSERT INTO roles (id, nom) VALUES 
    (gen_random_uuid(), 'USER'),
    (gen_random_uuid(), 'MANAGER'),
    (gen_random_uuid(), 'ADMIN');

-- 3.2 Statuts d'avancement des signalements
INSERT INTO statut_avancement_signalement (id, nom, description, ordre) VALUES 
    (gen_random_uuid(), 'EN_ATTENTE', 'Signalement en attente de traitement', 1),
    (gen_random_uuid(), 'EN_COURS', 'Signalement en cours de traitement', 2),
    (gen_random_uuid(), 'TERMINE', 'Travaux terminés', 3),
    (gen_random_uuid(), 'REJETE', 'Signalement rejeté', 4);

-- 3.3 Paramètres de sécurité par défaut
INSERT INTO security_settings (id, setting_key, setting_value, description, updated_at) VALUES 
    (gen_random_uuid(), 'max_login_attempts', '3', 'Nombre max de tentatives de connexion', NOW()),
    (gen_random_uuid(), 'lockout_duration_minutes', '30', 'Durée de blocage en minutes', NOW()),
    (gen_random_uuid(), 'session_duration_minutes', '60', 'Durée de session en minutes', NOW()),
    (gen_random_uuid(), 'jwt_expiration_ms', '3600000', 'Expiration JWT en millisecondes', NOW());

-- ================================================================
-- 4. UTILISATEURS DE TEST (optionnel - décommenter si nécessaire)
-- ================================================================
-- Mot de passe: "password123" encodé avec BCrypt
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

/*
INSERT INTO users (id, email, password_hash, full_name, phone, role_id, is_active, is_locked, failed_login_attempts, sync_status, firestore_id, created_at)
SELECT 
    gen_random_uuid(),
    'admin@test.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Admin Test',
    '+261340000001',
    r.id,
    true,
    false,
    0,
    'SYNCED',
    'user_admin_test',
    NOW()
FROM roles r WHERE r.nom = 'ADMIN';

INSERT INTO users (id, email, password_hash, full_name, phone, role_id, is_active, is_locked, failed_login_attempts, sync_status, firestore_id, created_at)
SELECT 
    gen_random_uuid(),
    'manager@test.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Manager Test',
    '+261340000002',
    r.id,
    true,
    false,
    0,
    'SYNCED',
    'user_manager_test',
    NOW()
FROM roles r WHERE r.nom = 'MANAGER';

INSERT INTO users (id, email, password_hash, full_name, phone, role_id, is_active, is_locked, failed_login_attempts, sync_status, firestore_id, created_at)
SELECT 
    gen_random_uuid(),
    'user@test.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'User Test',
    '+261340000003',
    r.id,
    true,
    false,
    0,
    'SYNCED',
    'user_test',
    NOW()
FROM roles r WHERE r.nom = 'USER';
*/

-- ================================================================
-- 5. VÉRIFICATION
-- ================================================================
SELECT 'Rôles créés:' AS info, COUNT(*) AS count FROM roles;
SELECT 'Statuts créés:' AS info, COUNT(*) AS count FROM statut_avancement_signalement;
SELECT 'Settings créés:' AS info, COUNT(*) AS count FROM security_settings;
SELECT 'Utilisateurs:' AS info, COUNT(*) AS count FROM users;

SELECT '✅ Base de données réinitialisée avec succès!' AS status;
