-- Cleanup migration
-- Use ONLY if your `users` table previously added `delete_otp_*` columns.

USE defaultdb;

ALTER TABLE users
  DROP COLUMN IF EXISTS delete_otp_code,
  DROP COLUMN IF EXISTS delete_otp_expires_at;

