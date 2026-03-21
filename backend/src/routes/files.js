const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');
const { requireRole } = require('../middleware/rbac');
const { persistUploadedFile } = require('../utils/fileStorage');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 250 * 1024 * 1024 },
});

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

function dedupeRowsById(rows) {
    const map = new Map();
    for (const row of rows || []) {
        if (!row || row.id == null) continue;
        const k = String(row.id);
        if (!map.has(k)) map.set(k, row);
    }
    return [...map.values()];
}

function mapFileRow(file, userId) {
    return {
        ...file,
        isOwner: file.owner_id === userId,
    };
}

/**
 * GET /api/files
 * Owned + public files; includes owner username for UI. Rows deduped by id.
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `SELECT f.id,
                    f.filename,
                    f.description,
                    f.file_type,
                    f.owner_id,
                    f.is_public,
                    f.created_at,
                    f.file_url,
                    f.file_size_kb,
                    f.original_name,
                    f.mime_type,
                    u.username AS owner_username
             FROM files f
             LEFT JOIN users u ON u.id = f.owner_id
             WHERE f.owner_id = ? OR f.is_public = 1
             ORDER BY f.created_at DESC`,
            [userId]
        );

        const unique = dedupeRowsById(rows);
        res.status(200).json(unique.map((file) => mapFileRow(file, userId)));
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        if (msg.includes('Unknown column') && msg.includes('file_url')) {
            console.error('[Files] Add storage columns: run backend/migrations/002_files_storage.sql');
        }
        console.error('[Files] Get files error:', msg);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function optionalMultipartUpload(req, res, next) {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('multipart/form-data')) return next();
    return upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File exceeds 250 MB limit.' });
            }
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }
        next();
    });
}

/**
 * POST /api/files
 * JSON (legacy): metadata-only record.
 * multipart/form-data: file field + filename, file_type, description, is_public — stores binary via Cloudinary or local /uploads.
 */
router.post('/', authMiddleware, optionalMultipartUpload, async (req, res) => {
    try {
        const ownerId = req.user.id;
        let filename;
        let description = null;
        let file_type;
        let isPublicValue;
        let fileUrl = null;
        let fileSizeKb = null;
        let originalName = null;
        let mimeType = null;

        if (req.file && req.file.buffer) {
            originalName = req.file.originalname || 'upload';
            filename = (req.body.filename && String(req.body.filename).trim()) || originalName;
            description = req.body.description ? String(req.body.description).trim() : null;
            file_type = req.body.file_type;
            const vis = req.body.is_public;
            isPublicValue = vis === true || vis === 'true' || vis === '1' || vis === 1 ? 1 : 0;

            const stored = await persistUploadedFile(req.file.buffer, originalName, req.file.mimetype);
            fileUrl = stored.file_url;
            fileSizeKb = stored.file_size_kb;
            mimeType = stored.mime_type;
        } else {
            const body = req.body || {};
            filename = body.filename;
            description = body.description || null;
            file_type = body.file_type;
            isPublicValue = body.is_public ? 1 : 0;
        }

        if (!filename || !file_type) {
            return res.status(400).json({ error: 'Filename and file type are required' });
        }

        const validTypes = ['recipe', 'report', 'schedule', 'invoice'];
        if (!validTypes.includes(file_type)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const [result] = await pool.execute(
            `INSERT INTO files (filename, description, file_type, owner_id, is_public, file_url, file_size_kb, original_name, mime_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                filename,
                description,
                file_type,
                ownerId,
                isPublicValue,
                fileUrl,
                fileSizeKb,
                originalName,
                mimeType,
            ]
        );

        res.status(201).json({
            message: 'File created',
            fileId: result.insertId,
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        if (msg.includes('Unknown column') && msg.includes('file_url')) {
            console.error('[Files] Add storage columns: run backend/migrations/002_files_storage.sql');
        }
        console.error('[Files] Upload error:', msg);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/files/logs/denied — must be registered before /:id
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
                filename: r.filename || 'Unknown file',
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
            `SELECT f.id, f.filename, f.description, f.file_type, f.owner_id, f.is_public, f.created_at,
                    f.file_url, f.file_size_kb, f.original_name, f.mime_type,
                    u.username AS owner_username
             FROM files f
             LEFT JOIN users u ON u.id = f.owner_id
             WHERE f.id = ?`,
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        const isAllowed = file.owner_id === userId || file.is_public === 1;
        if (!isAllowed) {
            await logAccess({
                userId,
                fileId,
                action: 'view',
                result: 'denied',
                reason: 'not_owner_private',
            });
            return res.status(403).json({ error: 'Access denied: you do not own this file' });
        }

        await logAccess({
            userId,
            fileId,
            action: 'view',
            result: 'allowed',
        });

        res.status(200).json(mapFileRow(file, userId));
    } catch (error) {
        console.error('[Files] Get file error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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

        if (file.owner_id !== userId) {
            await logAccess({
                userId,
                fileId,
                action: 'delete',
                result: 'denied',
                reason: 'only_owner_can_delete',
            });
            return res.status(403).json({ error: 'Access denied: only the file owner can delete' });
        }

        await pool.execute('DELETE FROM files WHERE id = ?', [fileId]);

        res.status(200).json({ message: 'File deleted' });
    } catch (error) {
        console.error('[Files] Delete error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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

        if (file.owner_id !== userId) {
            await logAccess({
                userId,
                fileId,
                action: 'visibility',
                result: 'denied',
                reason: 'only_owner_can_change_visibility',
            });
            return res.status(403).json({ error: 'Access denied: only the file owner can change visibility' });
        }

        await pool.execute(
            'UPDATE files SET is_public = ? WHERE id = ?',
            [is_public, fileId]
        );

        res.status(200).json({
            message: 'Visibility updated',
            is_public: is_public,
        });
    } catch (error) {
        console.error('[Files] Visibility error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
