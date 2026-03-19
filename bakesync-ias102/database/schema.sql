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
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
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
