# Recipe Management

Create, edit, and manage bakery recipes with cost analysis.

## Tables

```sql
-- Recipe categories
CREATE TABLE IF NOT EXISTS recipe_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Main recipes table
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

-- Recipe ingredients (links recipes to inventory items)
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

-- Recipe cost history (tracks cost changes over time)
CREATE TABLE IF NOT EXISTS recipe_cost_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    total_ingredient_cost DECIMAL(10,2) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe versions for tracking changes
CREATE TABLE IF NOT EXISTS recipe_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    version_number INT NOT NULL,
    changes_description TEXT,
    ingredients_snapshot JSON,
    instructions_snapshot TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Seed Data

```sql
-- Insert recipe categories
INSERT INTO recipe_categories (name, description) VALUES
('Breads', 'Artisan breads, loaves, and rolls'),
('Pastries', 'Croissants, danishes, and puff pastries'),
('Cakes', 'Layer cakes, pound cakes, and specialty cakes'),
('Cookies', 'Drop cookies, bar cookies, and biscotti'),
('Pies & Tarts', 'Sweet and savory pies and tarts'),
('Specialty Items', 'Seasonal and custom items');

-- Insert sample recipes
INSERT INTO recipes (name, category_id, description, yield_quantity, yield_unit_id, prep_time_minutes, bake_time_minutes, difficulty, instructions, created_by) VALUES
('Classic Pandesal', 1, 'Traditional Filipino bread rolls, soft and slightly sweet', 24, 5, 30, 15, 'easy',
'1. Mix flour, sugar, salt, and yeast in a bowl.\n2. Add milk and butter, knead until smooth.\n3. Let rise for 1 hour.\n4. Divide into 24 pieces, shape into rolls.\n5. Roll in breadcrumbs, let rise 30 minutes.\n6. Bake at 180°C for 15 minutes.', 1),

('Chocolate Chip Cookies', 4, 'Classic chewy chocolate chip cookies', 36, 5, 20, 12, 'easy',
'1. Cream butter and sugars until fluffy.\n2. Add eggs and vanilla.\n3. Mix in flour, baking soda, and salt.\n4. Fold in chocolate chips.\n5. Scoop onto baking sheets.\n6. Bake at 175°C for 10-12 minutes.', 1),

('Chocolate Layer Cake', 3, 'Rich three-layer chocolate cake with ganache frosting', 12, 5, 45, 35, 'medium',
'1. Mix dry ingredients in large bowl.\n2. Add wet ingredients, mix until combined.\n3. Divide between three 9-inch pans.\n4. Bake at 175°C for 30-35 minutes.\n5. Cool completely before frosting.\n6. Apply ganache between layers and cover.', 1),

('Butter Croissant', 2, 'Flaky, buttery French croissants', 12, 5, 180, 20, 'hard',
'1. Make détrempe dough, chill 1 hour.\n2. Pound butter into flat square.\n3. Encase butter in dough.\n4. Perform 3 single folds, chilling between.\n5. Shape croissants, proof 2 hours.\n6. Bake at 200°C for 18-20 minutes.', 2),

('Ensaymada', 2, 'Filipino brioche-style bread with butter and cheese topping', 12, 5, 60, 18, 'medium',
'1. Mix dough ingredients, knead until smooth.\n2. Let rise until doubled.\n3. Divide and shape into coils.\n4. Place in molds, let rise again.\n5. Bake at 170°C for 15-18 minutes.\n6. Brush with butter, top with sugar and cheese.', 2);

-- Insert recipe ingredients for Classic Pandesal
INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit_id, notes, sort_order) VALUES
(1, 2, 500, 2, 'Bread flour', 1),
(1, 7, 60, 2, 'White sugar', 2),
(1, 11, 7, 2, 'Instant yeast', 3),
(1, 4, 250, 4, 'Warm milk', 4),
(1, 5, 60, 2, 'Softened butter', 5),
(1, 9, 2, 5, 'Beaten eggs', 6);

-- Insert recipe ingredients for Chocolate Chip Cookies
INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit_id, notes, sort_order) VALUES
(2, 1, 280, 2, 'All-purpose flour', 1),
(2, 5, 225, 2, 'Room temperature butter', 2),
(2, 7, 150, 2, 'White sugar', 3),
(2, 8, 150, 2, 'Brown sugar, packed', 4),
(2, 9, 2, 5, 'Large eggs', 5),
(2, 13, 5, 4, 'Vanilla extract', 6),
(2, 15, 300, 2, 'Chocolate chips', 7),
(2, 12, 5, 2, 'Baking powder', 8);

-- Insert recipe ingredients for Chocolate Layer Cake
INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit_id, notes, sort_order) VALUES
(3, 3, 300, 2, 'Cake flour', 1),
(3, 7, 400, 2, 'White sugar', 2),
(3, 14, 75, 2, 'Cocoa powder', 3),
(3, 12, 8, 2, 'Baking powder', 4),
(3, 9, 4, 5, 'Large eggs', 5),
(3, 4, 240, 4, 'Milk', 6),
(3, 10, 120, 4, 'Vegetable oil', 7),
(3, 13, 10, 4, 'Vanilla extract', 8),
(3, 6, 240, 4, 'Heavy cream for ganache', 9),
(3, 15, 340, 2, 'Chocolate chips for ganache', 10);
```

## Common Queries

```sql
-- Get all recipes with their categories
SELECT
    r.id,
    r.name,
    rc.name AS category,
    r.yield_quantity,
    u.name AS yield_unit,
    r.total_time_minutes,
    r.difficulty,
    r.is_active
