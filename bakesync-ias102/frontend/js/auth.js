// BakeSync Authentication Logic

/**
 * Handle login form submission
 * Direct login - no OTP step
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('submit-btn');

    // Hide any previous error
    errorAlert.style.display = 'none';

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
        const data = await apiPost('/api/auth/login', { username, password });

        // Store session - token returned immediately, no OTP step
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
 * Handle OTP verification form submission
 * Used for registration flow only
 */
async function handleOTPVerify(event) {
    event.preventDefault();

    const otp = document.getElementById('otp').value.trim();
    const userId = sessionStorage.getItem('reg_userId');
    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('submit-btn');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    errorAlert.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        await apiPost('/api/auth/verify-otp', {
            userId: parseInt(userId),
            otp
        });

        // Clear registration session data
        sessionStorage.removeItem('reg_userId');
        sessionStorage.removeItem('reg_username');

        // Redirect to login with success message
        window.location.href = 'login.html?registered=true';
    } catch (error) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.textContent = error.message;
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify Code';
    }
}

/**
 * Initialize OTP page for registration
 */
function initOTPPage() {
    const userId = sessionStorage.getItem('reg_userId');
    const username = sessionStorage.getItem('reg_username');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
    }
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
        // Remove the param from URL
        window.history.replaceState({}, '', 'login.html');
    }
}
