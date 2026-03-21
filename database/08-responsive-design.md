# Responsive Design

Works seamlessly on desktop, tablet, and mobile devices.

## Overview

Responsive design is primarily a frontend concern and doesn't require specific database tables. However, user preferences for display settings can be stored in the database.

## Tables

```sql
-- User display preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'system',
    sidebar_collapsed TINYINT(1) DEFAULT 0,
    compact_mode TINYINT(1) DEFAULT 0,
    items_per_page INT DEFAULT 20,
    default_view ENUM('grid', 'list', 'table') DEFAULT 'table',
    dashboard_layout JSON,
    pos_layout JSON,
    notification_sound TINYINT(1) DEFAULT 1,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    currency_symbol VARCHAR(5) DEFAULT '₱',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device sessions (track device types for analytics)
CREATE TABLE IF NOT EXISTS device_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_type ENUM('desktop', 'tablet', 'mobile') NOT NULL,
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_width INT,
    screen_height INT,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    page_views INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved dashboard widget configurations
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

-- Quick access favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    favorite_type ENUM('product', 'recipe', 'report', 'page') NOT NULL,
    reference_id INT DEFAULT NULL,
    reference_url VARCHAR(255) DEFAULT NULL,
    display_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Seed Data

```sql
-- Create default preferences for existing users
INSERT INTO user_preferences (user_id, theme, items_per_page, default_view)
SELECT id, 'system', 20, 'table'
FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = users.id);

-- Default dashboard widgets for admin
INSERT INTO dashboard_widgets (user_id, widget_type, title, position_x, position_y, width, height, settings) VALUES
(1, 'sales_summary', 'Today\'s Sales', 0, 0, 2, 1, '{"period": "today"}'),
(1, 'low_stock_alerts', 'Low Stock Alerts', 2, 0, 1, 1, '{"limit": 5}'),
(1, 'pending_orders', 'Pending Orders', 3, 0, 1, 1, '{"status": "pending"}'),
(1, 'sales_chart', 'Sales Trend', 0, 1, 2, 2, '{"period": "week", "chartType": "line"}'),
(1, 'top_products', 'Top Products', 2, 1, 2, 2, '{"period": "week", "limit": 5}'),
(1, 'production_status', 'Production Status', 0, 3, 2, 1, '{"showCompleted": false}');

-- Default dashboard widgets for staff
INSERT INTO dashboard_widgets (user_id, widget_type, title, position_x, position_y, width, height, settings) VALUES
(2, 'production_schedule', 'Today\'s Production', 0, 0, 2, 2, '{"date": "today"}'),
(2, 'my_batches', 'My Batches', 2, 0, 2, 1, '{"status": "in_progress"}'),
(2, 'low_stock_alerts', 'Ingredient Alerts', 0, 2, 2, 1, '{"category": "raw_material"}');

-- Default dashboard widgets for cashier
INSERT INTO dashboard_widgets (user_id, widget_type, title, position_x, position_y, width, height, settings) VALUES
(3, 'quick_sale', 'Quick Sale', 0, 0, 2, 2, '{"showFavorites": true}'),
(3, 'my_sales_today', 'My Sales Today', 2, 0, 2, 1, '{"showDetails": true}'),
(3, 'recent_orders', 'Recent Orders', 0, 2, 4, 1, '{"limit": 5}');

-- Add favorite products for cashier
INSERT INTO user_favorites (user_id, favorite_type, reference_id, display_name, sort_order) VALUES
(3, 'product', 1, 'Pandesal (6 pcs)', 1),
(3, 'product', 7, 'Butter Croissant', 2),
(3, 'product', 8, 'Ensaymada', 3),
(3, 'product', 3, 'Chocolate Chip Cookie', 4);
```

## Common Queries

```sql
-- Get user preferences with defaults
SELECT
    COALESCE(up.theme, 'system') AS theme,
    COALESCE(up.sidebar_collapsed, 0) AS sidebar_collapsed,
    COALESCE(up.compact_mode, 0) AS compact_mode,
    COALESCE(up.items_per_page, 20) AS items_per_page,
    COALESCE(up.default_view, 'table') AS default_view,
    COALESCE(up.notification_sound, 1) AS notification_sound,
    COALESCE(up.language, 'en') AS language,
    COALESCE(up.timezone, 'Asia/Manila') AS timezone,
    COALESCE(up.date_format, 'YYYY-MM-DD') AS date_format,
    COALESCE(up.currency_symbol, '₱') AS currency_symbol
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE u.id = @user_id;

