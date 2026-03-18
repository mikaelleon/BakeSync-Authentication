# Role-Based Access Control (RBAC)

Different permissions for managers, bakers, and cashiers.

## Tables

```sql
-- Roles definition (extends existing ENUM in users table)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    level INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions/capabilities
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

-- Activity/audit log
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

-- User sessions tracking
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
    INDEX idx_token (token_hash),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login attempts (for security)
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success TINYINT(1) DEFAULT 0,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_ip (email, ip_address),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modify users table to use role_id reference (migration)
-- ALTER TABLE users ADD COLUMN role_id INT AFTER role;
-- ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);
```

## Seed Data

```sql
-- Insert roles
INSERT INTO roles (name, display_name, description, level) VALUES
('admin', 'Manager', 'Full system access - can manage all aspects of the bakery', 100),
('staff', 'Baker', 'Production staff - can manage recipes, inventory, and production', 50),
('user', 'Cashier', 'Sales staff - can process orders and manage POS', 25);

-- Insert permissions by module
-- Dashboard permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('dashboard.view_admin', 'View Admin Dashboard', 'Access to admin/manager dashboard', 'dashboard'),
('dashboard.view_staff', 'View Staff Dashboard', 'Access to baker/staff dashboard', 'dashboard'),
('dashboard.view_user', 'View User Dashboard', 'Access to cashier/user dashboard', 'dashboard'),
('dashboard.view_analytics', 'View Analytics', 'Access to financial analytics', 'dashboard');

-- Inventory permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('inventory.view', 'View Inventory', 'View inventory items and stock levels', 'inventory'),
('inventory.create', 'Create Inventory Item', 'Add new inventory items', 'inventory'),
('inventory.edit', 'Edit Inventory', 'Modify inventory item details', 'inventory'),
('inventory.delete', 'Delete Inventory', 'Remove inventory items', 'inventory'),
('inventory.adjust', 'Adjust Stock', 'Make stock adjustments', 'inventory'),
('inventory.purchase_order', 'Manage Purchase Orders', 'Create and manage purchase orders', 'inventory');

-- Recipe permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('recipe.view', 'View Recipes', 'View recipe list and details', 'recipe'),
('recipe.create', 'Create Recipe', 'Add new recipes', 'recipe'),
('recipe.edit', 'Edit Recipe', 'Modify existing recipes', 'recipe'),
('recipe.delete', 'Delete Recipe', 'Remove recipes', 'recipe'),
('recipe.cost_analysis', 'View Cost Analysis', 'Access recipe cost breakdowns', 'recipe');

-- Production permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('production.view', 'View Production', 'View production schedules and batches', 'production'),
('production.create', 'Create Production Batch', 'Schedule new production batches', 'production'),
('production.edit', 'Edit Production', 'Modify production schedules', 'production'),
('production.start', 'Start Production', 'Begin production batches', 'production'),
('production.complete', 'Complete Production', 'Mark batches as completed', 'production'),
('production.approve', 'Approve Production Schedule', 'Approve production plans', 'production');

-- POS permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('pos.view', 'Access POS', 'Access point of sale system', 'pos'),
('pos.create_order', 'Create Order', 'Create new customer orders', 'pos'),
('pos.void_order', 'Void Order', 'Cancel or void orders', 'pos'),
('pos.apply_discount', 'Apply Discount', 'Apply discounts to orders', 'pos'),
('pos.refund', 'Process Refund', 'Process order refunds', 'pos'),
('pos.cash_register', 'Manage Cash Register', 'Open/close cash register sessions', 'pos');

-- User management permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('user.view', 'View Users', 'View user list', 'user'),
('user.create', 'Create User', 'Add new users', 'user'),
('user.edit', 'Edit User', 'Modify user details', 'user'),
('user.delete', 'Delete User', 'Remove users', 'user'),
('user.change_role', 'Change User Role', 'Modify user roles', 'user');

-- Report permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('report.sales', 'View Sales Reports', 'Access sales reports', 'report'),
('report.inventory', 'View Inventory Reports', 'Access inventory reports', 'report'),
('report.production', 'View Production Reports', 'Access production reports', 'report'),
('report.financial', 'View Financial Reports', 'Access financial reports', 'report'),
('report.export', 'Export Reports', 'Export reports to files', 'report');

-- Settings permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
('settings.view', 'View Settings', 'View system settings', 'settings'),
('settings.edit', 'Edit Settings', 'Modify system settings', 'settings'),
('settings.backup', 'Backup System', 'Create system backups', 'settings');

-- Assign permissions to Admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign permissions to Staff/Baker role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name IN (
    'dashboard.view_staff',
    'inventory.view',
    'inventory.adjust',
    'recipe.view',
    'recipe.create',
    'recipe.edit',
    'recipe.cost_analysis',
    'production.view',
    'production.create',
    'production.start',
    'production.complete',
    'report.inventory',
    'report.production'
);

-- Assign permissions to Cashier role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN (
    'dashboard.view_user',
    'inventory.view',
    'recipe.view',
    'pos.view',
    'pos.create_order',
    'pos.apply_discount',
    'pos.cash_register',
    'report.sales'
);
```

