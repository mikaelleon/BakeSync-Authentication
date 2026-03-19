const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const pool = require('../config/db');

const router = express.Router();

/**
 * GET /api/dashboard/admin
 * Admin dashboard data - requires admin role
 */
router.get('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
<<<<<<< HEAD
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
=======
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [fileCount] = await pool.execute('SELECT COUNT(*) as count FROM files');
>>>>>>> parent of 2a9e917 (feat: enhance dashboard functionality and UI improvements)

        res.status(200).json({
            stats: {
<<<<<<< HEAD
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
=======
                totalUsers: userCount[0].count,
                totalFiles: fileCount[0].count,
                systemAlerts: 3
            },
            recentActivity: [
                { action: 'New user registered', user: 'baker_carlos', time: '2 hours ago' },
                { action: 'File uploaded', user: 'cashier_ana', time: '3 hours ago' },
                { action: 'Recipe updated', user: 'baker_juan', time: '5 hours ago' },
                { action: 'Monthly report generated', user: 'manager_maria', time: '1 day ago' },
                { action: 'System backup completed', user: 'system', time: '1 day ago' }
            ]
        };

        res.status(200).json(dashboardData);
>>>>>>> parent of 2a9e917 (feat: enhance dashboard functionality and UI improvements)
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
<<<<<<< HEAD
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
=======
        const [recipeCount] = await pool.execute(
            "SELECT COUNT(*) as count FROM files WHERE file_type = 'recipe'"
        );

        const dashboardData = {
            stats: {
                recipesManaged: recipeCount[0].count,
                productionToday: 47
            },
            schedule: [
                { time: '06:00 AM', task: 'Start bread dough preparation', status: 'completed' },
                { time: '07:30 AM', task: 'Bake croissants batch 1', status: 'completed' },
                { time: '09:00 AM', task: 'Prepare cake orders', status: 'in_progress' },
                { time: '11:00 AM', task: 'Lunch pastries production', status: 'pending' },
                { time: '02:00 PM', task: 'Special orders preparation', status: 'pending' }
            ]
        };
>>>>>>> parent of 2a9e917 (feat: enhance dashboard functionality and UI improvements)

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
<<<<<<< HEAD
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
=======
        const dashboardData = {
            stats: {
                ordersToday: 23
>>>>>>> parent of 2a9e917 (feat: enhance dashboard functionality and UI improvements)
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
