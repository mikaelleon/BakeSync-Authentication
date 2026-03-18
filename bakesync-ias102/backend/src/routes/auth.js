const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email OTP verification
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate all fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                error: 'Username, email, password, and role are required'
            });
        }

        // Validate role
        const validRoles = ['admin', 'staff', 'user'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be admin, staff, or user'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if username exists
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Check if email exists
        const [existingEmail] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingEmail.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Insert user with is_verified = 0
        const [result] = await pool.execute(
            `INSERT INTO users (username, email, password_hash, role, otp_code, otp_expires_at, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [username, email, passwordHash, role, otpCode, otpExpiry]
        );

        const userId = result.insertId;

        // Send OTP email
        try {
            await sendOTPEmail(email, username, otpCode);
        } catch (emailError) {
            // If email fails, delete the user and return error
            console.error('Failed to send OTP email:', emailError);
            await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
            return res.status(500).json({
                error: 'Failed to send verification email. Please try again.'
            });
        }

        res.status(201).json({
            message: 'Verification code sent to your email.',
            userId: userId,
            username: username
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and activate account
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ error: 'User ID and OTP are required' });
        }

        // Get user
        const [rows] = await pool.execute(
            'SELECT id, username, email, role, otp_code, otp_expires_at, is_verified FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];

        // Check if already verified
        if (user.is_verified === 1) {
            return res.status(200).json({
                message: 'Account already verified. Please log in.',
                username: user.username,
                role: user.role
            });
        }

        // Check OTP code
        if (user.otp_code !== otp) {
            return res.status(401).json({ error: 'Invalid OTP code.' });
        }

        // Check OTP expiry
        const now = new Date();
        const otpExpiry = new Date(user.otp_expires_at);
        if (now > otpExpiry) {
            return res.status(401).json({
                error: 'OTP has expired. Please register again.'
            });
        }

        // Activate account
        await pool.execute(
            'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            message: 'Email verified. Your account is now active.',
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/resend-otp
 * Resend verification OTP email
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Get user
        const [rows] = await pool.execute(
            'SELECT id, username, email, otp_expires_at, is_verified FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found or already verified' });
        }

        const user = rows[0];

        // Check if already verified
        if (user.is_verified === 1) {
            return res.status(404).json({ error: 'User not found or already verified' });
        }

        // Rate limit: check if previous OTP was sent less than 1 minute ago
        if (user.otp_expires_at) {
            const previousExpiry = new Date(user.otp_expires_at);
            const previousSentTime = new Date(previousExpiry.getTime() - 10 * 60 * 1000); // OTP sent 10 min before expiry
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

            if (previousSentTime > oneMinuteAgo) {
                return res.status(429).json({
                    error: 'Please wait before requesting a new code.'
                });
            }
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Update OTP in database
        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [otpCode, otpExpiry, userId]
        );

        // Send OTP email
        try {
            await sendOTPEmail(user.email, user.username, otpCode);
        } catch (emailError) {
            console.error('Failed to resend OTP email:', emailError);
            return res.status(500).json({
                error: 'Failed to send verification email. Please try again.'
            });
        }

        res.status(200).json({
            message: 'A new code has been sent to your email.'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 * Verify credentials and issue JWT (requires verified account)
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, email, password_hash, role, is_verified FROM users WHERE username = ?',
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

        // Check if account is verified
        if (user.is_verified === 0) {
            return res.status(403).json({
                error: 'Account not verified. Please check your email for the verification code.',
                userId: user.id,
                username: user.username
            });
        }

        // Sign JWT
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
