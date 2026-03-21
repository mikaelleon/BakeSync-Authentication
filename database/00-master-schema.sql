-- BakeSync Complete Database Schema
-- MySQL 8.0+ compatible
-- Generated for BakeSync IAS102 Project

-- =====================================================
-- DATABASE CREATION
-- =====================================================
CREATE DATABASE IF NOT EXISTS defaultdb;
USE defaultdb;

-- =====================================================
-- CORE TABLES (Authentication & Users)
-- =====================================================

-- Users table with authentication fields
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') NOT NULL,
    otp_code VARCHAR(128) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    mfa_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles definition
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    level INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Units of measurement
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    type ENUM('weight', 'volume', 'count', 'length') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory categories
CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    type ENUM('raw_material', 'finished_good', 'packaging') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    maximum_stock DECIMAL(10,3) DEFAULT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(100),
    location VARCHAR(50),
    expiry_date DATE DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    transaction_type ENUM('purchase', 'production_use', 'sale', 'adjustment', 'waste', 'return') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    quantity_before DECIMAL(10,3) NOT NULL,
    quantity_after DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    notes TEXT,
    performed_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_terms VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'received', 'cancelled') DEFAULT 'draft',
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity_ordered DECIMAL(10,3) NOT NULL,
    quantity_received DECIMAL(10,3) DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RECIPE MANAGEMENT TABLES
-- =====================================================

