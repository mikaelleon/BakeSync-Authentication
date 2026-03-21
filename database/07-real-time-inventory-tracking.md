# Real-Time Inventory Tracking

Live stock updates and low-stock alerts.

## Tables

```sql
-- Stock alerts configuration
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

-- Alert notifications log
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

-- Real-time stock snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS stock_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    snapshot_time TIME NOT NULL,
    item_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    INDEX idx_date_item (snapshot_date, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory change subscriptions (for real-time updates)
CREATE TABLE IF NOT EXISTS inventory_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT DEFAULT NULL,
    category_id INT DEFAULT NULL,
    subscription_type ENUM('item', 'category', 'all') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pending inventory updates queue (for batch processing)
CREATE TABLE IF NOT EXISTS inventory_update_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    update_type ENUM('stock_change', 'price_change', 'status_change') NOT NULL,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    processed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    INDEX idx_unprocessed (processed, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Seed Data

```sql
-- Create default stock alerts for all inventory items
INSERT INTO stock_alerts (item_id, alert_type, threshold, is_active)
SELECT id, 'low_stock', minimum_stock, 1
FROM inventory_items
WHERE is_active = 1;

INSERT INTO stock_alerts (item_id, alert_type, threshold, is_active)
SELECT id, 'out_of_stock', 0, 1
FROM inventory_items
WHERE is_active = 1;

-- Create expiry alerts for perishable items
INSERT INTO stock_alerts (item_id, alert_type, days_before_expiry, is_active)
SELECT id, 'expiring', 7, 1
FROM inventory_items
WHERE category_id IN (2, 4) AND is_active = 1;
```

## Common Queries

```sql
-- Get current stock status for all items (real-time view)
SELECT
    i.id,
    i.name,
    i.sku,
    c.name AS category,
    i.quantity,
    i.minimum_stock,
    i.maximum_stock,
    u.abbreviation AS unit,
    i.cost_per_unit,
    ROUND(i.quantity * i.cost_per_unit, 2) AS stock_value,
    i.expiry_date,
    CASE
        WHEN i.quantity <= 0 THEN 'out_of_stock'
        WHEN i.quantity <= i.minimum_stock THEN 'low_stock'
        WHEN i.maximum_stock IS NOT NULL AND i.quantity >= i.maximum_stock THEN 'overstock'
        ELSE 'normal'
    END AS stock_status,
    CASE
        WHEN i.expiry_date IS NOT NULL AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'expiring_soon'
        WHEN i.expiry_date IS NOT NULL AND i.expiry_date <= CURDATE() THEN 'expired'
        ELSE 'fresh'
    END AS expiry_status,
    i.updated_at AS last_updated
FROM inventory_items i
JOIN inventory_categories c ON i.category_id = c.id
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1
ORDER BY
    CASE WHEN i.quantity <= 0 THEN 0 WHEN i.quantity <= i.minimum_stock THEN 1 ELSE 2 END,
    i.name;

-- Get items requiring immediate attention
SELECT
    i.id,
    i.name,
    i.quantity,
    i.minimum_stock,
    u.abbreviation AS unit,
    'LOW STOCK' AS alert_type,
    CONCAT('Stock at ', ROUND(i.quantity / i.minimum_stock * 100, 0), '% of minimum') AS alert_message
FROM inventory_items i
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1 AND i.quantity > 0 AND i.quantity <= i.minimum_stock

UNION ALL

SELECT
    i.id,
    i.name,
    i.quantity,
    i.minimum_stock,
    u.abbreviation AS unit,
    'OUT OF STOCK' AS alert_type,
    'Item is out of stock - immediate reorder required' AS alert_message
FROM inventory_items i
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1 AND i.quantity <= 0

UNION ALL

SELECT
    i.id,
    i.name,
    i.quantity,
    i.minimum_stock,
    u.abbreviation AS unit,
    'EXPIRING SOON' AS alert_type,
    CONCAT('Expires in ', DATEDIFF(i.expiry_date, CURDATE()), ' days') AS alert_message
