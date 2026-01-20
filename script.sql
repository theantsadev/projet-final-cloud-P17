-- Création de la base de données
CREATE DATABASE authdb;
-- Se connecter à la base de données
\ c authdb;
-- Table des utilisateurs
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  firestore_id VARCHAR(255) UNIQUE,
  sync_status VARCHAR(20) DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED'))
);
-- Table des sessions
CREATE TABLE user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(512) UNIQUE NOT NULL,
  refresh_token VARCHAR(512) UNIQUE,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  firestore_id VARCHAR(255) UNIQUE,
  sync_status VARCHAR(20) DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED'))
);
-- Table des logs de tentatives de connexion
CREATE TABLE login_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE
  SET
    NULL,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    firestore_id VARCHAR(255) UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED'))
);
-- Table de paramètres de sécurité
CREATE TABLE security_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insérer les paramètres par défaut
INSERT INTO
  security_settings (setting_key, setting_value, description)
VALUES
  (
    'MAX_LOGIN_ATTEMPTS',
    '3',
    'Nombre maximum de tentatives de connexion échouées avant blocage'
  ),
  (
    'SESSION_DURATION_MINUTES',
    '60',
    'Durée de vie des sessions en minutes'
  ),
  (
    'LOCKOUT_DURATION_MINUTES',
    '30',
    'Durée de blocage après trop de tentatives échouées'
  ),
  (
    'PASSWORD_MIN_LENGTH',
    '8',
    'Longueur minimale du mot de passe'
  ),
  (
    'REQUIRE_SPECIAL_CHAR',
    'true',
    'Exiger un caractère spécial dans le mot de passe'
  );
-- Index pour améliorer les performances
  CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firestore_id ON users(firestore_id);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_time ON login_attempts(attempted_at);
-- Trigger pour mettre à jour updated_at
  CREATE
  OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$ $ language 'plpgsql';
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_settings_updated_at BEFORE
UPDATE
  ON security_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();