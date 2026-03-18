const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

/**
 * GET /api/files
 * Get all files accessible to the user (owned + public)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `SELECT id, filename, description, file_type, owner_id, is_public, created_at
             FROM files
             WHERE owner_id = ? OR is_public = 1
             ORDER BY created_at DESC`,
            [userId]
        );

        const files = rows.map(file => ({
            ...file,
            isOwner: file.owner_id === userId
        }));

        res.status(200).json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/files
 * Create a new file
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { filename, description, file_type, is_public } = req.body;
        const ownerId = req.user.id;

        if (!filename || !file_type) {
            return res.status(400).json({ error: 'Filename and file type are required' });
        }

        const validTypes = ['recipe', 'report', 'schedule', 'invoice'];
        if (!validTypes.includes(file_type)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const isPublicValue = is_public ? 1 : 0;

        const [result] = await pool.execute(
            `INSERT INTO files (filename, description, file_type, owner_id, is_public)
             VALUES (?, ?, ?, ?, ?)`,
            [filename, description || null, file_type, ownerId, isPublicValue]
        );

        res.status(201).json({
            message: 'File created',
            fileId: result.insertId
        });
    } catch (error) {
        console.error('Create file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/files/:id
 * Get a specific file with DAC enforcement
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        const [rows] = await pool.execute(
            'SELECT id, filename, description, file_type, owner_id, is_public, created_at FROM files WHERE id = ?',
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        // DAC enforcement: only owner or public files can be accessed
        if (file.owner_id !== userId && file.is_public !== 1) {
            return res.status(403).json({ error: 'Access denied: you do not own this file' });
        }

        res.status(200).json({
            ...file,
            isOwner: file.owner_id === userId
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/files/:id
 * Delete a file with DAC enforcement (owner only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        const [rows] = await pool.execute(
            'SELECT id, owner_id FROM files WHERE id = ?',
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        // DAC enforcement: only owner can delete
        if (file.owner_id !== userId) {
            return res.status(403).json({ error: 'Access denied: only the file owner can delete' });
        }

        await pool.execute('DELETE FROM files WHERE id = ?', [fileId]);

        res.status(200).json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/files/:id/visibility
 * Toggle file visibility with DAC enforcement (owner only)
 */
router.patch('/:id/visibility', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;
        const { is_public } = req.body;

        if (is_public === undefined || (is_public !== 0 && is_public !== 1)) {
            return res.status(400).json({ error: 'is_public must be 0 or 1' });
        }

        const [rows] = await pool.execute(
            'SELECT id, owner_id FROM files WHERE id = ?',
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        // DAC enforcement: only owner can change visibility
        if (file.owner_id !== userId) {
            return res.status(403).json({ error: 'Access denied: only the file owner can change visibility' });
        }

        await pool.execute(
            'UPDATE files SET is_public = ? WHERE id = ?',
            [is_public, fileId]
        );

        res.status(200).json({
            message: 'Visibility updated',
            is_public: is_public
        });
    } catch (error) {
        console.error('Update visibility error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
