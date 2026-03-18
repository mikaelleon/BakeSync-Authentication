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
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [fileCount] = await pool.execute('SELECT COUNT(*) as count FROM files');

        const dashboardData = {
            stats: {
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
        const dashboardData = {
            stats: {
                ordersToday: 23
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
