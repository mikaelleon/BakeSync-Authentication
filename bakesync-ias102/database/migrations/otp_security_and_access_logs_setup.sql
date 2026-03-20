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

