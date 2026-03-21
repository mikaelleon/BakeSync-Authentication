// BakeSync Authentication Logic

const REMEMBER_ME_KEY = 'bakesync_remember_username';

/**
 * Initialize password toggle buttons
 */
function initPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn:not([data-password-toggle-bound])').forEach(btn => {
        btn.setAttribute('data-password-toggle-bound', '1');
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const eyeIcon = this.querySelector('.eye-icon');
            const eyeOffIcon = this.querySelector('.eye-off-icon');

            if (input.type === 'password') {
                input.type = 'text';
                if (eyeIcon) eyeIcon.style.display = 'none';
                if (eyeOffIcon) eyeOffIcon.style.display = 'block';
            } else {
                input.type = 'password';
                if (eyeIcon) eyeIcon.style.display = 'block';
                if (eyeOffIcon) eyeOffIcon.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize remember me functionality
 */
function initRememberMe() {
    const usernameInput = document.getElementById('username');
    const rememberCheckbox = document.getElementById('remember-me');

    if (!usernameInput || !rememberCheckbox) return;

    // Load saved username
    const savedUsername = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('submit-btn');

    // Hide any previous alerts
    errorAlert.style.display = 'none';
    document.getElementById('success-alert').style.display = 'none';

    // Client-side validation
    if (!username || username.length < 3) {
        showLoginError('Username must be at least 3 characters.');
        return;
    }

    if (!password || password.length < 6) {
        showLoginError('Password must be at least 6 characters.');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle unverified account
            if (response.status === 403 && data.userId) {
                sessionStorage.setItem('reg_userId', data.userId);
                sessionStorage.setItem('reg_username', data.username);
                showLoginError('Your account is not verified yet. Redirecting to verification...');
                setTimeout(() => {
                    window.location.href = 'otp.html';
                }, 2000);
                return;
            }
            throw new Error(data.error || 'Login failed');
        }

        // Handle remember me
        if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, username);
        } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
        }

        // MFA gate: backend returns mfaRequired instead of a JWT.
        if (data.mfaRequired) {
            sessionStorage.setItem('mfa_userId', String(data.userId));
            sessionStorage.setItem('mfa_email', data.email || '');
            sessionStorage.setItem('mfa_username', data.username || '');
            sessionStorage.setItem('mfa_role', data.role || '');
            if (data.expiresAt) {
                sessionStorage.setItem('mfa_expires_at', data.expiresAt);
            }
            sessionStorage.setItem('mfa_remember_me', rememberMe ? '1' : '0');

            // Redirect to MFA OTP page to finish sign in.
            window.location.href = 'mfa.html';
            return;
        }

        if (typeof persistLoginSession === 'function') {
            persistLoginSession(data, rememberMe);
        } else {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('role', data.role);
            sessionStorage.setItem('username', data.username);
        }

        // Redirect based on role
        const redirectMap = {
            'admin': 'dashboard-admin.html',
            'staff': 'dashboard-staff.html',
            'user': 'dashboard-user.html'
        };

        window.location.href = redirectMap[data.role] || 'dashboard-user.html';
    } catch (error) {
        showLoginError(error.message || 'Login failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const errorAlert = document.getElementById('error-alert');
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.textContent = message;
    errorAlert.style.display = 'flex';
}

/**
 * Check for registration success message on login page
 */
function checkRegistrationSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const expired = urlParams.get('expired');

    // Improvement 2: show JWT expiry context.
    if (expired === 'true') {
        const infoEl = document.getElementById('login-info');
        const infoMsgEl = document.getElementById('login-info-message');
        if (infoEl && infoMsgEl) {
            infoMsgEl.textContent = 'Your session expired. Please sign in again.';
            infoEl.style.display = 'flex';
        }
        window.history.replaceState({}, '', 'login.html');
        return;
    }

    if (urlParams.get('registered') === 'true') {
        const successAlert = document.getElementById('success-alert');
        const successMsg = document.getElementById('success-message');
        if (successAlert && successMsg) {
            successMsg.textContent = 'Account created successfully. You can now sign in.';
            successAlert.style.display = 'flex';
        }
        window.history.replaceState({}, '', 'login.html');
    }
}

