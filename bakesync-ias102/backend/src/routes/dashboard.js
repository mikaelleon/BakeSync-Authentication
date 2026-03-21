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
        const userId = req.user.id;
        void userId; // keep for parity with the spec; queries below are admin-wide

        // Total verified users
        const [[{ totalUsers }]] = await pool.execute(
            `SELECT COUNT(*) AS totalUsers
             FROM users WHERE is_verified = 1`
        );

        // Total files across all users
        const [[{ totalFiles }]] = await pool.execute(
            `SELECT COUNT(*) AS totalFiles FROM files`
        );

        // Public recipes specifically
        const [[{ publicRecipes }]] = await pool.execute(
            `SELECT COUNT(*) AS publicRecipes FROM files
             WHERE file_type = 'recipe' AND is_public = 1`
        );

        // Files uploaded in the last 7 days
        const [[{ recentUploads }]] = await pool.execute(
            `SELECT COUNT(*) AS recentUploads FROM files
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Unverified accounts (pending verification)
        const [[{ pendingAccounts }]] = await pool.execute(
            `SELECT COUNT(*) AS pendingAccounts
             FROM users WHERE is_verified = 0`
        );

        // Private files count (DAC demo stat)
        const [[{ privateFiles }]] = await pool.execute(
            `SELECT COUNT(*) AS privateFiles
             FROM files WHERE is_public = 0`
        );

        // Recent denied access from audit log (used as "systemAlerts" KPI)
        let deniedCount = 0;
        try {
            const [[{ denials }]] = await pool.execute(
                `SELECT COUNT(*) AS denials FROM access_logs
                 WHERE result = 'denied'
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
            );
            deniedCount = denials;
        } catch (_) {
            // access_logs table may not exist yet — safe to ignore
        }

        // Recent activity: last 10 file uploads with uploader info
        const [recentActivity] = await pool.execute(
            `SELECT
               f.id,
               f.filename,
               f.file_type,
               f.created_at,
               u.username  AS uploader,
               u.role      AS uploader_role
             FROM files f
             JOIN users u ON f.owner_id = u.id
             ORDER BY f.created_at DESC
             LIMIT 10`
        );

        res.status(200).json({
            stats: {
                totalUsers,
                totalFiles,
                publicRecipes,
                recentUploads,
                pendingAccounts,
                privateFiles,
                systemAlerts: deniedCount
            },
            recentActivity: (recentActivity || []).map((f) => ({
                id: f.id,
                text: `${f.uploader} uploaded ${f.filename}`,
                type: 'upload',
                fileType: f.file_type,
                uploaderRole: f.uploader_role,
                time: f.created_at
            }))
        });
    } catch (error) {
        console.error('[Dashboard] Admin error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

/**
 * GET /api/dashboard/staff
 * Staff dashboard data - requires staff role
 */
router.get('/staff', authMiddleware, requireRole('staff'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Recipes owned by this user
        const [[{ myRecipes }]] = await pool.execute(
            `SELECT COUNT(*) AS myRecipes FROM files
             WHERE file_type = 'recipe' AND owner_id = ?`,
            [userId]
        );

        // Public schedules visible to this user
        const [[{ sharedSchedules }]] = await pool.execute(
            `SELECT COUNT(*) AS sharedSchedules FROM files
             WHERE file_type = 'schedule' AND is_public = 1`
        );

        // Derive productionToday from schedules uploaded today (real DB data)
        const [[{ productionToday }]] = await pool.execute(
            `SELECT COUNT(*) AS productionToday FROM files
             WHERE file_type = 'schedule'
               AND (owner_id = ? OR is_public = 1)
               AND DATE(created_at) = CURDATE()`,
            [userId]
        );

        // Total documents owned by this user
        const [[{ totalMyDocs }]] = await pool.execute(
            `SELECT COUNT(*) AS totalMyDocs FROM files
             WHERE owner_id = ?`,
            [userId]
        );

        // Latest 5 schedules visible to this user
        const [schedules] = await pool.execute(
            `SELECT
               f.id,
               f.filename,
               f.description,
               f.is_public,
               f.created_at,
               u.username AS owner
             FROM files f
             JOIN users u ON f.owner_id = u.id
             WHERE f.file_type = 'schedule'
               AND (f.owner_id = ? OR f.is_public = 1)
             ORDER BY f.created_at DESC
             LIMIT 5`,
            [userId]
        );

        res.status(200).json({
            stats: {
                myRecipes,
                sharedSchedules,
                productionToday,
                totalMyDocs
            },
            schedule: (schedules || []).map((s) => ({
                id: s.id,
                filename: s.filename,
                description: s.description,
                owner: s.owner,
                is_public: s.is_public,
                time: s.created_at,
                status: 'active'
            }))
        });
    } catch (error) {
        console.error('[Dashboard] Staff error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

/**
 * GET /api/dashboard/user
 * User dashboard data - requires user role
 */
router.get('/user', authMiddleware, requireRole('user'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Invoices owned by this user
        const [[{ myInvoices }]] = await pool.execute(
            `SELECT COUNT(*) AS myInvoices FROM files
             WHERE file_type = 'invoice' AND owner_id = ?`,
            [userId]
        );

        // Reports owned by this user
        const [[{ myReports }]] = await pool.execute(
            `SELECT COUNT(*) AS myReports FROM files
             WHERE file_type = 'report' AND owner_id = ?`,
            [userId]
        );

        // Public documents from other users
        const [[{ sharedDocs }]] = await pool.execute(
            `SELECT COUNT(*) AS sharedDocs FROM files
             WHERE is_public = 1 AND owner_id != ?`,
            [userId]
        );

        // Total documents accessible to this user
        const [[{ totalAccessible }]] = await pool.execute(
            `SELECT COUNT(*) AS totalAccessible FROM files
             WHERE owner_id = ? OR is_public = 1`,
            [userId]
        );

        // Notifications: use 5 most recently uploaded public files from other users
        const [notifications] = await pool.execute(
            `SELECT
               f.id,
               f.filename,
               f.file_type,
               f.created_at,
               u.username AS uploader,
               u.role     AS uploader_role
             FROM files f
             JOIN users u ON f.owner_id = u.id
             WHERE f.is_public = 1
               AND f.owner_id != ?
             ORDER BY f.created_at DESC
             LIMIT 5`,
            [userId]
        );

        res.status(200).json({
            stats: {
                myInvoices,
                myReports,
                sharedDocs,
                totalAccessible
            },
            notifications: (notifications || []).map((n) => ({
                id: n.id,
                message: `${n.uploader} shared a new ${n.file_type}: ${n.filename}`,
                type: n.file_type,
                time: n.created_at,
                read: false,
                uploaderRole: n.uploader_role
            }))
        });
    } catch (error) {
        console.error('[Dashboard] User error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

module.exports = router;
