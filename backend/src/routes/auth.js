const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendOTPEmail, sendPasswordResetOTPEmail } = require('../utils/mailer');

const router = express.Router();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 15;

/** Trim + lowercase for consistent email lookups (password reset). */
function normalizeEmailInput(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
}

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

        // ── Password hashing ────────────────────────────────────────
        // bcrypt with saltRounds=10 meets the OWASP minimum recommendation.
        // Higher rounds (12+) are more secure but slower.
        // For this prototype, 10 provides adequate protection.
        const passwordHash = await bcrypt.hash(password, 10);

        // ── OTP generation ───────────────────────────────────────────
        // Math.random() is NOT cryptographically secure (CSPRNG).
        // This is a known prototype limitation documented in the report.
        // Production improvement: use crypto.randomInt(100000, 999999)
        // from Node.js built-in crypto module.
        const otpCode = generateOTP();
        // ── OTP expiry ───────────────────────────────────────────────
        // 10-minute window balances security and usability.
        // NIST SP 800-63B recommends OTP validity of no more than 10 min.
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
                console.error('[Auth] Failed to resend OTP email:', emailError && emailError.message ? emailError.message : emailError);
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
            console.error('[Auth] Failed to send OTP email:', emailError && emailError.message ? emailError.message : emailError);
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
        console.error('[Auth] Register error:', error && error.message ? error.message : error);
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

            // ── OTP brute-force lockout ──────────────────────────────────
            // After 5 failed attempts, account is locked for 15 minutes.
            // This limits brute-force guessing of 6-digit OTPs (10^6 space).
            // Improvement: progressive lockout (15min → 1hr → permanent)
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
        console.error('[Auth] OTP verify error:', error && error.message ? error.message : error);
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
            console.error('[Auth] Failed to resend OTP email:', emailError && emailError.message ? emailError.message : emailError);
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
        console.error('[Auth] Resend OTP error:', error && error.message ? error.message : error);
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

        // ── JWT signing ──────────────────────────────────────────────
        // Payload contains minimal claims (id, username, role).
        // Avoid storing sensitive data in JWT — it is base64 encoded,
        // not encrypted, and can be decoded by anyone with the token.
        // 2-hour expiry limits the window for token misuse.
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
        console.error('[Auth] Login error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset OTP to user's email
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const normalizedEmail = normalizeEmailInput(req.body && req.body.email);

        if (!normalizedEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, email, is_verified FROM users WHERE LOWER(TRIM(email)) = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'No account found with this email address.'
            });
        }

        const user = rows[0];

        if (user.is_verified !== 1) {
            return res.status(403).json({
                error:
                    'This email is registered but the account is not verified yet. Complete sign-up before resetting your password.'
            });
        }

        // Generate OTP for password reset
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Store reset OTP in database (reusing otp_code and otp_expires_at fields)
        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0, otp_locked_until = NULL WHERE id = ?',
            [otpCode, otpExpiry, user.id]
        );

        // Send password reset email
        try {
            await sendPasswordResetOTPEmail(user.email, user.username, otpCode);
        } catch (emailError) {
            console.error('[Auth] Failed to send reset email:', emailError && emailError.message ? emailError.message : emailError);
            return res.status(500).json({
                error: 'Failed to send reset email. Please try again.'
            });
        }

        res.status(200).json({
            message: 'A reset code has been sent to your email.'
        });
    } catch (error) {
        console.error('[Auth] Forgot password error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/verify-reset-otp
 * Verify password reset OTP and return a reset token
 */
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { otp } = req.body;
        const normalizedEmail = normalizeEmailInput(req.body && req.body.email);

        if (!normalizedEmail || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, otp_code, otp_expires_at, otp_attempts, otp_locked_until, is_verified FROM users WHERE LOWER(TRIM(email)) = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired code' });
        }

        const user = rows[0];

        // Must be a verified user (forgot password only works for existing accounts)
        if (user.is_verified !== 1) {
            return res.status(401).json({ error: 'Invalid or expired code' });
        }

        const now = new Date();

        // Check lockout
        if (user.otp_locked_until) {
            const lockedUntil = new Date(user.otp_locked_until);
            if (now < lockedUntil) {
                return res.status(429).json({
                    error: 'Too many invalid attempts. Please try again later.',
                    lockedUntil: lockedUntil.toISOString()
                });
            }
        }

        // Check OTP expiry
        if (!user.otp_expires_at) {
            return res.status(401).json({ error: 'Invalid or expired code' });
        }

        const otpExpiry = new Date(user.otp_expires_at);
        if (now > otpExpiry) {
            return res.status(401).json({ error: 'Code has expired. Please request a new one.' });
        }

        // Verify OTP
        if (user.otp_code !== otp) {
            const prevAttempts = Number(user.otp_attempts || 0);
            const nextAttempts = prevAttempts + 1;

            if (nextAttempts >= MAX_OTP_ATTEMPTS) {
                const lockedUntil = new Date(now);
                lockedUntil.setMinutes(lockedUntil.getMinutes() + OTP_LOCK_MINUTES);

                await pool.execute(
                    'UPDATE users SET otp_attempts = ?, otp_locked_until = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
                    [MAX_OTP_ATTEMPTS, lockedUntil, user.id]
                );

                return res.status(429).json({
                    error: 'Too many invalid attempts. Please try again later.',
                    lockedUntil: lockedUntil.toISOString()
                });
            }

            await pool.execute(
                'UPDATE users SET otp_attempts = ? WHERE id = ?',
                [nextAttempts, user.id]
            );

            return res.status(401).json({
                error: 'Invalid code.',
                attemptsRemaining: MAX_OTP_ATTEMPTS - nextAttempts
            });
        }

        // Generate a secure reset token (valid for 15 minutes)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store reset token (repurposing otp fields)
        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?',
            [resetToken, resetTokenExpiry, user.id]
        );

        res.status(200).json({
            message: 'Code verified. You can now reset your password.',
            resetToken: resetToken
        });
    } catch (error) {
        console.error('[Auth] Verify reset OTP error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password using the reset token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        const normalizedEmail = normalizeEmailInput(req.body && req.body.email);

        if (!normalizedEmail || !resetToken || !newPassword) {
            return res.status(400).json({ error: 'Email, reset token, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const [rows] = await pool.execute(
            'SELECT id, otp_code, otp_expires_at, is_verified FROM users WHERE LOWER(TRIM(email)) = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        const user = rows[0];

        // Verify user is verified
        if (user.is_verified !== 1) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        // Verify reset token
        if (user.otp_code !== resetToken) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        // Check token expiry
        if (!user.otp_expires_at) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        const tokenExpiry = new Date(user.otp_expires_at);
        if (new Date() > tokenExpiry) {
            return res.status(401).json({ error: 'Reset token has expired. Please request a new one.' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await pool.execute(
            'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0, otp_locked_until = NULL WHERE id = ?',
            [passwordHash, user.id]
        );

        res.status(200).json({
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('[Auth] Reset password error:', error && error.message ? error.message : error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
