# BakeSync IAS102 — Database SQL (full)

This file is a **single reference** for all database definitions used by the IAS102 prototype.  
**Source of truth for a fresh install:** run `database/schema.sql` on MySQL 8.0+ (or compatible).

---

## 1. Canonical schema + seed data

The following is the complete contents of **`database/schema.sql`**: database creation, three tables, indexes/foreign keys, demo users, and demo files.

```sql
-- BakeSync IAS102 Database Schema
-- MySQL 8.0+ compatible

CREATE DATABASE IF NOT EXISTS defaultdb;
USE defaultdb;

-- Users table with authentication fields
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') NOT NULL,
    -- OTP is reused for both email verification and account deletion confirmation
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
    -- Brute-force protection for OTP verification
    otp_attempts INT NOT NULL DEFAULT 0,
    otp_locked_until DATETIME DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files table for DAC demonstration
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(100) NOT NULL,
    description TEXT,
    file_type ENUM('recipe', 'report', 'schedule', 'invoice') NOT NULL,
    owner_id INT NOT NULL,
    is_public TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit trail for DAC decisions (allowed + denied)
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    file_id INT NULL,
    action ENUM('view', 'visibility', 'delete') NOT NULL,
    result ENUM('allowed', 'denied') NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
    INDEX (created_at),
    INDEX (file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Users (passwords pre-hashed with bcrypt rounds=10)
-- IMPORTANT: The hashes below are generated for the following passwords:
--   manager_maria: admin123
--   baker_juan: staff123
--   cashier_ana: user123
--
-- To regenerate hashes, run: cd backend && npm run hash
-- Then update the values below with the new hashes.
-- Demo users are pre-verified (is_verified=1) for testing.

INSERT INTO users (username, email, password_hash, role, is_verified) VALUES
('manager_maria', 'manager@bakesync.demo', '$2a$10$7070hG8mxo8QvHqzg8WVNeDeCu5WkipBE4h57QjCXQK//9ES1Fv3i', 'admin', 1),
('baker_juan', 'baker@bakesync.demo', '$2a$10$dY289C4kETAYOKpxtLwCg.M0cCbVF0ADbZXyypcHy9KjzvLJZ3h8q', 'staff', 1),
('cashier_ana', 'cashier@bakesync.demo', '$2a$10$Pk5kIA6boJNqzO8kA2MuPeotNaIwtlLMcfnBS8hH5jWvpCP7WSM3u', 'user', 1);

-- Seed Files for DAC demonstration
INSERT INTO files (filename, description, file_type, owner_id, is_public) VALUES
('chocolate_cake_recipe.pdf', 'Secret family recipe for our signature chocolate cake', 'recipe', 1, 0),
('monthly_sales_report_jan.xlsx', 'January 2024 sales performance report', 'report', 1, 1),
('sourdough_bread_recipe.pdf', 'Traditional sourdough bread recipe with starter instructions', 'recipe', 2, 1),
('weekly_baking_schedule.pdf', 'Staff baking schedule for the current week', 'schedule', 2, 0),
('customer_invoice_001.pdf', 'Invoice for Cafe Delights bulk order', 'invoice', 3, 0),
('pastry_order_form.pdf', 'Standard order form template for pastry requests', 'invoice', 3, 1);


-- Migration script for existing databases (run if tables already exist):
-- ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE AFTER username;
-- ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER otp_expires_at;
-- UPDATE users SET email = CONCAT(username, '@bakesync.demo'), is_verified = 1 WHERE email IS NULL;

-- Cleanup (only if you previously added separate deletion OTP columns by mistake):
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS delete_otp_code,
--   DROP COLUMN IF EXISTS delete_otp_expires_at;
```

> **Note:** The block above must match `database/schema.sql` in the repo. If you edit the `.sql` file, update this document (or regenerate it) so they stay in sync.

---

## 2. Optional migration — OTP columns + `access_logs` (older DBs)

**File:** `database/migrations/otp_security_and_access_logs_setup.sql`

Use when upgrading an existing database that predates `otp_attempts`, `otp_locked_until`, or `access_logs`.

```sql
-- Add OTP brute-force protection columns + access audit table.
-- Target DB: defaultdb (as used by database/schema.sql)

USE defaultdb;

-- Add users.otp_attempts if missing
SET @has_otp_attempts := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'defaultdb'
    AND table_name = 'users'
    AND column_name = 'otp_attempts'
);

SET @sql := IF(
  @has_otp_attempts = 0,
  'ALTER TABLE users ADD COLUMN otp_attempts INT NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add users.otp_locked_until if missing
SET @has_otp_locked_until := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'defaultdb'
    AND table_name = 'users'
    AND column_name = 'otp_locked_until'
);

SET @sql := IF(
  @has_otp_locked_until = 0,
  'ALTER TABLE users ADD COLUMN otp_locked_until DATETIME DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure access_logs exists (CREATE TABLE IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    file_id INT NULL,
    action ENUM('view', 'visibility', 'delete') NOT NULL,
    result ENUM('allowed', 'denied') NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
    INDEX (created_at),
    INDEX (file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Optional migration — drop mistaken deletion OTP columns

**File:** `database/migrations/cleanup_drop_delete_otp_columns.sql`

```sql
-- Cleanup migration
-- Use ONLY if your `users` table previously added `delete_otp_*` columns.

USE defaultdb;

ALTER TABLE users
  DROP COLUMN IF EXISTS delete_otp_code,
  DROP COLUMN IF EXISTS delete_otp_expires_at;
```

---

## 4. Optional migration — rollback Cloudinary / file-storage columns

**File:** `database/migrations/rollback_files_storage_columns.sql`  
Run only if you previously added optional `files` columns (`file_url`, `file_size_kb`, etc.) and want them removed.

```sql
-- BakeSync IAS102: remove file storage / Cloudinary columns added by 001_files_storage.sql
-- Run on databases where those ALTERs were already applied.
-- If a column was never added, skip that line or comment it out (MySQL will error on missing column).

USE defaultdb;

ALTER TABLE files DROP COLUMN cloudinary_public_id;
ALTER TABLE files DROP COLUMN mime_type;
ALTER TABLE files DROP COLUMN original_name;
ALTER TABLE files DROP COLUMN file_size_kb;
ALTER TABLE files DROP COLUMN file_url;
```

---

## 5. Table summary

| Table         | Purpose |
|---------------|---------|
| **users**     | Accounts, bcrypt hash, role, OTP + lockout fields, `is_verified` |
| **files**     | Document metadata, DAC (`owner_id`, `is_public`), `file_type` |
| **access_logs** | DAC audit: action, result, reason, optional `user_id` / `file_id` |

---

## 6. Forward migration (optional file-storage columns) — reference only

If you **add** binary/metadata columns for a future upload feature, the pattern is:

```sql
USE defaultdb;

ALTER TABLE files ADD COLUMN file_url VARCHAR(500) DEFAULT NULL AFTER description;
ALTER TABLE files ADD COLUMN file_size_kb INT UNSIGNED DEFAULT NULL AFTER file_url;
ALTER TABLE files ADD COLUMN original_name VARCHAR(255) DEFAULT NULL AFTER file_size_kb;
ALTER TABLE files ADD COLUMN mime_type VARCHAR(100) DEFAULT NULL AFTER original_name;
ALTER TABLE files ADD COLUMN cloudinary_public_id VARCHAR(255) DEFAULT NULL AFTER mime_type;
```

The IAS102 prototype **does not require** these columns; use **§4** to remove them if applied by mistake.
