const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, getOTPExpiry } = require('../utils/otp');

const router = express.Router();

/**
 * POST /api/auth/login
 * Step 1 of MFA: Verify credentials and generate OTP
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, password_hash, role FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [otpCode, otpExpiry, user.id]
        );

        // SIMULATE OTP delivery - only appears in server console
        console.log(`[OTP] User '${user.username}' OTP: ${otpCode} (expires in 5 min)`);

        res.status(200).json({
            message: 'OTP sent',
            userId: user.id,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/verify-otp
 * Step 2 of MFA: Verify OTP and issue JWT
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ error: 'User ID and OTP are required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, role, otp_code, otp_expires_at FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        const user = rows[0];

        if (user.otp_code !== otp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        const now = new Date();
        const otpExpiry = new Date(user.otp_expires_at);

        if (now > otpExpiry) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        await pool.execute(
            'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            token,
            role: user.role,
            username: user.username
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        const validRoles = ['admin', 'staff', 'user'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be admin, staff, or user' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, passwordHash, role]
        );

        res.status(201).json({
            message: 'User registered',
            userId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
