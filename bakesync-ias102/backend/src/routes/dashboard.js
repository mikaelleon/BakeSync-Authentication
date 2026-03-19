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
        const totalUsers = await safeScalar(
            'SELECT COUNT(*) AS totalUsers FROM users WHERE is_verified = 1'
        );

        const totalFiles = await safeScalar('SELECT COUNT(*) AS totalFiles FROM files');

        const publicRecipes = await safeScalar(
            `SELECT COUNT(*) AS publicRecipes
             FROM files
             WHERE file_type = 'recipe' AND is_public = 1`
        );

        const filesAddedThisWeek = await safeScalar(
            `SELECT COUNT(*) AS filesAddedThisWeek
             FROM files
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
        );

        const newRegistrationsThisWeek = await safeScalar(
            `SELECT COUNT(*) AS newRegistrationsThisWeek
             FROM users
             WHERE is_verified = 1
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
        );

        const publicRecipesSharedThisWeek = await safeScalar(
            `SELECT COUNT(*) AS publicRecipesSharedThisWeek
             FROM files
             WHERE file_type = 'recipe'
               AND is_public = 1
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
        );

        const systemAlerts = await safeScalar(
            `SELECT COUNT(*) AS systemAlerts
             FROM inventory_items
             WHERE quantity < minimum_stock`,
            [],
            0
        );

        const recentFiles = await safeRows(
            `SELECT f.filename, f.file_type, f.created_at,
                    u.username AS uploader
             FROM files f
             JOIN users u ON u.id = f.owner_id
             ORDER BY f.created_at DESC
             LIMIT 10`
        );

        const recentActivity = recentFiles.map((f) => ({
            text: `${f.uploader} uploaded ${f.filename}`,
            type: 'upload',
            time: f.created_at,
        }));

        res.status(200).json({
            stats: {
                totalFiles: Number(totalFiles) || 0,
                totalUsers: Number(totalUsers) || 0,
                publicRecipes: Number(publicRecipes) || 0,
                systemAlerts: Number(systemAlerts) || 0,
            },
            trends: {
                filesAddedThisWeek: Number(filesAddedThisWeek) || 0,
                newRegistrationsThisWeek: Number(newRegistrationsThisWeek) || 0,
                publicRecipesSharedThisWeek: Number(publicRecipesSharedThisWeek) || 0,
                systemAlertsThisWeek: 0
            },
            recentActivity,
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
            `SELECT COUNT(*) AS myRecipes
             FROM files
             WHERE file_type = 'recipe' AND owner_id = ?`,
            [userId]
        );

        const sharedSchedules = await safeScalar(
            `SELECT COUNT(*) AS sharedSchedules
             FROM files
             WHERE file_type = 'schedule' AND is_public = 1`
        );

        const myRecipesAddedThisMonth = await safeScalar(
            `SELECT COUNT(*) AS myRecipesAddedThisMonth
             FROM files
             WHERE file_type = 'recipe'
               AND owner_id = ?
               AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
            [userId]
        );

        const sharedSchedulesActiveThisWeek = await safeScalar(
            `SELECT COUNT(*) AS sharedSchedulesActiveThisWeek
             FROM files
             WHERE file_type = 'schedule'
               AND is_public = 1
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
        );

        const productionToday = await safeScalar(
            `SELECT COUNT(*) AS productionToday
             FROM files
             WHERE file_type = 'schedule'
               AND owner_id = ?
               AND created_at >= CURDATE()
               AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`,
            [userId]
        );

        // Use schedule files owned by the staff user as "today schedule" rows.
        const scheduleRows = await safeRows(
            `SELECT id, filename, created_at
             FROM files
             WHERE file_type = 'schedule' AND owner_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
            [userId]
        );

        const schedule = scheduleRows.map((r) => {
            const d = new Date(r.created_at);
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return {
                time,
                batchName: r.filename,
                recipeDocument: null,
                status: 'pending',
            };
        });

        res.status(200).json({
            stats: {
                myRecipes: Number(myRecipes) || 0,
                sharedSchedules: Number(sharedSchedules) || 0,
                productionToday: Number(productionToday) || 0,
            },
            trends: {
                myRecipesAddedThisMonth: Number(myRecipesAddedThisMonth) || 0,
                sharedSchedulesActiveThisWeek: Number(sharedSchedulesActiveThisWeek) || 0,
                productionTodayTrend: 0
            },
            schedule,
        });
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
            `SELECT COUNT(*) AS myInvoices
             FROM files
             WHERE file_type = 'invoice' AND owner_id = ?`,
            [userId]
        );

        const myReports = await safeScalar(
            `SELECT COUNT(*) AS myReports
             FROM files
             WHERE file_type = 'report' AND owner_id = ?`,
            [userId]
        );

        const sharedDocs = await safeScalar(
            `SELECT COUNT(*) AS sharedDocs
             FROM files
             WHERE is_public = 1 AND owner_id <> ?`,
            [userId]
        );

        const myInvoicesThisMonth = await safeScalar(
            `SELECT COUNT(*) AS myInvoicesThisMonth
             FROM files
             WHERE file_type = 'invoice'
               AND owner_id = ?
               AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
            [userId]
        );

        const myReportsFiledThisWeek = await safeScalar(
            `SELECT COUNT(*) AS myReportsFiledThisWeek
             FROM files
             WHERE file_type = 'report'
               AND owner_id = ?
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        const sharedDocsThisWeek = await safeScalar(
            `SELECT COUNT(*) AS sharedDocsThisWeek
             FROM files
             WHERE is_public = 1
               AND owner_id <> ?
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        res.status(200).json({
            stats: {
                myInvoices: Number(myInvoices) || 0,
                myReports: Number(myReports) || 0,
                sharedDocs: Number(sharedDocs) || 0,
            },
            trends: {
                myInvoicesThisMonth: Number(myInvoicesThisMonth) || 0,
                myReportsFiledThisWeek: Number(myReportsFiledThisWeek) || 0,
                sharedDocsThisWeek: Number(sharedDocsThisWeek) || 0
            },
            notifications: [],
        });
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
