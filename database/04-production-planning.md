# Production Planning

Schedule and track production batches.

## Tables

```sql
-- Production schedules (daily/weekly planning)
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

-- Batch ingredient usage (actual ingredients used)
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

-- Production checkpoints/stages
CREATE TABLE IF NOT EXISTS batch_checkpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    checkpoint_name VARCHAR(50) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    completed_by INT DEFAULT NULL,
    notes TEXT,
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (completed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Production templates (for recurring batches)
CREATE TABLE IF NOT EXISTS production_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template items
CREATE TABLE IF NOT EXISTS production_template_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    recipe_id INT NOT NULL,
    default_quantity DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(5,2) DEFAULT 1.00,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    sort_order INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES production_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment/oven scheduling
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('oven', 'mixer', 'proofer', 'other') NOT NULL,
    capacity VARCHAR(50),
    is_available TINYINT(1) DEFAULT 1,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment reservations
CREATE TABLE IF NOT EXISTS equipment_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    batch_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('reserved', 'in_use', 'completed', 'cancelled') DEFAULT 'reserved',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Seed Data

```sql
-- Insert equipment
INSERT INTO equipment (name, type, capacity, is_available) VALUES
('Main Oven 1', 'oven', '10 trays', 1),
('Main Oven 2', 'oven', '10 trays', 1),
('Deck Oven', 'oven', '4 trays', 1),
('Spiral Mixer', 'mixer', '50kg dough', 1),
('Planetary Mixer', 'mixer', '20L', 1),
('Proofing Cabinet', 'proofer', '20 trays', 1);

-- Insert production templates
INSERT INTO production_templates (name, description, created_by) VALUES
('Weekday Morning', 'Standard weekday morning production', 1),
('Weekend Special', 'Increased production for weekends', 1);

-- Insert template items for weekday morning
INSERT INTO production_template_items (template_id, recipe_id, default_quantity, multiplier, priority, sort_order) VALUES
(1, 1, 48, 2.0, 'high', 1),      -- Pandesal x2 batches (48 pcs)
(1, 4, 24, 2.0, 'normal', 2),   -- Croissants x2 batches (24 pcs)
(1, 5, 24, 2.0, 'normal', 3),   -- Ensaymada x2 batches (24 pcs)
(1, 2, 72, 2.0, 'normal', 4);   -- Cookies x2 batches (72 pcs)

-- Insert template items for weekend
INSERT INTO production_template_items (template_id, recipe_id, default_quantity, multiplier, priority, sort_order) VALUES
(2, 1, 72, 3.0, 'high', 1),     -- Pandesal x3 batches
(2, 4, 36, 3.0, 'normal', 2),   -- Croissants x3 batches
(2, 5, 36, 3.0, 'normal', 3),   -- Ensaymada x3 batches
(2, 3, 24, 2.0, 'normal', 4),   -- Chocolate Cake x2
(2, 2, 108, 3.0, 'normal', 5);  -- Cookies x3 batches

-- Insert sample production schedule
INSERT INTO production_schedules (schedule_date, shift, status, created_by, notes) VALUES
(CURDATE(), 'morning', 'approved', 1, 'Regular weekday production'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'morning', 'draft', 1, 'Tomorrow production plan');

