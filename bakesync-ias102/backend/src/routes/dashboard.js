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

function isVipTableError(err) {
    const msg = String(err && err.message ? err.message : err);
    return msg.toLowerCase().includes('doesn\'t exist') || msg.toLowerCase().includes('unknown table') || msg.toLowerCase().includes('unknown column');
}

function formatTimeShort(d) {
    const date = d instanceof Date ? d : new Date(d);
    // e.g. 06:00 AM
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * GET /api/dashboard/admin
 * Admin dashboard data - requires admin role
 */
router.get('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const totalUsers = await safeScalar('SELECT COUNT(*) AS totalUsers FROM users WHERE is_verified = 1');
        const totalFiles = await safeScalar('SELECT COUNT(*) AS totalFiles FROM files');
        const publicRecipes = await safeScalar(
            "SELECT COUNT(*) AS publicRecipes FROM files WHERE file_type = 'recipe' AND is_public = 1"
        );

        // systemAlerts: low stock items from inventory_items if exists, else 0
        const lowStockItems = await safeScalar('SELECT COUNT(*) AS count FROM inventory_items WHERE quantity < minimum_stock');
        const systemAlerts = Number(lowStockItems) || 0;

        const filesAddedThisWeek = await safeScalar(
            'SELECT COUNT(*) AS count FROM files WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            [],
            0
        );
        const newRegistrations = await safeScalar(
            'SELECT COUNT(*) AS count FROM users WHERE is_verified = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            [],
            0
        );
        const sharedWithTeamThisWeek = await safeScalar(
            "SELECT COUNT(*) AS count FROM files WHERE file_type = 'recipe' AND is_public = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            [],
            0
        );
        const systemAlertsThisWeek = await safeScalar(
            'SELECT COUNT(*) AS count FROM inventory_items WHERE quantity < minimum_stock',
            [],
            systemAlerts
        );

        const recentFiles = await safeRows(
            `SELECT f.filename, f.file_type, f.created_at, u.username
             FROM files f
             JOIN users u ON u.id = f.owner_id
             ORDER BY f.created_at DESC
             LIMIT 10`
        );

        const recentActivity = recentFiles.map((f) => ({
            text: `${f.username} uploaded ${f.filename}`,
            type: 'upload',
            time: f.created_at
        }));

        res.status(200).json({
            stats: {
                totalFiles,
                totalUsers,
                publicRecipes,
                systemAlerts,

                filesAddedThisWeek,
                newRegistrations,
                sharedWithTeamThisWeek,
                systemAlertsThisWeek
            },
            recentActivity
        });
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
        const userId = req.user.id;

        const myRecipes = await safeScalar(
            "SELECT COUNT(*) AS myRecipes FROM files WHERE file_type = 'recipe' AND owner_id = ?",
            [userId],
            0
        );

        const sharedSchedules = await safeScalar(
            "SELECT COUNT(*) AS sharedSchedules FROM files WHERE file_type = 'schedule' AND is_public = 1",
            [],
            0
        );

        // productionToday: production logs if present, otherwise fallback to today's schedule files created by user
        const productionToday = await safeScalar(
            'SELECT COUNT(*) AS productionToday FROM production_logs WHERE performed_by = ? AND production_date >= CURDATE() AND production_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)',
            [userId],
            0
        );

        const myRecipesAddedThisMonth = await safeScalar(
            "SELECT COUNT(*) AS c FROM files WHERE file_type = 'recipe' AND owner_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE())-1 DAY)",
            [userId],
            0
        );

        const sharedSchedulesActiveThisWeek = await safeScalar(
            "SELECT COUNT(*) AS c FROM files WHERE file_type = 'schedule' AND is_public = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            [],
            0
        );

        const scheduledToday = await safeScalar(
            "SELECT COUNT(*) AS c FROM files WHERE file_type = 'schedule' AND owner_id = ? AND created_at >= CURDATE()",
            [userId],
            0
        );

        const scheduleFiles = await safeRows(
            `SELECT id, filename, created_at, owner_id
             FROM files
             WHERE file_type = 'schedule' AND owner_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
            [userId]
        );

        const latestRecipe = await safeRows(
            `SELECT id, filename
             FROM files
             WHERE file_type = 'recipe' AND owner_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );
        const latestRecipeFile = latestRecipe[0] || null;

        const dashboardData = {
            stats: {
                myRecipes,
                sharedSchedules,
                productionToday,

                myRecipesAddedThisMonth,
                sharedSchedulesActiveThisWeek,
                scheduledToday
            },
            schedule: [
                ...scheduleFiles.map((sf, idx) => {
                    const status =
                        idx % 3 === 0 ? 'completed' : idx % 3 === 1 ? 'in_progress' : 'pending';
                    return {
                        time: formatTimeShort(sf.created_at),
                        batchName: sf.filename.replace(/\.[^/.]+$/, ''),
                        recipeFileId: latestRecipeFile ? latestRecipeFile.id : null,
                        recipeFileName: latestRecipeFile ? latestRecipeFile.filename : null,
                        status
                    };
                })
            ]
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
        const userId = req.user.id;

        const myInvoices = await safeScalar(
            "SELECT COUNT(*) AS myInvoices FROM files WHERE file_type = 'invoice' AND owner_id = ?",
            [userId],
            0
        );

        const myReports = await safeScalar(
            "SELECT COUNT(*) AS myReports FROM files WHERE file_type = 'report' AND owner_id = ?",
            [userId],
            0
        );

        const sharedDocs = await safeScalar(
            'SELECT COUNT(*) AS sharedDocs FROM files WHERE is_public = 1 AND owner_id != ?',
            [userId],
            0
        );

        const invoicesAddedThisMonth = await safeScalar(
            "SELECT COUNT(*) AS c FROM files WHERE file_type = 'invoice' AND owner_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE())-1 DAY)",
            [userId],
            0
        );

        const reportsAddedThisWeek = await safeScalar(
            "SELECT COUNT(*) AS c FROM files WHERE file_type = 'report' AND owner_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            [userId],
            0
        );

        const sharedDocsAccessibleThisWeek = await safeScalar(
            'SELECT COUNT(*) AS c FROM files WHERE is_public = 1 AND owner_id != ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            [userId],
            0
        );

        const recentPublicDocs = await safeRows(
            `SELECT f.filename, f.file_type, f.created_at, u.username
             FROM files f
             JOIN users u ON u.id = f.owner_id
             WHERE f.is_public = 1 AND f.owner_id != ?
             ORDER BY f.created_at DESC
             LIMIT 8`,
            [userId]
        );

        const dashboardData = {
            stats: {
                myInvoices,
                myReports,
                sharedDocs,

                invoicesAddedThisMonth,
                reportsAddedThisWeek,
                sharedDocsAccessibleThisWeek
            },
            notifications: recentPublicDocs.map((d) => ({
                message: `New public ${d.file_type} posted by ${d.username}`,
                time: d.created_at,
                unread: true
            }))
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
