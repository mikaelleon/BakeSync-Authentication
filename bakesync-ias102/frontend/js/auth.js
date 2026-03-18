// BakeSync Authentication Logic

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
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

        // Store session
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', data.username);

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

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;
    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('register-btn');

    // Hide previous error
    errorAlert.style.display = 'none';
    clearAllFieldErrors();

    // Validation
    let valid = true;

    if (!username || username.length < 3) {
        showFieldError('username-error', 'Username must be at least 3 characters.');
        valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showFieldError('email-error', 'Please enter a valid email address.');
        valid = false;
    }

    if (!password || password.length < 6) {
        showFieldError('password-error', 'Password must be at least 6 characters.');
        valid = false;
    }

    if (password !== confirm) {
        showFieldError('confirm-error', 'Passwords do not match.');
        valid = false;
    }

    if (!role) {
        showFieldError('role-error', 'Please select a role.');
        valid = false;
    }

    if (!valid) return;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

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

        // Redirect to OTP verification
        window.location.href = 'otp.html';
    } catch (error) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.textContent = error.message;
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account & Send Code';
    }
}

/**
 * Show field-level error
 */
function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
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

/**
 * Initialize OTP page
 */
(function initOTPPage() {
    // Only run on OTP page
    if (!document.getElementById('otp-form')) return;

    const userId = sessionStorage.getItem('reg_userId');
    const username = sessionStorage.getItem('reg_username');
    const email = sessionStorage.getItem('reg_email');

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

    // Timer
    let seconds = 600; // 10 minutes
    const timerEl = document.getElementById('otp-timer');
    const verifyBtn = document.getElementById('otp-verify-btn');
    const resendBtn = document.getElementById('otp-resend-btn');

    const countdownInterval = setInterval(() => {
        seconds--;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${m}:${s}`;

        if (seconds <= 0) {
            clearInterval(countdownInterval);
            if (timerEl) {
                timerEl.textContent = 'Code expired';
                timerEl.classList.add('expired');
            }
            if (verifyBtn) verifyBtn.disabled = true;
            if (resendBtn) resendBtn.disabled = false;
        }
    }, 1000);

    // Enable resend after 60 seconds
    setTimeout(() => {
        if (resendBtn && seconds > 0) resendBtn.disabled = false;
    }, 60000);

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
            const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId), otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Clear registration session
            sessionStorage.removeItem('reg_userId');
            sessionStorage.removeItem('reg_username');
            sessionStorage.removeItem('reg_email');

            // Show success state
            clearInterval(countdownInterval);
            document.getElementById('otp-form-container').style.display = 'none';
            document.getElementById('otp-success-container').style.display = 'block';

            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 2000);
        } catch (error) {
            document.getElementById('error-message').textContent = error.message;
            errorAlert.style.display = 'flex';
            document.getElementById('otp-input').value = '';
            document.getElementById('otp-input').focus();
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify Code';
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
                const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: parseInt(userId) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to resend code');
                }

                // Show success message
                document.getElementById('success-message').textContent = 'A new code has been sent to your email.';
                successAlert.style.display = 'flex';

                // Reset timer
                seconds = 600;
                timerEl.classList.remove('expired');
                verifyBtn.disabled = false;

                // Disable resend for 60 seconds
                setTimeout(() => {
                    if (seconds > 0) resendBtn.disabled = false;
                }, 60000);
            } catch (error) {
                document.getElementById('error-message').textContent = error.message;
                errorAlert.style.display = 'flex';
                resendBtn.disabled = false;
            }
        });
    }
})();