FROM inventory_items i
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1
    AND i.expiry_date IS NOT NULL
    AND i.expiry_date > CURDATE()
    AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)

ORDER BY alert_type, name;

-- Generate alert notifications
INSERT INTO alert_notifications (alert_id, item_id, alert_type, message, current_value, threshold_value)
SELECT
    sa.id,
    sa.item_id,
    sa.alert_type,
    CASE sa.alert_type
        WHEN 'low_stock' THEN CONCAT(i.name, ' is running low (', i.quantity, ' ', u.abbreviation, ' remaining)')
        WHEN 'out_of_stock' THEN CONCAT(i.name, ' is out of stock')
        WHEN 'expiring' THEN CONCAT(i.name, ' expires on ', i.expiry_date)
        WHEN 'overstock' THEN CONCAT(i.name, ' is overstocked (', i.quantity, ' ', u.abbreviation, ')')
    END,
    i.quantity,
    sa.threshold
FROM stock_alerts sa
JOIN inventory_items i ON sa.item_id = i.id
JOIN units u ON i.unit_id = u.id
WHERE sa.is_active = 1
    AND (
        (sa.alert_type = 'low_stock' AND i.quantity <= sa.threshold AND i.quantity > 0)
        OR (sa.alert_type = 'out_of_stock' AND i.quantity <= 0)
        OR (sa.alert_type = 'expiring' AND i.expiry_date IS NOT NULL AND DATEDIFF(i.expiry_date, CURDATE()) <= sa.days_before_expiry)
        OR (sa.alert_type = 'overstock' AND i.maximum_stock IS NOT NULL AND i.quantity >= i.maximum_stock)
    )
    AND NOT EXISTS (
        SELECT 1 FROM alert_notifications an
        WHERE an.alert_id = sa.id
            AND an.status IN ('pending', 'sent')
            AND an.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    );

-- Get unread/pending alerts for dashboard
SELECT
    an.id,
    i.name AS item_name,
    an.alert_type,
    an.message,
    an.current_value,
    an.threshold_value,
    an.status,
    an.created_at
FROM alert_notifications an
JOIN inventory_items i ON an.item_id = i.id
WHERE an.status IN ('pending', 'sent')
ORDER BY
    CASE an.alert_type
        WHEN 'out_of_stock' THEN 1
        WHEN 'expiring' THEN 2
        WHEN 'low_stock' THEN 3
        ELSE 4
    END,
    an.created_at DESC;

-- Mark alert as read
UPDATE alert_notifications
SET status = 'read', read_at = NOW()
WHERE id = @alert_id;

-- Resolve alert
UPDATE alert_notifications
SET status = 'resolved', resolved_at = NOW(), resolved_by = @user_id
WHERE id = @alert_id;

-- Record stock snapshot (run periodically)
INSERT INTO stock_snapshots (snapshot_date, snapshot_time, item_id, quantity, value)
SELECT
    CURDATE(),
    CURTIME(),
    id,
    quantity,
    quantity * cost_per_unit
FROM inventory_items
WHERE is_active = 1;

-- Get stock history for an item (last 30 days)
SELECT
    ss.snapshot_date,
    ss.quantity,
    ss.value,
    LAG(ss.quantity) OVER (ORDER BY ss.snapshot_date) AS prev_quantity,
    ss.quantity - LAG(ss.quantity) OVER (ORDER BY ss.snapshot_date) AS daily_change
FROM stock_snapshots ss
WHERE ss.item_id = @item_id
    AND ss.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY ss.snapshot_date;

-- Calculate stock movement velocity
SELECT
    i.id,
    i.name,
    i.quantity AS current_stock,
    COALESCE(item_usage.daily_avg, 0) AS avg_daily_usage,
    CASE
        WHEN COALESCE(item_usage.daily_avg, 0) > 0 THEN ROUND(i.quantity / item_usage.daily_avg, 1)
        ELSE NULL
    END AS days_of_stock_remaining
