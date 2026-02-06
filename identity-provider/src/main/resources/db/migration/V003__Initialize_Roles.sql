-- Migration: Initialiser les rôles par défaut

INSERT INTO roles (id, nom) VALUES 
  (UUID(), 'USER'),
  (UUID(), 'MANAGER')
ON DUPLICATE KEY UPDATE nom = nom;
