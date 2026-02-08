-- =========================
-- TABLE: role
-- =========================
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- =========================
-- TABLE: users
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    last_failed_login TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    firestore_id VARCHAR(100),
    sync_status VARCHAR(50),
    role_id INT,
    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES role(id)
);

-- =========================
-- TABLE: user_sessions
-- =========================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_token TEXT NOT NULL,
    refresh_token TEXT,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE,
    firestore_id VARCHAR(100),
    sync_status VARCHAR(50),
    user_id INT NOT NULL,
    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- TABLE: security_settings
-- =========================
CREATE TABLE security_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_security_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- TABLE: pictures
-- =========================
CREATE TABLE pictures (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE: signalment
-- =========================
CREATE TABLE signalment (
    id SERIAL PRIMARY KEY,
    date_signalement DATE,
    surface_m2 NUMERIC(10,2),
    budget NUMERIC(12,2),
    entreprise VARCHAR(150),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50),
    firestore_id VARCHAR(100),
    user_id INT NOT NULL,
    picture_id INT,
    CONSTRAINT fk_signalment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_signalment_picture
        FOREIGN KEY (picture_id)
        REFERENCES pictures(id)
);

-- =========================
-- TABLE: signalment_status
-- =========================
CREATE TABLE signalment_status (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    advancement_value INT
);

-- =========================
-- TABLE: signalment_status_history
-- =========================
CREATE TABLE signalment_status_history (
    id SERIAL PRIMARY KEY,
    history_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signalment_id INT NOT NULL,
    status_id INT NOT NULL,
    CONSTRAINT fk_history_signalment
        FOREIGN KEY (signalment_id)
        REFERENCES signalment(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_history_status
        FOREIGN KEY (status_id)
        REFERENCES signalment_status(id)
);

-- =========================
-- TABLE: notification
-- =========================
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    motif TEXT,
    history_id INT UNIQUE,
    CONSTRAINT fk_notification_history
        FOREIGN KEY (history_id)
        REFERENCES signalment_status_history(id)
        ON DELETE CASCADE
);
