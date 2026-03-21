-- Widen users.otp_code so password-reset hex tokens (64 chars) are not truncated.
-- Safe if column is already VARCHAR(128) or wider.
-- See docs/DATABASE.md §2.1

USE defaultdb;

ALTER TABLE users MODIFY COLUMN otp_code VARCHAR(128) DEFAULT NULL;
