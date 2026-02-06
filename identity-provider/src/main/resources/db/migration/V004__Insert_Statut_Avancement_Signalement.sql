-- Migration: Initialiser les statuts d'avancement des signalements

INSERT INTO statut_avancement_signalement (id, statut, avancement) VALUES 
  (gen_random_uuid(), 'NOUVEAU', 0),
  (gen_random_uuid(), 'EN_COURS', 50),
  (gen_random_uuid(), 'TERMINE', 100)
ON CONFLICT (statut) DO NOTHING;
