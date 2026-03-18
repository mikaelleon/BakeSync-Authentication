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

    errorAlert.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
        const data = await apiPost('/api/auth/login', { username, password });

        // Store user info for OTP step (no token yet)
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('username', data.username);

        // Redirect to OTP page
        window.location.href = 'otp.html';
    } catch (error) {
        errorAlert.textContent = error.message;
        errorAlert.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

/**
 * Handle OTP verification form submission
 */
async function handleOTPVerify(event) {
    event.preventDefault();

    const otp = document.getElementById('otp').value.trim();
    const userId = sessionStorage.getItem('userId');
    const errorAlert = document.getElementById('error-alert');
    const submitBtn = document.getElementById('submit-btn');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    errorAlert.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        const data = await apiPost('/api/auth/verify-otp', {
            userId: parseInt(userId),
            otp
        });

        // Store authentication data
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', data.username);

        // Clear temporary userId
        sessionStorage.removeItem('userId');

        // Redirect based on role
        const dashboardMap = {
            'admin': 'dashboard-admin.html',
            'staff': 'dashboard-staff.html',
            'user': 'dashboard-user.html'
        };

        window.location.href = dashboardMap[data.role] || 'dashboard-user.html';
    } catch (error) {
        errorAlert.textContent = error.message;
        errorAlert.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify OTP';
    }
}

/**
 * Initialize OTP page
 */
function initOTPPage() {
    const userId = sessionStorage.getItem('userId');
    const username = sessionStorage.getItem('username');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
    }
}