FROM recipes r
JOIN recipe_categories rc ON r.category_id = rc.id
JOIN units u ON r.yield_unit_id = u.id
WHERE r.is_active = 1
ORDER BY rc.name, r.name;

-- Get recipe with full ingredient details and costs
SELECT
    r.id AS recipe_id,
    r.name AS recipe_name,
    r.yield_quantity,
    yu.name AS yield_unit,
    ri.quantity AS ingredient_qty,
    iu.abbreviation AS ingredient_unit,
    inv.name AS ingredient_name,
    inv.cost_per_unit,
    ROUND(ri.quantity * inv.cost_per_unit /
        CASE
            WHEN iu.id = inv.unit_id THEN 1
            WHEN iu.abbreviation = 'g' AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'kg' THEN 1000
            WHEN iu.abbreviation = 'mL' AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'L' THEN 1000
            ELSE 1
        END, 2) AS ingredient_cost,
    ri.notes,
    ri.is_optional
FROM recipes r
JOIN units yu ON r.yield_unit_id = yu.id
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
JOIN units iu ON ri.unit_id = iu.id
WHERE r.id = 1
ORDER BY ri.sort_order;

-- Calculate total recipe cost and cost per unit
SELECT
    r.id,
    r.name,
    r.yield_quantity,
    u.name AS yield_unit,
    ROUND(SUM(
        ri.quantity * inv.cost_per_unit /
        CASE
            WHEN ri.unit_id = inv.unit_id THEN 1
            WHEN (SELECT abbreviation FROM units WHERE id = ri.unit_id) = 'g'
                AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'kg' THEN 1000
            WHEN (SELECT abbreviation FROM units WHERE id = ri.unit_id) = 'mL'
                AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'L' THEN 1000
            ELSE 1
        END
    ), 2) AS total_cost,
    ROUND(SUM(
        ri.quantity * inv.cost_per_unit /
        CASE
            WHEN ri.unit_id = inv.unit_id THEN 1
            WHEN (SELECT abbreviation FROM units WHERE id = ri.unit_id) = 'g'
                AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'kg' THEN 1000
            WHEN (SELECT abbreviation FROM units WHERE id = ri.unit_id) = 'mL'
                AND (SELECT abbreviation FROM units WHERE id = inv.unit_id) = 'L' THEN 1000
            ELSE 1
        END
    ) / r.yield_quantity, 2) AS cost_per_unit
FROM recipes r
JOIN units u ON r.yield_unit_id = u.id
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
WHERE r.is_active = 1
GROUP BY r.id, r.name, r.yield_quantity, u.name
ORDER BY r.name;

-- Check ingredient availability for a recipe
SELECT
    r.name AS recipe_name,
    inv.name AS ingredient,
    ri.quantity AS required_qty,
    iu.abbreviation AS required_unit,
    inv.quantity AS available_qty,
    inv_u.abbreviation AS stock_unit,
    CASE
        WHEN inv.quantity >= ri.quantity THEN 'Available'
        WHEN inv.quantity > 0 THEN 'Partial'
        ELSE 'Out of Stock'
    END AS availability
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
JOIN units iu ON ri.unit_id = iu.id
JOIN units inv_u ON inv.unit_id = inv_u.id
WHERE r.id = 1
ORDER BY ri.sort_order;

-- Get recipes that can be made with current inventory
SELECT
    r.id,
    r.name,
    r.yield_quantity,
    COUNT(ri.id) AS total_ingredients,
    SUM(CASE WHEN inv.quantity >= ri.quantity THEN 1 ELSE 0 END) AS available_ingredients,
    CASE
        WHEN COUNT(ri.id) = SUM(CASE WHEN inv.quantity >= ri.quantity THEN 1 ELSE 0 END) THEN 'Ready'
        ELSE 'Missing Ingredients'
    END AS status
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
WHERE r.is_active = 1
GROUP BY r.id, r.name, r.yield_quantity
ORDER BY status, r.name;

-- Record recipe cost snapshot
INSERT INTO recipe_cost_history (recipe_id, total_ingredient_cost, cost_per_unit)
SELECT
    r.id,
    ROUND(SUM(ri.quantity * inv.cost_per_unit /
        CASE
            WHEN ri.unit_id = inv.unit_id THEN 1
            ELSE 1000
        END
    ), 2),
    ROUND(SUM(ri.quantity * inv.cost_per_unit /
        CASE
            WHEN ri.unit_id = inv.unit_id THEN 1
            ELSE 1000
        END
    ) / r.yield_quantity, 2)
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
WHERE r.id = 1
GROUP BY r.id;

-- Search recipes by ingredient
SELECT DISTINCT
    r.id,
    r.name,
    rc.name AS category,
    r.difficulty
FROM recipes r
JOIN recipe_categories rc ON r.category_id = rc.id
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN inventory_items inv ON ri.item_id = inv.id
WHERE inv.name LIKE '%chocolate%'
    AND r.is_active = 1;
```