-- Update user preference
INSERT INTO user_preferences (user_id, theme)
VALUES (@user_id, @theme)
ON DUPLICATE KEY UPDATE
    theme = VALUES(theme),
    updated_at = NOW();

-- Record device session
INSERT INTO device_sessions (user_id, device_type, browser, os, screen_width, screen_height)
VALUES (@user_id, @device_type, @browser, @os, @screen_width, @screen_height);

-- Get device usage analytics
SELECT
    device_type,
    COUNT(*) AS session_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage,
    AVG(page_views) AS avg_page_views
FROM device_sessions
WHERE session_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY device_type
ORDER BY session_count DESC;

-- Get user's dashboard widgets
SELECT
    dw.id,
    dw.widget_type,
    dw.title,
    dw.position_x,
    dw.position_y,
    dw.width,
    dw.height,
    dw.settings,
    dw.is_visible
FROM dashboard_widgets dw
WHERE dw.user_id = @user_id
ORDER BY dw.position_y, dw.position_x;

-- Save widget position (for drag and drop)
UPDATE dashboard_widgets
SET
    position_x = @x,
    position_y = @y,
    width = @width,
    height = @height,
    updated_at = NOW()
WHERE id = @widget_id AND user_id = @user_id;

-- Toggle widget visibility
UPDATE dashboard_widgets
SET is_visible = NOT is_visible, updated_at = NOW()
WHERE id = @widget_id AND user_id = @user_id;

-- Get user's favorites for quick access
SELECT
    uf.id,
    uf.favorite_type,
    uf.reference_id,
    uf.reference_url,
    uf.display_name,
    CASE uf.favorite_type
        WHEN 'product' THEN (SELECT price FROM products WHERE id = uf.reference_id)
        ELSE NULL
    END AS extra_info
FROM user_favorites uf
WHERE uf.user_id = @user_id
ORDER BY uf.sort_order;

-- Add to favorites
INSERT INTO user_favorites (user_id, favorite_type, reference_id, display_name, sort_order)
VALUES (
    @user_id,
    'product',
    @product_id,
    (SELECT name FROM products WHERE id = @product_id),
    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM user_favorites WHERE user_id = @user_id)
);

-- Remove from favorites
DELETE FROM user_favorites
WHERE user_id = @user_id AND favorite_type = @type AND reference_id = @ref_id;

-- Reorder favorites
UPDATE user_favorites
SET sort_order = @new_order
WHERE id = @favorite_id AND user_id = @user_id;

-- Get responsive breakpoint usage (for analytics)
SELECT
    CASE
        WHEN screen_width < 768 THEN 'mobile'
        WHEN screen_width < 1024 THEN 'tablet'
        ELSE 'desktop'
    END AS breakpoint,
    COUNT(*) AS sessions,
    AVG(page_views) AS avg_pages,
    AVG(TIMESTAMPDIFF(MINUTE, session_start, COALESCE(session_end, NOW()))) AS avg_duration_mins
FROM device_sessions
WHERE session_start >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY
    CASE
        WHEN screen_width < 768 THEN 'mobile'
        WHEN screen_width < 1024 THEN 'tablet'
        ELSE 'desktop'
    END
ORDER BY sessions DESC;

-- Reset dashboard to default layout
DELETE FROM dashboard_widgets WHERE user_id = @user_id;

-- Then insert defaults based on user role (example for admin)
INSERT INTO dashboard_widgets (user_id, widget_type, title, position_x, position_y, width, height, settings)
SELECT @user_id, widget_type, title, position_x, position_y, width, height, settings
FROM dashboard_widgets
WHERE user_id = 1;
```

## Frontend Implementation Notes

The responsive design should be implemented in the frontend using:

1. **CSS Media Queries** - Breakpoints for mobile (< 768px), tablet (768px - 1024px), desktop (> 1024px)
2. **Flexbox/Grid Layouts** - For fluid layouts that adapt to screen size
3. **Touch-Friendly UI** - Larger touch targets for mobile devices
4. **Collapsible Navigation** - Hamburger menu for mobile, full sidebar for desktop
5. **Adaptive Tables** - Card view for mobile, full table for desktop
6. **Lazy Loading** - Load data as needed to improve mobile performance

Example CSS breakpoints:
```css
/* Mobile first approach */
.container { padding: 1rem; }

/* Tablet */
@media (min-width: 768px) {
    .container { padding: 1.5rem; }
    .sidebar { width: 250px; }
}

/* Desktop */
@media (min-width: 1024px) {
    .container { padding: 2rem; }
    .sidebar { width: 280px; }
}

/* Large Desktop */
@media (min-width: 1440px) {
    .container { max-width: 1400px; margin: 0 auto; }
}
```