/**
 * Handle registration form submission
 */
async function handleRegister(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const roleInput = document.getElementById('role');

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const role = roleInput.value;

    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('register-btn');
    const submitLabel = document.getElementById('register-btn-label');

    // Hide previous error
    errorAlert.style.display = 'none';
    clearAllFieldErrors();

    // Validation
    const usernameValid = validateUsernameField(usernameInput, true);
    const emailValid = validateEmailField(emailInput, true);
    const passwordValid = validatePasswordField(passwordInput, true);
    const confirmValid = validateConfirmPasswordField(confirmInput, true);
    const roleValid = validateRoleField(roleInput, true);

    const usernameAvailabilityState = await checkUsernameAvailability(username, false);
    const available = usernameAvailabilityState === 'available' || usernameAvailabilityState === 'unknown';
    const valid = usernameValid && emailValid && passwordValid && confirmValid && roleValid && available;

    if (!valid) return;

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitLabel.textContent = 'Creating account...';

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store registration session for OTP page
        sessionStorage.setItem('reg_userId', data.userId);
        sessionStorage.setItem('reg_username', data.username);
        sessionStorage.setItem('reg_email', email);
        if (data.expiresAt) {
            sessionStorage.setItem('reg_expires_at', data.expiresAt);
        }

        // Redirect to OTP verification
        window.location.href = 'otp.html';
    } catch (error) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.textContent = error.message;
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitLabel.textContent = 'Create Account & Send Code';
        if (/username.+taken/i.test(error.message || '')) {
            setFieldInvalid(usernameInput, 'username-error', 'This username is already taken.');
        } else if (/email.+registered/i.test(error.message || '')) {
            setFieldInvalid(emailInput, 'email-error', 'This email is already registered.');
        }
    }
}

/**
 * Show field-level error
 */
function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = message ? 'block' : 'none';
    }
}

/**
 * Clear all field errors
 */
function clearAllFieldErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function setFieldInvalid(inputEl, errorId, message) {
    if (!inputEl) return;
    inputEl.classList.remove('input-valid');
    inputEl.classList.add('input-invalid');
    showFieldError(errorId, message);
}

function setFieldValid(inputEl, errorId) {
    if (!inputEl) return;
    inputEl.classList.remove('input-invalid');
    inputEl.classList.add('input-valid');
    showFieldError(errorId, '');
}

function clearFieldState(inputEl, errorId) {
    if (!inputEl) return;
    inputEl.classList.remove('input-invalid', 'input-valid');
    showFieldError(errorId, '');
}

function validateUsernameField(inputEl, showWhenEmpty = false) {
    const value = String(inputEl?.value || '').trim();
    if (!value) {
        if (showWhenEmpty) setFieldInvalid(inputEl, 'username-error', 'Username is required.');
        else clearFieldState(inputEl, 'username-error');
        return false;
    }
    if (value.length < 3) {
        setFieldInvalid(inputEl, 'username-error', 'Username must be at least 3 characters.');
        return false;
    }
    if (value.length > 50) {
        setFieldInvalid(inputEl, 'username-error', 'Username must be 50 characters or less.');
        return false;
    }
    setFieldValid(inputEl, 'username-error');
    return true;
}

function validateEmailField(inputEl, showWhenEmpty = false) {
    const value = String(inputEl?.value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
        if (showWhenEmpty) setFieldInvalid(inputEl, 'email-error', 'Email is required.');
        else clearFieldState(inputEl, 'email-error');
        return false;
    }
    if (!emailRegex.test(value)) {
        setFieldInvalid(inputEl, 'email-error', 'Please enter a valid email address.');
        return false;
    }
    setFieldValid(inputEl, 'email-error');
    return true;
}

function evaluatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = 'Very weak';
    let color = '#b91c1c';
    if (score >= 5) {
        label = 'Strong';
        color = '#16a34a';
    } else if (score >= 4) {
        label = 'Good';
        color = '#65a30d';
    } else if (score >= 3) {
        label = 'Fair';
        color = '#d97706';
    } else if (score >= 2) {
        label = 'Weak';
        color = '#ea580c';
    }
    return { score, label, color };
}

function renderPasswordStrength(password) {
    const bar = document.getElementById('password-strength-bar');
    const text = document.getElementById('password-strength-text');
    if (!bar || !text) return;

    if (!password) {
        bar.style.width = '0%';
        bar.style.backgroundColor = 'var(--muted-foreground)';
        text.textContent = '';
        text.classList.remove('hint-valid', 'hint-invalid');
        return;
    }

    const result = evaluatePasswordStrength(password);
    const width = Math.max(12, (result.score / 5) * 100);
    bar.style.width = `${width}%`;
    bar.style.backgroundColor = result.color;
    text.textContent = `Strength: ${result.label}`;
    text.classList.toggle('hint-valid', result.score >= 4);
    text.classList.toggle('hint-invalid', result.score < 3);
}

function validatePasswordField(inputEl, showWhenEmpty = false) {
    const value = String(inputEl?.value || '');
    renderPasswordStrength(value);

    if (!value) {
        if (showWhenEmpty) setFieldInvalid(inputEl, 'password-error', 'Password is required.');
        else clearFieldState(inputEl, 'password-error');
        return false;
    }

    if (value.length < 8) {
        setFieldInvalid(inputEl, 'password-error', 'Password must be at least 8 characters.');
        return false;
    }

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);
    if (!(hasUpper && hasLower && hasDigit && hasSymbol)) {
        setFieldInvalid(inputEl, 'password-error', 'Include uppercase, lowercase, number, and symbol.');
        return false;
    }

    setFieldValid(inputEl, 'password-error');
    return true;
}

function validateConfirmPasswordField(inputEl, showWhenEmpty = false) {
    const password = String(document.getElementById('password')?.value || '');
    const confirm = String(inputEl?.value || '');
    const statusEl = document.getElementById('confirm-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('hint-valid', 'hint-invalid');
    }

    if (!confirm) {
        if (showWhenEmpty) setFieldInvalid(inputEl, 'confirm-error', 'Please confirm your password.');
        else clearFieldState(inputEl, 'confirm-error');
        return false;
    }

    if (password !== confirm) {
        setFieldInvalid(inputEl, 'confirm-error', 'Passwords do not match.');
        if (statusEl) {
            statusEl.textContent = 'Passwords do not match.';
            statusEl.classList.add('hint-invalid');
        }
        return false;
    }

    setFieldValid(inputEl, 'confirm-error');
    if (statusEl) {
        statusEl.textContent = 'Passwords match.';
        statusEl.classList.add('hint-valid');
    }
    return true;
}

const ROLE_HINTS = {
    admin: 'Manager: Full access to manage bakeshop, staff, and reports.',
    staff: 'Baker: Access to recipes, production schedules, and inventory.',
    user: 'Cashier: Access to POS, orders, and customer management.'
};

function validateRoleField(selectEl, showWhenEmpty = false) {
    const value = String(selectEl?.value || '');
    const hintEl = document.getElementById('role-hint');
    if (hintEl) hintEl.textContent = ROLE_HINTS[value] || '';
    if (!value) {
        if (showWhenEmpty) setFieldInvalid(selectEl, 'role-error', 'Please select a role.');
        else clearFieldState(selectEl, 'role-error');
        return false;
    }
    setFieldValid(selectEl, 'role-error');
    return true;
}

let usernameCheckTimer = null;
let lastUsernameChecked = '';
let usernameAvailability = 'unknown';

