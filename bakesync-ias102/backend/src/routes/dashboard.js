const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const pool = require('../config/db');

const router = express.Router();

async function safeScalar(sql, params = [], fallback = 0) {
    try {
        const [rows] = await pool.execute(sql, params);
        const first = rows && rows[0] ? rows[0] : null;
        if (!first) return fallback;
        const val = Object.values(first)[0];
        return val === null || val === undefined ? fallback : val;
    } catch (e) {
        return fallback;
    }
}

async function safeRows(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return Array.isArray(rows) ? rows : [];
    } catch (e) {
        return [];
    }
}

function timeAgo(date) {
    const d = date instanceof Date ? date : new Date(date);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/**
 * GET /api/dashboard/admin
 * Admin dashboard data - requires admin role
 */
router.get('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const totalUsers = await safeScalar('SELECT COUNT(*) as count FROM users');
        const totalFiles = await safeScalar('SELECT COUNT(*) as count FROM files');

        // Optional ERP tables (if present in DB) — otherwise 0.
        const todaySales = await safeScalar(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date >= CURDATE() AND sale_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)'
        );
        const pendingOrders = await safeScalar(
            "SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('pending','draft')"
        );
        const lowStockItems = await safeScalar(
            'SELECT COUNT(*) as count FROM inventory_items WHERE quantity < minimum_stock'
        );
        const productionToday = await safeScalar(
            'SELECT COALESCE(SUM(quantity_produced), 0) as total FROM production_logs WHERE production_date >= CURDATE() AND production_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)'
        );

        // Recent activity from files + users (works with the minimal schema)
        const recentFileActivity = await safeRows(
            `SELECT f.file_type, f.created_at, u.username
             FROM files f
             JOIN users u ON u.id = f.owner_id
             ORDER BY f.created_at DESC
             LIMIT 8`
        );
        const recentActivity = recentFileActivity.map((row) => ({
            action: row.file_type === 'recipe' ? 'Recipe uploaded' : 'File uploaded',
            user: row.username,
            time: timeAgo(row.created_at)
        }));

        const dashboardData = {
            stats: {
                totalUsers,
                totalFiles,
                systemAlerts: lowStockItems > 0 ? 1 : 0
            },
            quickStats: {
                todaySales: Number(todaySales) || 0,
                productionToday: Number(productionToday) || 0,
                lowStockItems: Number(lowStockItems) || 0,
                pendingOrders: Number(pendingOrders) || 0
            },
            recentActivity
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/dashboard/staff
 * Staff dashboard data - requires staff role
 */
router.get('/staff', authMiddleware, requireRole('staff'), async (req, res) => {
    try {
        const recipeCount = await safeScalar("SELECT COUNT(*) as count FROM files WHERE file_type = 'recipe'");
        const myRecipeCount = await safeScalar(
            "SELECT COUNT(*) as count FROM files WHERE file_type = 'recipe' AND owner_id = ?",
            [req.user.id]
        );
        const productionToday = await safeScalar(
            'SELECT COALESCE(SUM(quantity_produced), 0) as total FROM production_logs WHERE performed_by = ? AND production_date >= CURDATE() AND production_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)',
            [req.user.id],
            0
        );

        const recentUploads = await safeRows(
            `SELECT filename, file_type, created_at
             FROM files
             WHERE owner_id = ?
             ORDER BY created_at DESC
             LIMIT 5`,
            [req.user.id]
        );

        const dashboardData = {
            stats: {
                recipesManaged: recipeCount,
                myRecipes: myRecipeCount,
                productionToday: Number(productionToday) || 0
            },
            schedule: [
                { time: '06:00 AM', task: 'Start bread dough preparation', status: 'completed' },
                { time: '07:30 AM', task: 'Bake croissants batch 1', status: 'completed' },
                { time: '09:00 AM', task: 'Prepare cake orders', status: 'in_progress' },
                { time: '11:00 AM', task: 'Lunch pastries production', status: 'pending' },
                { time: '02:00 PM', task: 'Special orders preparation', status: 'pending' }
            ],
            recentUploads: recentUploads.map(r => ({
                filename: r.filename,
                file_type: r.file_type,
                time: timeAgo(r.created_at)
            }))
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Staff dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/dashboard/user
 * User dashboard data - requires user role
 */
router.get('/user', authMiddleware, requireRole('user'), async (req, res) => {
    try {
        // Optional ERP tables — otherwise fall back.
        const ordersToday = await safeScalar(
            'SELECT COUNT(*) as count FROM orders WHERE created_at >= CURDATE() AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)',
            [],
            0
        );
        const todaySales = await safeScalar(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE performed_by = ? AND sale_date >= CURDATE() AND sale_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)',
            [req.user.id],
            0
        );

        const dashboardData = {
            stats: {
                ordersToday: Number(ordersToday) || 0,
                todaySales: Number(todaySales) || 0
            },
            notifications: [
                { message: 'New cake order received from Cafe Delights', time: '30 min ago', type: 'order' },
                { message: 'Payment confirmed for Order #1247', time: '1 hour ago', type: 'payment' },
                { message: 'Low stock alert: Vanilla extract', time: '2 hours ago', type: 'alert' },
                { message: 'Customer feedback received for Order #1245', time: '3 hours ago', type: 'feedback' }
            ]
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
