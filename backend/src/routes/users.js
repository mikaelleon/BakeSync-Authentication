const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendAccountDeletionOTPEmail } = require('../utils/mailer');

const router = express.Router();

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * GET /api/users/me
 * Current authenticated user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute(
            'SELECT id, username, email, role, is_verified, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('[Users] Profile error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/users/me
 * Update username and/or email (any role)
 * Returns updated user + refreshed token if username changed
 */
router.patch('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body || {};

        if ((username === undefined || username === null) && (email === undefined || email === null)) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        // Fetch current user
        const [currentRows] = await pool.execute(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [userId]
        );
        if (currentRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const current = currentRows[0];

        const updates = [];
        const params = [];

        let nextUsername = current.username;
        let nextEmail = current.email;

        if (username !== undefined && username !== null) {
            const trimmed = String(username).trim();
            if (trimmed.length < 3 || trimmed.length > 50) {
                return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
            }
            if (trimmed !== current.username) {
                // Check uniqueness
                const [u] = await pool.execute(
                    'SELECT id FROM users WHERE username = ? AND id <> ?',
                    [trimmed, userId]
                );
                if (u.length > 0) {
                    return res.status(409).json({ error: 'Username already taken' });
                }
                updates.push('username = ?');
                params.push(trimmed);
                nextUsername = trimmed;
            }
        }

        if (email !== undefined && email !== null) {
            const trimmedEmail = String(email).trim().toLowerCase();
            if (!isValidEmail(trimmedEmail) || trimmedEmail.length > 100) {
                return res.status(400).json({ error: 'Invalid email address' });
            }
            if (trimmedEmail !== current.email) {
                const [e] = await pool.execute(
                    'SELECT id FROM users WHERE email = ? AND id <> ?',
                    [trimmedEmail, userId]
                );
                if (e.length > 0) {
                    return res.status(409).json({ error: 'Email already registered' });
                }
                updates.push('email = ?');
                params.push(trimmedEmail);
                nextEmail = trimmedEmail;
            }
        }

        if (updates.length === 0) {
            return res.status(200).json({
                message: 'No changes',
                user: { id: current.id, username: current.username, email: current.email, role: current.role }
            });
        }

        params.push(userId);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        const user = { id: current.id, username: nextUsername, email: nextEmail, role: current.role };

        // Refresh JWT if username changed (token includes username)
        let token = null;
        if (nextUsername !== current.username) {
            // Same JWT policy as login: minimal claims, 2h expiry (see auth routes).
            token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );
        }

        res.status(200).json({ message: 'Profile updated', user, token });
    } catch (error) {
        console.error('[Users] Profile update error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/users/me/delete/request-otp
 * Send OTP to current email for account deletion confirmation
 */
router.post('/me/delete/request-otp', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            'SELECT id, username, email FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0, otp_locked_until = NULL WHERE id = ?',
            [otpCode, otpExpiry, userId]
        );

        await sendAccountDeletionOTPEmail(user.email, user.username, otpCode);

        res.status(200).json({ message: 'Deletion code sent to your email.' });
    } catch (error) {
        console.error('[Users] Delete OTP request error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/users/me/delete/confirm
 * Confirm OTP and delete account
 */
router.post('/me/delete/confirm', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp } = req.body || {};

        if (!otp || !/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({ error: 'A valid 6-digit OTP is required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, otp_code, otp_expires_at FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        if (!user.otp_code || !user.otp_expires_at) {
            return res.status(400).json({ error: 'No deletion code requested' });
        }

        if (user.otp_code !== String(otp)) {
            return res.status(401).json({ error: 'Invalid OTP code' });
        }

        const now = new Date();
        const expiry = new Date(user.otp_expires_at);
        if (now > expiry) {
            return res.status(401).json({ error: 'OTP has expired. Please request a new code.' });
        }

        // Delete user; dependent rows should cascade where configured
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.status(200).json({ message: 'Account deleted' });
    } catch (error) {
        console.error('[Users] Delete confirm error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/users/me/change-password
 * Change account password (IAS102 security requirement)
 */
router.post('/me/change-password', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required.',
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                error: 'New password must be at least 6 characters.',
            });
        }

        if (String(currentPassword) === String(newPassword)) {
            return res.status(400).json({
                error: 'New password must be different from current password.',
            });
        }

        const [rows] = await pool.execute(
            'SELECT id, password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = rows[0];

        const matches = await bcrypt.compare(currentPassword, user.password_hash);
        if (!matches) {
            return res.status(401).json({
                error: 'Current password is incorrect.',
            });
        }

        // bcrypt saltRounds=10 — same rationale as registration (see auth routes).
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        return res.status(200).json({
            message: 'Password changed successfully.',
        });
    } catch (err) {
        console.error('[Users] Password change error:', err && err.message ? err.message : err);
        return res.status(500).json({ error: 'Failed to change password.' });
    }
});

module.exports = router;

