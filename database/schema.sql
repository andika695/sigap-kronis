-- =====================================================================
-- SIGAP-Kronis — Skema Basis Data
-- Sistem Pendukung Keputusan Stratifikasi Risiko Hipertensi & DM Tipe 2
-- Kelompok "Kesatria Naga Hitam" — Informatika/E, Universitas Islam Indonesia
--
-- Target: MariaDB 10.4+ / MySQL 5.7+ (XAMPP)
-- Jalankan:  mysql -u root < database/schema.sql
-- =====================================================================

DROP DATABASE IF EXISTS sigap_kronis;
CREATE DATABASE sigap_kronis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE sigap_kronis;

-- ---------------------------------------------------------------------
-- users — 3 peran: admin (seluruh privilege), dokter/perawat, kader
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code          VARCHAR(20)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  username      VARCHAR(60)  NOT NULL,
  email         VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('kader','dokter','admin') NOT NULL DEFAULT 'kader',
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_code (code),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- criteria — C1..C5 (dapat ditambah/dihapus admin)
-- min_value/max_value dipakai untuk validasi input (dulu di-hardcode di form)
-- ---------------------------------------------------------------------
CREATE TABLE criteria (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(10)  NOT NULL,
  name       VARCHAR(120) NOT NULL,
  unit       VARCHAR(40)  NOT NULL DEFAULT '',
  type       ENUM('cost','benefit') NOT NULL DEFAULT 'cost',
  min_value  DECIMAL(10,3) NOT NULL DEFAULT 0,
  max_value  DECIMAL(10,3) NOT NULL DEFAULT 1000,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_criteria_code (code),
  KEY idx_criteria_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- ahp_comparisons — segitiga ATAS matriks perbandingan berpasangan (Saaty)
-- Segitiga bawah = resiprokal (dihitung, tidak disimpan). Diagonal = 1.
-- Bobot kriteria SELALU diturunkan dari tabel ini (AHP autentik, slide 5).
-- ---------------------------------------------------------------------
CREATE TABLE ahp_comparisons (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  row_criteria_id INT UNSIGNED NOT NULL,
  col_criteria_id INT UNSIGNED NOT NULL,
  value          DECIMAL(12,6) NOT NULL DEFAULT 1,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ahp_pair (row_criteria_id, col_criteria_id),
  CONSTRAINT fk_ahp_row FOREIGN KEY (row_criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
  CONSTRAINT fk_ahp_col FOREIGN KEY (col_criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------
CREATE TABLE patients (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code           VARCHAR(20)  NOT NULL,
  name           VARCHAR(120) NOT NULL,
  tindaklanjuti  TINYINT(1)   NOT NULL DEFAULT 0,
  prev_saw       DECIMAL(10,6) DEFAULT NULL,
  prev_topsis    DECIMAL(10,6) DEFAULT NULL,
  created_by     INT UNSIGNED DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_code (code),
  CONSTRAINT fk_patients_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- patient_values — nilai tiap kriteria per pasien.
-- Model EAV supaya "Tambah Kriteria" di Panel Admin benar-benar berfungsi
-- (kolom c1..c5 yang di-hardcode tidak bisa menampung kriteria baru).
-- ---------------------------------------------------------------------
CREATE TABLE patient_values (
  patient_id  INT UNSIGNED NOT NULL,
  criteria_id INT UNSIGNED NOT NULL,
  value       DECIMAL(10,3) NOT NULL,
  PRIMARY KEY (patient_id, criteria_id),
  CONSTRAINT fk_pv_patient  FOREIGN KEY (patient_id)  REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_pv_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- follow_ups — riwayat tindak lanjut (dokter/perawat & admin)
-- ---------------------------------------------------------------------
CREATE TABLE follow_ups (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED DEFAULT NULL,
  author     VARCHAR(120) NOT NULL,
  role       ENUM('kader','dokter','admin') NOT NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fu_patient (patient_id),
  CONSTRAINT fk_fu_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_fu_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- password_resets — token lupa password (SHA-256, sekali pakai)
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token_hash CHAR(64)  NOT NULL,
  expires_at DATETIME  NOT NULL,
  used_at    DATETIME  DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_token (token_hash),
  KEY idx_pr_user (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SEED
-- =====================================================================

-- Akun demo. Password: admin123 / dokter123 / kader123
INSERT INTO users (code, name, username, email, password_hash, role, active) VALUES
('U001', 'Kepala Puskesmas', 'admin.puskesmas', 'admin@sigap-kronis.test',
 '$2y$10$gCEHnk0o02pwoe8kn8akoezSJXV4dbgbAYowNjzOViB2bua1By4L2', 'admin', 1),
('U002', 'Dr. Ahmad Fauzi', 'dr.ahmad', 'ahmad@sigap-kronis.test',
 '$2y$10$i4fTRDpY.HmtTYNqVKo9c.A37Y5J4n8pWSxOqi9.oL2i85j4bx0ju', 'dokter', 1),
('U003', 'Siti Rahayu', 'kader.siti', 'siti@sigap-kronis.test',
 '$2y$10$AX4TFNgxTMWJ9Jdnd3sAIOBdBNZurwUnz/ltLGGt/N67eXgx/xI8y', 'kader', 1),
('U004', 'Nur Hidayah', 'kader.nur', 'nur@sigap-kronis.test',
 '$2y$10$Bxz5W22gDLUelHUGQl0ktuM7b5aXF6cajuyiK4aDV5SAW35yq2ypK', 'kader', 0);

-- Kriteria (PPT slide 4). Rentang validasi mengikuti form asli.
INSERT INTO criteria (code, name, unit, type, min_value, max_value, position) VALUES
('C1', 'Tekanan Darah Sistolik',        'mmHg',      'cost',    60, 250, 1),
('C2', 'Gula Darah Puasa',              'mg/dL',     'cost',    50, 600, 2),
('C3', 'Usia',                          'tahun',     'cost',     1, 120, 3),
('C4', 'IMT/BMI',                       'kg/m²',     'cost',    10,  60, 4),
('C5', 'Kepatuhan Kontrol',             'skala 1-5', 'benefit',  1,   5, 5);

-- Matriks perbandingan berpasangan AHP — segitiga atas (PPT slide 5).
-- C1/C2 lebih penting (5) dari usia/BMI dan (3) dari kepatuhan;
-- kepatuhan (3) dari usia/BMI.  => lambdaMax=5,056  CI=0,014  CR=0,012
INSERT INTO ahp_comparisons (row_criteria_id, col_criteria_id, value) VALUES
((SELECT id FROM criteria WHERE code='C1'), (SELECT id FROM criteria WHERE code='C2'), 1),
((SELECT id FROM criteria WHERE code='C1'), (SELECT id FROM criteria WHERE code='C3'), 5),
((SELECT id FROM criteria WHERE code='C1'), (SELECT id FROM criteria WHERE code='C4'), 5),
((SELECT id FROM criteria WHERE code='C1'), (SELECT id FROM criteria WHERE code='C5'), 3),
((SELECT id FROM criteria WHERE code='C2'), (SELECT id FROM criteria WHERE code='C3'), 5),
((SELECT id FROM criteria WHERE code='C2'), (SELECT id FROM criteria WHERE code='C4'), 5),
((SELECT id FROM criteria WHERE code='C2'), (SELECT id FROM criteria WHERE code='C5'), 3),
((SELECT id FROM criteria WHERE code='C3'), (SELECT id FROM criteria WHERE code='C4'), 1),
((SELECT id FROM criteria WHERE code='C3'), (SELECT id FROM criteria WHERE code='C5'), 0.333333),
((SELECT id FROM criteria WHERE code='C4'), (SELECT id FROM criteria WHERE code='C5'), 0.333333);

-- 5 pasien uji coba (PPT slide 4)
INSERT INTO patients (code, name, tindaklanjuti) VALUES
('P001', 'Bu Sari',    0),
('P002', 'Pak Joko',   0),
('P003', 'Bu Wati',    0),
('P004', 'Pak Slamet', 0),
('P005', 'Bu Ningsih', 0);

INSERT INTO patient_values (patient_id, criteria_id, value)
SELECT p.id, c.id, v.value
FROM (
  SELECT 'P001' pcode, 'C1' ccode, 165 value UNION ALL
  SELECT 'P001', 'C2', 210 UNION ALL SELECT 'P001', 'C3', 62 UNION ALL
  SELECT 'P001', 'C4',  29 UNION ALL SELECT 'P001', 'C5',  2 UNION ALL

  SELECT 'P002', 'C1', 130 UNION ALL SELECT 'P002', 'C2', 110 UNION ALL
  SELECT 'P002', 'C3',  45 UNION ALL SELECT 'P002', 'C4',  23 UNION ALL
  SELECT 'P002', 'C5',   4 UNION ALL

  SELECT 'P003', 'C1', 150 UNION ALL SELECT 'P003', 'C2', 180 UNION ALL
  SELECT 'P003', 'C3',  55 UNION ALL SELECT 'P003', 'C4',  27 UNION ALL
  SELECT 'P003', 'C5',   3 UNION ALL

  SELECT 'P004', 'C1', 120 UNION ALL SELECT 'P004', 'C2',  95 UNION ALL
  SELECT 'P004', 'C3',  38 UNION ALL SELECT 'P004', 'C4',  21 UNION ALL
  SELECT 'P004', 'C5',   5 UNION ALL

  SELECT 'P005', 'C1', 175 UNION ALL SELECT 'P005', 'C2', 230 UNION ALL
  SELECT 'P005', 'C3',  68 UNION ALL SELECT 'P005', 'C4',  31 UNION ALL
  SELECT 'P005', 'C5',   1
) v
JOIN patients p ON p.code = v.pcode
JOIN criteria c ON c.code = v.ccode;