async function checkUsernameAvailability(username, debounce = true) {
    const usernameInput = document.getElementById('username');
    const statusEl = document.getElementById('username-status');
    if (!usernameInput || !statusEl) return 'unknown';

    const candidate = String(username || '').trim();
    if (!validateUsernameField(usernameInput, false)) {
        usernameAvailability = 'unknown';
        statusEl.textContent = '';
        statusEl.classList.remove('hint-valid', 'hint-invalid');
        return 'unknown';
    }
    if (candidate === lastUsernameChecked && usernameAvailability !== 'unknown') {
        return usernameAvailability;
    }

    const runCheck = async () => {
        statusEl.textContent = 'Checking username...';
        statusEl.classList.remove('hint-valid', 'hint-invalid');
        try {
            const response = await fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(candidate)}`);
            const data = await response.json();
            lastUsernameChecked = candidate;
            if (!response.ok || data.available === false) {
                usernameAvailability = 'taken';
                statusEl.textContent = data.reason || 'Username is unavailable.';
                statusEl.classList.add('hint-invalid');
                setFieldInvalid(usernameInput, 'username-error', data.reason || 'Username is unavailable.');
                return 'taken';
            }
            usernameAvailability = 'available';
            statusEl.textContent = 'Username is available.';
            statusEl.classList.add('hint-valid');
            setFieldValid(usernameInput, 'username-error');
            return 'available';
        } catch (e) {
            usernameAvailability = 'unknown';
            statusEl.textContent = '';
            statusEl.classList.remove('hint-valid', 'hint-invalid');
            return 'unknown';
        }
    };

    if (!debounce) return runCheck();

    return new Promise(resolve => {
        if (usernameCheckTimer) clearTimeout(usernameCheckTimer);
        usernameCheckTimer = setTimeout(async () => {
            const res = await runCheck();
            resolve(res);
        }, 300);
    });
}

async function resendVerificationForEmail(email) {
    const errorAlert = document.getElementById('error-alert');
    const errorMsg = document.getElementById('error-message');
    if (errorAlert) errorAlert.style.display = 'none';
    try {
        const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to resend verification code.');
        }

        sessionStorage.setItem('reg_userId', data.userId);
        sessionStorage.setItem('reg_username', data.username);
        sessionStorage.setItem('reg_email', email);
        if (data.expiresAt) sessionStorage.setItem('reg_expires_at', data.expiresAt);
        window.location.href = 'otp.html';
    } catch (err) {
        if (errorMsg) errorMsg.textContent = err.message || 'Failed to resend verification code.';
        if (errorAlert) errorAlert.style.display = 'flex';
    }
}

function initRegisterFormEnhancements() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const roleInput = document.getElementById('role');
    const resendLink = document.getElementById('resend-verification-link');

    usernameInput?.addEventListener('blur', async () => {
        validateUsernameField(usernameInput, true);
        await checkUsernameAvailability(usernameInput.value, false);
    });
    usernameInput?.addEventListener('input', async () => {
        validateUsernameField(usernameInput, false);
        await checkUsernameAvailability(usernameInput.value, true);
    });

    emailInput?.addEventListener('blur', () => validateEmailField(emailInput, true));
    emailInput?.addEventListener('input', () => validateEmailField(emailInput, false));
    passwordInput?.addEventListener('input', () => {
        validatePasswordField(passwordInput, false);
        validateConfirmPasswordField(confirmInput, false);
    });
    passwordInput?.addEventListener('blur', () => validatePasswordField(passwordInput, true));
    confirmInput?.addEventListener('input', () => validateConfirmPasswordField(confirmInput, false));
    confirmInput?.addEventListener('blur', () => validateConfirmPasswordField(confirmInput, true));
    roleInput?.addEventListener('change', () => validateRoleField(roleInput, true));
    roleInput?.addEventListener('blur', () => validateRoleField(roleInput, true));

    resendLink?.addEventListener('click', async e => {
        e.preventDefault();
        const email = String(emailInput?.value || '').trim();
        if (!validateEmailField(emailInput, true)) return;
        await resendVerificationForEmail(email);
    });
}

/**
 * Initialize OTP page
 */
(function initOTPPage() {
    // Only run on OTP page
    if (!document.getElementById('otp-form')) return;

    const mfaUserId = sessionStorage.getItem('mfa_userId');
    const isMfa = !!mfaUserId;

    const expiryKey = isMfa ? 'mfa_expires_at' : 'reg_expires_at';
    const verifyEndpoint = isMfa ? '/api/auth/verify-mfa-otp' : '/api/auth/verify-otp';
    const resendEndpoint = isMfa ? '/api/auth/resend-mfa-otp' : '/api/auth/resend-otp';

    const userId = isMfa ? mfaUserId : sessionStorage.getItem('reg_userId');
    const username = isMfa ? sessionStorage.getItem('mfa_username') : sessionStorage.getItem('reg_username');
    const email = isMfa ? sessionStorage.getItem('mfa_email') : sessionStorage.getItem('reg_email');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Display masked email
    const emailDisplay = document.getElementById('otp-email-display');
    if (emailDisplay && email) {
        const masked = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
        emailDisplay.textContent = `Code sent to: ${masked}`;
    }

    // Timer (Improvement 4: server-synced, avoids desync on refresh)
    const timerEl = document.getElementById('otp-timer');
    const verifyBtn = document.getElementById('otp-verify-btn');
    const resendBtn = document.getElementById('otp-resend-btn');
    const attemptsEl = document.getElementById('otp-attempts-remaining');

    const MAX_OTP_ATTEMPTS = 5;
    let lockoutUntilMs = null;
    let lockoutIntervalId = null;
    let resendCooldownUntilMs = Date.now() + 60000; // mirrors backend: ~1 minute between resends

    let seconds = 600; // fallback if reg_expires_at isn't present
    const regExpiresAt = sessionStorage.getItem(expiryKey);
    let regExpiresAtMs = regExpiresAt ? new Date(regExpiresAt).getTime() : null;
    if (regExpiresAt) {
        const msLeft = regExpiresAtMs - Date.now();
        seconds = Math.max(0, Math.ceil(msLeft / 1000));
    }

    function formatMmSs(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function isLockoutActive() {
        return !!lockoutUntilMs && Date.now() < lockoutUntilMs;
    }

    function setAttemptsRemainingText(text) {
        if (attemptsEl) attemptsEl.textContent = text || '';
    }

    function updateTimerDisplay() {
        if (!timerEl) return;
        if (seconds <= 0) {
            timerEl.textContent = 'Code expired';
            timerEl.classList.add('expired');
            return;
        }
        timerEl.classList.remove('expired');
        timerEl.textContent = formatMmSs(seconds);
    }

    function updateVerifyEnabled() {
        if (!verifyBtn) return;
        verifyBtn.disabled = seconds <= 0 || isLockoutActive();
    }

    function updateResendEnabled() {
        if (!resendBtn) return;
        const shouldEnable =
            !isLockoutActive() &&
            (seconds <= 0 || Date.now() >= resendCooldownUntilMs);
        resendBtn.disabled = !shouldEnable;
    }

    function startLockoutCountdown(lockedUntilIso) {
        if (!lockedUntilIso) return;
        lockoutUntilMs = new Date(lockedUntilIso).getTime();
        // Backend lockout clears otp_code/otp_expires_at, so reflect as expired in UI.
        seconds = 0;
        // Prevent countdown from "reverting" to the old expiry after lockout starts.
        sessionStorage.removeItem(expiryKey);
        regExpiresAtMs = null;
        updateTimerDisplay();
        updateVerifyEnabled();
        updateResendEnabled();
        if (lockoutIntervalId) clearInterval(lockoutIntervalId);

        const tick = () => {
            const remainingMs = lockoutUntilMs - Date.now();
            const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

            updateVerifyEnabled();
            updateResendEnabled();

            if (attemptsEl) {
                if (remainingSeconds > 0) {
                    attemptsEl.textContent = `Locked out (${formatMmSs(remainingSeconds)})`;
                } else {
                    setAttemptsRemainingText(`${MAX_OTP_ATTEMPTS} attempt(s) remaining`);
                }
            }

            if (remainingSeconds <= 0) {
                if (lockoutIntervalId) clearInterval(lockoutIntervalId);
                lockoutIntervalId = null;
                lockoutUntilMs = null;
                updateVerifyEnabled();
                updateResendEnabled();
            }
        };

        tick();
        lockoutIntervalId = setInterval(tick, 1000);
    }

    // Initial display
    updateTimerDisplay();
    setAttemptsRemainingText(`${MAX_OTP_ATTEMPTS} attempt(s) remaining`);
    updateVerifyEnabled();
    updateResendEnabled();

    const countdownInterval = setInterval(() => {
        if (regExpiresAtMs) {
            const msLeft = regExpiresAtMs - Date.now();
            seconds = Math.max(0, Math.ceil(msLeft / 1000));
        } else {
            seconds = Math.max(0, seconds - 1);
        }
        updateTimerDisplay();
        updateVerifyEnabled();
        updateResendEnabled();
    }, 1000);

    // OTP form submission
    document.getElementById('otp-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const otp = document.getElementById('otp-input').value.trim();
        const errorAlert = document.getElementById('error-alert');
        const successAlert = document.getElementById('success-alert');

        if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            document.getElementById('error-message').textContent = 'Please enter a valid 6-digit code.';
            errorAlert.style.display = 'flex';
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}${verifyEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId), otp })
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                data = {};
            }

            if (!response.ok) {
                document.getElementById('error-message').textContent = data.error || 'Verification failed';
                errorAlert.style.display = 'flex';

                // Keep backend-provided state in sync with UI hints.
                if (response.status === 429 && data.lockedUntil) {
                    startLockoutCountdown(data.lockedUntil);
                } else if (response.status === 401 && typeof data.attemptsRemaining === 'number') {
                    setAttemptsRemainingText(`${data.attemptsRemaining} attempt(s) remaining`);
                }

                document.getElementById('otp-input').value = '';
                document.getElementById('otp-input').focus();

                verifyBtn.textContent = 'Verify Code';
                updateVerifyEnabled();
                updateResendEnabled();
                return;
            }

            // Clear OTP session state
            if (isMfa) {
                sessionStorage.removeItem('mfa_userId');
                sessionStorage.removeItem('mfa_username');
                sessionStorage.removeItem('mfa_email');
                sessionStorage.removeItem('mfa_role');
                sessionStorage.removeItem('mfa_expires_at');
            } else {
                sessionStorage.removeItem('reg_userId');
                sessionStorage.removeItem('reg_username');
                sessionStorage.removeItem('reg_email');
                sessionStorage.removeItem('reg_expires_at');
            }

            // Show success state
            clearInterval(countdownInterval);
            if (lockoutIntervalId) clearInterval(lockoutIntervalId);
            document.getElementById('otp-form-container').style.display = 'none';
            document.getElementById('otp-success-container').style.display = 'block';

            // Redirect after 2 seconds
            setTimeout(() => {
                if (isMfa) {
                    const rememberMe = sessionStorage.getItem('mfa_remember_me') === '1';
                    sessionStorage.removeItem('mfa_remember_me');

                    if (data && data.token) {
                        if (typeof persistLoginSession === 'function') {
                            persistLoginSession(data, rememberMe);
                        } else {
                            sessionStorage.setItem('token', data.token);
                            sessionStorage.setItem('role', data.role);
                            sessionStorage.setItem('username', data.username);
                        }
                    }

                    const redirectMap = {
                        'admin': 'dashboard-admin.html',
                        'staff': 'dashboard-staff.html',
                        'user': 'dashboard-user.html'
                    };
                    window.location.href = redirectMap[data.role] || 'dashboard-user.html';
                    return;
                }

                window.location.href = 'login.html?registered=true';
            }, 2000);
        } catch (error) {
            document.getElementById('error-message').textContent = error.message || 'Verification failed';
            errorAlert.style.display = 'flex';
            document.getElementById('otp-input').value = '';
            document.getElementById('otp-input').focus();
            verifyBtn.textContent = 'Verify Code';
            updateVerifyEnabled();
            updateResendEnabled();
        }
    });

    // Resend OTP
    if (resendBtn) {
        resendBtn.addEventListener('click', async function() {
            resendBtn.disabled = true;
            const errorAlert = document.getElementById('error-alert');
            const successAlert = document.getElementById('success-alert');
            errorAlert.style.display = 'none';
            successAlert.style.display = 'none';

            try {
                const response = await fetch(`${API_BASE}${resendEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: parseInt(userId) })
                });

                let data = {};
                try {
                    data = await response.json();
                } catch (e) {
                    data = {};
                }

                if (!response.ok) {
                    document.getElementById('error-message').textContent = data.error || 'Failed to resend code';
                    errorAlert.style.display = 'flex';

                    if (response.status === 429 && data.lockedUntil) {
                        startLockoutCountdown(data.lockedUntil);
                    }

                    updateVerifyEnabled();
                    updateResendEnabled();
                    return;
                }

                // Show success message
                document.getElementById('success-message').textContent = 'A new code has been sent to your email.';
                successAlert.style.display = 'flex';

                // Reset server-synced timer + resend cooldown.
                if (data.expiresAt) {
                    sessionStorage.setItem(expiryKey, data.expiresAt);
                    regExpiresAtMs = new Date(data.expiresAt).getTime();
                    const msLeft = regExpiresAtMs - Date.now();
                    seconds = Math.max(0, Math.ceil(msLeft / 1000));
                }

                // Clear any active lockout state (resend resets attempts/lock on the backend too)
                if (lockoutIntervalId) clearInterval(lockoutIntervalId);
                lockoutIntervalId = null;
                lockoutUntilMs = null;

                if (typeof data.attemptsRemaining === 'number') {
                    setAttemptsRemainingText(`${data.attemptsRemaining} attempt(s) remaining`);
                } else {
                    setAttemptsRemainingText(`${MAX_OTP_ATTEMPTS} attempt(s) remaining`);
                }

                updateTimerDisplay();
                updateVerifyEnabled();

                resendCooldownUntilMs = Date.now() + 60000;
                updateResendEnabled();
            } catch (error) {
                document.getElementById('error-message').textContent = error.message || 'Failed to resend code';
                errorAlert.style.display = 'flex';
                updateVerifyEnabled();
                updateResendEnabled();
            }
        });
    }
})();

