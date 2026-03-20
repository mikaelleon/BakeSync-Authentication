const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/mailer');

const router = express.Router();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 15;

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

        // Check username/email existence (and whether already verified)
        const [usernameRows] = await pool.execute(
            'SELECT id, is_verified FROM users WHERE username = ?',
            [username]
        );
        const usernameRow = usernameRows && usernameRows[0] ? usernameRows[0] : null;

        const [emailRows] = await pool.execute(
            'SELECT id, is_verified FROM users WHERE email = ?',
            [email]
        );
        const emailRow = emailRows && emailRows[0] ? emailRows[0] : null;

        // If we found an unverified user for either field, we resend OTP (instead of 409).
        let candidateUserId = null;
        let candidateResent = false;
        if (usernameRow && Number(usernameRow.is_verified) === 0) {
            candidateUserId = usernameRow.id;
            candidateResent = true;
        } else if (emailRow && Number(emailRow.is_verified) === 0) {
            candidateUserId = emailRow.id;
            candidateResent = true;
        }

        // Block conflicts for already-verified accounts.
        if (!candidateUserId) {
            if (usernameRow && Number(usernameRow.is_verified) === 1) {
                return res.status(409).json({ error: 'Username already taken' });
            }
            if (emailRow && Number(emailRow.is_verified) === 1) {
                return res.status(409).json({ error: 'Email already registered' });
            }
        } else {
            // Candidate resend is only allowed if the other unique field isn't taken by someone else.
            if (usernameRow && usernameRow.id !== candidateUserId) {
                return res.status(409).json({ error: 'Username already taken' });
            }
            if (emailRow && emailRow.id !== candidateUserId) {
                return res.status(409).json({ error: 'Email already registered' });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();
        const expiresAt = otpExpiry.toISOString();

        if (candidateResent && candidateUserId) {
            // Update existing unverified user (unblocks the re-registration loop).
            await pool.execute(
                `UPDATE users
                 SET username = ?,
                     email = ?,
                     password_hash = ?,
                     role = ?,
                     otp_code = ?,
                     otp_expires_at = ?,
                     otp_attempts = 0,
                     otp_locked_until = NULL,
                     is_verified = 0
                 WHERE id = ?`,
                [username, email, passwordHash, role, otpCode, otpExpiry, candidateUserId]
            );

            try {
                await sendOTPEmail(email, username, otpCode);
            } catch (emailError) {
                console.error('Failed to resend OTP email:', emailError);
                return res.status(500).json({
                    error: 'Failed to send verification email. Please try again.'
                });
            }

            return res.status(200).json({
                message: 'Verification code resent to your email.',
                resent: true,
                userId: candidateUserId,
                username: username,
                expiresAt
            });
        }

        // Create new user with is_verified = 0
        const [result] = await pool.execute(
            `INSERT INTO users (username, email, password_hash, role, otp_code, otp_expires_at, otp_attempts, otp_locked_until, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0)`,
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
            username: username,
            expiresAt
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
            'SELECT id, username, email, role, otp_code, otp_expires_at, otp_attempts, otp_locked_until, is_verified FROM users WHERE id = ?',
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

        const now = new Date();

        // Lockout check
        if (user.otp_locked_until) {
            const lockedUntil = new Date(user.otp_locked_until);
            if (now < lockedUntil) {
                return res.status(429).json({
                    error: 'Too many invalid OTP attempts. Please try again later.',
                    lockedUntil: lockedUntil.toISOString(),
                    attemptsRemaining: 0
                });
            }
        }

        // Check OTP expiry
        if (!user.otp_expires_at) {
            return res.status(401).json({
                error: 'OTP has expired. Please register again.'
            });
        }

        const otpExpiry = new Date(user.otp_expires_at);
        if (now > otpExpiry) {
            return res.status(401).json({
                error: 'OTP has expired. Please register again.'
            });
        }

        // OTP mismatch => increment attempt counter + possibly lock
        if (user.otp_code !== otp) {
            const prevAttempts = Number(user.otp_attempts || 0);
            const nextAttempts = prevAttempts + 1;

            if (nextAttempts >= MAX_OTP_ATTEMPTS) {
                const lockedUntil = new Date(now);
                lockedUntil.setMinutes(lockedUntil.getMinutes() + OTP_LOCK_MINUTES);

                await pool.execute(
                    'UPDATE users SET otp_attempts = ?, otp_locked_until = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
                    [MAX_OTP_ATTEMPTS, lockedUntil, userId]
                );

                return res.status(429).json({
                    error: 'Too many invalid OTP attempts. You are temporarily locked out.',
                    lockedUntil: lockedUntil.toISOString(),
                    attemptsRemaining: 0
                });
            }

            await pool.execute(
                'UPDATE users SET otp_attempts = ? WHERE id = ?',
                [nextAttempts, userId]
            );

            return res.status(401).json({
                error: 'Invalid OTP code.',
                attemptsRemaining: MAX_OTP_ATTEMPTS - nextAttempts
            });
        }

        // Activate account
        await pool.execute(
            'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0, otp_locked_until = NULL WHERE id = ?',
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
            'SELECT id, username, email, otp_expires_at, otp_attempts, otp_locked_until, is_verified FROM users WHERE id = ?',
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

        // Lockout check (prevents resend from bypassing OTP brute-force protection)
        const now = new Date();
        if (user.otp_locked_until) {
            const lockedUntil = new Date(user.otp_locked_until);
            if (now < lockedUntil) {
                return res.status(429).json({
                    error: 'Too many invalid OTP attempts. Please try again later.',
                    lockedUntil: lockedUntil.toISOString(),
                    attemptsRemaining: 0
                });
            }
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
        const expiresAt = otpExpiry.toISOString();

        // Update OTP in database
        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0, otp_locked_until = NULL WHERE id = ?',
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
            message: 'A new code has been sent to your email.',
            expiresAt,
            attemptsRemaining: MAX_OTP_ATTEMPTS
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
