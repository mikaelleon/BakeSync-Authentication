const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');
const { requireRole } = require('../middleware/rbac');
const { upload, cloudinary } = require('../utils/upload');

const router = express.Router();

async function logAccess({ userId, fileId, action, result, reason }) {
    try {
        await pool.execute(
            `INSERT INTO access_logs (user_id, file_id, action, result, reason)
             VALUES (?, ?, ?, ?, ?)`,
            [userId || null, fileId || null, action, result, reason || null]
        );
    } catch (e) {
        // Audit logging must never break the main request.
    }
}

function mapFileRow(row, userId) {
    if (!row) return null;
    const isOwner = row.isOwner === 1 || row.isOwner === true;
    return {
        id: row.id,
        filename: row.filename,
        description: row.description,
        file_url: row.file_url,
        file_size_kb: row.file_size_kb,
        original_name: row.original_name,
        mime_type: row.mime_type,
        file_type: row.file_type,
        owner_id: row.owner_id,
        is_public: row.is_public,
        created_at: row.created_at,
        owner_username: row.owner_username,
        owner_role: row.owner_role,
        isOwner
    };
}

/**
 * GET /api/files
 * One row per file; join owner for username (GROUP BY guards accidental row multiplication).
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `SELECT
               f.id,
               f.filename,
               f.description,
               f.file_url,
               f.file_size_kb,
               f.original_name,
               f.mime_type,
               f.file_type,
               f.owner_id,
               f.is_public,
               f.created_at,
               f.cloudinary_public_id,
               u.username AS owner_username,
               u.role AS owner_role,
               (f.owner_id = ?) AS isOwner
             FROM files f
             JOIN users u ON f.owner_id = u.id
             WHERE f.owner_id = ? OR f.is_public = 1
             GROUP BY
               f.id,
               f.filename,
               f.description,
               f.file_url,
               f.file_size_kb,
               f.original_name,
               f.mime_type,
               f.file_type,
               f.owner_id,
               f.is_public,
               f.created_at,
               f.cloudinary_public_id,
               u.username,
               u.role
             ORDER BY (f.owner_id = ?) DESC, f.created_at DESC`,
            [userId, userId, userId]
        );

        const files = (rows || []).map((r) => mapFileRow(r, userId));
        res.status(200).json({ files });
    } catch (error) {
        console.error('[Files] Get files error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Failed to retrieve files.' });
    }
});

function uploadSingleMiddleware(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File exceeds the 250 MB size limit.' });
            }
            if (String(err.message || '').startsWith('File type not allowed')) {
                return res.status(415).json({ error: err.message });
            }
            console.error('[Files] Multer error:', err.message || err);
            return res.status(500).json({ error: 'File upload failed.' });
        }
        next();
    });
}

/**
 * POST /api/files
 * Multipart upload (field name: file) + metadata fields.
 */
router.post('/', authMiddleware, uploadSingleMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'A file is required.' });
        }

        const filename =
            (req.body.filename && String(req.body.filename).trim()) ||
            req.file.originalname ||
            'Untitled';
        const description =
            req.body.description && String(req.body.description).trim()
                ? String(req.body.description).trim()
                : null;
        const file_type = req.body.file_type;
        const rawPublic = req.body.is_public;
        const is_public =
            rawPublic === 'true' || rawPublic === '1' || rawPublic === 1 || rawPublic === true ? 1 : 0;

        if (!file_type) {
            return res.status(400).json({ error: 'file_type is required.' });
        }

        const validTypes = ['recipe', 'report', 'schedule', 'invoice'];
        if (!validTypes.includes(file_type)) {
            return res.status(400).json({
                error: 'Invalid file type. Must be recipe, report, schedule, or invoice.'
            });
        }

        const file_url = req.file.path || null;
        const file_size_kb = req.file.size != null ? Math.ceil(req.file.size / 1024) : null;
        const original_name = req.file.originalname || null;
        const mime_type = req.file.mimetype || null;
        const cloudinary_public_id = req.file.filename || null;

        const [result] = await pool.execute(
            `INSERT INTO files
              (filename, description, file_url, file_size_kb, original_name, mime_type,
               cloudinary_public_id, file_type, owner_id, is_public)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                filename,
                description,
                file_url,
                file_size_kb,
                original_name,
                mime_type,
                cloudinary_public_id,
                file_type,
                userId,
                is_public
            ]
        );

        res.status(201).json({
            message: 'File uploaded successfully.',
            fileId: result.insertId,
            fileUrl: file_url
        });
    } catch (err) {
        console.error('[Files] Upload error:', err && err.message ? err.message : err);
        res.status(500).json({ error: 'File upload failed.' });
    }
});

/**
 * GET /api/files/logs/denied
 * Must be registered before /:id so "logs" is not treated as an id.
 */
router.get('/logs/denied', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT al.created_at,
                    al.action,
                    al.reason,
                    u.username,
                    f.filename
             FROM access_logs al
             LEFT JOIN users u ON u.id = al.user_id
             LEFT JOIN files f ON f.id = al.file_id
             WHERE al.result = 'denied'
             ORDER BY al.created_at DESC
             LIMIT 50`
        );

        res.status(200).json(
            (rows || []).map((r) => ({
                time: r.created_at,
                action: r.action,
                reason: r.reason,
                user: r.username || 'Unknown',
                filename: r.filename || 'Unknown file'
            }))
        );
    } catch (error) {
        console.error('[Files] Denied logs error:', error && error.message ? error.message : error);
        res.status(200).json([]);
    }
});