// ===================================================
// Forgot Password Functionality
// ===================================================

let forgotResetToken = null;

/**
 * Initialize forgot password link
 */
function initForgotPassword() {
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            openForgotModal();
        });
    }
}

/**
 * Open forgot password modal
 */
function openForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (!modal) return;

    // Reset to step 1
    forgotResetToken = null;
    document.querySelectorAll('.forgot-step').forEach(step => step.classList.remove('active'));
    document.getElementById('forgot-step-1').classList.add('active');

    // Clear inputs and alerts
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-otp').value = '';
    document.getElementById('forgot-new-password').value = '';
    document.getElementById('forgot-confirm-password').value = '';
    document.getElementById('forgot-error').style.display = 'none';
    document.getElementById('forgot-success').style.display = 'none';

    // Reset button states
    document.getElementById('forgot-send-btn').disabled = false;
    document.getElementById('forgot-send-btn').textContent = 'Send Reset Code';

    modal.classList.add('show');
    document.getElementById('forgot-email').focus();

    // Initialize password toggles in modal
    initPasswordToggles();
}

/**
 * Close forgot password modal
 */
function closeForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) modal.classList.remove('show');
}

/**
 * Show forgot modal error
 */
function showForgotError(message) {
    const errorEl = document.getElementById('forgot-error');
    const errorMsg = document.getElementById('forgot-error-message');
    const successEl = document.getElementById('forgot-success');

    if (successEl) successEl.style.display = 'none';
    if (errorMsg) errorMsg.textContent = message;
    if (errorEl) errorEl.style.display = 'flex';
}

