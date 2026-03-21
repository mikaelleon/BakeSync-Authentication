# Inventory Management

Track raw materials and finished goods with real-time stock levels.

## Tables

```sql
-- Categories for organizing inventory items
CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    type ENUM('raw_material', 'finished_good', 'packaging') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Units of measurement
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    type ENUM('weight', 'volume', 'count', 'length') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Main inventory items table
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

-- Inventory transactions log
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

-- Supplier information
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
```

## Seed Data

```sql
-- Insert units
INSERT INTO units (name, abbreviation, type) VALUES
('Kilogram', 'kg', 'weight'),
('Gram', 'g', 'weight'),
('Liter', 'L', 'volume'),
('Milliliter', 'mL', 'volume'),
('Piece', 'pc', 'count'),
('Dozen', 'doz', 'count'),
('Box', 'box', 'count');

-- Insert categories
INSERT INTO inventory_categories (name, description, type) VALUES
('Flour & Grains', 'All types of flour, wheat, and grain products', 'raw_material'),
('Dairy', 'Milk, butter, cream, and cheese products', 'raw_material'),
('Sweeteners', 'Sugar, honey, syrups, and sweetening agents', 'raw_material'),
('Eggs', 'Fresh eggs and egg products', 'raw_material'),
('Fats & Oils', 'Cooking oils, shortening, and fats', 'raw_material'),
('Leavening Agents', 'Yeast, baking powder, baking soda', 'raw_material'),
('Flavorings', 'Vanilla, extracts, spices, and flavorings', 'raw_material'),
('Chocolates', 'Cocoa, chocolate chips, and chocolate products', 'raw_material'),
('Fruits & Nuts', 'Fresh and dried fruits, nuts', 'raw_material'),
('Breads', 'Finished bread products', 'finished_good'),
('Pastries', 'Finished pastry products', 'finished_good'),
('Cakes', 'Finished cake products', 'finished_good'),
('Packaging', 'Boxes, bags, and packaging materials', 'packaging');

-- Insert sample inventory items
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

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, payment_terms) VALUES
('Manila Flour Mills', 'Juan Dela Cruz', 'sales@manilaflour.com', '02-8123-4567', '123 Flour St, Manila', 'Net 30'),
('Nestle Philippines', 'Maria Santos', 'orders@nestle.ph', '02-8234-5678', '456 Dairy Ave, Makati', 'Net 15'),
('Universal Robina', 'Pedro Reyes', 'b2b@urc.com.ph', '02-8345-6789', '789 Sugar Lane, Pasig', 'Net 30'),
('Local Farm Supplier', 'Ana Gonzales', 'eggs@localfarm.ph', '0917-123-4567', 'Bulacan', 'COD');
```

## Common Queries

```sql
-- Get all inventory items with low stock
SELECT
    i.id,
    i.name,
    i.sku,
    c.name AS category,
    i.quantity,
    i.minimum_stock,
    u.abbreviation AS unit,
    CASE
        WHEN i.quantity <= 0 THEN 'Out of Stock'
        WHEN i.quantity <= i.minimum_stock THEN 'Low Stock'
        ELSE 'In Stock'
    END AS stock_status
FROM inventory_items i
JOIN inventory_categories c ON i.category_id = c.id
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1 AND i.quantity <= i.minimum_stock
ORDER BY i.quantity ASC;

-- Get inventory value by category
SELECT
    c.name AS category,
    c.type,
    COUNT(i.id) AS item_count,
    SUM(i.quantity * i.cost_per_unit) AS total_value
FROM inventory_categories c
LEFT JOIN inventory_items i ON c.id = i.category_id AND i.is_active = 1
GROUP BY c.id, c.name, c.type
ORDER BY total_value DESC;

-- Get recent inventory transactions
SELECT
    t.id,
    i.name AS item_name,
    t.transaction_type,
    t.quantity,
    t.quantity_before,
    t.quantity_after,
    u.username AS performed_by,
    t.notes,
    t.created_at
FROM inventory_transactions t
JOIN inventory_items i ON t.item_id = i.id
JOIN users u ON t.performed_by = u.id
ORDER BY t.created_at DESC
LIMIT 50;

-- Update inventory quantity (with transaction log)
-- Use this in a transaction for atomic updates
START TRANSACTION;

SET @item_id = 1;
SET @qty_change = -5.000;
SET @user_id = 1;
SET @transaction_type = 'production_use';

SELECT quantity INTO @current_qty FROM inventory_items WHERE id = @item_id FOR UPDATE;

UPDATE inventory_items
SET quantity = quantity + @qty_change
WHERE id = @item_id;

INSERT INTO inventory_transactions (item_id, transaction_type, quantity, quantity_before, quantity_after, performed_by, notes)
VALUES (@item_id, @transaction_type, ABS(@qty_change), @current_qty, @current_qty + @qty_change, @user_id, 'Used for production batch');

COMMIT;

-- Get items expiring soon (within 7 days)
SELECT
    i.id,
    i.name,
    i.sku,
    i.quantity,
    u.abbreviation AS unit,
    i.expiry_date,
    DATEDIFF(i.expiry_date, CURDATE()) AS days_until_expiry
FROM inventory_items i
JOIN units u ON i.unit_id = u.id
WHERE i.expiry_date IS NOT NULL
    AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    AND i.is_active = 1
ORDER BY i.expiry_date ASC;
```