FROM inventory_items i
LEFT JOIN (
    SELECT
        item_id,
        ABS(SUM(CASE WHEN quantity < 0 THEN quantity ELSE 0 END)) / 30 AS daily_avg
    FROM inventory_transactions
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND transaction_type IN ('production_use', 'sale')
    GROUP BY item_id
) AS item_usage ON i.id = item_usage.item_id
WHERE i.is_active = 1
ORDER BY days_of_stock_remaining IS NULL, days_of_stock_remaining ASC;

-- Real-time stock update trigger simulation (call after stock changes)
-- Add to update queue for real-time broadcast
INSERT INTO inventory_update_queue (item_id, update_type, old_value, new_value)
VALUES (@item_id, 'stock_change', @old_quantity, @new_quantity);

-- Process update queue (for real-time notifications)
SELECT
    iuq.id,
    iuq.item_id,
    i.name AS item_name,
    iuq.update_type,
    iuq.old_value,
    iuq.new_value,
    iuq.created_at
FROM inventory_update_queue iuq
JOIN inventory_items i ON iuq.item_id = i.id
WHERE iuq.processed = 0
ORDER BY iuq.created_at ASC;

-- Mark updates as processed
UPDATE inventory_update_queue
SET processed = 1, processed_at = NOW()
WHERE id IN (@id1, @id2, @id3);

-- Get stock summary by category (dashboard widget)
SELECT
    c.id,
    c.name AS category,
    c.type,
    COUNT(i.id) AS total_items,
    SUM(CASE WHEN i.quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock,
    SUM(CASE WHEN i.quantity > 0 AND i.quantity <= i.minimum_stock THEN 1 ELSE 0 END) AS low_stock,
    SUM(CASE WHEN i.quantity > i.minimum_stock THEN 1 ELSE 0 END) AS normal_stock,
    ROUND(SUM(i.quantity * i.cost_per_unit), 2) AS total_value
FROM inventory_categories c
LEFT JOIN inventory_items i ON c.id = i.category_id AND i.is_active = 1
GROUP BY c.id, c.name, c.type
ORDER BY c.type, c.name;

-- Real-time inventory search with status
SELECT
    i.id,
    i.name,
    i.sku,
    c.name AS category,
    i.quantity,
    u.abbreviation AS unit,
    CASE
        WHEN i.quantity <= 0 THEN 'danger'
        WHEN i.quantity <= i.minimum_stock THEN 'warning'
        ELSE 'success'
    END AS status_class,
    i.updated_at
FROM inventory_items i
JOIN inventory_categories c ON i.category_id = c.id
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1
    AND (i.name LIKE CONCAT('%', @search, '%') OR i.sku LIKE CONCAT('%', @search, '%'))
ORDER BY i.name
LIMIT 20;

-- Inventory reorder suggestions
SELECT
    i.id,
    i.name,
    i.sku,
    i.quantity AS current_stock,
    i.minimum_stock,
    GREATEST(i.minimum_stock * 2 - i.quantity, 0) AS suggested_order_qty,
    u.abbreviation AS unit,
    i.cost_per_unit,
    ROUND(GREATEST(i.minimum_stock * 2 - i.quantity, 0) * i.cost_per_unit, 2) AS estimated_cost,
    i.supplier
FROM inventory_items i
JOIN units u ON i.unit_id = u.id
WHERE i.is_active = 1
    AND i.quantity <= i.minimum_stock
ORDER BY (i.minimum_stock - i.quantity) DESC;

-- Get live transaction feed (last 10 transactions)
SELECT
    it.id,
    i.name AS item_name,
    it.transaction_type,
    it.quantity,
    u.abbreviation AS unit,
    it.quantity_before,
    it.quantity_after,
    usr.username AS performed_by,
    it.notes,
    it.created_at
FROM inventory_transactions it
JOIN inventory_items i ON it.item_id = i.id
JOIN units u ON i.unit_id = u.id
JOIN users usr ON it.performed_by = usr.id
ORDER BY it.created_at DESC
LIMIT 10;
```