/**
 * Show forgot modal success
 */
function showForgotSuccess(message) {
    const successEl = document.getElementById('forgot-success');
    const successMsg = document.getElementById('forgot-success-message');
    const errorEl = document.getElementById('forgot-error');

    if (errorEl) errorEl.style.display = 'none';
    if (successMsg) successMsg.textContent = message;
    if (successEl) successEl.style.display = 'flex';
}

/**
 * Step 1: Send reset OTP to email
 */
async function sendResetOTP() {
    const email = document.getElementById('forgot-email').value.trim();
    const sendBtn = document.getElementById('forgot-send-btn');

    if (!email) {
        showForgotError('Please enter your email address.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showForgotError('Please enter a valid email address.');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset code');
        }

        // Store email for next step
        sessionStorage.setItem('reset_email', email);

        showForgotSuccess('Reset code sent to your email.');

        // Move to step 2
        setTimeout(() => {
            document.getElementById('forgot-step-1').classList.remove('active');
            document.getElementById('forgot-step-2').classList.add('active');
            document.getElementById('forgot-error').style.display = 'none';
            document.getElementById('forgot-success').style.display = 'none';
            document.getElementById('forgot-otp').focus();
        }, 1000);

    } catch (error) {
        showForgotError(error.message || 'Failed to send reset code.');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Reset Code';
    }
}

