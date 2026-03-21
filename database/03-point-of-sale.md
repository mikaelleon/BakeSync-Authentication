# Point of Sale (POS)

Process customer transactions with responsive cart interface.

## Tables

```sql
-- Products available for sale
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

-- Customer information
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

-- Discount types
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

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('cash', 'card', 'ewallet', 'other') NOT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders/Transactions
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

-- Order payments (supports split payments)
CREATE TABLE IF NOT EXISTS order_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily cash register sessions
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
```

## Seed Data

```sql
-- Insert payment methods
INSERT INTO payment_methods (name, type) VALUES
('Cash', 'cash'),
('Credit Card', 'card'),
('Debit Card', 'card'),
('GCash', 'ewallet'),
('Maya', 'ewallet'),
('Bank Transfer', 'other');

-- Insert sample products
INSERT INTO products (name, description, category_id, recipe_id, sku, price, cost, is_taxable) VALUES
('Pandesal (6 pcs)', 'Fresh baked Filipino bread rolls', 1, 1, 'BRD-PDS-6', 30.00, 12.00, 1),
('Pandesal (12 pcs)', 'Fresh baked Filipino bread rolls - dozen', 1, 1, 'BRD-PDS-12', 55.00, 24.00, 1),
('Chocolate Chip Cookie', 'Classic chewy cookie with chocolate chips', 4, 2, 'CKE-CHC-1', 25.00, 8.00, 1),
('Chocolate Chip Cookies (Box of 6)', 'Box of 6 chocolate chip cookies', 4, 2, 'CKE-CHC-6', 140.00, 45.00, 1),
('Chocolate Layer Cake (Whole)', 'Rich 3-layer chocolate cake - serves 12', 3, 3, 'CAK-CHO-W', 850.00, 350.00, 1),
('Chocolate Layer Cake (Slice)', 'Single slice of chocolate layer cake', 3, 3, 'CAK-CHO-S', 85.00, 30.00, 1),
('Butter Croissant', 'Flaky French butter croissant', 2, 4, 'PST-CRO-1', 65.00, 25.00, 1),
('Ensaymada', 'Sweet Filipino brioche with cheese', 2, 5, 'PST-ENS-1', 45.00, 18.00, 1),
('Ensaymada (Box of 6)', 'Box of 6 ensaymada', 2, 5, 'PST-ENS-6', 250.00, 100.00, 1),
('Ube Pandesal (6 pcs)', 'Purple yam flavored bread rolls', 1, NULL, 'BRD-UBE-6', 45.00, 18.00, 1);

-- Insert sample discounts
INSERT INTO discounts (name, code, discount_type, value, min_purchase, start_date, end_date) VALUES
('Senior Citizen', 'SENIOR', 'percentage', 20.00, 0, '2024-01-01', '2025-12-31'),
('PWD Discount', 'PWD', 'percentage', 20.00, 0, '2024-01-01', '2025-12-31'),
('First Order', 'WELCOME10', 'percentage', 10.00, 100.00, '2024-01-01', '2025-12-31'),
('Bulk Order', 'BULK50', 'fixed', 50.00, 500.00, '2024-01-01', '2025-12-31'),
('Holiday Special', 'HOLIDAY15', 'percentage', 15.00, 200.00, '2024-12-01', '2024-12-31');

-- Insert sample customers
INSERT INTO customers (name, email, phone, loyalty_points, total_purchases, visit_count) VALUES
('Walk-in Customer', NULL, NULL, 0, 0, 0),
('Maria Clara', 'maria.clara@email.com', '0917-111-2222', 150, 2500.00, 12),
('Jose Rizal', 'jose.rizal@email.com', '0918-333-4444', 280, 4200.00, 18),
('Andres Bonifacio', 'andres.b@email.com', '0919-555-6666', 95, 1580.00, 8);
```

## Common Queries