/**
 * GET /api/files/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `SELECT f.id, f.filename, f.description, f.file_url, f.file_size_kb, f.original_name,
                    f.mime_type, f.file_type, f.owner_id, f.is_public, f.created_at,
                    f.cloudinary_public_id, u.username AS owner_username
             FROM files f
             JOIN users u ON f.owner_id = u.id
             WHERE f.id = ?`,
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const row = rows[0];
        const isAllowed = row.owner_id === userId || row.is_public === 1;
        if (!isAllowed) {
            await logAccess({
                userId,
                fileId,
                action: 'view',
                result: 'denied',
                reason: 'not_owner_private'
            });
            return res.status(403).json({ error: 'Access denied: you do not own this file' });
        }

        await logAccess({
            userId,
            fileId,
            action: 'view',
            result: 'allowed'
        });

        const file = mapFileRow(
            {
                ...row,
                owner_role: null,
                isOwner: row.owner_id === userId ? 1 : 0
            },
            userId
        );
        res.status(200).json(file);
    } catch (error) {
        console.error('[Files] Get file error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/files/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const fileId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        const [rows] = await pool.execute(
            'SELECT id, owner_id, cloudinary_public_id, file_url FROM files WHERE id = ?',
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found.' });
        }

        const file = rows[0];

        if (file.owner_id !== userId) {
            await logAccess({
                userId,
                fileId,
                action: 'delete',
                result: 'denied',
                reason: 'not file owner'
            });
            return res.status(403).json({
                error: 'Access denied: only the file owner can delete this file.'
            });
        }

        const publicId = file.cloudinary_public_id;
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            } catch (cloudErr) {
                console.error('[Files] Cloudinary delete error:', cloudErr && cloudErr.message ? cloudErr.message : cloudErr);
            }
        }

        await pool.execute('DELETE FROM files WHERE id = ?', [fileId]);

        res.status(200).json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error('[Files] Delete error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});

/**
 * PATCH /api/files/:id/visibility
 */
router.patch('/:id/visibility', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;
        let { is_public } = req.body;

        if (is_public === '0' || is_public === '1') is_public = parseInt(is_public, 10);
        if (is_public === undefined || (is_public !== 0 && is_public !== 1)) {
            return res.status(400).json({ error: 'is_public must be 0 or 1' });
        }

        const [rows] = await pool.execute('SELECT id, owner_id FROM files WHERE id = ?', [fileId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        if (file.owner_id !== userId) {
            await logAccess({
                userId,
                fileId,
                action: 'visibility',
                result: 'denied',
                reason: 'only_owner_can_change_visibility'
            });
            return res.status(403).json({ error: 'Access denied: only the file owner can change visibility' });
        }

        await pool.execute('UPDATE files SET is_public = ? WHERE id = ?', [is_public, fileId]);

        res.status(200).json({
            message: 'Visibility updated',
            is_public
        });
    } catch (error) {
        console.error('[Files] Visibility error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
