-- BakeSync IAS102 Database Schema
-- MySQL 8.0+ compatible

CREATE DATABASE IF NOT EXISTS bakesync_ias102;
USE bakesync_ias102;

-- Users table with authentication fields
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') NOT NULL,
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
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

INSERT INTO users (username, password_hash, role) VALUES
('manager_maria', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('baker_juan', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff'),
('cashier_ana', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- NOTE: All demo users above use the same hash for simplicity.
-- This hash corresponds to the password "password" for testing.
-- After setup, run the hash script and update with unique hashes for:
--   admin123, staff123, user123

-- Seed Files for DAC demonstration
INSERT INTO files (filename, description, file_type, owner_id, is_public) VALUES
('chocolate_cake_recipe.pdf', 'Secret family recipe for our signature chocolate cake', 'recipe', 1, 0),
('monthly_sales_report_jan.xlsx', 'January 2024 sales performance report', 'report', 1, 1),
('sourdough_bread_recipe.pdf', 'Traditional sourdough bread recipe with starter instructions', 'recipe', 2, 1),
('weekly_baking_schedule.pdf', 'Staff baking schedule for the current week', 'schedule', 2, 0),
('customer_invoice_001.pdf', 'Invoice for Cafe Delights bulk order', 'invoice', 3, 0),
('pastry_order_form.pdf', 'Standard order form template for pastry requests', 'invoice', 3, 1);