```sql
-- Generate unique order number
SELECT CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(COALESCE(MAX(CAST(SUBSTRING(order_number, -4) AS UNSIGNED)), 0) + 1, 4, '0')) AS next_order_number
FROM orders
WHERE DATE(created_at) = CURDATE();

-- Create new order
INSERT INTO orders (order_number, customer_id, cashier_id, order_type, status)
VALUES ('ORD-20240115-0001', 2, 3, 'takeout', 'pending');

-- Add items to order
INSERT INTO order_items (order_id, product_id, quantity, unit_price, tax_amount)
SELECT
    @order_id := LAST_INSERT_ID(),
    p.id,
    2,
    p.price,
    ROUND(p.price * 2 * (p.tax_rate / 100), 2)
FROM products p WHERE p.id = 1;

-- Calculate order totals
UPDATE orders o
SET
    subtotal = (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id),
    tax_amount = (SELECT COALESCE(SUM(oi.tax_amount), 0) FROM order_items oi WHERE oi.order_id = o.id),
    total_amount = subtotal + tax_amount - discount_amount
WHERE o.id = @order_id;

-- Get active products for POS display
SELECT
    p.id,
    p.name,
    p.description,
    rc.name AS category,
    p.sku,
    p.price,
    p.is_taxable,
    p.tax_rate,
    p.image_url,
    CASE
        WHEN p.track_inventory = 0 THEN 'available'
        WHEN inv.quantity > 0 THEN 'available'
        ELSE 'out_of_stock'
    END AS availability
FROM products p
JOIN recipe_categories rc ON p.category_id = rc.id
LEFT JOIN inventory_items inv ON p.inventory_item_id = inv.id
WHERE p.is_available = 1
ORDER BY rc.name, p.name;

-- Get order with items
SELECT
    o.id,
    o.order_number,
    o.order_type,
    o.status,
    c.name AS customer_name,
    u.username AS cashier,
    o.subtotal,
    o.tax_amount,
    d.name AS discount_name,
    o.discount_amount,
    o.total_amount,
    o.payment_status,
    pm.name AS payment_method,
    o.created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
JOIN users u ON o.cashier_id = u.id
LEFT JOIN discounts d ON o.discount_id = d.id
LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
WHERE o.id = 1;

-- Get order items
SELECT
    oi.id,
    p.name AS product_name,
    p.sku,
    oi.quantity,
    oi.unit_price,
    oi.discount_amount,
    oi.tax_amount,
    oi.subtotal,
    oi.notes
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 1;

-- Process payment
START TRANSACTION;

UPDATE orders
SET
    payment_method_id = 1,
    amount_tendered = 1000.00,
    change_amount = 1000.00 - total_amount,
    payment_status = 'paid',
    status = 'completed',
    completed_at = NOW()
WHERE id = @order_id;

-- Record payment
INSERT INTO order_payments (order_id, payment_method_id, amount)
VALUES (@order_id, 1, (SELECT total_amount FROM orders WHERE id = @order_id));

-- Update customer stats
UPDATE customers c
JOIN orders o ON o.customer_id = c.id
SET
    c.total_purchases = c.total_purchases + o.total_amount,
    c.visit_count = c.visit_count + 1,
    c.loyalty_points = c.loyalty_points + FLOOR(o.total_amount / 10)
WHERE o.id = @order_id AND c.id IS NOT NULL;

COMMIT;

-- Apply discount to order
UPDATE orders
SET
    discount_id = 1,
    discount_amount = CASE
        WHEN (SELECT discount_type FROM discounts WHERE id = 1) = 'percentage'
        THEN ROUND(subtotal * (SELECT value FROM discounts WHERE id = 1) / 100, 2)
        ELSE (SELECT value FROM discounts WHERE id = 1)
    END,
    total_amount = subtotal + tax_amount - discount_amount
WHERE id = @order_id
    AND subtotal >= (SELECT min_purchase FROM discounts WHERE id = 1);

-- Get today's sales summary
SELECT
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total_amount) AS total_sales,
    SUM(o.tax_amount) AS total_tax,
    SUM(o.discount_amount) AS total_discounts,
    AVG(o.total_amount) AS average_order_value,
    SUM(CASE WHEN o.order_type = 'dine_in' THEN o.total_amount ELSE 0 END) AS dine_in_sales,
    SUM(CASE WHEN o.order_type = 'takeout' THEN o.total_amount ELSE 0 END) AS takeout_sales,
    SUM(CASE WHEN o.order_type = 'delivery' THEN o.total_amount ELSE 0 END) AS delivery_sales
FROM orders o
WHERE DATE(o.created_at) = CURDATE()
    AND o.status = 'completed'
    AND o.payment_status = 'paid';

-- Get top selling products today
SELECT
    p.id,
    p.name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.subtotal) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE DATE(o.created_at) = CURDATE()
    AND o.status = 'completed'
GROUP BY p.id, p.name
ORDER BY units_sold DESC
LIMIT 10;

-- Open cash register session
INSERT INTO cash_register_sessions (cashier_id, opening_balance)
VALUES (3, 5000.00);

-- Close cash register session
UPDATE cash_register_sessions crs
SET
    closing_balance = 8500.00,
    expected_balance = opening_balance + (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM orders o
        WHERE o.cashier_id = crs.cashier_id
            AND o.created_at >= crs.opened_at
            AND o.status = 'completed'
            AND o.payment_method_id = 1
    ),
    total_sales = (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM orders o
        WHERE o.cashier_id = crs.cashier_id
            AND o.created_at >= crs.opened_at
            AND o.status = 'completed'
    ),
    transaction_count = (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.cashier_id = crs.cashier_id
            AND o.created_at >= crs.opened_at
            AND o.status = 'completed'
    ),
    variance = closing_balance - expected_balance,
    status = 'closed',
    closed_at = NOW()
WHERE id = 1;

-- Search orders by various criteria
SELECT
    o.order_number,
    c.name AS customer,
    o.total_amount,
    o.status,
    o.created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE (o.order_number LIKE '%0001%' OR c.name LIKE '%Maria%')
    AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY o.created_at DESC;
```
