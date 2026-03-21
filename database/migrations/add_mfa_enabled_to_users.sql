-- Add MFA setting to users.
-- Default is enabled (mfa_enabled=1), but demo accounts start exempt (mfa_enabled=0).

USE defaultdb;

ALTER TABLE users
  ADD COLUMN mfa_enabled TINYINT(1) DEFAULT 1;

UPDATE users
SET mfa_enabled = 0
WHERE username IN ('manager_maria', 'baker_juan', 'cashier_ana');