## Common Queries

```sql
-- Check if user has specific permission
SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role = r.name
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = @user_id AND p.name = @permission_name
) AS has_permission;

-- Get all permissions for a user
SELECT DISTINCT
    p.name AS permission,
    p.display_name,
    p.module
FROM users u
JOIN roles r ON u.role = r.name
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = @user_id
ORDER BY p.module, p.name;

-- Get permissions grouped by module for a role
SELECT
    p.module,
    GROUP_CONCAT(p.display_name ORDER BY p.name SEPARATOR ', ') AS permissions
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = @role_id
GROUP BY p.module
ORDER BY p.module;

-- Compare permissions between roles
SELECT
    p.name AS permission,
    p.display_name,
    MAX(CASE WHEN r.name = 'admin' THEN 'Yes' ELSE 'No' END) AS admin,
    MAX(CASE WHEN r.name = 'staff' THEN 'Yes' ELSE 'No' END) AS staff,
    MAX(CASE WHEN r.name = 'user' THEN 'Yes' ELSE 'No' END) AS cashier
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
GROUP BY p.id, p.name, p.display_name
ORDER BY p.module, p.name;

-- Log user activity
INSERT INTO activity_logs (user_id, action, module, resource_type, resource_id, description, ip_address, old_values, new_values)
VALUES (@user_id, 'update', 'inventory', 'inventory_item', @item_id, 'Updated stock level', @ip_address,
    JSON_OBJECT('quantity', @old_quantity),
    JSON_OBJECT('quantity', @new_quantity));

-- Get recent activity for a user
SELECT
    al.action,
    al.module,
    al.resource_type,
    al.description,
    al.created_at
FROM activity_logs al
WHERE al.user_id = @user_id
ORDER BY al.created_at DESC
LIMIT 50;

-- Get activity log with user details (admin view)
SELECT
    al.id,
    u.username,
    u.role,
    al.action,
    al.module,
    al.resource_type,
    al.resource_id,
    al.description,
    al.ip_address,
    al.created_at
FROM activity_logs al
JOIN users u ON al.user_id = u.id
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY al.created_at DESC;

-- Track failed login attempts (security)
INSERT INTO login_attempts (email, ip_address, success, failure_reason)
VALUES (@email, @ip_address, 0, 'Invalid password');

-- Check for brute force attempts (block after 5 failed attempts in 15 minutes)
SELECT COUNT(*) AS failed_attempts
FROM login_attempts
WHERE (email = @email OR ip_address = @ip_address)
    AND success = 0
    AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE);

-- Record successful login
INSERT INTO login_attempts (email, ip_address, success)
VALUES (@email, @ip_address, 1);

-- Create user session
INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
VALUES (@user_id, SHA2(@token, 256), @ip_address, @user_agent, DATE_ADD(NOW(), INTERVAL 2 HOUR));

-- Validate session
SELECT
    us.id,
    us.user_id,
    u.username,
    u.role,
    us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.token_hash = SHA2(@token, 256)
    AND us.is_active = 1
    AND us.expires_at > NOW();

-- Invalidate session (logout)
UPDATE user_sessions
SET is_active = 0
WHERE token_hash = SHA2(@token, 256);

-- Invalidate all sessions for user (force logout everywhere)
UPDATE user_sessions
SET is_active = 0
WHERE user_id = @user_id;

-- Clean up expired sessions
DELETE FROM user_sessions
WHERE expires_at < NOW() OR is_active = 0;

-- Get active sessions for a user
SELECT
    us.id,
    us.ip_address,
    us.user_agent,
    us.last_activity,
    us.created_at
FROM user_sessions us
WHERE us.user_id = @user_id
    AND us.is_active = 1
    AND us.expires_at > NOW()
ORDER BY us.last_activity DESC;

-- Grant permission to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @role_id, id FROM permissions WHERE name = @permission_name
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Revoke permission from role
DELETE FROM role_permissions
WHERE role_id = @role_id
    AND permission_id = (SELECT id FROM permissions WHERE name = @permission_name);

-- Get users by role with permission count
SELECT
    u.id,
    u.username,
    u.email,
    r.display_name AS role,
    (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) AS permission_count,
    u.is_verified,
    u.created_at
FROM users u
JOIN roles r ON u.role = r.name
ORDER BY r.level DESC, u.username;

-- Security audit: users with admin access
SELECT
    u.id,
    u.username,
    u.email,
    u.role,
    (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id) AS last_activity,
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = 1) AS active_sessions
FROM users u
WHERE u.role = 'admin'
ORDER BY last_activity DESC;

-- Module access summary by role
SELECT
    r.display_name AS role,
    p.module,
    COUNT(rp.id) AS permissions_granted
FROM roles r
CROSS JOIN (SELECT DISTINCT module FROM permissions) p
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id AND perm.module = p.module
GROUP BY r.id, r.display_name, p.module
ORDER BY r.level DESC, p.module;
```