/**
 * Step 2: Verify reset OTP
 */
async function verifyResetOTP() {
    const otp = document.getElementById('forgot-otp').value.trim();
    const email = sessionStorage.getItem('reset_email');
    const verifyBtn = document.getElementById('forgot-verify-btn');

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        showForgotError('Please enter a valid 6-digit code.');
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
        const response = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Invalid or expired code');
        }

        // Store reset token for final step
        forgotResetToken = data.resetToken;

        showForgotSuccess('Code verified. Set your new password.');

        // Move to step 3
        setTimeout(() => {
            document.getElementById('forgot-step-2').classList.remove('active');
            document.getElementById('forgot-step-3').classList.add('active');
            document.getElementById('forgot-error').style.display = 'none';
            document.getElementById('forgot-success').style.display = 'none';
            document.getElementById('forgot-new-password').focus();

            // Re-init password toggles for step 3
            initPasswordToggles();
        }, 1000);

    } catch (error) {
        showForgotError(error.message || 'Verification failed.');
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';
        document.getElementById('forgot-otp').value = '';
        document.getElementById('forgot-otp').focus();
    }
}

/**
 * Step 3: Reset password
 */
async function resetPassword() {
    const newPassword = document.getElementById('forgot-new-password').value;
    const confirmPassword = document.getElementById('forgot-confirm-password').value;
    const email = sessionStorage.getItem('reset_email');
    const resetBtn = document.getElementById('forgot-reset-btn');

    if (!newPassword || newPassword.length < 6) {
        showForgotError('Password must be at least 6 characters.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showForgotError('Passwords do not match.');
        return;
    }

    if (!forgotResetToken) {
        showForgotError('Session expired. Please start over.');
        return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = 'Resetting...';

    try {
        const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, resetToken: forgotResetToken, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
        }

        // Clear session data
        sessionStorage.removeItem('reset_email');
        forgotResetToken = null;

        showForgotSuccess('Password reset successfully! Redirecting to login...');

        // Close modal and show success on login page
        setTimeout(() => {
            closeForgotModal();
            const successAlert = document.getElementById('success-alert');
            const successMsg = document.getElementById('success-message');
            if (successAlert && successMsg) {
                successMsg.textContent = 'Password reset successfully. You can now sign in with your new password.';
                successAlert.style.display = 'flex';
            }
        }, 1500);

    } catch (error) {
        showForgotError(error.message || 'Failed to reset password.');
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset Password';
    }
}
