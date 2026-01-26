# PROJET CLOUD P17 – RESTE À FAIRE (AUTHENTIFICATION + WEB)

## 1. OBJECTIF IMMÉDIAT
Finaliser le **module Authentification** et le **module Web** en mode :
- Online : Firebase
- Offline : PostgreSQL (Docker)

L’application doit rester fonctionnelle même sans connexion Internet.

---

## 2. MODULE AUTHENTIFICATION

### 2.1 Affichage (Web)

#### Pages à finaliser
- Page Login
- Page Création utilisateur (Manager uniquement)
- Page Liste utilisateurs bloqués

#### Comportement attendu
- Blocage après N tentatives (paramétrable, défaut = 3)
- Message clair : compte bloqué / désactivé
- Déconnexion automatique après expiration de session

---

### 2.2 Métier (API / Services)

#### Authentification
- POST `/api/auth/login`
  - Source : Firebase si internet, sinon PostgreSQL
  - Incrémentation de `login_attempts`
  - Blocage du compte si dépassement du seuil

- POST `/api/auth/register`
  - Accessible uniquement au rôle `MANAGER`
  - Création du compte local
  - Synchronisation Firebase si possible

- POST `/api/auth/logout`

#### Gestion des utilisateurs
- GET `/api/users/locked`
- POST `/api/users/unblock/{email}`
- PUT `/api/users/{id}`
  - Modification infos utilisateur
  - Mise à jour locale prioritaire
  - Synchronisation Firebase optionnelle

#### Sécurité
- Gestion durée de session
- Rôles via Spring Security
- Swagger sécurisé (JWT / Session)

---

### 2.3 Base de données (MCD Auth)

#### USER
- id
- email (unique)
- password_hash
- firebase_uid
- full_name
- enabled
- locked
- login_attempts
- last_login
- created_at
- updated_at

#### ROLE
- id
- name (`MANAGER`, `USER`)

#### USER_ROLE
- user_id (FK)
- role_id (FK)

---

## 3. MODULE WEB – SUIVI DES TRAVAUX ROUTIERS

---

### 3.1 Affichage – VISITEUR (sans login)

#### Page : VisitorDashboard.jsx
- Carte Leaflet (serveur offline Docker)
- Points représentant les signalements
- Survol :
  - Date
  - Statut (nouveau, en cours, terminé)
  - Surface
  - Budget
  - Entreprise concernée

#### Tableau récapitulatif
- Nombre total de signalements
- Surface totale
- Budget total
- Avancement (%) :
  - % terminé = (terminé / total) * 100

---

### 3.2 Métier – VISITEUR (API)

- GET `/api/signalements`
- GET `/api/signalements/{id}`
- GET `/api/signalements/recap?date=now`

---

## 4. MODULE WEB – MANAGER

---

### 4.1 Affichage – MANAGER

#### Pages à faire
- Dashboard Manager
- Gestion des signalements
- Gestion utilisateurs
- Bouton Synchronisation

---

### 4.2 Métier – MANAGER (API)

#### Signalements
- POST `/api/signalements`
- PUT `/api/signalements/{id}`
- PUT `/api/signalements/{id}/status`

#### Synchronisation
- POST `/api/sync/firebase`
  - Envoi données locales vers Firebase
- POST `/api/sync/local`
  - Récupération données Firebase

#### Utilisateurs
- GET `/api/users`
- GET `/api/users/locked`
- POST `/api/users/unblock/{email}`

---

### 4.3 Base de données (MCD Web)

#### SIGNALMENT
- id
- date_signalement
- statut (`NOUVEAU`, `EN_COURS`, `TERMINE`)
- surface_m2
- budget
- entreprise
- latitude
- longitude
- created_by (FK → USER)
- created_at

Relations :
- USER (1) → (N) SIGNALMENT

---

## 5. PRIORITÉS DE DÉVELOPPEMENT (ORDRE LOGIQUE)

### Phase 1 – Obligatoire
1. Authentification locale PostgreSQL complète
2. Gestion des rôles (USER / MANAGER)
3. CRUD Signalement
4. Carte offline + affichage visiteur
5. Tableau récapitulatif

### Phase 2 – Synchronisation
6. Sync Firebase → Local
7. Sync Local → Firebase
8. Gestion conflits (last update wins)

### Phase 3 – Bonus
9. Champs dynamiques sur signalement
10. Historique des statuts
11. Audit des connexions

---

## 6. ÉLÉMENTS À FOURNIR POUR LA SOUTENANCE

- MCD clair (USER / ROLE / SIGNALMENT)
- Scénarios d’utilisation avec captures écran
- Swagger documenté
- Repo Git public
- APK mobile
- Documentation technique (ce fichier)

---

## 7. PHRASE CLÉ POUR LE RAPPORT

> Le système repose sur une architecture hybride online/offline assurant la continuité du service.  
> La gestion des identités est indépendante des applications clientes et extensible via rôles.