-- Recipe categories
CREATE TABLE IF NOT EXISTS recipe_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    yield_quantity DECIMAL(10,2) NOT NULL,
    yield_unit_id INT NOT NULL,
    prep_time_minutes INT DEFAULT 0,
    bake_time_minutes INT DEFAULT 0,
    total_time_minutes INT GENERATED ALWAYS AS (prep_time_minutes + bake_time_minutes) STORED,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    instructions TEXT,
    notes TEXT,
    image_url VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES recipe_categories(id),
    FOREIGN KEY (yield_unit_id) REFERENCES units(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_id INT NOT NULL,
    notes VARCHAR(100),
    is_optional TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    UNIQUE KEY unique_recipe_item (recipe_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe cost history
CREATE TABLE IF NOT EXISTS recipe_cost_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    total_ingredient_cost DECIMAL(10,2) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- POINT OF SALE TABLES
-- =====================================================

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('cash', 'card', 'ewallet', 'other') NOT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    recipe_id INT DEFAULT NULL,
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    is_taxable TINYINT(1) DEFAULT 1,
    track_inventory TINYINT(1) DEFAULT 1,
    inventory_item_id INT DEFAULT NULL,
    image_url VARCHAR(255),
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES recipe_categories(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    loyalty_points INT DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    visit_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2) DEFAULT NULL,
    start_date DATE,
    end_date DATE,
    usage_limit INT DEFAULT NULL,
    times_used INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT DEFAULT NULL,
    cashier_id INT NOT NULL,
    order_type ENUM('dine_in', 'takeout', 'delivery', 'online') DEFAULT 'takeout',
    status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_id INT DEFAULT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_tendered DECIMAL(12,2) DEFAULT NULL,
    change_amount DECIMAL(12,2) DEFAULT NULL,
    payment_method_id INT DEFAULT NULL,
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (discount_id) REFERENCES discounts(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED,
    notes VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cash register sessions
CREATE TABLE IF NOT EXISTS cash_register_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    opening_balance DECIMAL(12,2) NOT NULL,
    closing_balance DECIMAL(12,2) DEFAULT NULL,
    expected_balance DECIMAL(12,2) DEFAULT NULL,
    variance DECIMAL(12,2) DEFAULT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    status ENUM('open', 'closed') DEFAULT 'open',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PRODUCTION PLANNING TABLES
-- =====================================================

-- Production schedules
CREATE TABLE IF NOT EXISTS production_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_date DATE NOT NULL,
    shift ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning',
    status ENUM('draft', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_schedule (schedule_date, shift)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Production batches
CREATE TABLE IF NOT EXISTS production_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_number VARCHAR(20) NOT NULL UNIQUE,
    schedule_id INT DEFAULT NULL,
    recipe_id INT NOT NULL,
    planned_quantity DECIMAL(10,2) NOT NULL,
    actual_quantity DECIMAL(10,2) DEFAULT NULL,
    multiplier DECIMAL(5,2) DEFAULT 1.00,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'scheduled',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to INT DEFAULT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    quality_check ENUM('pending', 'passed', 'failed') DEFAULT 'pending',
    quality_notes TEXT,
    waste_quantity DECIMAL(10,2) DEFAULT 0,
    waste_reason VARCHAR(255),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES production_schedules(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Batch ingredients
CREATE TABLE IF NOT EXISTS batch_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    item_id INT NOT NULL,
    planned_quantity DECIMAL(10,3) NOT NULL,
    actual_quantity DECIMAL(10,3) DEFAULT NULL,
    unit_id INT NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('oven', 'mixer', 'proofer', 'other') NOT NULL,
    capacity VARCHAR(50),
    is_available TINYINT(1) DEFAULT 1,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FINANCIAL ANALYTICS TABLES
-- =====================================================

-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    budget_monthly DECIMAL(12,2) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method_id INT DEFAULT NULL,
    vendor VARCHAR(100),
    receipt_number VARCHAR(50),
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily revenue
CREATE TABLE IF NOT EXISTS daily_revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    revenue_date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    gross_sales DECIMAL(12,2) DEFAULT 0,
    discounts_given DECIMAL(12,2) DEFAULT 0,
    tax_collected DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    ewallet_sales DECIMAL(12,2) DEFAULT 0,
    refunds DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECURITY & AUDIT TABLES
-- =====================================================

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) DEFAULT NULL,
    resource_id INT DEFAULT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success TINYINT(1) DEFAULT 0,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_ip (email, ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REAL-TIME INVENTORY TRACKING TABLES
-- =====================================================

-- Stock alerts
CREATE TABLE IF NOT EXISTS stock_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    alert_type ENUM('low_stock', 'out_of_stock', 'expiring', 'overstock') NOT NULL,
    threshold DECIMAL(10,3) DEFAULT NULL,
    days_before_expiry INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    notify_email TINYINT(1) DEFAULT 1,
    notify_dashboard TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_item_alert (item_id, alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert notifications
CREATE TABLE IF NOT EXISTS alert_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    item_id INT NOT NULL,
    alert_type ENUM('low_stock', 'out_of_stock', 'expiring', 'overstock') NOT NULL,
    message TEXT NOT NULL,
    current_value DECIMAL(10,3),
    threshold_value DECIMAL(10,3),
    status ENUM('pending', 'sent', 'read', 'resolved') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    resolved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES stock_alerts(id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER PREFERENCES TABLES
-- =====================================================

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'system',
    sidebar_collapsed TINYINT(1) DEFAULT 0,
    compact_mode TINYINT(1) DEFAULT 0,
    items_per_page INT DEFAULT 20,
    default_view ENUM('grid', 'list', 'table') DEFAULT 'table',
    dashboard_layout JSON,
    notification_sound TINYINT(1) DEFAULT 1,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    currency_symbol VARCHAR(5) DEFAULT '₱',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(100),
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 1,
    height INT DEFAULT 1,
    settings JSON,
    is_visible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed Users
INSERT INTO users (username, email, password_hash, role, is_verified, mfa_enabled) VALUES
('manager_maria', 'manager@bakesync.demo', '$2a$10$7070hG8mxo8QvHqzg8WVNeDeCu5WkipBE4h57QjCXQK//9ES1Fv3i', 'admin', 1, 0),
('baker_juan', 'baker@bakesync.demo', '$2a$10$dY289C4kETAYOKpxtLwCg.M0cCbVF0ADbZXyypcHy9KjzvLJZ3h8q', 'staff', 1, 0),
('cashier_ana', 'cashier@bakesync.demo', '$2a$10$Pk5kIA6boJNqzO8kA2MuPeotNaIwtlLMcfnBS8hH5jWvpCP7WSM3u', 'user', 1, 0);

-- Seed Roles
INSERT INTO roles (name, display_name, description, level) VALUES
('admin', 'Manager', 'Full system access', 100),
('staff', 'Baker', 'Production staff access', 50),
('user', 'Cashier', 'Sales staff access', 25);

-- Seed Units
INSERT INTO units (name, abbreviation, type) VALUES
('Kilogram', 'kg', 'weight'),
('Gram', 'g', 'weight'),
('Liter', 'L', 'volume'),
('Milliliter', 'mL', 'volume'),
('Piece', 'pc', 'count'),
('Dozen', 'doz', 'count'),
('Box', 'box', 'count');

-- Seed Inventory Categories
INSERT INTO inventory_categories (name, description, type) VALUES
('Flour & Grains', 'All types of flour and grain products', 'raw_material'),
('Dairy', 'Milk, butter, cream products', 'raw_material'),
('Sweeteners', 'Sugar, honey, syrups', 'raw_material'),
('Eggs', 'Fresh eggs and egg products', 'raw_material'),
('Fats & Oils', 'Cooking oils and fats', 'raw_material'),
('Leavening Agents', 'Yeast, baking powder', 'raw_material'),
('Flavorings', 'Vanilla, extracts, spices', 'raw_material'),
('Chocolates', 'Cocoa and chocolate products', 'raw_material'),
('Fruits & Nuts', 'Fresh and dried fruits, nuts', 'raw_material'),
('Breads', 'Finished bread products', 'finished_good'),
('Pastries', 'Finished pastry products', 'finished_good'),
('Cakes', 'Finished cake products', 'finished_good'),
('Packaging', 'Boxes, bags, packaging', 'packaging');

-- Seed Recipe Categories
INSERT INTO recipe_categories (name, description) VALUES
('Breads', 'Artisan breads, loaves, and rolls'),
('Pastries', 'Croissants, danishes, and puff pastries'),
('Cakes', 'Layer cakes, pound cakes, and specialty cakes'),
('Cookies', 'Drop cookies, bar cookies, and biscotti'),
('Pies & Tarts', 'Sweet and savory pies and tarts'),
('Specialty Items', 'Seasonal and custom items');

-- Seed Payment Methods
INSERT INTO payment_methods (name, type) VALUES
('Cash', 'cash'),
('Credit Card', 'card'),
('Debit Card', 'card'),
('GCash', 'ewallet'),
('Maya', 'ewallet'),
('Bank Transfer', 'other');

-- Seed Expense Categories
INSERT INTO expense_categories (name, description, budget_monthly) VALUES
('Ingredients', 'Raw materials and baking ingredients', 50000.00),
('Utilities', 'Electricity, water, gas', 15000.00),
('Rent', 'Store/bakery rental', 25000.00),
('Salaries', 'Employee wages and benefits', 80000.00),
('Equipment', 'Kitchen equipment and maintenance', 10000.00),
('Marketing', 'Advertising and promotions', 5000.00),
('Packaging', 'Boxes, bags, and packaging materials', 8000.00),
('Transportation', 'Delivery and logistics', 7000.00),
('Miscellaneous', 'Other operational expenses', 5000.00);

-- Seed Inventory Items
INSERT INTO inventory_items (name, sku, category_id, unit_id, quantity, minimum_stock, cost_per_unit, supplier, location) VALUES
('All-Purpose Flour', 'FLR-001', 1, 1, 50.000, 20.000, 45.00, 'Manila Flour Mills', 'Storage A'),
('Bread Flour', 'FLR-002', 1, 1, 30.000, 15.000, 52.00, 'Manila Flour Mills', 'Storage A'),
('Cake Flour', 'FLR-003', 1, 1, 25.000, 10.000, 58.00, 'Manila Flour Mills', 'Storage A'),
('Fresh Milk', 'DRY-001', 2, 3, 20.000, 10.000, 85.00, 'Nestle Philippines', 'Refrigerator 1'),
('Butter (Unsalted)', 'DRY-002', 2, 1, 15.000, 5.000, 450.00, 'Magnolia', 'Refrigerator 1'),
('Heavy Cream', 'DRY-003', 2, 3, 10.000, 5.000, 180.00, 'Nestle Philippines', 'Refrigerator 1'),
('White Sugar', 'SWT-001', 3, 1, 40.000, 15.000, 55.00, 'Universal Robina', 'Storage B'),
('Brown Sugar', 'SWT-002', 3, 1, 20.000, 10.000, 60.00, 'Universal Robina', 'Storage B'),
('Fresh Eggs (Large)', 'EGG-001', 4, 6, 50.000, 20.000, 95.00, 'Local Farm', 'Refrigerator 2'),
('Vegetable Oil', 'FAT-001', 5, 3, 15.000, 5.000, 120.00, 'San Miguel', 'Storage B'),
('Instant Yeast', 'LEV-001', 6, 1, 5.000, 2.000, 350.00, 'Lesaffre', 'Storage C'),
('Baking Powder', 'LEV-002', 6, 1, 3.000, 1.000, 180.00, 'Royal', 'Storage C'),
('Vanilla Extract', 'FLV-001', 7, 4, 2000.000, 500.000, 0.50, 'McCormick', 'Storage C'),
('Cocoa Powder', 'CHO-001', 8, 1, 10.000, 3.000, 280.00, 'Hersheys', 'Storage C'),
('Chocolate Chips', 'CHO-002', 8, 1, 8.000, 3.000, 420.00, 'Hersheys', 'Storage C');

-- Seed Files for DAC demonstration
INSERT INTO files (filename, description, file_type, owner_id, is_public) VALUES
('chocolate_cake_recipe.pdf', 'Secret family recipe for our signature chocolate cake', 'recipe', 1, 0),
('monthly_sales_report_jan.xlsx', 'January 2024 sales performance report', 'report', 1, 1),
('sourdough_bread_recipe.pdf', 'Traditional sourdough bread recipe with starter instructions', 'recipe', 2, 1),
('weekly_baking_schedule.pdf', 'Staff baking schedule for the current week', 'schedule', 2, 0),
('customer_invoice_001.pdf', 'Invoice for Cafe Delights bulk order', 'invoice', 3, 0),
('pastry_order_form.pdf', 'Standard order form template for pastry requests', 'invoice', 3, 1);

-- Seed Customers
INSERT INTO customers (name, email, phone, loyalty_points, total_purchases, visit_count) VALUES
('Walk-in Customer', NULL, NULL, 0, 0, 0),
('Maria Clara', 'maria.clara@email.com', '0917-111-2222', 150, 2500.00, 12),
('Jose Rizal', 'jose.rizal@email.com', '0918-333-4444', 280, 4200.00, 18);

-- Seed Discounts
INSERT INTO discounts (name, code, discount_type, value, min_purchase, start_date, end_date) VALUES
('Senior Citizen', 'SENIOR', 'percentage', 20.00, 0, '2024-01-01', '2025-12-31'),
('PWD Discount', 'PWD', 'percentage', 20.00, 0, '2024-01-01', '2025-12-31'),
('First Order', 'WELCOME10', 'percentage', 10.00, 100.00, '2024-01-01', '2025-12-31');

-- Seed Equipment
INSERT INTO equipment (name, type, capacity, is_available) VALUES
('Main Oven 1', 'oven', '10 trays', 1),
('Main Oven 2', 'oven', '10 trays', 1),
('Deck Oven', 'oven', '4 trays', 1),
('Spiral Mixer', 'mixer', '50kg dough', 1),
('Planetary Mixer', 'mixer', '20L', 1),
('Proofing Cabinet', 'proofer', '20 trays', 1);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