-- Insert sample production batches
INSERT INTO production_batches (batch_number, schedule_id, recipe_id, planned_quantity, multiplier, status, priority, assigned_to, created_by) VALUES
(CONCAT('BATCH-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-001'), 1, 1, 48, 2.0, 'completed', 'high', 2, 1),
(CONCAT('BATCH-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-002'), 1, 4, 24, 2.0, 'in_progress', 'normal', 2, 1),
(CONCAT('BATCH-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-003'), 1, 5, 24, 2.0, 'scheduled', 'normal', 2, 1);
```

## Common Queries

```sql
-- Generate unique batch number
SELECT CONCAT('BATCH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-',
    LPAD(COALESCE(MAX(CAST(SUBSTRING(batch_number, -3) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_batch_number
FROM production_batches
WHERE DATE(created_at) = CURDATE();

-- Create production schedule
INSERT INTO production_schedules (schedule_date, shift, status, created_by, notes)
VALUES ('2024-01-20', 'morning', 'draft', 1, 'Saturday production');

-- Create batch from template
INSERT INTO production_batches (batch_number, schedule_id, recipe_id, planned_quantity, multiplier, priority, created_by)
SELECT
    CONCAT('BATCH-', DATE_FORMAT(@schedule_date, '%Y%m%d'), '-', LPAD(ROW_NUMBER() OVER (ORDER BY pti.sort_order), 3, '0')),
    @schedule_id,
    pti.recipe_id,
    pti.default_quantity,
    pti.multiplier,
    pti.priority,
    @user_id
FROM production_template_items pti
WHERE pti.template_id = 1;

-- Auto-populate batch ingredients from recipe
INSERT INTO batch_ingredients (batch_id, item_id, planned_quantity, unit_id)
SELECT
    @batch_id,
    ri.item_id,
    ri.quantity * pb.multiplier,
    ri.unit_id
FROM recipe_ingredients ri
JOIN production_batches pb ON pb.recipe_id = ri.recipe_id
WHERE pb.id = @batch_id;

-- Get today's production schedule with batches
SELECT
    ps.id AS schedule_id,
    ps.schedule_date,
    ps.shift,
    ps.status AS schedule_status,
    pb.id AS batch_id,
    pb.batch_number,
    r.name AS recipe_name,
    pb.planned_quantity,
    pb.actual_quantity,
    pb.status AS batch_status,
    pb.priority,
    u.username AS assigned_to,
    pb.started_at,
    pb.completed_at
FROM production_schedules ps
LEFT JOIN production_batches pb ON ps.id = pb.schedule_id
LEFT JOIN recipes r ON pb.recipe_id = r.id
LEFT JOIN users u ON pb.assigned_to = u.id
WHERE ps.schedule_date = CURDATE()
ORDER BY ps.shift, pb.priority DESC, pb.id;

-- Start production batch
UPDATE production_batches
SET
    status = 'in_progress',
    started_at = NOW()
WHERE id = @batch_id;

-- Complete production batch with actual quantity
UPDATE production_batches
SET
    status = 'completed',
    actual_quantity = 46,
    waste_quantity = 2,
    waste_reason = 'Slight overbaking',
    completed_at = NOW()
WHERE id = @batch_id;

-- Deduct ingredients from inventory after batch completion
INSERT INTO inventory_transactions (item_id, transaction_type, quantity, quantity_before, quantity_after, reference_id, reference_type, performed_by)
SELECT
    bi.item_id,
    'production_use',
    COALESCE(bi.actual_quantity, bi.planned_quantity),
    inv.quantity,
    inv.quantity - COALESCE(bi.actual_quantity, bi.planned_quantity),
    pb.id,
    'production_batch',
    @user_id
FROM batch_ingredients bi
JOIN production_batches pb ON bi.batch_id = pb.id
JOIN inventory_items inv ON bi.item_id = inv.id
WHERE pb.id = @batch_id;

UPDATE inventory_items inv
JOIN batch_ingredients bi ON inv.id = bi.item_id
SET inv.quantity = inv.quantity - COALESCE(bi.actual_quantity, bi.planned_quantity)
WHERE bi.batch_id = @batch_id;

-- Get production efficiency report
SELECT
    r.name AS recipe_name,
    COUNT(pb.id) AS batches_completed,
    SUM(pb.planned_quantity) AS total_planned,
    SUM(pb.actual_quantity) AS total_produced,
    SUM(pb.waste_quantity) AS total_waste,
    ROUND(SUM(pb.actual_quantity) / SUM(pb.planned_quantity) * 100, 2) AS efficiency_rate,
    ROUND(SUM(pb.waste_quantity) / SUM(pb.planned_quantity) * 100, 2) AS waste_rate
FROM production_batches pb
JOIN recipes r ON pb.recipe_id = r.id
WHERE pb.status = 'completed'
    AND pb.completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY r.id, r.name
ORDER BY efficiency_rate DESC;

-- Check ingredient availability for scheduled batches
SELECT
    pb.batch_number,
    r.name AS recipe_name,
    inv.name AS ingredient,
    bi.planned_quantity AS needed,
    u.abbreviation AS unit,
    inv.quantity AS available,
    CASE
        WHEN inv.quantity >= bi.planned_quantity THEN 'OK'
        WHEN inv.quantity > 0 THEN 'PARTIAL'
        ELSE 'OUT'
    END AS status
FROM production_batches pb
JOIN recipes r ON pb.recipe_id = r.id
JOIN batch_ingredients bi ON pb.id = bi.batch_id
JOIN inventory_items inv ON bi.item_id = inv.id
JOIN units u ON bi.unit_id = u.id
WHERE pb.status = 'scheduled'
    AND pb.schedule_id = @schedule_id
ORDER BY pb.id, bi.id;

-- Get staff production summary
SELECT
    u.id,
    u.username,
    COUNT(pb.id) AS batches_completed,
    SUM(pb.actual_quantity) AS units_produced,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, pb.started_at, pb.completed_at)), 0) AS avg_batch_time_mins,
    SUM(CASE WHEN pb.quality_check = 'passed' THEN 1 ELSE 0 END) AS quality_passed,
    ROUND(SUM(CASE WHEN pb.quality_check = 'passed' THEN 1 ELSE 0 END) / COUNT(pb.id) * 100, 2) AS quality_rate
FROM users u
LEFT JOIN production_batches pb ON u.id = pb.assigned_to AND pb.status = 'completed'
WHERE u.role = 'staff'
GROUP BY u.id, u.username
ORDER BY units_produced DESC;

-- Get equipment schedule for today
SELECT
    e.name AS equipment,
    e.type,
    pb.batch_number,
    r.name AS recipe,
    er.start_time,
    er.end_time,
    er.status
FROM equipment_reservations er
JOIN equipment e ON er.equipment_id = e.id
JOIN production_batches pb ON er.batch_id = pb.id
JOIN recipes r ON pb.recipe_id = r.id
WHERE DATE(er.start_time) = CURDATE()
ORDER BY er.start_time;

-- Get weekly production forecast
SELECT
    ps.schedule_date,
    DAYNAME(ps.schedule_date) AS day_name,
    ps.shift,
    COUNT(pb.id) AS planned_batches,
    SUM(pb.planned_quantity) AS planned_units,
    ps.status
FROM production_schedules ps
LEFT JOIN production_batches pb ON ps.id = pb.schedule_id
WHERE ps.schedule_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
GROUP BY ps.id, ps.schedule_date, ps.shift, ps.status
ORDER BY ps.schedule_date, ps.shift;

-- Add checkpoint stages for a batch
INSERT INTO batch_checkpoints (batch_id, checkpoint_name, status) VALUES
(@batch_id, 'Mise en Place', 'pending'),
(@batch_id, 'Mixing', 'pending'),
(@batch_id, 'Proofing', 'pending'),
(@batch_id, 'Shaping', 'pending'),
(@batch_id, 'Final Proof', 'pending'),
(@batch_id, 'Baking', 'pending'),
(@batch_id, 'Cooling', 'pending'),
(@batch_id, 'Quality Check', 'pending');

-- Update checkpoint status
UPDATE batch_checkpoints
SET
    status = 'completed',
    completed_at = NOW(),
    completed_by = @user_id
WHERE batch_id = @batch_id AND checkpoint_name = 'Mixing';
```
