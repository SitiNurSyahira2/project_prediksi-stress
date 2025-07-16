-- Database Schema untuk RelaxaID - Sistem Prediksi Stress Digital
-- Sesuai dengan spesifikasi laporan

-- 1. Tabel Users (Data pengguna dan admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Tabel DigitalActivities (Data aktivitas digital harian pengguna)
CREATE TABLE IF NOT EXISTS digital_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tanggal DATE DEFAULT CURRENT_DATE,
    
    -- Aktivitas digital utama
    screen_time_total FLOAT NOT NULL, -- Total waktu layar (jam)
    durasi_pemakaian FLOAT NOT NULL, -- Durasi pemakaian perangkat
    frekuensi_penggunaan FLOAT NOT NULL, -- Frekuensi penggunaan
    jumlah_aplikasi INTEGER NOT NULL, -- Jumlah aplikasi yang digunakan
    
    -- Notifikasi dan interupsi
    notifikasi_count INTEGER NOT NULL, -- Jumlah notifikasi
    
    -- Aktivitas lifestyle yang mempengaruhi stres
    durasi_tidur FLOAT NOT NULL, -- Jam tidur
    durasi_makan FLOAT NOT NULL, -- Waktu makan
    durasi_olahraga FLOAT NOT NULL, -- Waktu olahraga
    
    -- Aktivitas digital spesifik
    main_game FLOAT NOT NULL, -- Waktu bermain game
    belajar_online FLOAT NOT NULL, -- Waktu belajar online
    buka_sosmed FLOAT NOT NULL, -- Waktu media sosial
    streaming FLOAT NOT NULL, -- Waktu streaming
    scroll_time FLOAT NOT NULL, -- Waktu scrolling
    email_time FLOAT NOT NULL, -- Waktu email
    panggilan_time FLOAT NOT NULL, -- Waktu panggilan
    
    -- Pola waktu penggunaan (faktor stres malam hari)
    waktu_pagi INTEGER DEFAULT 0, -- Penggunaan pagi (0/1)
    waktu_siang INTEGER DEFAULT 0, -- Penggunaan siang (0/1)
    waktu_sore INTEGER DEFAULT 0, -- Penggunaan sore (0/1)
    waktu_malam INTEGER DEFAULT 0, -- Penggunaan malam (0/1)
    
    -- Multitasking digital
    jumlah_aktivitas INTEGER NOT NULL, -- Jumlah aktivitas simultan
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Predictions (Hasil prediksi stres)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    digital_activity_id INTEGER REFERENCES digital_activities(id) ON DELETE CASCADE,
    
    -- Hasil prediksi Random Forest
    predicted_stress_level VARCHAR(20) NOT NULL CHECK (predicted_stress_level IN ('Rendah', 'Sedang', 'Tinggi')),
    confidence_score FLOAT NOT NULL, -- Confidence dari model
    probability_rendah FLOAT, -- Probabilitas stres rendah
    probability_sedang FLOAT, -- Probabilitas stres sedang  
    probability_tinggi FLOAT, -- Probabilitas stres tinggi
    
    -- Metadata prediksi
    model_version VARCHAR(50) DEFAULT '1.0.0',
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validasi hasil (untuk evaluasi model)
    actual_stress_level VARCHAR(20) CHECK (actual_stress_level IN ('Rendah', 'Sedang', 'Tinggi')),
    user_feedback TEXT
);

-- 4. Tabel FeatureImportanceLogs (Catatan fitur-fitur penting dalam prediksi)
CREATE TABLE IF NOT EXISTS feature_importance_logs (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    
    -- Feature importance dari Random Forest
    feature_name VARCHAR(100) NOT NULL,
    importance_score FLOAT NOT NULL,
    rank_position INTEGER NOT NULL,
    
    -- Metadata
    model_version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel LoginAuditLogs (Informasi login pengguna untuk audit keamanan)
CREATE TABLE IF NOT EXISTS login_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informasi login
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Status login
    login_status VARCHAR(20) DEFAULT 'success' CHECK (login_status IN ('success', 'failed', 'blocked')),
    failure_reason TEXT,
    
    -- Lokasi dan device
    device_info TEXT,
    location_info TEXT,
    
    session_duration INTERVAL -- Durasi session
);

-- Indexes untuk optimasi performa
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_digital_activities_user_date ON digital_activities(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_feature_importance_prediction ON feature_importance_logs(prediction_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_time ON login_audit_logs(user_id, login_time);

-- Insert default admin user
INSERT INTO users (nama, email, password, role) VALUES 
('Admin System', 'admin@relaxaid.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9wvq2JKfxG', 'admin'),
('Test User', 'test@relaxaid.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9wvq2JKfxG', 'user')
ON CONFLICT (email) DO NOTHING;
